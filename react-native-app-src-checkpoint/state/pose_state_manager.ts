import { create } from 'zustand';
import { PoseResult } from '../models/pose_result';
import { PostureMetrics, PostureMathEngine } from '../models/posture_metrics';
import { ViewMode } from '../views/types';

export interface PoseState {
    viewMode: ViewMode;
    isCalibrated: boolean;
    calibrationBaseline: PostureMetrics | null;
    calibrationBuffer: PostureMetrics[];
    isCalibrating: boolean;

    currentPose: PoseResult | null;
    currentMetrics: PostureMetrics | null;
    calibratedMetrics: PostureMetrics | null;

    framesProcessed: number;
    fps: number;
    lastFrameTime: number | null;

    error: string | null;
    isConnected: boolean;
    connectionMessage: string;
    currentFrame: string | null;

    // Actions
    setViewMode: (mode: ViewMode) => void;
    startCalibration: () => void;
    cancelCalibration: () => void;
    handlePoseResult: (pose: PoseResult) => void;
    setConnectionStatus: (connected: boolean, message: string) => void;
    setCurrentFrame: (base64Frame: string | null) => void;
    setError: (error: string | null) => void;
    reset: () => void;
}

const CALIBRATION_FRAMES_REQUIRED = 30;

function calculateAverageMetrics(buffer: PostureMetrics[]): PostureMetrics {
    if (buffer.length === 0) return PostureMetrics.empty();

    let totalNeckBend = 0;
    let totalShoulderSlope = 0;
    let totalTorsoTilt = 0;
    let totalHeadForward = 0;
    let totalNeckConf = 0;
    let totalShoulderConf = 0;
    let totalTorsoConf = 0;
    let totalHeadConf = 0;
    let totalConfidence = 0;

    for (const m of buffer) {
        totalNeckBend += m.neckBendAngle;
        totalShoulderSlope += m.shoulderSlopeAngle;
        totalTorsoTilt += m.torsoTiltPercent;
        totalHeadForward += m.headForwardRatio;

        totalNeckConf += m.neckBendConfidence;
        totalShoulderConf += m.shoulderSlopeConfidence;
        totalTorsoConf += m.torsoTiltConfidence;
        totalHeadConf += m.headForwardConfidence;
        totalConfidence += m.confidence;
    }

    const count = buffer.length;
    return new PostureMetrics({
        neckBendAngle: totalNeckBend / count,
        neckBendConfidence: totalNeckConf / count,
        shoulderSlopeAngle: totalShoulderSlope / count,
        shoulderSlopeConfidence: totalShoulderConf / count,
        torsoTiltPercent: totalTorsoTilt / count,
        torsoTiltConfidence: totalTorsoConf / count,
        headForwardRatio: totalHeadForward / count,
        headForwardConfidence: totalHeadConf / count,
        confidence: totalConfidence / count,
        timestamp: new Date(),
    });
}

function emitData(calibratedMetrics: PostureMetrics, viewMode: ViewMode, isCalibrated: boolean) {
    const timestamp = new Date().getTime();
    const cameraAngle = viewMode === ViewMode.front ? 'FRONT' : 'SIDE';

    const dataObj: any = {};

    if (viewMode === ViewMode.front) {
        dataObj['neck_bend_degree'] = parseFloat(calibratedMetrics.neckBendAngle.toFixed(2));
        dataObj['neck_camera_angle'] = cameraAngle;
        dataObj['neck_is_calibrated'] = isCalibrated;
        dataObj['neck_confidence'] = parseFloat(calibratedMetrics.neckBendConfidence.toFixed(3));
        dataObj['neck_timestamp'] = timestamp;

        dataObj['shoulder_slope_degree'] = parseFloat(calibratedMetrics.shoulderSlopeAngle.toFixed(2));
        dataObj['shoulder_camera_angle'] = cameraAngle;
        dataObj['shoulder_is_calibrated'] = isCalibrated;
        dataObj['shoulder_confidence'] = parseFloat(calibratedMetrics.shoulderSlopeConfidence.toFixed(3));
        dataObj['shoulder_timestamp'] = timestamp;

        dataObj['torso_tilt_degree'] = parseFloat(calibratedMetrics.torsoTiltPercent.toFixed(2));
        dataObj['torso_camera_angle'] = cameraAngle;
        dataObj['torso_is_calibrated'] = isCalibrated;
        dataObj['torso_confidence'] = parseFloat(calibratedMetrics.torsoTiltConfidence.toFixed(3));
        dataObj['torso_timestamp'] = timestamp;
    } else {
        dataObj['head_forward_index'] = parseFloat(calibratedMetrics.headForwardRatio.toFixed(3));
        dataObj['head_forward_camera_angle'] = cameraAngle;
        dataObj['head_forward_is_calibrated'] = isCalibrated;
        dataObj['head_forward_confidence'] = parseFloat(calibratedMetrics.headForwardConfidence.toFixed(3));
        dataObj['head_forward_timestamp'] = timestamp;
    }

    const finalPayload = {
        scan_id: `frame_${timestamp}`,
        camera_angle: cameraAngle,
        is_calibrated: isCalibrated,
        data: dataObj
    };

    console.log('📊 STR_JSON: ', JSON.stringify(finalPayload));
}

export const usePoseStore = create<PoseState>((set, get) => ({
    viewMode: ViewMode.front,
    isCalibrated: false,
    calibrationBaseline: null,
    calibrationBuffer: [],
    isCalibrating: false,

    currentPose: null,
    currentMetrics: null,
    calibratedMetrics: null,

    framesProcessed: 0,
    fps: 0,
    lastFrameTime: null,

    error: null,
    isConnected: false,
    connectionMessage: 'Not connected',
    currentFrame: null,

    setViewMode: (mode: ViewMode) => {
        if (get().viewMode !== mode) {
            set({
                viewMode: mode,
                isCalibrated: false,
                calibrationBaseline: null,
                calibratedMetrics: null,
            });
        }
    },

    startCalibration: () => {
        set({
            isCalibrating: true,
            calibrationBuffer: [],
        });
    },

    cancelCalibration: () => {
        set({
            isCalibrating: false,
            calibrationBuffer: [],
        });
    },

    handlePoseResult: (pose: PoseResult) => {
        const s = get();
        if (!pose.hasMinimumKeypoints && pose.landmarks.size === 0) return;

        let newFps = s.fps;
        const now = new Date().getTime();
        if (s.lastFrameTime) {
            const delta = now - s.lastFrameTime;
            if (delta > 0) newFps = 1000 / delta;
        }

        const metrics = PostureMathEngine.calculate(pose, s.viewMode === ViewMode.side);

        let isCalibratingNow = s.isCalibrating;
        let newBuffer = [...s.calibrationBuffer];
        let isCalibratedNow = s.isCalibrated;
        let newBaseline = s.calibrationBaseline;

        if (s.isCalibrating && metrics) {
            newBuffer.push(metrics);
            if (newBuffer.length >= CALIBRATION_FRAMES_REQUIRED) {
                newBaseline = calculateAverageMetrics(newBuffer);
                isCalibratedNow = true;
                isCalibratingNow = false;
                console.log('💾 Baseline saved: ', newBaseline.toString());
            }
        }

        let calMetrics = metrics;
        if (isCalibratedNow && newBaseline && metrics) {
            calMetrics = metrics.applyCalibration(newBaseline);
        }

        if (calMetrics && s.framesProcessed % 30 === 0) {
            emitData(calMetrics, s.viewMode, isCalibratedNow);
        }

        set({
            currentPose: pose,
            framesProcessed: s.framesProcessed + 1,
            fps: newFps,
            lastFrameTime: now,
            currentMetrics: metrics,
            calibratedMetrics: calMetrics,
            isCalibrating: isCalibratingNow,
            calibrationBuffer: newBuffer,
            isCalibrated: isCalibratedNow,
            calibrationBaseline: newBaseline,
            error: null,
        });
    },

    setConnectionStatus: (connected: boolean, message: string) => {
        set({
            isConnected: connected,
            connectionMessage: message,
            error: !connected ? message : null,
            currentFrame: !connected ? null : get().currentFrame,
        });
    },

    setCurrentFrame: (base64Frame: string | null) => {
        set({ currentFrame: base64Frame });
    },

    setError: (err: string | null) => {
        set({ error: err });
    },

    reset: () => {
        set({
            currentPose: null,
            currentMetrics: null,
            calibratedMetrics: null,
            isCalibrated: false,
            calibrationBaseline: null,
            calibrationBuffer: [],
            isCalibrating: false,
            framesProcessed: 0,
            fps: 0,
            error: null,
        });
    }
}));
