# Team 1 Integration Guide (MediaPipe & Camera)

This guide explains how to integrate the real camera/webcam and ML processing logic into the existing Posture Coach system.

## 📍 Core Files to Modify
1.  **`frontend/services/cameraService.ts`**: (Primary Logic) Replace mock timers and random data with real ML inference.
2.  **`frontend/app/calibration.tsx`**: (Calibration UI) Integrate your camera view and ML overlays (skeletons/points).
3.  **`frontend/app/(tabs)/live.tsx`**: (Monitoring UI) Ensure the real-time feed displays your ML results.

---

## 🛠️ Step 1: Replace Mock Logic
Currently, the app uses a `setInterval` and `CameraView` to simulate data. Team 1 needs to:

1.  **`cameraService.ts`**:
    - Replace `detectPosture()` with your **MediaPipe** inference.
    - Replace `startMonitoring()` with your camera stream loop.
2.  **`calibration.tsx`**:
    - Update the `captureFrame()` logic to use your ML-confirmed measurements.
    - **Front vs Side**: The screen tells you which view is active via the `currentView` ('front' or 'side') variable. Use this to tell your ML model which rules to apply.
3.  **UI Overlays**:
    - In both `calibration.tsx` and `live.tsx`, replace the standard `CameraView` or add a `<Canvas>` overlay to draw your MediaPipe landmarks (skeleton/points) over the user's body.

---

## 📊 Step 2: Follow the Data Interface
To ensure the Backend and Dashboard continue to work, your result must strictly follow the `PostureData` interface:

```typescript
export interface PostureData {
    status: 'good' | 'warning' | 'bad'; // Controls the UI color & Voice Alerts
    score: number;                     // 0 to 100
    timestamp: number;
    // REQUIRED FOR BACKEND ANALYSIS:
    neckAngle?: number;
    shoulderAlignment?: number;
    backCurve?: number;
    torsoTilt?: number;
}
```

---

## 🔗 Step 3: Zero-Error Connectivity (Session ID)
Team 1 does **NOT** need to worry about `session_id` or managing API calls. I have already built a **"Data Bridge"** that connects your ML results to the Backend automatically.

**How it works (The Magic)**:
- Inside [`live.tsx`](file:///frontend/app/(tabs)/live.tsx) (Line 110), there is a function called `apiIngestTeam2Frames`.
- This function **automatically grabs the correct `session_id`** and attaches it to whichever data you produce.
- **Your ONLY Job**: Simply call the `callback(data)` function in your `startMonitoring` loop with the real angles. My bridge will handle the rest of the synchronization perfectly.

---

## ☁️ Step 4: No Backend Work Needed
There is no need for Team 1 to modify the backend.
- The **Team 2 Unified Backend** already has the endpoints (`/frames/ingest`) ready to accept the data you produce.
- You can focus 100% on making the React Native camera feed and MediaPipe processing fast and accurate.

---

## 🚀 How to Test
1.  Run the backend: `uvicorn app.main:app --reload --port 8001`
2.  Run the frontend: `npx expo start`
3.  Go to **Live Session**. When you click "Start Monitoring," the `session_id` is created and your ML code starts. If your code produces an angle (e.g., `neckAngle: 15`), it will be synced to the database in real-time with zero extra effort.
