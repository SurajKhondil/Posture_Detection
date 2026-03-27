from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# Fix for Neon SSL requirement
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(
    DATABASE_URL,
    connect_args={"sslmode": "require"} if "neon.tech" in (DATABASE_URL or "") else {},
    pool_pre_ping=True,
    pool_recycle=300,
    pool_size=5,
    max_overflow=10,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# ─── MODELS ────────────────────────────────────────────────────────────────────

# ─── MODELS ────────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    
    # Biometric Data (Moved from UserProfile)
    age = Column(Integer, nullable=True)
    height_cm = Column(Integer, nullable=True)
    weight_kg = Column(Integer, nullable=True)
    sitting_hours = Column(String(50), nullable=True)
    
    # Settings (Moved from UserProfile)
    theme = Column(String(20), default="light")
    notifications_enabled = Column(Boolean, default=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    calibration_session_id = Column(Integer, nullable=True)  # Active calibration session

    # Relationships
    sessions = relationship("SessionModel", back_populates="user")


class SessionModel(Base):
    __tablename__ = "sessions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    start_time = Column(DateTime, nullable=False, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    current_phase = Column(String(20), default='front')
    phase_start_time = Column(DateTime, nullable=True)
    expected_end_time = Column(DateTime, nullable=True)
    avg_fps = Column(Float, nullable=True)
    total_frames = Column(Integer, default=0)
    status = Column(String(20), default='active')
    is_calibration = Column(Boolean, default=False)  # True = calibration session
    alerts_count = Column(Integer, default=0)         # Total bad posture alerts during session
    good_time_minutes = Column(Float, default=0.0)    # Total time in good posture

    user = relationship("User", back_populates="sessions")


class RawAngle(Base):
    __tablename__ = "raw_angles"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey('sessions.id'), nullable=False, index=True)
    frame_id = Column(Integer, nullable=False)
    camera_angle = Column(String(10), nullable=False)
    angle_data = Column(JSONB, nullable=False)
    confidence_data = Column(JSONB, nullable=False)
    is_calibrated = Column(Boolean, default=True)
    fps_at_frame = Column(Float, nullable=True)
    timestamp_iso = Column(String(50), nullable=False)
    timestamp_ms = Column(Float, nullable=False, index=True)


class PostureResult(Base):
    __tablename__ = "posture_results"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey('sessions.id'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    metric_name = Column(String(50), nullable=False)
    risk_percent = Column(Integer, nullable=False)
    status = Column(String(20), nullable=False)
    time_good_min = Column(Float, default=0)
    time_warning_min = Column(Float, default=0)
    time_bad_min = Column(Float, default=0)
    calculated_at = Column(DateTime, default=datetime.utcnow)


class Recommendation(Base):
    __tablename__ = "recommendations"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey('sessions.id'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    recommendation_text = Column(Text, nullable=False)
    priority = Column(String(20), nullable=False)
    dominant_issue = Column(String(50), nullable=True)
    risk_level = Column(String(20), nullable=True)
    actions_json = Column(JSONB, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class AngleAccumulation(Base):
    __tablename__ = "angle_accumulation"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey('sessions.id'), nullable=False, index=True)
    camera_angle = Column(String(10), nullable=False)
    metric_name = Column(String(50), nullable=False)
    angle_value = Column(Integer, nullable=False)
    total_time_seconds = Column(Float, default=0)
    
    from sqlalchemy import UniqueConstraint
    __table_args__ = (UniqueConstraint('session_id', 'camera_angle', 'metric_name', 'angle_value', name='uq_angle_accumulation'),)


# ─── CORE ALIASES (For Engine Compatibility) ──────────────────────────────────
users_table = User.__table__
sessions_table = SessionModel.__table__
raw_angles_table = RawAngle.__table__
posture_results_table = PostureResult.__table__
recommendations_table = Recommendation.__table__
angle_accumulation_table = AngleAccumulation.__table__


# ─── DB SESSION DEPENDENCY ──────────────────────────────────────────────────────

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_connection():
    """Compatibility helper for Team 2 engines using SQLAlchemy Core"""
    return engine.connect()


def create_tables():
    """Create all tables in Neon PostgreSQL"""
    Base.metadata.create_all(bind=engine)
