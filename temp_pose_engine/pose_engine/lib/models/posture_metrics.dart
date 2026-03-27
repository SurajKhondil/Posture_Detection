import 'dart:math' as math;
import 'pose_landmark.dart';
import 'pose_result.dart';

/// Posture quality classification
enum PostureQuality {
  good,    // Green - Within acceptable range
  warning, // Yellow - Slight deviation
  bad,     // Red - Significant deviation
}

/// Calculated posture metrics from pose detection
class PostureMetrics {
  // Neck bend
  final double neckBendAngle;
  final double neckBendConfidence;

  // Shoulder slope
  final double shoulderSlopeAngle;
  final double shoulderSlopeConfidence;

  // Torso tilt
  final double torsoTiltPercent;
  final double torsoTiltConfidence;

  // Head forward
  final double headForwardRatio;
  final double headForwardConfidence;

  // Overall
  final double confidence; // Average of all used landmarks

  // Timestamp for the measurement
  final DateTime timestamp;

  const PostureMetrics({
    this.neckBendAngle = 0.0,
    this.neckBendConfidence = 0.0,
    this.shoulderSlopeAngle = 0.0,
    this.shoulderSlopeConfidence = 0.0,
    this.torsoTiltPercent = 0.0,
    this.torsoTiltConfidence = 0.0,
    this.headForwardRatio = 0.0,
    this.headForwardConfidence = 0.0,
    this.confidence = 0.0,
    required this.timestamp,
  });

  /// Quality classification thresholds (degrees/percentages)
  static const double neckBendWarningThreshold = 10.0;
  static const double neckBendBadThreshold = 20.0;
  static const double shoulderSlopeWarningThreshold = 5.0;
  static const double shoulderSlopeBadThreshold = 10.0;
  static const double torsoTiltWarningThreshold = 10.0;
  static const double torsoTiltBadThreshold = 20.0;
  static const double headForwardWarningThreshold = 0.15;
  static const double headForwardBadThreshold = 0.25;

  /// Get quality for neck bend
  PostureQuality get neckBendQuality {
    final absAngle = neckBendAngle.abs();
    if (absAngle >= neckBendBadThreshold) return PostureQuality.bad;
    if (absAngle >= neckBendWarningThreshold) return PostureQuality.warning;
    return PostureQuality.good;
  }

  /// Get quality for shoulder slope
  PostureQuality get shoulderSlopeQuality {
    final absAngle = shoulderSlopeAngle.abs();
    if (absAngle >= shoulderSlopeBadThreshold) return PostureQuality.bad;
    if (absAngle >= shoulderSlopeWarningThreshold) return PostureQuality.warning;
    return PostureQuality.good;
  }

  /// Get quality for torso tilt
  PostureQuality get torsoTiltQuality {
    final absPercent = torsoTiltPercent.abs();
    if (absPercent >= torsoTiltBadThreshold) return PostureQuality.bad;
    if (absPercent >= torsoTiltWarningThreshold) return PostureQuality.warning;
    return PostureQuality.good;
  }

  /// Get quality for head forward
  PostureQuality get headForwardQuality {
    final absRatio = headForwardRatio.abs();
    if (absRatio >= headForwardBadThreshold) return PostureQuality.bad;
    if (absRatio >= headForwardWarningThreshold) return PostureQuality.warning;
    return PostureQuality.good;
  }

  /// Overall posture quality (worst of all metrics)
  PostureQuality get overallQuality {
    final qualities = [
      neckBendQuality,
      shoulderSlopeQuality,
      torsoTiltQuality,
      headForwardQuality,
    ];
    
    if (qualities.contains(PostureQuality.bad)) return PostureQuality.bad;
    if (qualities.contains(PostureQuality.warning)) return PostureQuality.warning;
    return PostureQuality.good;
  }

  /// Create empty metrics
  factory PostureMetrics.empty() => PostureMetrics(timestamp: DateTime.now());

  /// Apply calibration baseline (subtract baseline values)
  PostureMetrics applyCalibration(PostureMetrics baseline) {
    return PostureMetrics(
      neckBendAngle: neckBendAngle - baseline.neckBendAngle,
      neckBendConfidence: neckBendConfidence, // Confidence isn't subtracted
      shoulderSlopeAngle: shoulderSlopeAngle - baseline.shoulderSlopeAngle,
      shoulderSlopeConfidence: shoulderSlopeConfidence,
      torsoTiltPercent: torsoTiltPercent - baseline.torsoTiltPercent,
      torsoTiltConfidence: torsoTiltConfidence,
      headForwardRatio: headForwardRatio - baseline.headForwardRatio,
      headForwardConfidence: headForwardConfidence,
      confidence: confidence,
      timestamp: timestamp,
    );
  }

  /// Convert to JSON payload for Team 2 & 3
  Map<String, dynamic> toJson() {
    return {
      'timestamp': timestamp.millisecondsSinceEpoch,
      'confidence': confidence,
      'metrics': {
        'neckBend': {
          'value': neckBendAngle,
          'quality': neckBendQuality.name,
          'confidence': neckBendConfidence,
        },
        'shoulderSlope': {
          'value': shoulderSlopeAngle,
          'quality': shoulderSlopeQuality.name,
          'confidence': shoulderSlopeConfidence,
        },
        'torsoTilt': {
          'value': torsoTiltPercent,
          'quality': torsoTiltQuality.name,
          'confidence': torsoTiltConfidence,
        },
        'headForward': {
          'value': headForwardRatio,
          'quality': headForwardQuality.name,
          'confidence': headForwardConfidence,
        },
      },
      'overallQuality': overallQuality.name,
    };
  }

  @override
  String toString() => 'PostureMetrics(neck: ${neckBendAngle.toStringAsFixed(1)}°, '
      'shldr: ${shoulderSlopeAngle.toStringAsFixed(1)}°, '
      'conf: ${confidence.toStringAsFixed(2)})';
}

/// Math Engine for calculating posture metrics from pose
class PostureMathEngine {
  /// Calculate all metrics from a pose result
  static PostureMetrics calculate(PoseResult pose, {bool isSideView = false}) {
    if (!pose.hasMinimumKeypoints) {
      return PostureMetrics.empty();
    }

    // Refined Calculation with Individual Confidence
    final neckAngle = _calculateNeckBend(pose, isSideView);
    final neckConf = _calculateNeckConfidence(pose, isSideView);

    final shoulderAngle = _calculateShoulderSlope(pose);
    final shoulderConf = _calculateShoulderConfidence(pose);

    final torsoTilt = _calculateTorsoTilt(pose);
    final torsoConf = _calculateTorsoConfidence(pose);

    final headForward = _calculateHeadForwardRatio(pose, isSideView);
    final headConf = _calculateHeadConfidence(pose, isSideView);
    
    // Average confidence of key landmarks used
    final confidence = (neckConf + shoulderConf + torsoConf + headConf) / 4;

    return PostureMetrics(
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
    );
  }

  static double _calculateNeckConfidence(PoseResult pose, bool isSideView) {
    if (isSideView) {
       // Side: Ear + Shoulder (Max of left/right pair)
       final lConf = (pose.getLandmark(PoseLandmarkType.leftEar)?.confidence ?? 0) * 
                     (pose.getLandmark(PoseLandmarkType.leftShoulder)?.confidence ?? 0);
       final rConf = (pose.getLandmark(PoseLandmarkType.rightEar)?.confidence ?? 0) * 
                     (pose.getLandmark(PoseLandmarkType.rightShoulder)?.confidence ?? 0);
       return math.max(lConf, rConf);
    } else {
       // Front: Nose + Shoulders
       final nose = pose.getLandmark(PoseLandmarkType.nose)?.confidence ?? 0;
       final ls = pose.getLandmark(PoseLandmarkType.leftShoulder)?.confidence ?? 0;
       final rs = pose.getLandmark(PoseLandmarkType.rightShoulder)?.confidence ?? 0;
       return (nose + ls + rs) / 3;
    }
  }

  static double _calculateShoulderConfidence(PoseResult pose) {
     final ls = pose.getLandmark(PoseLandmarkType.leftShoulder)?.confidence ?? 0;
     final rs = pose.getLandmark(PoseLandmarkType.rightShoulder)?.confidence ?? 0;
     return (ls + rs) / 2;
  }

  static double _calculateTorsoConfidence(PoseResult pose) {
     // Currently derived from shoulders (sternum)
     return _calculateShoulderConfidence(pose);
  }

  static double _calculateHeadConfidence(PoseResult pose, bool isSideView) {
     return _calculateNeckConfidence(pose, isSideView);
  }

  /// Calculate Neck Bend: Angle between Ear-Shoulder line and vertical
  static double _calculateNeckBend(PoseResult pose, bool isSideView) {
    PoseLandmark? ear;
    PoseLandmark? shoulder;

    if (isSideView) {
      // Prioritize side with better average confidence
      final lEar = pose.getLandmark(PoseLandmarkType.leftEar);
      final lShldr = pose.getLandmark(PoseLandmarkType.leftShoulder);
      final rEar = pose.getLandmark(PoseLandmarkType.rightEar);
      final rShldr = pose.getLandmark(PoseLandmarkType.rightShoulder);

      final lScore = (lEar?.confidence ?? 0) + (lShldr?.confidence ?? 0);
      final rScore = (rEar?.confidence ?? 0) + (rShldr?.confidence ?? 0);

      if (lScore >= rScore) {
        ear = lEar; shoulder = lShldr;
      } else {
        ear = rEar; shoulder = rShldr;
      }
    } else {
      // Front: Nose to Sternum
      final nose = pose.getLandmark(PoseLandmarkType.nose);
      final sternum = pose.sternum;
      if (nose != null && sternum != null) {
        final dx = nose.x - sternum.x;
        final dy = sternum.y - nose.y;
        return (math.atan2(dx, dy) * 180 / math.pi);
      }
      return 0.0;
    }

    if (ear == null || shoulder == null) return 0.0;
    final dx = ear.x - shoulder.x;
    final dy = shoulder.y - ear.y;
    return (math.atan2(dx, dy) * 180 / math.pi);
  }

  /// Calculate Shoulder Slope
  static double _calculateShoulderSlope(PoseResult pose) {
    final left = pose.getLandmark(PoseLandmarkType.leftShoulder);
    final right = pose.getLandmark(PoseLandmarkType.rightShoulder);
    if (left == null || right == null) return 0.0;

    final dx = left.x - right.x;
    final dy = left.y - right.y;
    if (dx.abs() < 0.001) return 0.0;
    
    return (math.atan2(dy, dx) * 180 / math.pi);
  }

  /// Calculate Torso Tilt (Sternum offset from center)
  static double _calculateTorsoTilt(PoseResult pose) {
    final sternum = pose.sternum;
    if (sternum == null) return 0.0;
    // x=0.5 is center. Range -0.5 to 0.5 mapped to -100% to 100%
    return (sternum.x - 0.5) * 200;
  }

  /// Calculate Head Forward Ratio
  static double _calculateHeadForwardRatio(PoseResult pose, bool isSideView) {
    PoseLandmark? ear;
    PoseLandmark? shoulder;

    if (isSideView) {
       // Same logic as neck bend logic for selection
      final lEar = pose.getLandmark(PoseLandmarkType.leftEar);
      final lShldr = pose.getLandmark(PoseLandmarkType.leftShoulder);
      final rEar = pose.getLandmark(PoseLandmarkType.rightEar);
      final rShldr = pose.getLandmark(PoseLandmarkType.rightShoulder);
      
      final lScore = (lEar?.confidence ?? 0) + (lShldr?.confidence ?? 0);
      final rScore = (rEar?.confidence ?? 0) + (rShldr?.confidence ?? 0);
      
      if (lScore >= rScore) { ear = lEar; shoulder = lShldr; }
      else { ear = rEar; shoulder = rShldr; }
    } else {
      ear = pose.getLandmark(PoseLandmarkType.nose);
      shoulder = pose.sternum;
    }

    if (ear == null || shoulder == null) return 0.0;
    
    final forwardDist = shoulder.x - ear.x;
    
    // Normalize by shoulder width
    final left = pose.getLandmark(PoseLandmarkType.leftShoulder);
    final right = pose.getLandmark(PoseLandmarkType.rightShoulder);
    if (left != null && right != null) {
       final width = (right.x - left.x).abs();
       if (width > 0.01) return forwardDist / width;
    }
    return forwardDist;
  }
}
