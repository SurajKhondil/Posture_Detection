import { Camera } from 'expo-camera';
import { poseDetectorService } from './mediapipe_pose_detector';
import { usePoseStore } from '../store/pose_state_manager';

export type PostureStatus = 'good' | 'warning' | 'bad';

export interface PostureData {
    status: PostureStatus;
    score: number;
    timestamp: number;
    neckAngle?: number;
    shoulderAlignment?: number;
    backCurve?: number;
    torsoTilt?: number;
}

class CameraService {
    private hasPermission: boolean = false;
    private isMonitoring: boolean = false;
    private monitoringInterval: any = null;
    private callback: ((data: PostureData) => void) | null = null;

    async requestPermissions(): Promise<boolean> {
        try {
            const { status } = await Camera.requestCameraPermissionsAsync();
            this.hasPermission = status === 'granted';
            return this.hasPermission;
        } catch (error) {
            console.error('Error requesting camera permission:', error);
            return false;
        }
    }

    async checkPermissions(): Promise<boolean> {
        try {
            const { status } = await Camera.getCameraPermissionsAsync();
            this.hasPermission = status === 'granted';
            return this.hasPermission;
        } catch (error) {
            console.error('Error checking camera permission:', error);
            return false;
        }
    }

    // Mock posture detection - in production, this would use ML/AI
    private detectPosture(): PostureData {
        // Generate random but realistic posture data
        const random = Math.random();
        let status: PostureStatus;
        let score: number;

        if (random < 0.6) {
            // 60% good posture
            status = 'good';
            score = 80 + Math.floor(Math.random() * 20);
        } else if (random < 0.85) {
            // 25% warning
            status = 'warning';
            score = 60 + Math.floor(Math.random() * 20);
        } else {
            // 15% bad posture
            status = 'bad';
            score = 30 + Math.floor(Math.random() * 30);
        }

        return {
            status,
            score,
            timestamp: Date.now(),
            neckAngle: 10 + Math.random() * 30,
            shoulderAlignment: 85 + Math.random() * 15,
            backCurve: 15 + Math.random() * 20,
            torsoTilt: 15 + Math.random() * 15,
        };
    }

    startMonitoring(callback: (data: PostureData) => void, intervalMs: number = 2000) {
        if (this.isMonitoring) {
            this.stopMonitoring();
        }

        this.callback = callback;
        this.isMonitoring = true;

        poseDetectorService.startSession();

        this.monitoringInterval = usePoseStore.subscribe((state) => {
            if (state.calibratedMetrics && this.isMonitoring && this.callback) {
                const output: PostureData = {
                    status: (state.calibratedMetrics as any).overallQuality as 'good' | 'warning' | 'bad' || 'good',
                    score: Math.round(state.calibratedMetrics.confidence * 100),
                    timestamp: Date.now(),
                    neckAngle: state.calibratedMetrics.neckBendAngle,
                    shoulderAlignment: state.calibratedMetrics.shoulderSlopeAngle,
                    torsoTilt: state.calibratedMetrics.torsoTiltPercent
                };
                this.callback(output);
            }
        });
    }

    stopMonitoring() {
        this.isMonitoring = false;
        if (this.monitoringInterval && typeof this.monitoringInterval === 'function') {
            this.monitoringInterval(); // Unsubscribe Zustand 
            this.monitoringInterval = null;
        }
        this.callback = null;
        poseDetectorService.stopSession();
    }

    isCurrentlyMonitoring(): boolean {
        return this.isMonitoring;
    }

    // Calibration - capture baseline posture
    async calibrate(): Promise<PostureData> {
        // In production, this would capture and analyze multiple frames
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    status: 'good',
                    score: 95,
                    timestamp: Date.now(),
                    neckAngle: 12,
                    shoulderAlignment: 98,
                    backCurve: 18,
                });
            }, 3000);
        });
    }
}

export const cameraService = new CameraService();
