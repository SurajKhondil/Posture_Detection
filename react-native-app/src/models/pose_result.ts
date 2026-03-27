import { PoseLandmark, PoseLandmarkType } from './pose_landmark';

export class PoseResult {
    landmarks: Map<PoseLandmarkType, PoseLandmark>;
    timestamp: Date;
    frameNumber: number;

    constructor(landmarks: Map<PoseLandmarkType, PoseLandmark>, timestamp?: Date, frameNumber: number = 0) {
        this.landmarks = landmarks;
        this.timestamp = timestamp || new Date();
        this.frameNumber = frameNumber;
    }

    getLandmark(type: PoseLandmarkType): PoseLandmark | undefined {
        return this.landmarks.get(type);
    }

    get hasMinimumKeypoints(): boolean {
        const requiredTypes = [
            PoseLandmarkType.nose,
            PoseLandmarkType.leftEar,
            PoseLandmarkType.rightEar,
            PoseLandmarkType.leftShoulder,
            PoseLandmarkType.rightShoulder,
            PoseLandmarkType.leftEye,
            PoseLandmarkType.rightEye,
        ];

        let visibleCount = 0;
        for (const type of requiredTypes) {
            const landmark = this.landmarks.get(type);
            if (landmark && landmark.isVisible) {
                visibleCount++;
            }
        }
        return visibleCount >= 7;
    }

    get visibleLandmarks(): PoseLandmark[] {
        return Array.from(this.landmarks.values()).filter(l => l.isVisible);
    }

    getMidpoint(type1: PoseLandmarkType, type2: PoseLandmarkType, resultType?: PoseLandmarkType): PoseLandmark | undefined {
        const l1 = this.landmarks.get(type1);
        const l2 = this.landmarks.get(type2);

        if (!l1 || !l2) return undefined;

        return new PoseLandmark(
            resultType ?? type1,
            (l1.x + l2.x) / 2,
            (l1.y + l2.y) / 2,
            (l1.z + l2.z) / 2,
            (l1.confidence + l2.confidence) / 2
        );
    }

    get sternum(): PoseLandmark | undefined {
        return this.getMidpoint(PoseLandmarkType.leftShoulder, PoseLandmarkType.rightShoulder);
    }

    get unixTimestamp(): number {
        return this.timestamp.getTime();
    }

    static empty(): PoseResult {
        return new PoseResult(new Map());
    }

    get isEmpty(): boolean {
        return this.landmarks.size === 0;
    }

    get isNotEmpty(): boolean {
        return this.landmarks.size > 0;
    }
}
