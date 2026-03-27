"""
Pose Detection Server using MediaPipe Tasks API (0.10+)
Runs as a local WebSocket server that Flutter connects to
"""

import asyncio
import json
import cv2
import websockets
import numpy as np
from typing import Optional, Dict, List
import time
import os
import urllib.request

# Import MediaPipe with new Tasks API
import mediapipe as mp
from mediapipe.tasks.python import BaseOptions
from mediapipe.tasks.python.vision import (
    PoseLandmarker, 
    PoseLandmarkerOptions, 
    RunningMode
)

# Upper body landmarks only (indices 0-22, excluding hips and below)
UPPER_BODY_LANDMARKS = {
    0: "nose",
    1: "left_eye_inner",
    2: "left_eye",
    3: "left_eye_outer",
    4: "right_eye_inner",
    5: "right_eye",
    6: "right_eye_outer",
    7: "left_ear",
    8: "right_ear",
    9: "mouth_left",
    10: "mouth_right",
    11: "left_shoulder",
    12: "right_shoulder",
    13: "left_elbow",
    14: "right_elbow",
    15: "left_wrist",
    16: "right_wrist",
    17: "left_pinky",
    18: "right_pinky",
    19: "left_index",
    20: "right_index",
    21: "left_thumb",
    22: "right_thumb",
    23: "left_hip",
    24: "right_hip",
    25: "left_knee",
    26: "right_knee",
    27: "left_ankle",
    28: "right_ankle",
}

MODEL_URL = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task"
MODEL_PATH = "pose_landmarker_full.task"


def download_model():
    """Download pose landmarker model if not exists"""
    if not os.path.exists(MODEL_PATH):
        print("📥 Downloading pose detection model...")
        urllib.request.urlretrieve(MODEL_URL, MODEL_PATH)
        print("✅ Model downloaded successfully!")
    else:
        print("✅ Model already exists")


class PoseDetector:
    def __init__(self):
        self.landmarker = None
        self.cap = None
        self.frame_count = 0
        
    def _init_detector(self):
        """Initialize MediaPipe Pose Landmarker"""
        if self.landmarker is None:
            download_model()
            
            options = PoseLandmarkerOptions(
                base_options=BaseOptions(model_asset_path=MODEL_PATH),
                running_mode=RunningMode.VIDEO,
                num_poses=1,
                min_pose_detection_confidence=0.5,
                min_pose_presence_confidence=0.5,
                min_tracking_confidence=0.5,
            )
            self.landmarker = PoseLandmarker.create_from_options(options)
            print("✅ Pose Landmarker initialized")
        
    def start_camera(self, camera_index: int = 0) -> bool:
        """Initialize camera capture"""
        try:
            self._init_detector()
            
            # Try DirectShow first on Windows (usually faster)
            self.cap = cv2.VideoCapture(camera_index, cv2.CAP_DSHOW)
            if not self.cap.isOpened():
                # Fallback to default
                self.cap = cv2.VideoCapture(camera_index)
                
            if not self.cap.isOpened():
                print(f"❌ Error: Could not open camera {camera_index}")
                return False
            
            # Set camera properties
            self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
            self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
            self.cap.set(cv2.CAP_PROP_FPS, 30)
            
            actual_width = int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            actual_height = int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            print(f"📷 Camera {camera_index} opened: {actual_width}x{actual_height}")
            return True
            
        except Exception as e:
            print(f"❌ Error starting camera: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def stop_camera(self):
        """Release camera"""
        if self.cap:
            self.cap.release()
            self.cap = None
            print("📷 Camera stopped")
    
    def detect_pose(self) -> Optional[Dict]:
        """Capture frame and detect pose"""
        if not self.cap or not self.cap.isOpened():
            return None
        
        ret, frame = self.cap.read()
        if not ret:
            return None
        
        self.frame_count += 1
        timestamp_ms = int(time.time() * 1000)
        
        # Convert BGR to RGB for MediaPipe
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Create MediaPipe image
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
        
        # Detect pose
        result = self.landmarker.detect_for_video(mp_image, timestamp_ms)
        
        if not result.pose_landmarks or len(result.pose_landmarks) == 0:
            return {
                "frame": self.frame_count,
                "timestamp": timestamp_ms,
                "landmarks": [],
                "detected": False,
            }
        
        # Extract upper body landmarks from first pose
        pose_landmarks = result.pose_landmarks[0]
        landmarks = []
        
        for idx, name in UPPER_BODY_LANDMARKS.items():
            if idx < len(pose_landmarks):
                lm = pose_landmarks[idx]
                landmarks.append({
                    "index": idx,
                    "name": name,
                    "x": float(lm.x),  # Normalized 0-1
                    "y": float(lm.y),  # Normalized 0-1
                    "z": float(lm.z),  # Depth
                    "visibility": float(lm.visibility) if hasattr(lm, 'visibility') else 1.0,
                })
        
        return {
            "frame": self.frame_count,
            "timestamp": timestamp_ms,
            "landmarks": landmarks,
            "detected": True,
            "image_width": frame.shape[1],
            "image_height": frame.shape[0],
        }
    
    def close(self):
        """Cleanup resources"""
        self.stop_camera()
        if self.landmarker:
            self.landmarker.close()
            self.landmarker = None


class PoseServer:
    def __init__(self, host: str = "localhost", port: int = 8765):
        self.host = host
        self.port = port
        self.detector = PoseDetector()
        self.clients = {}  # mapping websocket -> {"session_id": 1, "is_paused": False}
        self.running = False
        self.session_counter = 0
        
    async def handler(self, websocket):
        """Handle WebSocket connection"""
        self.clients[websocket] = {"session_id": None, "is_paused": False}
        print(f"✅ Client connected. Awaiting 'Start Session' to begin saving data.")
        
        try:
            async for message in websocket:
                try:
                    data = json.loads(message)
                    command = data.get("command")
                    
                    if command == "start":
                        self.session_counter += 1
                        next_session_id = self.session_counter
                            
                        self.clients[websocket]["session_id"] = next_session_id
                        self.clients[websocket]["is_paused"] = False
                        
                        if "camera_index" in data:
                            camera_index = data.get("camera_index", 0)
                            success = self.detector.start_camera(camera_index)
                            await websocket.send(json.dumps({
                                "type": "status",
                                "success": success,
                                "message": "Camera started" if success else "Failed to start camera"
                            }))
                            if success:
                                self.running = True
                                asyncio.create_task(self.stream_poses(websocket))
                        else:
                            await websocket.send(json.dumps({
                                "type": "status",
                                "success": True,
                                "message": f"Session {next_session_id} started, ready to receive frames"
                            }))
                            
                    elif command == "pause":
                        if websocket in self.clients:
                            self.clients[websocket]["is_paused"] = True
                        await websocket.send(json.dumps({
                            "type": "status",
                            "success": True,
                            "message": "Session paused"
                        }))
                    
                    elif command == "stop":
                        if websocket in self.clients:
                            self.clients[websocket]["is_paused"] = True
                            self.clients[websocket]["session_id"] = None
                            
                        if self.running:
                            self.running = False
                            self.detector.stop_camera()
                            
                        await websocket.send(json.dumps({
                            "type": "status",
                            "success": True,
                            "message": "Session stopped"
                        }))
                        
                    elif command == "process_frame":
                        client_state = self.clients.get(websocket, {})
                        if client_state.get("is_paused", False):
                            continue # Ignore frames while paused
                            
                        if not self.detector.landmarker:
                            self.detector._init_detector()
                            
                        image_b64 = data.get("image")
                        if image_b64:
                            # if it has data url scheme, split it
                            if "," in image_b64:
                                image_b64 = image_b64.split(",")[1]
                                
                            timestamp_ms = data.get("timestamp_ms", int(time.time() * 1000))
                            
                            import base64
                            try:
                                img_bytes = base64.b64decode(image_b64)
                                np_arr = np.frombuffer(img_bytes, np.uint8)
                                frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
                                if frame is not None:
                                    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                                    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
                                    result = self.detector.landmarker.detect_for_video(mp_image, timestamp_ms)
                                    
                                    landmarks = []
                                    detected = False
                                    if result.pose_landmarks and len(result.pose_landmarks) > 0:
                                        detected = True
                                        pose_landmarks = result.pose_landmarks[0]
                                        for idx, name in UPPER_BODY_LANDMARKS.items():
                                            if idx < len(pose_landmarks):
                                                lm = pose_landmarks[idx]
                                                landmarks.append({
                                                    "index": idx,
                                                    "name": name,
                                                    "x": float(lm.x),
                                                    "y": float(lm.y),
                                                    "z": float(lm.z),
                                                    "visibility": float(lm.visibility) if hasattr(lm, 'visibility') else 1.0,
                                                })
                                    
                                    self.detector.frame_count += 1
                                    pose_data = {
                                        "frame": self.detector.frame_count,
                                        "timestamp": timestamp_ms,
                                        "landmarks": landmarks,
                                        "detected": detected,
                                        "image_width": frame.shape[1],
                                        "image_height": frame.shape[0],
                                    }
                                    await websocket.send(json.dumps({
                                        "type": "pose",
                                        "data": pose_data
                                    }))
                            except Exception as e:
                                print(f"Error handling process_frame: {e}")
                        
                    elif command == "save_metrics":
                        client_state = self.clients.get(websocket, {})
                        if client_state.get("is_paused", False) or client_state.get("session_id") is None:
                            continue
                            
                        import database
                        database.init_database()  # Ensure tables exist
                        
                        payload = data.get("payload", {})
                        if payload:
                            try:
                                with database.get_connection() as conn:
                                    frame_id = payload.get("scan_id", "frame_0").replace("frame_", "")
                                    camera_angle = payload.get("camera_angle", "FRONT")
                                    is_calibrated = payload.get("is_calibrated", True)
                                    data_obj = payload.get("data", {})
                                    
                                    angle_data = {}
                                    confidence_data = {}
                                    
                                    for k, v in data_obj.items():
                                        if k.endswith("_degree") or k.endswith("_index"):
                                            base = k.replace("_degree", "").replace("_index", "")
                                            angle_data[base] = v
                                        elif k.endswith("_confidence"):
                                            base = k.replace("_confidence", "")
                                            confidence_data[base] = v

                                    timestamp_ms = float(frame_id) if frame_id.isdigit() else 0.0
                                    
                                    import datetime as dt
                                    ist_tz = dt.timezone(dt.timedelta(hours=5, minutes=30))
                                    iso_str = dt.datetime.fromtimestamp(timestamp_ms / 1000.0, tz=ist_tz).isoformat()
                                    
                                    stmt = database.raw_angles_table.insert().values(
                                        session_id=client_state.get("session_id", 1),
                                        frame_id=int(timestamp_ms),
                                        camera_angle=camera_angle,
                                        angle_data=angle_data,
                                        confidence_data=confidence_data,
                                        is_calibrated=is_calibrated,
                                        fps_at_frame=30.0,
                                        timestamp_iso=iso_str,
                                        timestamp_ms=timestamp_ms
                                    )
                                    conn.execute(stmt)
                                    conn.commit()
                                    # print(f"💾 Raw angles saved to DB: {camera_angle}")
                            except Exception as e:
                                print(f"❌ DB Insert Error: {e}")
                                
                    elif command == "ping":
                        await websocket.send(json.dumps({
                            "type": "pong",
                            "timestamp": int(time.time() * 1000)
                        }))
                        
                except json.JSONDecodeError:
                    print(f"Invalid JSON: {message}")
                    
        except websockets.exceptions.ConnectionClosed:
            print("❌ Client disconnected")
        except Exception as e:
            print(f"Handler error: {e}")
            import traceback
            traceback.print_exc()
        finally:
            self.clients.pop(websocket, None)
            if len(self.clients) == 0:
                self.running = False
                self.detector.stop_camera()
                self.session_counter = 0  # Reset session counter when React App fully disconnects
    
    async def stream_poses(self, websocket):
        """Stream pose detection results to client"""
        print("📡 Starting pose stream with video...")
        frames_sent = 0
        
        while self.running and websocket in self.clients:
            try:
                # Get frame separately to encode it
                if not self.detector.cap or not self.detector.cap.isOpened():
                    await asyncio.sleep(0.1)
                    continue
                    
                ret, frame = self.detector.cap.read()
                if not ret:
                    continue
                
                self.detector.frame_count += 1
                timestamp_ms = int(time.time() * 1000)
                
                # 1. Detect Pose
                # Convert BGR to RGB for MediaPipe
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
                result = self.detector.landmarker.detect_for_video(mp_image, timestamp_ms)
                
                # Process landmarks
                landmarks = []
                detected = False
                if result.pose_landmarks and len(result.pose_landmarks) > 0:
                    detected = True
                    pose_landmarks = result.pose_landmarks[0]
                    for idx, name in UPPER_BODY_LANDMARKS.items():
                        if idx < len(pose_landmarks):
                            lm = pose_landmarks[idx]
                            landmarks.append({
                                "index": idx,
                                "name": name,
                                "x": float(lm.x),
                                "y": float(lm.y),
                                "z": float(lm.z),
                                "visibility": float(lm.visibility) if hasattr(lm, 'visibility') else 1.0,
                            })

                pose_data = {
                    "frame": self.detector.frame_count,
                    "timestamp": timestamp_ms,
                    "landmarks": landmarks,
                    "detected": detected,
                    "image_width": frame.shape[1],
                    "image_height": frame.shape[0],
                }

                # 2. Encode Frame to JPEG (lower quality for speed)
                _, buffer = cv2.imencode('.jpg', frame, [int(cv2.IMWRITE_JPEG_QUALITY), 60])
                import base64
                jpg_as_text = base64.b64encode(buffer).decode('utf-8')
                
                # 3. Send Data
                await websocket.send(json.dumps({
                    "type": "frame",
                    "pose": pose_data,
                    "image": jpg_as_text
                }))
                
                frames_sent += 1
                if frames_sent % 30 == 0:
                    print(f"📊 Frame {frames_sent}: detected={detected}, landmarks={len(landmarks)}")
                    
                await asyncio.sleep(1/30)  # ~30 FPS
                
            except websockets.exceptions.ConnectionClosed:
                break
            except Exception as e:
                print(f"Stream error: {e}")
                import traceback
                traceback.print_exc()
                await asyncio.sleep(0.1)
        
        print(f"📡 Stream ended. Total frames: {frames_sent}")
    
    async def start(self):
        """Start the WebSocket server"""
        print("=" * 50)
        print("  MediaPipe Pose Detection Server")
        print("=" * 50)
        print(f"🚀 Starting server on ws://{self.host}:{self.port}")
        print("📷 Waiting for Flutter app to connect...")
        print()
        
        async with websockets.serve(self.handler, self.host, self.port, max_size=10485760, ping_interval=None): # 10MB max size and disable strict pings
            await asyncio.Future()  # Run forever


def main():
    server = PoseServer(host="0.0.0.0", port=8765)
    try:
        asyncio.run(server.start())
    except KeyboardInterrupt:
        print("\n🛑 Server stopped")
        server.detector.close()


if __name__ == "__main__":
    main()
