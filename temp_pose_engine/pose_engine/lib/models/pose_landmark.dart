import 'dart:ui' show Offset;

/// Pose Landmark Types for Upper Body Only (indices 0-24)
/// Excludes hips and lower body landmarks as per "No Hips" constraint
enum PoseLandmarkType {
  nose(0),
  leftEyeInner(1),
  leftEye(2),
  leftEyeOuter(3),
  rightEyeInner(4),
  rightEye(5),
  rightEyeOuter(6),
  leftEar(7),
  rightEar(8),
  mouthLeft(9),
  mouthRight(10),
  leftShoulder(11),
  rightShoulder(12),
  leftElbow(13),
  rightElbow(14),
  leftWrist(15),
  rightWrist(16),
  leftPinky(17),
  rightPinky(18),
  leftIndex(19),
  rightIndex(20),
  leftThumb(21),
  rightThumb(22),
  // Note: Hips (23, 24) and below are excluded
  ;

  /// The MediaPipe/ML Kit landmark index
  final int landmarkIndex;
  const PoseLandmarkType(this.landmarkIndex);

  /// Find landmark type by MediaPipe index
  static PoseLandmarkType? fromLandmarkIndex(int idx) {
    for (final type in PoseLandmarkType.values) {
      if (type.landmarkIndex == idx) return type;
    }
    return null;
  }
}

/// Individual pose landmark with coordinates and confidence
class PoseLandmark {
  final PoseLandmarkType type;
  final double x; // Normalized 0-1 (relative to image width)
  final double y; // Normalized 0-1 (relative to image height)
  final double z; // Depth (relative to hip midpoint, negative = closer)
  final double confidence; // 0-1 visibility/confidence score

  const PoseLandmark({
    required this.type,
    required this.x,
    required this.y,
    this.z = 0.0,
    this.confidence = 1.0,
  });

  /// Check if this landmark is reliable for calculations
  bool get isVisible => confidence >= 0.5;

  /// Get pixel coordinates given image dimensions
  Offset toPixel(double imageWidth, double imageHeight) {
    return Offset(x * imageWidth, y * imageHeight);
  }

  /// Create from ML Kit format (for mobile compatibility)
  factory PoseLandmark.fromMLKit({
    required int landmarkIndex,
    required double x,
    required double y,
    required double z,
    required double likelihood,
    required double imageWidth,
    required double imageHeight,
  }) {
    final type = PoseLandmarkType.fromLandmarkIndex(landmarkIndex);
    if (type == null) {
      throw ArgumentError('Invalid landmark index: $landmarkIndex');
    }
    
    return PoseLandmark(
      type: type,
      x: x / imageWidth, // Normalize to 0-1
      y: y / imageHeight, // Normalize to 0-1
      z: z,
      confidence: likelihood,
    );
  }

  @override
  String toString() => 'PoseLandmark(${type.name}: x=$x, y=$y, conf=$confidence)';
}
