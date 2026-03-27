from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import cast, Date, select
from datetime import datetime, date
from ..database import get_db, User, SessionModel
from ..schemas import SessionStartRequest, SessionStartResponse, SessionEndRequest, SessionResponse, TodayStatsResponse
from ..auth_utils import get_current_user

router = APIRouter(prefix="/sessions", tags=["Posture Sessions"])


@router.post("/start", response_model=SessionStartResponse)
def start_session(
    data: SessionStartRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    now = datetime.utcnow()

    session = SessionModel(
        user_id=current_user.id,
        start_time=now,
        current_phase=data.current_phase or "live",
        phase_start_time=data.phase_start_time or now,
        expected_end_time=data.expected_end_time,
        total_frames=0,
        status="active"
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    return SessionStartResponse(session_id=str(session.id))


@router.put("/{session_id}/end", response_model=SessionResponse)
def end_session(
    session_id: int,
    data: SessionEndRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    session = db.query(SessionModel).filter(
        SessionModel.id == session_id,
        SessionModel.user_id == current_user.id
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.end_time = data.end_time
    session.avg_fps = data.avg_fps
    session.total_frames = data.total_frames
    session.status = data.status   # "completed"

    db.commit()
    db.refresh(session)
    return session


@router.get("/today", response_model=TodayStatsResponse)
def get_today_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    today = date.today()
    sessions = (
        db.query(SessionModel)
        .filter(
            SessionModel.user_id == current_user.id,
            cast(SessionModel.start_time, Date) == today
        )
        .all()
    )

    # Note: In a real app, you'd calculate these from posture_results table
    return TodayStatsResponse(
        total_sessions=len(sessions),
        average_score=0.0,
        total_good_posture_time=0,
        total_alerts=0
    )


@router.get("/", response_model=list[SessionResponse])
def get_all_sessions(limit: int = 30, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return (
        db.query(SessionModel)
        .filter(SessionModel.user_id == current_user.id)
        .order_by(SessionModel.start_time.desc())
        .limit(limit)
        .all()
    )
