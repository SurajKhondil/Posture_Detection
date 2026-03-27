# Backend Tech Stack - Team 3

## Recommended Stack

### Core Framework
- **FastAPI** (Python)
  - Purpose: API development, handles requests from mobile app
  - Why: Fast, auto-documentation, async support for real-time

### Database
- **PostgreSQL**
  - Purpose: Store user data, sessions, calibration data, settings
  - Why: Reliable, structured data, production-ready

### Cache
- **Redis**
  - Purpose: Cache real-time posture data, session state
  - Why: Fast in-memory storage for temporary data

### Authentication
- **JWT (JSON Web Tokens)**
  - Purpose: Secure user authentication
  - Why: Stateless, works well with mobile apps

### ORM
- **SQLAlchemy**
  - Purpose: Database operations
  - Why: Works seamlessly with FastAPI and PostgreSQL

---

## Dependencies

```bash
# Core
fastapi==0.104.1
uvicorn[standard]==0.24.0

# Database
sqlalchemy==2.0.23
psycopg2-binary==2.9.9
alembic==1.12.1

# Cache
redis==5.0.1

# Authentication
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4

# HTTP Client (for Team 1 & 2 APIs)
httpx==0.25.2

# Environment
python-dotenv==1.0.0
```

---

## Why This Stack?

| Component | Purpose | Benefit |
|-----------|---------|---------|
| FastAPI | API Server | Fast, auto-docs, async |
| PostgreSQL | Main Database | Reliable, scalable |
| Redis | Cache | Fast real-time data |
| JWT | Auth | Secure, mobile-friendly |
| SQLAlchemy | Database ORM | Easy queries |
| httpx | API Calls | Async calls to Team 1 & 2 |

---

## Setup

```bash
# Install Python 3.10+
python --version

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup PostgreSQL
# Install from: https://www.postgresql.org/download/

# Setup Redis
# Install from: https://redis.io/download

# Run
uvicorn main:app --reload
```

---

## API Endpoints (Your Backend)

```
POST /api/auth/login          - User login
POST /api/auth/signup         - User signup
GET  /api/user/profile        - Get user profile
PUT  /api/user/profile        - Update profile

POST /api/calibration/start   - Start calibration (→ Team 1)
GET  /api/calibration/status  - Get calibration data

POST /api/session/start       - Start posture session
POST /api/session/analyze     - Analyze frame (→ Team 1)
POST /api/session/end         - End session (→ Team 2)

GET  /api/reports/daily       - Daily stats
GET  /api/reports/weekly      - Weekly stats
GET  /api/pain-risk/:userId   - Pain risk report (from Team 2)
```

---

## Integration Flow

```
Mobile App
    ↓
Your FastAPI Backend
    ↓
    ├─→ Team 1 API (Posture Detection)
    └─→ Team 2 API (Pain Risk Analysis)
    ↓
PostgreSQL (Store Data)
    ↓
Return to Mobile App
```

---

## Environment Variables

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/posture_db
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
TEAM1_API_URL=https://team1-api.com
TEAM2_API_URL=https://team2-api.com
```

---

**Simple, fast, production-ready!**
