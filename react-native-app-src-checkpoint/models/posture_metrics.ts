import { PoseLandmark, PoseLandmarkType } from './pose_landmark';
import { PoseResult } from './pose_result';

export enum PostureQuality {
    good = 'good',
    warning = 'warning',
    bad = 'bad',
}

export class PostureMetrics {
    neckBendAngle: number;
    neckBendConfidence: number;
    shoulderSlopeAngle: number;
    shoulderSlopeConfidence: number;
    torsoTiltPercent: number;
    torsoTiltConfidence: number;
    headForwardRatio: number;
    headForwardConfidence: number;
    confidence: number;
    timestamp: Date;

    constructor({
        neckBendAngle = 0.0,
        neckBendConfidence = 0.0,
        shoulderSlopeAngle = 0.0,
        shoulderSlopeConfidence = 0.0,
        torsoTiltPercent = 0.0,
        torsoTiltConfidence = 0.0,
        headForwardRatio = 0.0,
        headForwardConfidence = 0.0,
        confidence = 0.0,
        timestamp,
    }: {
        neckBendAngle?: number;
        neckBendConfidence?: number;
        shoulderSlopeAngle?: number;
        shoulderSlopeConfidence?: number;
        torsoTiltPercent?: number;
        torsoTiltConfidence?: number;
        headForwardRatio?: number;
        headForwardConfidence?: number;
        confidence?: number;
        timestamp: Date;
    }) {
        this.neckBendAngle = neckBendAngle;
        this.neckBendConfidence = neckBendConfidence;
        this.shoulderSlopeAngle = shoulderSlopeAngle;
        this.shoulderSlopeConfidence = shoulderSlopeConfidence;
        this.torsoTiltPercent = torsoTiltPercent;
        this.torsoTiltConfidence = torsoTiltConfidence;
        this.headForwardRatio = headForwardRatio;
        this.headForwardConfidence = headForwardConfidence;
        this.confidence = confidence;
        this.timestamp = timestamp;
    }

    static readonly neckBendWarningThreshold = 10.0;
    static readonly neckBendBadThreshold = 20.0;
    static readonly shoulderSlopeWarningThreshold = 5.0;
    static readonly shoulderSlopeBadThreshold = 10.0;
    static readonly torsoTiltWarningThreshold = 10.0;
    static readonly torsoTiltBadThreshold = 20.0;
    static readonly headForwardWarningThreshold = 0.15;
    static readonly headForwardBadThreshold = 0.25;

    get neckBendQuality(): PostureQuality {
        const absAngle = Math.abs(this.neckBendAngle);
        if (absAngle >= PostureMetrics.neckBendBadThreshold) return PostureQuality.bad;
        if (absAngle >= PostureMetrics.neckBendWarningThreshold) return PostureQuality.warning;
        return PostureQuality.good;
    }

    get shoulderSlopeQuality(): PostureQuality {
        const absAngle = Math.abs(this.shoulderSlopeAngle);
        if (absAngle >= PostureMetrics.shoulderSlopeBadThreshold) return PostureQuality.bad;
        if (absAngle >= PostureMetrics.shoulderSlopeWarningThreshold) return PostureQuality.warning;
        return PostureQuality.good;
    }

    get torsoTiltQuality(): PostureQuality {
        const absPercent = Math.abs(this.torsoTiltPercent);
        if (absPercent >= PostureMetrics.torsoTiltBadThreshold) return PostureQuality.bad;
        if (absPercent >= PostureMetrics.torsoTiltWarningThreshold) return PostureQuality.warning;
        return PostureQuality.good;
    }

    get headForwardQuality(): PostureQuality {
        const absRatio = Math.abs(this.headForwardRatio);
        if (absRatio >= PostureMetrics.headForwardBadThreshold) return PostureQuality.bad;
        if (absRatio >= PostureMetrics.headForwardWarningThreshold) return PostureQuality.warning;
        return PostureQuality.good;
    }

    get overallQuality(): PostureQuality {
        const qualities = [
            this.neckBendQuality,
            this.shoulderSlopeQuality,
            this.torsoTiltQuality,
            this.headForwardQuality,
        ];

        if (qualities.includes(PostureQuality.bad)) return PostureQuality.bad;
        if (qualities.includes(PostureQuality.warning)) return PostureQuality.warning;
        return PostureQuality.good;
    }

    static empty(): PostureMetrics {
        return new PostureMetrics({ timestamp: new Date() });
    }

    applyCalibration(baseline: PostureMetrics): PostureMetrics {
        return new PostureMetrics({
            neckBendAngle: this.neckBendAngle - baseline.neckBendAngle,
            neckBendConfidence: this.neckBendConfidence,
            shoulderSlopeAngle: this.shoulderSlopeAngle - baseline.shoulderSlopeAngle,
            shoulderSlopeConfidence: this.shoulderSlopeConfidence,
            torsoTiltPercent: this.torsoTiltPercent - baseline.torsoTiltPercent,
            torsoTiltConfidence: this.torsoTiltConfidence,
            headForwardRatio: this.headForwardRatio - baseline.headForwardRatio,
            headForwardConfidence: this.headForwardConfidence,
            confidence: this.confidence,
            timestamp: this.timestamp,
        });
    }

    toString(): string {
        return `PostureMetrics(neck: ${this.neckBendAngle.toFixed(1)}°, shldr: ${this.shoulderSlopeAngle.toFixed(1)}°, conf: ${this.confidence.toFixed(2)})`;
    }
}

export class PostureMathEngine {
    static calculate(pose: PoseResult, isSideView: boolean = false): PostureMetrics {
        if (!pose.hasMinimumKeypoints) {
            return PostureMetrics.empty();
        }

        const neckAngle = this._calculateNeckBend(pose, isSideView);
        const neckConf = this._calculateNeckConfidence(pose, isSideView);

        const shoulderAngle = this._calculateShoulderSlope(pose);
        const shoulderConf = this._calculateShoulderConfidence(pose);

        const torsoTilt = this._calculateTorsoTilt(pose);
        const torsoConf = this._calculateTorsoConfidence(pose);

        const headForward = this._calculateHeadForwardRatio(pose, isSideView);
        const headConf = this._calculateHeadConfidence(pose, isSideView);

        const confidence = (neckConf + shoulderConf + torsoConf + headConf) / 4;

        return new PostureMetrics({
            neckBendAngle: neckAngle,
            neckBendConfidence: neckConf,
            shoulderSlopeAngle: shoulderAngle,
            shoulderSlopeConfidence: shoulderConf,
            torsoTiltPercent: torsoTilt,
            torsoTiltConfidence: torsoConf,
            headForwardRatio: headForward,
            headForwardConfidence: headConf,
            confidence: confidence,
            timestamp: pose.timestamp,
        });
    }

    private static _calculateNeckConfidence(pose: PoseResult, isSideView: boolean): number {
        if (isSideView) {
            const lConf = (pose.getLandmark(PoseLandmarkType.leftEar)?.confidence ?? 0) *
                (pose.getLandmark(PoseLandmarkType.leftShoulder)?.confidence ?? 0);
            const rConf = (pose.getLandmark(PoseLandmarkType.rightEar)?.confidence ?? 0) *
                (pose.getLandmark(PoseLandmarkType.rightShoulder)?.confidence ?? 0);
            return Math.max(lConf, rConf);
        } else {
            const nose = pose.getLandmark(PoseLandmarkType.nose)?.confidence ?? 0;
            const ls = pose.getLandmark(PoseLandmarkType.leftShoulder)?.confidence ?? 0;
            const rs = pose.getLandmark(PoseLandmarkType.rightShoulder)?.confidence ?? 0;
            return (nose + ls + rs) / 3;
        }
    }

    private static _calculateShoulderConfidence(pose: PoseResult): number {
        const ls = pose.getLandmark(PoseLandmarkType.leftShoulder)?.confidence ?? 0;
        const rs = pose.getLandmark(PoseLandmarkType.rightShoulder)?.confidence ?? 0;
        return (ls + rs) / 2;
    }

    private static _calculateTorsoConfidence(pose: PoseResult): number {
        return this._calculateShoulderConfidence(pose);
    }

    private static _calculateHeadConfidence(pose: PoseResult, isSideView: boolean): number {
        return this._calculateNeckConfidence(pose, isSideView);
    }

    private static _calculateNeckBend(pose: PoseResult, isSideView: boolean): number {
        let ear: PoseLandmark | undefined;
        let shoulder: PoseLandmark | undefined;

        if (isSideView) {
            const lEar = pose.getLandmark(PoseLandmarkType.leftEar);
            const lShldr = pose.getLandmark(PoseLandmarkType.leftShoulder);
            const rEar = pose.getLandmark(PoseLandmarkType.rightEar);
            const rShldr = pose.getLandmark(PoseLandmarkType.rightShoulder);

            const lScore = (lEar?.confidence ?? 0) + (lShldr?.confidence ?? 0);
            const rScore = (rEar?.confidence ?? 0) + (rShldr?.confidence ?? 0);

            if (lScore >= rScore) {
                ear = lEar; shoulder = lShldr;
            } else {
                ear = rEar; shoulder = rShldr;
            }
        } else {
            const nose = pose.getLandmark(PoseLandmarkType.nose);
            const sternum = pose.sternum;
            if (nose && sternum) {
                const dx = nose.x - sternum.x;
                const dy = sternum.y - nose.y;
                return (Math.atan2(dx, dy) * 180 / Math.PI);
            }
            return 0.0;
        }

        if (!ear || !shoulder) return 0.0;
        const dx = ear.x - shoulder.x;
        const dy = shoulder.y - ear.y;
        return (Math.atan2(dx, dy) * 180 / Math.PI);
    }

    private static _calculateShoulderSlope(pose: PoseResult): number {
        const left = pose.getLandmark(PoseLandmarkType.leftShoulder);
        const right = pose.getLandmark(PoseLandmarkType.rightShoulder);
        if (!left || !right) return 0.0;

        const dx = left.x - right.x;
        const dy = left.y - right.y;
        if (Math.abs(dx) < 0.001) return 0.0;

        return (Math.atan2(dy, dx) * 180 / Math.PI);
    }

    private static _calculateTorsoTilt(pose: PoseResult): number {
        const sternum = pose.sternum;
        if (!sternum) return 0.0;
        return (sternum.x - 0.5) * 200;
    }

    private static _calculateHeadForwardRatio(pose: PoseResult, isSideView: boolean): number {
        let ear: PoseLandmark | undefined;
        let shoulder: PoseLandmark | undefined;

        if (isSideView) {
            const lEar = pose.getLandmark(PoseLandmarkType.leftEar);
            const lShldr = pose.getLandmark(PoseLandmarkType.leftShoulder);
            const rEar = pose.getLandmark(PoseLandmarkType.rightEar);
            const rShldr = pose.getLandmark(PoseLandmarkType.rightShoulder);

            const lScore = (lEar?.confidence ?? 0) + (lShldr?.confidence ?? 0);
            const rScore = (rEar?.confidence ?? 0) + (rShldr?.confidence ?? 0);

            if (lScore >= rScore) { ear = lEar; shoulder = lShldr; }
            else { ear = rEar; shoulder = rShldr; }
        } else {
            ear = pose.getLandmark(PoseLandmarkType.nose);
            shoulder = pose.sternum;
        }

        if (!ear || !shoulder) return 0.0;

        const forwardDist = shoulder.x - ear.x;

        const left = pose.getLandmark(PoseLandmarkType.leftShoulder);
        const right = pose.getLandmark(PoseLandmarkType.rightShoulder);
        if (left && right) {
            const width = Math.abs(right.x - left.x);
            if (width > 0.01) return forwardDist / width;
        }
        return forwardDist;
    }
}
