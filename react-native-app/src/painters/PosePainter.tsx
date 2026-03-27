import React from 'react';
import Svg, { Circle, Line } from 'react-native-svg';
import { PoseResult } from '../models/pose_result';
import { PostureMetrics, PostureQuality } from '../models/posture_metrics';
import { PoseLandmarkType, PoseLandmark } from '../models/pose_landmark';
import { ViewMode } from '../views/types';

interface Props {
    pose: PoseResult | null;
    viewMode: ViewMode;
    metrics: PostureMetrics | null;
    imageWidth: number;
    imageHeight: number;
    containerWidth: number;
    containerHeight: number;
}

const FRONT_CONNECTIONS = [
    [PoseLandmarkType.leftEar, PoseLandmarkType.leftEye],
    [PoseLandmarkType.leftEye, PoseLandmarkType.nose],
    [PoseLandmarkType.nose, PoseLandmarkType.rightEye],
    [PoseLandmarkType.rightEye, PoseLandmarkType.rightEar],
    [PoseLandmarkType.leftShoulder, PoseLandmarkType.rightShoulder],
    [PoseLandmarkType.leftShoulder, PoseLandmarkType.leftElbow],
    [PoseLandmarkType.leftElbow, PoseLandmarkType.leftWrist],
    [PoseLandmarkType.rightShoulder, PoseLandmarkType.rightElbow],
    [PoseLandmarkType.rightElbow, PoseLandmarkType.rightWrist],
    [PoseLandmarkType.leftShoulder, PoseLandmarkType.leftHip],
    [PoseLandmarkType.rightShoulder, PoseLandmarkType.rightHip],
    [PoseLandmarkType.leftHip, PoseLandmarkType.rightHip],
    [PoseLandmarkType.leftHip, PoseLandmarkType.leftKnee],
    [PoseLandmarkType.leftKnee, PoseLandmarkType.leftAnkle],
    [PoseLandmarkType.rightHip, PoseLandmarkType.rightKnee],
    [PoseLandmarkType.rightKnee, PoseLandmarkType.rightAnkle],
];

const SIDE_CONNECTIONS = [
    [PoseLandmarkType.leftEar, PoseLandmarkType.leftEye],
    [PoseLandmarkType.leftEye, PoseLandmarkType.nose],
    [PoseLandmarkType.rightEar, PoseLandmarkType.rightEye],
    [PoseLandmarkType.rightEye, PoseLandmarkType.nose],
    [PoseLandmarkType.leftShoulder, PoseLandmarkType.leftElbow],
    [PoseLandmarkType.rightShoulder, PoseLandmarkType.rightElbow],
    [PoseLandmarkType.leftShoulder, PoseLandmarkType.leftHip],
    [PoseLandmarkType.rightShoulder, PoseLandmarkType.rightHip],
    [PoseLandmarkType.leftHip, PoseLandmarkType.leftKnee],
    [PoseLandmarkType.rightHip, PoseLandmarkType.rightKnee],
    [PoseLandmarkType.leftKnee, PoseLandmarkType.leftAnkle],
    [PoseLandmarkType.rightKnee, PoseLandmarkType.rightAnkle],
];

export const PosePainter: React.FC<Props> = ({
    pose,
    viewMode,
    metrics,
    imageWidth,
    imageHeight,
    containerWidth,
    containerHeight,
}) => {
    if (!pose || pose.isEmpty) return null;

    // React Native SVG renders in coordinates relative to the container.
    // We need to map [0,1] normalized coordinates from PoseLandmark to containerWidth/containerHeight
    // But wait, the python base64 image might be scaled to fit. Let's assume the SVG is absolute
    // over the image with exactly the same dimensions (e.g. using resizeMode='contain', we'd need to compute the exact image bounds,
    // but for simplicity let's just use containerWidth and containerHeight directly mapping xy).

    const mapPoint = (x: number, y: number) => {
        // If it's mirrored horizontally (like in Desktop), we do: x = 1 - x
        const mappedX = (1 - x) * containerWidth;
        const mappedY = y * containerHeight;
        return { x: mappedX, y: mappedY };
    };

    const connections = viewMode === ViewMode.front ? FRONT_CONNECTIONS : SIDE_CONNECTIONS;

    let neckColor = '#00D4FF';
    let shoulderColor = '#00D4FF';
    let torsoColor = '#00D4FF';

    if (metrics) {
        if (metrics.neckBendQuality === PostureQuality.bad) neckColor = '#FF0000';
        else if (metrics.neckBendQuality === PostureQuality.warning) neckColor = '#FFA500';
        else neckColor = '#00FF00';

        if (metrics.shoulderSlopeQuality === PostureQuality.bad) shoulderColor = '#FF0000';
        else if (metrics.shoulderSlopeQuality === PostureQuality.warning) shoulderColor = '#FFA500';
        else shoulderColor = '#00FF00';

        if (metrics.torsoTiltQuality === PostureQuality.bad) torsoColor = '#FF0000';
        else if (metrics.torsoTiltQuality === PostureQuality.warning) torsoColor = '#FFA500';
        else torsoColor = '#00FF00';
    }

    const lines = connections.map(([t1, t2], i) => {
        const l1 = pose.getLandmark(t1);
        const l2 = pose.getLandmark(t2);
        if (!l1 || !l2 || !l1.isVisible || !l2.isVisible) return null;

        const p1 = mapPoint(l1.x, l1.y);
        const p2 = mapPoint(l2.x, l2.y);

        // Choose color
        let color = 'rgba(255, 255, 255, 0.5)';
        if (t1 === PoseLandmarkType.leftShoulder && t2 === PoseLandmarkType.rightShoulder) {
            color = shoulderColor;
        }

        return (
            <Line
                key={`line-${i}`}
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke={color}
                strokeWidth={3}
            />
        );
    });

    // Custom connection: Nose to Sternum (Neck)
    const nose = pose.getLandmark(PoseLandmarkType.nose);
    const sternum = pose.sternum;
    if (viewMode === ViewMode.front && nose?.isVisible && sternum?.isVisible) {
        const p1 = mapPoint(nose.x, nose.y);
        const p2 = mapPoint(sternum.x, sternum.y);
        lines.push(
            <Line
                key="neck-line"
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke={neckColor}
                strokeWidth={4}
            />
        );
    }

    // Original Flutter Style Metrics Overlay (Visual Guides)
    if (viewMode === ViewMode.front && metrics) {
        // 1. Center Guide for Torso Tilt
        const topCenter = mapPoint(0.5, 0);
        const bottomCenter = mapPoint(0.5, 1);
        lines.push(
            <Line
                key="center-guide"
                x1={topCenter.x}
                y1={topCenter.y}
                x2={bottomCenter.x}
                y2={bottomCenter.y}
                stroke="rgba(255, 255, 255, 0.2)"
                strokeWidth={1}
            />
        );

        // 2. Shoulder Alignment Guide
        const leftShoulder = pose.getLandmark(PoseLandmarkType.leftShoulder);
        const rightShoulder = pose.getLandmark(PoseLandmarkType.rightShoulder);
        if (leftShoulder && rightShoulder) {
            const avgY = (leftShoulder.y + rightShoulder.y) / 2;
            const leftPoint = mapPoint(0.1, avgY);
            const rightPoint = mapPoint(0.9, avgY);
            lines.push(
                <Line
                    key="shoulder-guide"
                    x1={leftPoint.x}
                    y1={leftPoint.y}
                    x2={rightPoint.x}
                    y2={rightPoint.y}
                    stroke="rgba(255, 255, 255, 0.3)"
                    strokeWidth={2}
                    strokeDasharray="5, 5"
                />
            );
        }
    }

    // Draw points
    const points = pose.visibleLandmarks.map((l, i) => {
        const p = mapPoint(l.x, l.y);
        return (
            <Circle
                key={`point-${i}`}
                cx={p.x}
                cy={p.y}
                r={4}
                fill="#00D4FF"
            />
        );
    });

    return (
        <Svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
            {lines}
            {points}
        </Svg>
    );
};
