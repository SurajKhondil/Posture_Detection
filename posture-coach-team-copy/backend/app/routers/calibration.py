from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db, User, CalibrationSession
from ..schemas import CalibrationCreateRequest, CalibrationResponse
from ..auth_utils import get_current_user

router = APIRouter(prefix="/calibration", tags=["Calibration"])


@router.post("/", response_model=CalibrationResponse)
def save_calibration(data: CalibrationCreateRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    calibration = CalibrationSession(
        user_id=current_user.id,
        session_id=data.session_id,
        front_image_url=data.front_image_url,
        side_image_url=data.side_image_url,
        duration_seconds=data.duration_seconds,
        status=data.status
    )
    db.add(calibration)
    db.commit()
    db.refresh(calibration)
    return calibration


@router.get("/latest", response_model=CalibrationResponse)
def get_latest_calibration(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    calibration = (
        db.query(CalibrationSession)
        .filter(CalibrationSession.user_id == current_user.id)
        .order_by(CalibrationSession.created_at.desc())
        .first()
    )
    if not calibration:
        raise HTTPException(status_code=404, detail="No calibration found")
    return calibration


@router.get("/", response_model=list[CalibrationResponse])
def get_all_calibrations(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return (
        db.query(CalibrationSession)
        .filter(CalibrationSession.user_id == current_user.id)
        .order_by(CalibrationSession.created_at.desc())
        .all()
    )
