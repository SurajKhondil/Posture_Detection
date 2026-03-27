# Scoring Engine - Angle-Time Maps with Distribution Analysis (Procedural)
from collections import defaultdict
from typing import Dict, List, Tuple, Optional
from sqlalchemy import select, insert, update, delete
from ..database import sessions_table, angle_accumulation_table, posture_results_table, get_connection
from . import config
from . import logger

def posture_status(score: float) -> str:
    """Convert risk score to status text"""
    if score <= 30:
        return "Good posture"
    elif score <= 60:
        return "Moderate risk"
    return "High risk"

def build_angle_time_maps(session_id: int) -> Dict:
    """Query angle_accumulation table and build nested time maps"""
    try:
        conn = get_connection()
        query = select(angle_accumulation_table).where(
            angle_accumulation_table.c.session_id == session_id
        ).order_by(
            angle_accumulation_table.c.camera_angle,
            angle_accumulation_table.c.metric_name,
            angle_accumulation_table.c.angle_value
        )
        
        rows = conn.execute(query).fetchall()
        conn.close()
        
        angle_maps = defaultdict(lambda: defaultdict(dict))
        for row in rows:
            r_dict = dict(row._mapping)
            camera_angle = r_dict["camera_angle"]
            metric_name = r_dict["metric_name"]
            angle_value = r_dict["angle_value"]
            total_time = r_dict["total_time_seconds"]
            angle_maps[camera_angle][metric_name][angle_value] = total_time
        
        result = {c: {m: dict(a) for m, a in mt.items()} for c, mt in angle_maps.items()}
        logger.log_engine("Angle Maps Built", {
            "session_id": session_id,
            "cameras": list(result.keys()),
            "total_metrics": sum(len(m) for m in result.values())
        })
        return result
    except Exception as e:
        logger.log_error("Angle Map Build Failed", e, {"session_id": session_id})
        return {}

def analyze_angle_distribution(angle_time_map: Dict[int, float], 
                               metric_ranges: Dict[str, Tuple[float, float]]) -> Dict:
    """Analyze distribution of angles and compute risk metrics"""
    if not angle_time_map:
        return {"risk_percent": 0, "status": "No data", "time_good_min": 0, 
                "time_warning_min": 0, "time_bad_min": 0}
    
    time_by_class = {"good": 0.0, "warning": 0.0, "bad": 0.0}
    total_time = 0.0
    for angle_int, time_sec in angle_time_map.items():
        total_time += time_sec
        angle_float = float(angle_int)
        classified = False
        for level, (low, high) in metric_ranges.items():
            if low <= angle_float <= high:
                time_by_class[level] += time_sec
                classified = True
                break
        if not classified:
            time_by_class["bad"] += time_sec
    
    tg_min, tw_min, tb_min = time_by_class["good"]/60.0, time_by_class["warning"]/60.0, time_by_class["bad"]/60.0
    t_min = total_time / 60.0
    
    if t_min == 0:
        risk_percent = 0
    else:
        final_score = 0.0
        for level, m in [("good", tg_min), ("warning", tw_min), ("bad", tb_min)]:
            bs, be = config.SCORE_BANDS[level]
            bw = be - bs
            tp = m / t_min
            final_score += (bs + (tp * bw)) * m
        risk_percent = round(final_score / t_min)
        
    return {
        "risk_percent": risk_percent,
        "status": posture_status(risk_percent),
        "time_good_min": round(tg_min, 2),
        "time_warning_min": round(tw_min, 2),
        "time_bad_min": round(tb_min, 2),
        "total_time_min": round(t_min, 2),
        "unique_angles": len(angle_time_map),
        "angle_range": [min(angle_time_map.keys()), max(angle_time_map.keys())] if angle_time_map else [0, 0]
    }

def score_session(session_id: int) -> Dict:
    """Main scoring function"""
    try:
        logger.log_engine("Scoring Started", {"session_id": session_id})
        conn = get_connection()
        s = conn.execute(select(sessions_table).where(sessions_table.c.id == session_id)).fetchone()
        conn.close()
        if not s:
            logger.log_error("Session Not Found", Exception("404"), {"session_id": session_id})
            return {}
        
        user_id = s._mapping["user_id"]
        conn = get_connection()
        conn.execute(delete(posture_results_table).where(posture_results_table.c.session_id == session_id))
        conn.commit()
        conn.close()
        
        angle_maps = build_angle_time_maps(session_id)
        if not angle_maps:
            logger.log_warning("No Angle Data", {"session_id": session_id})
            return {}
        
        results = {}
        for cam, metrics in angle_maps.items():
            view = cam.upper()
            if view not in config.SESSION_CONFIG: continue
            for m_name, a_map in metrics.items():
                m_cfg = config.SESSION_CONFIG[view]["metrics"].get(m_name)
                if not m_cfg: continue
                analysis = analyze_angle_distribution(a_map, m_cfg["ranges"])
                m_key = f"{view}_{m_name}"
                results[m_key] = {"metric": m_name.replace("_", " "), **analysis}
                
                conn = get_connection()
                conn.execute(insert(posture_results_table).values(
                    session_id=session_id, user_id=user_id, metric_name=m_key,
                    risk_percent=analysis["risk_percent"], status=analysis["status"],
                    time_good_min=analysis["time_good_min"], time_warning_min=analysis["time_warning_min"],
                    time_bad_min=analysis["time_bad_min"]
                ))
                conn.commit()
                conn.close()
        
        if results:
            all_s = [m["risk_percent"] for m in results.values()]
            avg = sum(all_s) / len(all_s)
            worst = max(results.keys(), key=lambda k: results[k]["risk_percent"])
            results["__OVERALL__"] = {
                "metric": "overall session posture",
                "average_risk_percent": round(avg),
                "worst_metric": worst,
                "overall_status": posture_status(avg)
            }
            
            conn = get_connection()
            conn.execute(update(sessions_table).where(sessions_table.c.id == session_id).values(status="completed", current_phase="completed"))
            conn.commit()
            conn.close()
            
            logger.log_success("Scoring Complete", {"session_id": session_id, "avg_risk": f"{avg:.0f}%"})
            
            try:
                from . import recommendations as recommendation_engine
                recommendation_engine.generate_recommendation(session_id, user_id, results, angle_maps)
            except Exception as re:
                logger.log_error("Recommendation Trigger Failed", re, {"session_id": session_id})
                
        return results
    except Exception as e:
        logger.log_error("Scoring Failed", e, {"session_id": session_id})
        return {}

def get_session_results(session_id: int) -> Dict:
    """Fetch results from DB and recreate the dictionary format expected by the frontend"""
    try:
        conn = get_connection()
        r = conn.execute(select(posture_results_table).where(posture_results_table.c.session_id == session_id)).fetchall()
        conn.close()
        
        if not r:
            return {}
            
        results = {}
        for row in r:
            row_dict = dict(row._mapping)
            m_key = row_dict["metric_name"]
            results[m_key] = row_dict
            
        # Recreate __OVERALL__ metric
        all_s = [m["risk_percent"] for m in results.values() if "risk_percent" in m]
        if all_s:
            avg = sum(all_s) / len(all_s)
            
            # Simple manual calculation of worst metric without crashing
            worst = "None"
            highest_risk = -1
            for k, v in results.items():
                if v.get("risk_percent", -1) > highest_risk:
                    highest_risk = v.get("risk_percent", -1)
                    worst = k
                    
            results["__OVERALL__"] = {
                "metric": "overall session posture",
                "average_risk_percent": round(avg),
                "worst_metric": worst,
                "overall_status": posture_status(avg),
                "risk_level": "HIGH" if avg > 60 else "MODERATE" if avg > 30 else "GOOD"
            }
            
        return results
    except Exception as e:
        logger.log_error("Results Fetch Failed", e, {"session_id": session_id})
        return {}
