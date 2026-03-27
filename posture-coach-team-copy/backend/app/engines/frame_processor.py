# Frame Processor - Real-time Streaming Frame Processing (Procedural)
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from sqlalchemy import select, insert, update
from ..database import sessions_table, raw_angles_table, angle_accumulation_table, get_connection
from . import config
from . import logger

def parse_iso_timestamp(iso_timestamp: str) -> float:
    """Convert ISO timestamp to Unix milliseconds"""
    try:
        dt = datetime.fromisoformat(iso_timestamp.replace('Z', '+00:00'))
        return dt.timestamp() * 1000
    except Exception as e:
        logger.log_error("Timestamp Parse Failed", e, {"timestamp": iso_timestamp})
        return datetime.utcnow().timestamp() * 1000

def calculate_instant_fps(session_id: int, current_timestamp_ms: float) -> Optional[float]:
    """Calculate FPS from current frame and previous frame"""
    conn = None
    try:
        conn = get_connection()
        query = select(raw_angles_table.c.timestamp_ms).where(
            raw_angles_table.c.session_id == session_id
        ).order_by(raw_angles_table.c.timestamp_ms.desc()).limit(1)
        
        result = conn.execute(query).fetchone()
        if not result: return None
        
        last_ms = result[0]
        delta = current_timestamp_ms - last_ms
        return (1000.0 / delta) if delta > 0 else None
    except Exception as e:
        logger.log_error("FPS Calculation Failed", e, {"session_id": session_id})
        return None
    finally:
        if conn: conn.close()

def extract_angle_data(frame_type: str, frame_data: dict) -> Tuple[Dict[str, float], Dict[str, float]]:
    """Extract angle values and confidence from nested front/side structure"""
    angle_data, confidence_data = {}, {}
    frame_obj = frame_data.get(frame_type, {})
    for m_name, m_obj in frame_obj.items():
        if isinstance(m_obj, dict) and 'value' in m_obj and 'confidence' in m_obj:
            angle_data[m_name] = float(m_obj['value'])
            confidence_data[m_name] = float(m_obj['confidence'])
    return angle_data, confidence_data

def validate_frame(is_calibrated: bool, confidence_data: Dict[str, float], threshold: float = None) -> List[str]:
    """Validate frame and return list of valid metric names"""
    if threshold is None: threshold = config.MIN_CONFIDENCE_PER_ANGLE
    if not is_calibrated: return []
    valid = []
    for m, c in confidence_data.items():
        if c >= threshold: valid.append(m)
        else: logger.log_warning("Low Confidence", {"metric": m, "confidence": f"{c:.2f}"})
    return valid

def insert_frame_to_db(session_id: int, frame_id: int, camera_angle: str, 
                       angle_data: Dict[str, float], confidence_data: Dict[str, float],
                       is_calibrated: bool, fps: Optional[float], 
                       timestamp_iso: str, timestamp_ms: float) -> bool:
    """Insert frame data into raw_angles table"""
    conn = None
    try:
        conn = get_connection()
        conn.execute(insert(raw_angles_table).values(
            session_id=session_id, frame_id=frame_id, camera_angle=camera_angle,
            angle_data=angle_data, confidence_data=confidence_data, is_calibrated=is_calibrated,
            fps_at_frame=fps, timestamp_iso=timestamp_iso, timestamp_ms=timestamp_ms
        ))
        conn.commit()
        if frame_id % 100 == 0:
            logger.log_db("Frame Stored", {"session_id": session_id, "frame_id": frame_id, "fps": f"{fps:.2f}" if fps else "N/A"})
        return True
    except Exception as e:
        logger.log_error("Frame Insert Failed", e, {"session_id": session_id, "frame_id": frame_id})
        return False
    finally:
        if conn: conn.close()

def accumulate_angle_time(session_id: int, camera_angle: str, 
                          angle_data: Dict[str, float], fps: float,
                          valid_metrics: List[str]) -> bool:
    """Accumulate time for each unique angle value using efficient batch upsert"""
    fps = fps if (fps and fps > 0) else 15.0
    conn = None
    try:
        conn = get_connection()
        frame_time = 1.0 / fps
        from sqlalchemy.dialects.postgresql import insert as pg_insert
        
        for m_name in valid_metrics:
            if m_name not in angle_data: continue
            a_val = int(round(angle_data[m_name], config.ANGLE_ROUNDING_PRECISION))
            
            stmt = pg_insert(angle_accumulation_table).values(
                session_id=session_id, camera_angle=camera_angle, 
                metric_name=m_name, angle_value=a_val, total_time_seconds=frame_time
            )
            stmt = stmt.on_conflict_do_update(
                index_elements=['session_id', 'camera_angle', 'metric_name', 'angle_value'],
                set_={'total_time_seconds': angle_accumulation_table.c.total_time_seconds + frame_time}
            )
            conn.execute(stmt)
        conn.commit()
        return True
    except Exception as e:
        if conn: conn.rollback()
        logger.log_error("Accumulation Failed", e, {"session_id": session_id})
        return False
    finally:
        if conn: conn.close()

def update_session_stats(session_id: int, current_fps: Optional[float]) -> bool:
    """Update session statistics (frame count, average FPS)"""
    conn = None
    try:
        conn = get_connection()
        s = conn.execute(select(sessions_table).where(sessions_table.c.id == session_id)).fetchone()
        if not s: return False
        
        # indices: 7:avg_fps, 8:total_frames
        n_frames = (s[8] or 0) + 1
        if current_fps and s[7]:
            n_avg = ((s[7] * (n_frames - 1)) + current_fps) / n_frames
        elif current_fps:
            n_avg = current_fps
        else:
            n_avg = s[7]
            
        conn.execute(update(sessions_table).where(sessions_table.c.id == session_id).values(total_frames=n_frames, avg_fps=n_avg))
        conn.commit()
        return True
    except Exception as e:
        logger.log_error("Session Stats Update Failed", e, {"session_id": session_id})
        return False
    finally:
        if conn: conn.close()

def check_session_completion(session_id: int) -> Tuple[bool, Optional[str]]:
    """Check if session has completed 2 hours and trigger scoring"""
    conn = None
    try:
        conn = get_connection()
        from sqlalchemy import func
        t = conn.execute(select(func.sum(angle_accumulation_table.c.total_time_seconds)).where(angle_accumulation_table.c.session_id == session_id)).scalar()
        conn.close()
        
        total = t if t else 0
        if total >= config.SESSION_DURATION_SECONDS:
            logger.log_lifecycle("SESSION COMPLETE", f"Session {session_id} reached limit")
            from . import scoring as scoring_engine
            scoring_engine.score_session(session_id)
            return True, f"Completed at {total:.0f}s"
        return False, f"Progress: {(total/config.SESSION_DURATION_SECONDS)*100:.1f}%"
    except Exception as e:
        logger.log_error("Completion Check Failed", e, {"session_id": session_id})
        return False, str(e)

def process_incoming_frame(session_id: int, frame_id: int, timestamp: str,
                           frame_type: str, is_calibrated: bool,
                           frame_data: dict) -> Dict:
    """Main function to process a single incoming frame"""
    logger.log_step("TEAM1", "Frame Received", {"session_id": session_id, "frame_id": frame_id, "type": frame_type}, color='\033[94m')
    
    ms = parse_iso_timestamp(timestamp)
    fps = calculate_instant_fps(session_id, ms)
    a_data, c_data = extract_angle_data(frame_type, frame_data)
    valid = validate_frame(is_calibrated, c_data)
    
    cam = frame_type.upper()
    if insert_frame_to_db(session_id, frame_id, cam, a_data, c_data, is_calibrated, fps, timestamp, ms):
        accumulate_angle_time(session_id, cam, a_data, fps or 15.0, valid)
        update_session_stats(session_id, fps)
        
        is_comp, msg = check_session_completion(session_id)
            
        return {"success": True, "frame_id": frame_id, "session_complete": is_comp, "status": msg}
    return {"success": False, "error": "Storage failed"}
