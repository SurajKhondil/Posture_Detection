# Database Module - SQLAlchemy Core (Procedural, No ORM Classes)
from sqlalchemy import create_engine, MetaData, Table, Column, Integer, BigInteger, String, Float, Boolean, DateTime, Text, ForeignKey, JSON, text, UniqueConstraint
from sqlalchemy.sql import func
from datetime import datetime
import config

# Create engine - Convert postgresql:// to postgresql+psycopg:// for psycopg3
database_url = config.DATABASE_URL
if database_url.startswith("postgresql://"):
    database_url = database_url.replace("postgresql://", "postgresql+psycopg://", 1)

engine = create_engine(database_url, echo=False, pool_pre_ping=True)
metadata = MetaData()  # Table Definitions  # Raw Angles Table (Team 1 - Data Stream)
raw_angles_table = Table(
    'raw_angles',
    metadata,
    Column('id', Integer, primary_key=True, autoincrement=True),
    Column('session_id', Integer, nullable=False, index=True),
    Column('frame_id', BigInteger, nullable=False),
    Column('camera_angle', String(10), nullable=False),  # FRONT or SIDE
    Column('angle_data', JSON, nullable=False),  # {neck_bend: 15.2, shoulder_slope: 3.4, ...}
    Column('confidence_data', JSON, nullable=False),  # {neck_bend: 0.95, shoulder_slope: 0.88, ...}
    Column('is_calibrated', Boolean, default=True),
    Column('fps_at_frame', Float, nullable=True),  # Dynamic FPS calculated for this frame
    Column('timestamp_iso', String(50), nullable=False),  # ISO timestamp from Team 1
    Column('timestamp_ms', Float, nullable=False, index=True),  # Unix timestamp in milliseconds
)  # Database Initialization Functions

def init_database():
    """Create all tables if they don't exist"""
    try:
        metadata.create_all(engine)
        print("✅ Database tables created successfully")
        return True
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
        return False

def test_connection():
    """Test database connectivity"""
    try:
        with engine.connect() as conn:
            result = conn.execute(func.now())
            print(f"✅ Database connected successfully at {result.scalar()}")
            return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

def get_connection():
    """Get a database connection"""
    return engine.connect()