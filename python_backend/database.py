# Database Module - SQLAlchemy Core (Procedural, No ORM Classes)
from sqlalchemy import create_engine, MetaData, Table, Column, Integer, BigInteger, String, Float, Boolean, JSON
from sqlalchemy.sql import func
import config

# ── Team 1 (Own) Database ────────────────────────────────────────────────────
_t1_url = config.DATABASE_URL
if _t1_url and _t1_url.startswith("postgresql://"):
    _t1_url = _t1_url.replace("postgresql://", "postgresql+psycopg://", 1)

engine = create_engine(_t1_url, echo=False, pool_pre_ping=True)
metadata = MetaData()

raw_angles_table = Table(
    'raw_angles',
    metadata,
    Column('id', Integer, primary_key=True, autoincrement=True),
    Column('session_id', Integer, nullable=False, index=True),
    Column('frame_id', BigInteger, nullable=False),
    Column('camera_angle', String(10), nullable=False),
    Column('angle_data', JSON, nullable=False),
    Column('confidence_data', JSON, nullable=False),
    Column('is_calibrated', Boolean, default=True),
    Column('fps_at_frame', Float, nullable=True),
    Column('timestamp_iso', String(50), nullable=False),
    Column('timestamp_ms', Float, nullable=False, index=True),
)

# ── Team 3 (Mirror) Database ─────────────────────────────────────────────────
_t3_url = getattr(config, 'TEAM3_DATABASE_URL', None)
team3_engine = None
team3_raw_angles_table = None

if _t3_url:
    # Team 3 backend uses psycopg2 — keep plain postgresql:// prefix
    team3_engine = create_engine(
        _t3_url, echo=False, pool_pre_ping=True,
        connect_args={"sslmode": "require"}
    )
    _t3_meta = MetaData()
    team3_raw_angles_table = Table(
        'raw_angles', _t3_meta,
        Column('id', Integer, primary_key=True, autoincrement=True),
        Column('session_id', Integer, nullable=False),
        Column('frame_id', BigInteger, nullable=False),
        Column('camera_angle', String(10), nullable=False),
        Column('angle_data', JSON, nullable=False),
        Column('confidence_data', JSON, nullable=False),
        Column('is_calibrated', Boolean, default=True),
        Column('fps_at_frame', Float, nullable=True),
        Column('timestamp_iso', String(50), nullable=False),
        Column('timestamp_ms', Float, nullable=False),
    )
    print("✅ Team 3 mirror database engine ready")
else:
    print("⚠️  TEAM3_DATABASE_URL not set — mirroring disabled")


# ── Core Functions ────────────────────────────────────────────────────────────

def init_database():
    """Create tables in Team 1 DB if they don't exist"""
    try:
        metadata.create_all(engine)
        print("✅ Database tables created successfully")
        return True
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
        return False

def get_connection():
    """Get a Team 1 database connection"""
    return engine.connect()

def mirror_to_team3(row_values: dict):
    """
    Dual-write: insert the same raw_angles row into Team 3's Neon database.
    Silently skips if Team 3 URL is not configured.
    """
    if team3_engine is None or team3_raw_angles_table is None:
        return
    try:
        with team3_engine.connect() as conn:
            conn.execute(team3_raw_angles_table.insert().values(**row_values))
            conn.commit()
    except Exception as e:
        print(f"⚠️  Team 3 mirror write failed: {e}")