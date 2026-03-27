# Posture Coach - Team Setup Guide 🚀

Here is the complete guide to get the Posture Coach app and backend running on your machine.

---

## 🏗️ 1. Project Structure
The project has two main parts:
- **`e:\posture-coach-app\`** → The Expo React Native App
- **`e:\posture-coach-app\backend\`** → The Python FastAPI Backend

---

## 🐍 2. Set Up the Backend
You need Python installed. Since the database is hosted on the cloud (Neon), you don't need to configure a local database!

1. Open your terminal and navigate to the backend folder:
   ```cmd
   cd path/to/posture-coach-app/backend
   ```
2. Create a virtual environment:
   ```cmd
   python -m venv venv
   ```
3. Activate the virtual environment:
   * **Windows:** `.\venv\Scripts\activate`
   * **Mac/Linux:** `source venv/bin/activate`
4. Install the requirements:
   ```cmd
   pip install -r requirements.txt
   ```
5. *(Important!)* Create a file named `.env` in the `backend` folder and add the connection string (Ask Neha for the DATABASE_URL):
   ```plaintext
   DATABASE_URL=postgresql://neondb_owner:npg_SgXz9eBckPR2@ep-green-truth-a1s1qpgr-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
   JWT_SECRET=posture-coach-super-secret-key-2026
   JWT_ALGORITHM=HS256
   JWT_EXPIRE_MINUTES=10080
   ```
6. Run the backend server:
   ```cmd
   uvicorn app.main:app --port 8001 --reload
   ```
   *You should see: `✅ Connected to Neon PostgreSQL - Tables created!`*
   *The API docs will be at: [http://localhost:8001/docs](http://localhost:8001/docs)*

---

## 🌐 3. Expose the Backend with ngrok
Because you are running the app on a physical phone, the phone needs a public URL to reach the backend on your laptop.

1. Open a **new terminal** (leave the backend one running).
2. Install ngrok if you haven't already from [ngrok.com/download](https://ngrok.com/download)
3. Authenticate (Command from your ngrok dashboard):
   ```cmd
   ngrok config add-authtoken YOUR_NGROK_TOKEN
   ```
4. Start the tunnel:
   ```cmd
   ngrok http 8001
   ```
5. **Copy the Forwarding URL** (e.g., `https://1234-abcd.ngrok-free.app`)

---

## 📱 4. Set Up the App (Frontend)
Now tell the app where your ngrok tunnel is pointing.

1. Open the file `services/backendService.ts` in your code editor.
2. Find the constant `NGROK_URL` (around line 19) and paste your new ngrok URL:
   ```typescript
   const NGROK_URL = 'https://YOUR_NEW_NGROK_URL.ngrok-free.dev';
   ```
3. Open a **new terminal** (your 3rd one) and go to the main app folder:
   ```cmd
   cd path/to/posture-coach-app
   ```
4. Install app dependencies:
   ```cmd
   npm install
   ```
5. Start the Expo development server:
   ```cmd
   npm start
   ```
6. Open the **Expo Go app** on your mobile phone and scan the QR code.

**You are now fully connected!** Any users you sign up will be saved directly to the shared Neon PostgreSQL database!
