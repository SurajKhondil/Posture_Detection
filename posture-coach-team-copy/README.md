# Posture Coach

Welcome to the Posture Coach project! This repository contains the frontend React Native (Expo) application and the backend FastAPI service.

## Project Structure
- `/frontend`: The Expo React Native application for users.
- `/backend`: The FastAPI server containing core logic and database connections.

---

## 🚀 Running the Backend

The backend is built with Python and FastAPI. It uses a PostgreSQL database.

### 1. Setup Environment
Navigate to the backend directory:
```bash
cd backend
```

Create and activate a virtual environment:
```bash
# Windows
python -m venv venv
.\venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

Install the required dependencies:
```bash
pip install -r requirements.txt
```

### 2. Configure Environment Variables
You need a `.env` file for the backend to run. 
- Create a `.env` file in the `backend/` directory by copying `.env.example`.
- Ensure the `DATABASE_URL` and other required variables are properly set.

### 3. Start the Server
Run the FastAPI development server:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
The API documentation will be available at `http://localhost:8000/docs`.

---

## 📱 Running the Frontend

The frontend is an Expo React Native application. 

### 1. Setup Environment
Open a new terminal and navigate to the frontend directory:
```bash
cd frontend
```

Install the Node dependencies:
```bash
npm install
```

### 2. Start the App
Start the Expo development server:
```bash
npx expo start
```
- Press `a` to open on an Android emulator (if running).
- Press `i` to open on an iOS simulator (macOS only).
- Scan the QR code shown in the terminal with your physical device using the Expo Go app.

### Connecting Frontend to Backend
The frontend is configured to communicate with the backend. 
- Ensure your backend is running before testing the app's dynamic features.
- If you are testing on a physical device, ensure both your computer and the phone are on the same local network.

Happy Coding! 🎉
