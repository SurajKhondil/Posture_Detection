// =============================================================================
// ML Kit Pose Detector for Mobile (Android/iOS)
// =============================================================================
// 
// INSTRUCTIONS FOR MOBILE DEPLOYMENT:
// 
// 1. Add dependency to pubspec.yaml:
//    dependencies:
//      google_mlkit_pose_detection: ^0.11.0
//
// 2. Uncomment the code below
//
// 3. In main.dart, swap the detector:
//    final detector = MLKitPoseDetector(); // Instead of MockPoseDetector()
//
// 4. For Android, add to android/app/build.gradle:
//    android {
//      defaultConfig {
//        minSdkVersion 21
//        ndk {
//          abiFilters 'armeabi-v7a', 'arm64-v8a'
//        }
//      }
//    }
//
// 5. For iOS, add to ios/Podfile:
//    platform :ios, '12.0'
//
// =============================================================================

/*
import 'package:google_mlkit_pose_detection/google_mlkit_pose_detection.dart';
import 'pose_detector_service.dart';
import '../models/pose_landmark.dart' as app;
import '../models/pose_result.dart';

/// ML Kit pose detector for Mobile production
class MLKitPoseDetector implements PoseDetectorService {
  PoseDetector? _detector;
  bool _isReady = false;
  int _frameCount = 0;

  @override
  String get name => 'MLKitPoseDetector (Mobile Production)';

  @override
  bool get isReady => _isReady;

  @override
  Future<void> initialize() async {
    final options = PoseDetectorOptions(
      mode: PoseDetectionMode.stream, // Optimized for real-time
      model: PoseDetectionModel.base, // Use accurate for better precision
    );
    
    _detector = PoseDetector(options: options);
    _isReady = true;
  }

  @override
  Future<PoseResult?> detectPose(InputImageData imageData) async {
    if (!_isReady || _detector == null) return null;

    try {
      // Convert our InputImageData to ML Kit InputImage
      final inputImage = InputImage.fromBytes(
        bytes: imageData.bytes,
        metadata: InputImageMetadata(
          size: Size(imageData.width.toDouble(), imageData.height.toDouble()),
          rotation: _getRotation(imageData.rotation),
          format: _getFormat(imageData.format),
          bytesPerRow: imageData.width, // Adjust based on format
        ),
      );

      final poses = await _detector!.processImage(inputImage);
      
      if (poses.isEmpty) return null;

      _frameCount++;
      
      // Convert ML Kit pose to our format
      return _convertPose(poses.first, imageData.width, imageData.height);
    } catch (e) {
      print('ML Kit detection error: $e');
      return null;
    }
  }

  @override
  Future<PoseResult?> processFrame(dynamic cameraImage) async {
    if (!_isReady || _detector == null) return null;

    try {
      // For camera stream, create InputImage directly from CameraImage
      // This is more efficient than converting to bytes first
      final inputImage = InputImage.fromBytes(
        bytes: cameraImage.planes[0].bytes,
        metadata: InputImageMetadata(
          size: Size(cameraImage.width.toDouble(), cameraImage.height.toDouble()),
          rotation: InputImageRotation.rotation0deg, // Adjust based on device orientation
          format: InputImageFormat.nv21,
          bytesPerRow: cameraImage.planes[0].bytesPerRow,
        ),
      );

      final poses = await _detector!.processImage(inputImage);
      
      if (poses.isEmpty) return null;

      _frameCount++;
      
      return _convertPose(poses.first, cameraImage.width, cameraImage.height);
    } catch (e) {
      print('ML Kit frame processing error: $e');
      return null;
    }
  }

  /// Convert ML Kit Pose to our PoseResult format
  PoseResult _convertPose(Pose pose, int imageWidth, int imageHeight) {
    final landmarks = <app.PoseLandmarkType, app.PoseLandmark>{};

    for (final landmark in pose.landmarks.values) {
      // Skip landmarks beyond upper body (index > 22)
      if (landmark.type.index > 22) continue;

      final type = app.PoseLandmarkType.fromLandmarkIndex(landmark.type.index);
      if (type == null) continue;

      landmarks[type] = app.PoseLandmark(
        type: type,
        x: landmark.x / imageWidth, // Normalize to 0-1
        y: landmark.y / imageHeight, // Normalize to 0-1
        z: landmark.z,
        confidence: landmark.likelihood,
      );
    }

    return PoseResult(
      landmarks: landmarks,
      frameNumber: _frameCount,
    );
  }

  InputImageRotation _getRotation(int rotation) {
    switch (rotation) {
      case 0: return InputImageRotation.rotation0deg;
      case 90: return InputImageRotation.rotation90deg;
      case 180: return InputImageRotation.rotation180deg;
      case 270: return InputImageRotation.rotation270deg;
      default: return InputImageRotation.rotation0deg;
    }
  }

  InputImageFormat _getFormat(InputImageFormat format) {
    switch (format) {
      case InputImageFormat.nv21: return InputImageFormat.nv21;
      case InputImageFormat.yv12: return InputImageFormat.yv12;
      case InputImageFormat.yuv420: return InputImageFormat.yuv420;
      case InputImageFormat.bgra8888: return InputImageFormat.bgra8888;
      default: return InputImageFormat.nv21;
    }
  }

  @override
  void dispose() {
    _detector?.close();
    _detector = null;
    _isReady = false;
  }
}
*/

// Placeholder class for Windows compatibility
// This file provides the interface signature but no-ops on Windows
import 'pose_detector_service.dart';
import '../models/pose_result.dart';

/// Placeholder for ML Kit - not available on Windows
/// Use MockPoseDetector on Windows, uncomment above for Mobile
class MLKitPoseDetector implements PoseDetectorService {
  @override
  String get name => 'MLKitPoseDetector (Not Available on Windows)';

  @override
  bool get isReady => false;

  @override
  Future<void> initialize() async {
    throw UnsupportedError(
      'ML Kit is not available on Windows. Use MockPoseDetector for development.'
    );
  }

  @override
  Future<PoseResult?> detectPose(InputImageData imageData) async => null;

  @override
  Future<PoseResult?> processFrame(dynamic cameraImage) async => null;

  @override
  void dispose() {}
}
