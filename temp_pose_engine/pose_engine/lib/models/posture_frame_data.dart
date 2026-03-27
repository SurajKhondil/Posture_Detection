
import 'posture_metrics.dart';

/// Strict data model for backend JSON export
class PostureFrameData {
  final String scanId;
  final String cameraAngle;
  final bool isCalibrated;
  final PostureInnerData data;
  final int timestamp;

  PostureFrameData({
    required this.scanId,
    required this.cameraAngle,
    required this.isCalibrated,
    required this.data,
    required this.timestamp,
  });

  Map<String, dynamic> toJson() {
    return {
      "scan_id": scanId,
      "camera_angle": cameraAngle,
      "is_calibrated": isCalibrated,
      "data": data.toJson(),
    };
  }
}

class PostureInnerData {
  // Common metadata
  final String cameraAngle;
  final bool isCalibrated;
  final int timestamp;

  // Neck Bend
  final double? neckBendDegree;
  final double? neckConfidence;

  // Shoulder Slope
  final double? shoulderSlopeDegree;
  final double? shoulderConfidence;

  // Torso Tilt
  final double? torsoTiltDegree;
  final double? torsoConfidence;

  // Head Forward
  final double? headForwardIndex;
  final double? headForwardConfidence;

  PostureInnerData({
    required this.cameraAngle,
    required this.isCalibrated,
    required this.timestamp,
    this.neckBendDegree,
    this.neckConfidence,
    this.shoulderSlopeDegree,
    this.shoulderConfidence,
    this.torsoTiltDegree,
    this.torsoConfidence,
    this.headForwardIndex,
    this.headForwardConfidence,
  });

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};

    // Helper to populate metric set if value exists
    if (neckBendDegree != null) {
      map['neck_bend_degree'] = neckBendDegree;
      map['neck_camera_angle'] = cameraAngle;
      map['neck_is_calibrated'] = isCalibrated;
      map['neck_confidence'] = neckConfidence;
      map['neck_timestamp'] = timestamp;
    }

    if (shoulderSlopeDegree != null) {
      map['shoulder_slope_degree'] = shoulderSlopeDegree;
      map['shoulder_camera_angle'] = cameraAngle;
      map['shoulder_is_calibrated'] = isCalibrated;
      map['shoulder_confidence'] = shoulderConfidence;
      map['shoulder_timestamp'] = timestamp;
    }

    if (torsoTiltDegree != null) {
      map['torso_tilt_degree'] = torsoTiltDegree;
      map['torso_camera_angle'] = cameraAngle;
      map['torso_is_calibrated'] = isCalibrated;
      map['torso_confidence'] = torsoConfidence;
      map['torso_timestamp'] = timestamp;
    }

    if (headForwardIndex != null) {
      map['head_forward_index'] = headForwardIndex;
      map['head_forward_camera_angle'] = cameraAngle;
      map['head_forward_is_calibrated'] = isCalibrated;
      map['head_forward_confidence'] = headForwardConfidence;
      map['head_forward_timestamp'] = timestamp;
    }

    return map;
  }
}
