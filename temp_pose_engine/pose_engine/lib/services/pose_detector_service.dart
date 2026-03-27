import 'dart:typed_data';
import '../models/pose_result.dart';

/// Input image format for pose detection (compatible with ML Kit InputImage)
class InputImageData {
  final Uint8List bytes;
  final int width;
  final int height;
  final int rotation; // 0, 90, 180, 270
  final InputImageFormat format;

  const InputImageData({
    required this.bytes,
    required this.width,
    required this.height,
    this.rotation = 0,
    this.format = InputImageFormat.nv21,
  });
}

/// Image format enum (matches ML Kit formats)
enum InputImageFormat {
  nv21,
  yv12,
  yuv420,
  bgra8888,
}

/// Abstract interface for pose detection
/// 
/// This follows the Strategy Pattern to allow swapping implementations:
/// - [MockPoseDetector] for Windows development
/// - [MLKitPoseDetector] for Mobile production
abstract class PoseDetectorService {
  /// Detect pose from camera image data
  /// Returns null if no pose is detected or detection fails
  Future<PoseResult?> detectPose(InputImageData imageData);

  /// Process a camera frame directly (for camera stream integration)
  /// Override this if the implementation can optimize for streaming
  Future<PoseResult?> processFrame(dynamic cameraImage) async {
    // Default implementation - subclasses can override for optimization
    return null;
  }

  /// Whether the detector is ready to process frames
  bool get isReady;

  /// Initialize the detector (load models, etc.)
  Future<void> initialize();

  /// Clean up resources
  void dispose();

  /// Get the name of this detector implementation
  String get name;
}
