from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db, User
from ..schemas import ProfileCreateRequest, ProfileUpdateRequest, ProfileResponse
from ..auth_utils import get_current_user
from datetime import datetime

router = APIRouter(prefix="/profile", tags=["Profile"])


@router.post("/", response_model=ProfileResponse)
def create_profile(data: ProfileCreateRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Biometric data is now on the User object itself
    current_user.age = data.age
    current_user.sitting_hours = data.sitting_hours
    current_user.height_cm = data.height_cm
    current_user.weight_kg = data.weight_kg
    
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/", response_model=ProfileResponse)
def get_profile(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # User object itself contains the "profile" data now
    return current_user


@router.put("/", response_model=ProfileResponse)
def update_profile(data: ProfileUpdateRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if data.age is not None:
        current_user.age = data.age
    if data.sitting_hours is not None:
        current_user.sitting_hours = data.sitting_hours
    if data.height_cm is not None:
        current_user.height_cm = data.height_cm
    if data.weight_kg is not None:
        current_user.weight_kg = data.weight_kg
    
    db.commit()
    db.refresh(current_user)
    return current_user
