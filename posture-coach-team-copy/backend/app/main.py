from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import create_tables
from .routers import auth, profile, team2, sessions
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="Posture Coach API Gateway",
    description="""
    Main API Gateway for Posture Coach.
    Routes to User Auth (Internal) and Analysis Engine (Proxied to Port 8000).
    """,
    version="1.1.0"
)

# Allow all origins (App + Team 2)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Essential Routers
PREFIX = "/api/v1"
app.include_router(auth.router, prefix=PREFIX)
app.include_router(profile.router, prefix=PREFIX)
app.include_router(sessions.router, prefix=PREFIX)
app.include_router(team2.router, prefix=f"{PREFIX}/team2", tags=["Team 2 Gateway"])


@app.on_event("startup")
def startup():
    """Create all tables in Neon PostgreSQL on startup"""
    create_tables()
    
    # Diagnostic: Log masked JWT secret to verify loading against Team 2
    from .auth_utils import JWT_SECRET, JWT_ALGORITHM
    secret = JWT_SECRET or "MISSING"
    masked_secret = f"{secret[:4]}...{secret[-4:]}" if len(secret) > 8 else "***"
    print(f"🔒 SECURITY: JWT Secret Masked: {masked_secret}")
    print(f"🔒 SECURITY: JWT Algorithm: {JWT_ALGORITHM}")
    print(f"🔒 SECURITY: Env Path: {os.path.abspath('.env')}")
    
    print("✅ Gateway Ready!")


@app.get("/")
def root():
    return {
        "app": "Posture Coach API Gateway",
        "status": "online",
        "team2_status": "proxied",
        "docs": "/docs"
    }


@app.get("/health")
def health():
    return {"status": "ok"}
