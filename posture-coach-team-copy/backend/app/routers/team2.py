from fastapi import APIRouter, HTTPException, Request, Depends
from sqlalchemy import select, func, desc, insert, update, delete
from ..database import (get_connection, sessions_table, posture_results_table,
                        recommendations_table, users_table, User)
from ..engines import frame_processor, scoring, recommendations
from ..engines.logger import log_api, log_error, log_success
from ..auth_utils import get_current_user
from datetime import datetime, timedelta
from typing import Optional
from pydantic import BaseModel

router = APIRouter(tags=["Team 2 Analysis"])


# ─── Request Models ───────────────────────────────────────────────────────────

class StartSessionRequest(BaseModel):
    is_calibration: bool = False
    duration_seconds: Optional[int] = None


class CompleteSessionRequest(BaseModel):
    alerts_count: Optional[int] = 0
    good_time_seconds: Optional[float] = 0.0


# ─── SESSION START (handles both Calibration & Live) ─────────────────────────

@router.post("/sessions/start")
def start_session(body: StartSessionRequest = StartSessionRequest(),
                        current_user: User = Depends(get_current_user)):
    """
    Start a posture analysis session.

    - is_calibration=True  → UPSERT: wipe the user's previous calibration session
                             and all its posture_results/angle_accumulation data,
                             then create a brand-new session row.
                             Save the new session_id in users.calibration_session_id.
    - is_calibration=False → REUSE: return the existing calibration_session_id.
                             If none exists, create one transparently.
    """
    user_id = current_user.id
    log_api("POST /sessions/start", {"user_id": user_id,
                                     "is_calibration": body.is_calibration})

    conn = get_connection()
    try:
        from ..engines import config as engine_config
        duration = body.duration_seconds or engine_config.SESSION_DURATION_SECONDS
        start_time = datetime.utcnow()

        # ── Look up user's current calibration session ────────────────────────
        user_row = conn.execute(
            select(users_table).where(users_table.c.id == user_id)
        ).fetchone()
        existing_calib_id = user_row._mapping.get('calibration_session_id') if user_row else None

        if not body.is_calibration and existing_calib_id:
            # ── Live session: reuse the calibration session ID ─────────────────
            log_success("Session Reused", {"session_id": existing_calib_id,
                                           "user_id": user_id})
            return {
                "session_id": existing_calib_id,
                "status": "active",
                "reused": True,
                "message": "Reusing calibration session for live monitoring"
            }

        # ── Calibration (or first session): create a new one ─────────────────
        if existing_calib_id:
            # ✅ Do NOT delete old session data — keep it for weekly reports!
            # Just mark the old calibration session as "archived" so it stays in history
            conn.execute(
                update(sessions_table)
                .where(sessions_table.c.id == existing_calib_id)
                .values(is_calibration=False)  # Demote to regular session
            )
            conn.commit()
            log_success("Old Calibration Archived (data preserved)",
                        {"old_session_id": existing_calib_id})

        # Create fresh session
        result = conn.execute(
            insert(sessions_table).values(
                user_id=user_id,
                start_time=start_time,
                status="active",
                current_phase="front",
                phase_start_time=start_time,
                expected_end_time=start_time + timedelta(seconds=duration),
                is_calibration=True,
                alerts_count=0,
                good_time_minutes=0.0,
            )
        )
        conn.commit()
        session_id = result.inserted_primary_key[0]

        # Save on user record
        conn.execute(
            update(users_table)
            .where(users_table.c.id == user_id)
            .values(calibration_session_id=session_id)
        )
        conn.commit()

        log_success("Calibration Session Created",
                    {"session_id": session_id, "user_id": user_id})
        return {
            "session_id": session_id,
            "status": "active",
            "reused": False,
            "message": "New calibration session created"
        }

    except Exception as e:
        log_error("Session Start Failed", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


# ─── FRAME INGESTION ──────────────────────────────────────────────────────────

@router.post("/frames/ingest")
async def ingest_frames(request: Request,
                        current_user: User = Depends(get_current_user)):
    """Process incoming posture frames from Team 1"""
    body = await request.json()
    session_id = body.get("session_id")

    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")

    result = frame_processor.process_incoming_frame(
        session_id=session_id,
        frame_id=body.get("frame_id", 0),
        timestamp=body.get("timestamp", datetime.utcnow().isoformat()),
        frame_type=body.get("frame_type", "front"),
        is_calibrated=body.get("is_calibrated", True),
        frame_data=body
    )

    if not result.get("success"):
        raise HTTPException(status_code=500,
                            detail=result.get("error", "Processing failed"))
    return result


# ─── SESSION COMPLETE ──────────────────────────────────────────────────────────

@router.post("/sessions/{session_id}/complete")
def complete_session(session_id: int,
                           body: CompleteSessionRequest = CompleteSessionRequest(),
                           current_user: User = Depends(get_current_user)):
    """
    End a session, save alert count + good time, then trigger scoring.
    """
    user_id = current_user.id
    log_api(f"POST /sessions/{session_id}/complete",
            {"user_id": user_id,
             "alerts": body.alerts_count,
             "good_time_sec": body.good_time_seconds})

    conn = get_connection()
    try:
        good_min = round((body.good_time_seconds or 0) / 60, 2)
        conn.execute(
            update(sessions_table)
            .where(sessions_table.c.id == session_id,
                   sessions_table.c.user_id == user_id)
            .values(
                status="completed",
                end_time=datetime.utcnow(),
                alerts_count=body.alerts_count or 0,
                good_time_minutes=good_min,
            )
        )
        conn.commit()
    finally:
        conn.close()

    # Trigger scoring engine
    results = scoring.score_session(session_id)
    if not results:
        results = {
            "__OVERALL__": {
                "average_risk_percent": 0,
                "risk_level": "UNKNOWN",
                "session_score": 0,
                "overall_status": "No Data"
            }
        }

    return {"status": "completed", "session_id": session_id, "results": results}


# ─── DASHBOARD ────────────────────────────────────────────────────────────────

@router.get("/dashboard/{user_id_param}")
def get_dashboard(user_id_param: int,
                        current_user: User = Depends(get_current_user)):
    """Fetch aggregated dashboard data from unified DB"""
    user_id = current_user.id
    if user_id != user_id_param:
        raise HTTPException(status_code=403, detail="Access denied")

    log_api("GET /dashboard", {"user_id": user_id})

    conn = get_connection()
    try:
        # ── All sessions ──────────────────────────────────────────────────────
        sessions_rows = conn.execute(
            select(sessions_table)
            .where(sessions_table.c.user_id == user_id)
            .order_by(desc(sessions_table.c.start_time))
        ).fetchall()

        total_sessions = len(sessions_rows)
        total_alerts = sum(r._mapping.get('alerts_count') or 0
                           for r in sessions_rows)
        total_good_min = round(
            sum(r._mapping.get('good_time_minutes') or 0
                for r in sessions_rows), 2
        )

        # ── Latest completed session results ──────────────────────────────────
        latest_overall = None
        latest_session_id = None
        for row in sessions_rows:
            sid = row._mapping.get('id')
            results = scoring.get_session_results(sid)
            if results and "__OVERALL__" in results:
                latest_overall = results["__OVERALL__"]
                latest_session_id = sid
                break

        posture_score = 0
        risk_level = "None"
        if latest_overall:
            avg_risk = latest_overall.get("average_risk_percent", 0)
            posture_score = max(0, round(100 - avg_risk))
            risk_level = latest_overall.get("risk_level", "None")

        # ── Build session list with scores ─────────────────────────────────────
        # Get all posture results for this user to calculate scores efficiently
        results_rows = conn.execute(
            select(posture_results_table)
            .where(posture_results_table.c.user_id == user_id)
        ).fetchall()

        from collections import defaultdict
        session_risk_map = defaultdict(list)
        for rr in results_rows:
            rm = rr._mapping
            session_risk_map[rm['session_id']].append(rm['risk_percent'])

        session_list = []
        for r in sessions_rows:
            m = r._mapping
            sid = m.get('id')
            risks = session_risk_map.get(sid)
            s_score = None
            if risks:
                avg_r = sum(risks) / len(risks)
                s_score = max(0, round(100 - avg_r))

            session_list.append({
                "session_id": sid,
                "status": m.get('status'),
                "start_time": (m.get('start_time').isoformat()
                               if m.get('start_time') else None),
                "alerts_count": m.get('alerts_count') or 0,
                "good_time_minutes": m.get('good_time_minutes') or 0,
                "is_calibration": m.get('is_calibration') or False,
                "posture_score": s_score
            })

        return {
            "user_id": user_id,
            "total_sessions": total_sessions,
            "total_alerts": total_alerts,
            "total_good_time_minutes": total_good_min,
            "posture_score": posture_score,
            "risk_level": risk_level,
            "latest_session_id": latest_session_id,
            "sessions": session_list,
        }
    finally:
        conn.close()


# ─── RESULTS ──────────────────────────────────────────────────────────────────

@router.get("/results/{session_id}")
def get_results(session_id: int,
                      current_user: User = Depends(get_current_user)):
    """Get detailed posture results for a session"""
    log_api(f"GET /results/{session_id}", {"session_id": session_id})

    results = scoring.get_session_results(session_id)
    if not results:
        results = {
            "__OVERALL__": {
                "average_risk_percent": 0,
                "risk_level": "UNKNOWN",
                "session_score": 0
            }
        }
    return {"session_id": session_id, "results": results}


# ─── RECOMMENDATIONS ──────────────────────────────────────────────────────────

@router.get("/recommendations/{session_id}")
def get_recommendation(session_id: int,
                             current_user: User = Depends(get_current_user)):
    """Get AI recommendation for session"""
    log_api(f"GET /recommendations/{session_id}", {"session_id": session_id})

    rec = recommendations.get_session_recommendation(session_id)
    if not rec:
        return {
            "recommendation_text": ("Not enough data collected during this session "
                                    "to generate a personalized recommendation. "
                                    "Please complete a longer session."),
            "priority": "LOW",
            "dominant_issue": "None",
            "risk_level": "UNKNOWN",
            "actions_json": [
                {"action": "Complete a session > 1 min",
                 "benefit": "Allows the AI to accurately analyze your posture trends"}
            ]
        }
    return rec
