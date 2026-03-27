import { usePoseStore } from '../store/pose_state_manager';
import { PoseResult } from '../models/pose_result';
import { PoseLandmarkType, PoseLandmark } from '../models/pose_landmark';

export class MediaPipePoseDetector {
    private host: string;
    private port: number;
    private ws: WebSocket | null = null;
    private _isReady: boolean = false;
    private _frameCount: number = 0;

    constructor(host: string = 'localhost', port: number = 8765) {
        this.host = host;
        this.port = port;
    }

    get isReady(): boolean {
        return this._isReady;
    }

    async initialize(): Promise<void> {
        const { setConnectionStatus, setCurrentFrame, setError, handlePoseResult } = usePoseStore.getState();

        try {
            // In Android emulator, localhost is 10.0.2.2 usually.
            // Adjust if running on physical device or other environments.
            let finalHost = this.host;
            if (this.host === 'localhost') {
                // Platform.OS === 'android' ? '10.0.2.2' : 'localhost'
                // For Expo web/desktop it's localhost
                // We'll just assume localhost to match Flutter logic which ran on desktop
            }
            const uri = `ws://${finalHost}:${this.port}`;
            console.log(`🔌 Connecting to MediaPipe server at ${uri}`);

            this.ws = new WebSocket(uri);

            this.ws.onopen = () => {
                console.log('✅ Connected to MediaPipe server');
                this._isReady = true;
                setConnectionStatus(true, 'Connected to MediaPipe server');
                // No longer automatically starting Python webcam
            };

            this.ws.onmessage = (event) => {
                this.handleMessage(event.data);
            };

            this.ws.onerror = (error) => {
                console.log('❌ WebSocket error', error);
                this._isReady = false;
                setConnectionStatus(false, `Connection error`);
            };

            this.ws.onclose = () => {
                console.log('🔌 WebSocket connection closed');
                this._isReady = false;
                setConnectionStatus(false, 'Connection closed');
            };
        } catch (e: any) {
            console.log('❌ Failed to connect to MediaPipe server:', e);
            this._isReady = false;
            setConnectionStatus(false, `Failed to connect: ${e.message}`);
            throw e;
        }
    }

    private sendCommand(command: any) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(command));
        }
    }

    private handleMessage(message: string) {
        try {
            const data = JSON.parse(message);
            const type = data.type;

            switch (type) {
                case 'frame':
                    if (data.pose) {
                        this.handlePoseData(data.pose);
                    }
                    if (data.image) {
                        usePoseStore.getState().setCurrentFrame(data.image);
                    }
                    break;
                case 'pose':
                    this.handlePoseData(data.data);
                    break;
                case 'status':
                    const success = data.success as boolean;
                    const msg = data.message as string;
                    console.log(`📊 Status: ${msg}`);
                    usePoseStore.getState().setConnectionStatus(success, msg);
                    break;
                case 'pong':
                    console.log('🏓 Pong received');
                    break;
            }
        } catch (e) {
            console.log('Error parsing message:', e);
        }
    }

    private handlePoseData(poseData: any) {
        const detected = poseData.detected ?? false;
        const landmarks = new Map<PoseLandmarkType, PoseLandmark>();

        if (detected && poseData.landmarks) {
            const landmarkList = poseData.landmarks;

            for (const lm of landmarkList) {
                const index = lm.index as number;
                // Map index to type since values are same
                const type = index as PoseLandmarkType;

                if (PoseLandmarkType[type] !== undefined) {
                    landmarks.set(type, new PoseLandmark(
                        type,
                        lm.x,
                        lm.y,
                        lm.z,
                        lm.visibility
                    ));
                }
            }
        }

        this._frameCount++;
        const latestPose = new PoseResult(landmarks, new Date(), this._frameCount);

        usePoseStore.getState().handlePoseResult(latestPose);
    }

    sendFrame(base64Image: string) {
        if (!this._isReady) return;
        this.sendCommand({ command: 'process_frame', image: base64Image, timestamp_ms: Date.now() });
    }

    sendMetrics(metricsPayload: any) {
        if (!this._isReady) return;
        this.sendCommand({ command: 'save_metrics', payload: metricsPayload });
    }

    startSession() {
        if (!this._isReady) return;
        this.sendCommand({ command: 'start' });
    }

    pauseSession() {
        if (!this._isReady) return;
        this.sendCommand({ command: 'pause' });
    }

    stopSession() {
        if (!this._isReady) return;
        this.sendCommand({ command: 'stop' });
    }

    ping() {
        this.sendCommand({ command: 'ping' });
    }

    dispose() {
        this.sendCommand({ command: 'stop' });
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this._isReady = false;
    }
}

export const poseDetectorService = new MediaPipePoseDetector('10.181.245.239', 8765);
