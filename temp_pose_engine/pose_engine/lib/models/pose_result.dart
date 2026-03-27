import 'pose_landmark.dart';

/// Result of pose detection containing all detected landmarks
class PoseResult {
  final Map<PoseLandmarkType, PoseLandmark> landmarks;
  final DateTime timestamp;
  final int frameNumber;

  PoseResult({
    required this.landmarks,
    DateTime? timestamp,
    this.frameNumber = 0,
  }) : timestamp = timestamp ?? DateTime.now();

  /// Get a specific landmark by type
  PoseLandmark? getLandmark(PoseLandmarkType type) => landmarks[type];

  /// Check if minimum required landmarks are visible (7 keypoints as per flowchart)
  bool get hasMinimumKeypoints {
    final requiredTypes = [
      PoseLandmarkType.nose,
      PoseLandmarkType.leftEar,
      PoseLandmarkType.rightEar,
      PoseLandmarkType.leftShoulder,
      PoseLandmarkType.rightShoulder,
      PoseLandmarkType.leftEye,
      PoseLandmarkType.rightEye,
    ];

    int visibleCount = 0;
    for (final type in requiredTypes) {
      final landmark = landmarks[type];
      if (landmark != null && landmark.isVisible) {
        visibleCount++;
      }
    }
    return visibleCount >= 7;
  }

  /// Get all visible landmarks
  List<PoseLandmark> get visibleLandmarks =>
      landmarks.values.where((l) => l.isVisible).toList();

  /// Calculate the midpoint between two landmarks
  PoseLandmark? getMidpoint(PoseLandmarkType type1, PoseLandmarkType type2, {
    PoseLandmarkType? resultType,
  }) {
    final l1 = landmarks[type1];
    final l2 = landmarks[type2];
    
    if (l1 == null || l2 == null) return null;
    
    return PoseLandmark(
      type: resultType ?? type1,
      x: (l1.x + l2.x) / 2,
      y: (l1.y + l2.y) / 2,
      z: (l1.z + l2.z) / 2,
      confidence: (l1.confidence + l2.confidence) / 2,
    );
  }

  /// Calculate sternum position (midpoint of shoulders)
  PoseLandmark? get sternum => getMidpoint(
    PoseLandmarkType.leftShoulder,
    PoseLandmarkType.rightShoulder,
  );

  /// Get Unix timestamp in milliseconds
  int get unixTimestamp => timestamp.millisecondsSinceEpoch;

  /// Create empty result
  factory PoseResult.empty() => PoseResult(landmarks: {});

  /// Check if result has valid data
  bool get isEmpty => landmarks.isEmpty;
  bool get isNotEmpty => landmarks.isNotEmpty;

  @override
  String toString() => 'PoseResult(landmarks: ${landmarks.length}, frame: $frameNumber)';
}
