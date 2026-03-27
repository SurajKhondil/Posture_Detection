# Tech Stack - Posture Coach App

## Team 3 (Mobile App) Tech Stack:

### 1. Mobile Framework
**React Native with Expo**
- Purpose: Cross-platform mobile app development (iOS & Android)

### 2. Routing & Navigation
**Expo Router**
- Purpose: File-based routing and navigation

### 3. State Management
**Zustand**
- Purpose: Global state management (user data, settings, sessions)

### 4. Local Storage
**AsyncStorage**
- Purpose: Persist user data locally (offline support)

### 5. Camera Access
**expo-camera**
- Purpose: Access device camera for posture detection

### 6. UI Components & Icons
**Lucide React Native**
- Purpose: Icon library for UI elements

### 7. Styling
**React Native StyleSheet + expo-linear-gradient**
- Purpose: Component styling and gradient backgrounds

### 8. Notifications
**expo-notifications**
- Purpose: Push notifications for posture alerts

### 9. Audio Alerts
**expo-av**
- Purpose: Sound playback for posture alerts

### 10. Programming Language
**TypeScript**
- Purpose: Type-safe JavaScript for mobile app

---

## Team 3 (Backend) Tech Stack:

### 1. API Framework
**FastAPI (Python)**
- Purpose: REST API server, handles mobile app requests

### 2. Database
**PostgreSQL**
- Purpose: Store user profiles, sessions, calibration data, reports

### 3. Cache Layer
**Redis**
- Purpose: Cache real-time posture data and session state

### 4. ORM (Object-Relational Mapping)
**SQLAlchemy**
- Purpose: Database queries and operations

### 5. Authentication
**JWT (JSON Web Tokens)**
- Purpose: Secure user authentication

### 6. HTTP Client
**httpx**
- Purpose: Async API calls to Team 1 and Team 2 backends

### 7. Environment Management
**python-dotenv**
- Purpose: Manage environment variables

### 8. Programming Language
**Python 3.10+**
- Purpose: Backend development, ML model integration

---

## Integration with Team 1 & Team 2:

### Team 1 API Integration
- **Receives**: Camera frames (base64) from mobile app
- **Processes**: MediaPipe Pose detection (Team 1 backend)
- **Returns**: Keypoints, angles, posture status

### Team 2 API Integration
- **Receives**: Session data and user profile
- **Processes**: Pain risk analysis (Team 2 backend)
- **Returns**: Risk areas, recommendations

---

## Data Flow:

```
Mobile App (React Native + TypeScript)
    ↓
Team 3 Backend (FastAPI + Python)
    ↓
    ├─→ Team 1 Backend (MediaPipe + Python)
    └─→ Team 2 Backend (Pain Risk Analysis)
    ↓
PostgreSQL (Data Storage)
    ↓
Mobile App (Display Results)
```

---

## Complete Dependency List:

### Mobile App (package.json)
```json
{
  "expo": "~52.0.0",
  "react": "18.3.1",
  "react-native": "0.76.5",
  "expo-router": "~4.0.0",
  "expo-camera": "~16.0.0",
  "expo-notifications": "~0.29.0",
  "expo-av": "~15.0.0",
  "expo-linear-gradient": "~14.0.0",
  "zustand": "^5.0.2",
  "@react-native-async-storage/async-storage": "^2.1.0",
  "lucide-react-native": "^0.460.0",
  "react-native-svg": "15.8.0"
}
```

### Backend (requirements.txt)
```txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
sqlalchemy==2.0.23
psycopg2-binary==2.9.9
redis==5.0.1
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
httpx==0.25.2
python-dotenv==1.0.0
```
