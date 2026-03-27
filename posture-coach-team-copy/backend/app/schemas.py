from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Any
from datetime import datetime


# ─── AUTH SCHEMAS ──────────────────────────────────────────────────────────────

class SignUpRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8)
    age: Optional[int] = None
    height_cm: Optional[int] = None
    weight_kg: Optional[int] = None
    sitting_hours: Optional[str] = None

class SignInRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    name: str
    email: str
    age: Optional[int] = None
    height_cm: Optional[int] = None
    weight_kg: Optional[int] = None


# ─── PROFILE SCHEMAS ───────────────────────────────────────────────────────────

class ProfileCreateRequest(BaseModel):
    age: int
    sitting_hours: str       # "1-2", "3-4", etc.
    height_cm: Optional[int] = None
    weight_kg: Optional[int] = None

class ProfileUpdateRequest(BaseModel):
    age: Optional[int] = None
    sitting_hours: Optional[str] = None
    height_cm: Optional[int] = None
    weight_kg: Optional[int] = None

class ProfileResponse(BaseModel):
    id: int
    email: str
    name: Optional[str]
    age: Optional[int]
    sitting_hours: Optional[str]
    height_cm: Optional[int]
    weight_kg: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True


# ─── CALIBRATION SCHEMAS ───────────────────────────────────────────────────────

class CalibrationCreateRequest(BaseModel):
    session_id: str
    front_image_url: Optional[str] = None
    side_image_url: Optional[str] = None
    duration_seconds: int = 15
    status: str = "complete"

class CalibrationResponse(BaseModel):
    id: int
    user_id: int
    session_id: str
    front_image_url: Optional[str]
    side_image_url: Optional[str]
    duration_seconds: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# ─── POSTURE SESSION SCHEMAS ───────────────────────────────────────────────────

class SessionStartRequest(BaseModel):
    current_phase: Optional[str] = "live"
    phase_start_time: Optional[datetime] = None
    expected_end_time: Optional[datetime] = None

class SessionStartResponse(BaseModel):
    session_id: str
    message: str = "Session started successfully"

class SessionEndRequest(BaseModel):
    end_time: datetime
    avg_fps: Optional[float] = None
    total_frames: int = 0
    status: str = "completed"

class SessionResponse(BaseModel):
    id: int
    user_id: int
    session_id: str
    start_time: datetime
    end_time: Optional[datetime]
    current_phase: Optional[str]
    phase_start_time: Optional[datetime]
    expected_end_time: Optional[datetime]
    avg_fps: Optional[float]
    total_frames: int
    status: str

    class Config:
        from_attributes = True

class TodayStatsResponse(BaseModel):
    total_sessions: int
    average_score: float
    total_good_posture_time: int   # in seconds
    total_alerts: int


# ─── TEAM 2 SCHEMAS ────────────────────────────────────────────────────────────

class Team2UserProfileData(BaseModel):
    """What Team 2 receives when they call GET /team2/users"""
    user_id: int
    name: str
    age: int
    sitting_hours: str
    height_cm: Optional[int]
    weight_kg: Optional[int]
    created_at: datetime


class PainRiskSubmitRequest(BaseModel):
    """
    Team 2 sends their full analysis result here.
    Matches Team 2's exact output format.
    """
    session_id: str
    results: Any                  # Full results dict with per-metric data
    recommendation: Any           # Full recommendation dict


class PainRiskResponse(BaseModel):
    """Our app reads this from GET /team2/pain-risk/me"""
    id: int
    user_id: int
    session_id: Optional[str]
    overall_risk_percent: float
    overall_status: str
    worst_metric: Optional[str]
    worst_metric_risk_percent: float
    risk_level: str
    dominant_issue: Optional[str]
    priority: str
    recommendation_message: Optional[str]
    actions: Optional[Any]
    full_results: Optional[Any]
    full_recommendation: Optional[Any]
    created_at: datetime

    class Config:
        from_attributes = True

