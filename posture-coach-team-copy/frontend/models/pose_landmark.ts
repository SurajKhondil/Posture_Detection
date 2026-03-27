export enum PoseLandmarkType {
    nose = 0,
    leftEyeInner = 1,
    leftEye = 2,
    leftEyeOuter = 3,
    rightEyeInner = 4,
    rightEye = 5,
    rightEyeOuter = 6,
    leftEar = 7,
    rightEar = 8,
    mouthLeft = 9,
    mouthRight = 10,
    leftShoulder = 11,
    rightShoulder = 12,
    leftElbow = 13,
    rightElbow = 14,
    leftWrist = 15,
    rightWrist = 16,
    leftPinky = 17,
    rightPinky = 18,
    leftIndex = 19,
    rightIndex = 20,
    leftThumb = 21,
    rightThumb = 22,
    leftHip = 23,
    rightHip = 24,
    leftKnee = 25,
    rightKnee = 26,
    leftAnkle = 27,
    rightAnkle = 28,
}

export class PoseLandmark {
    type: PoseLandmarkType;
    x: number;
    y: number;
    z: number;
    confidence: number;

    constructor(type: PoseLandmarkType, x: number, y: number, z: number = 0.0, confidence: number = 1.0) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.z = z;
        this.confidence = confidence;
    }

    get isVisible(): boolean {
        return this.confidence >= 0.5;
    }

    toPixel(imageWidth: number, imageHeight: number): { x: number, y: number } {
        return { x: this.x * imageWidth, y: this.y * imageHeight };
    }

    static fromMLKit(
        landmarkIndex: number,
        x: number,
        y: number,
        z: number,
        likelihood: number,
        imageWidth: number,
        imageHeight: number
    ): PoseLandmark {
        if (!(landmarkIndex in PoseLandmarkType)) {
            throw new Error(`Invalid landmark index: ${landmarkIndex}`);
        }
        return new PoseLandmark(
            landmarkIndex as PoseLandmarkType,
            x / imageWidth,
            y / imageHeight,
            z,
            likelihood
        );
    }
}
