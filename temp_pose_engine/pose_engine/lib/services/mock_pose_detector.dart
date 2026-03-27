import 'dart:async';
import 'dart:math' as math;
import 'dart:typed_data';
import 'pose_detector_service.dart';
import '../models/pose_landmark.dart';
import '../models/pose_result.dart';

/// Mock pose detector for Windows development
/// 
/// Simulates realistic pose detection with oscillating landmarks
/// to test the UI and math engine without actual ML processing.
class MockPoseDetector implements PoseDetectorService {
  bool _isReady = false;
  int _frameCount = 0;
  final math.Random _random = math.Random();
  
  // Base positions for a centered, seated person (normalized 0-1)
  static const _basePositions = {
    PoseLandmarkType.nose: [0.5, 0.15],
    PoseLandmarkType.leftEye: [0.46, 0.12],
    PoseLandmarkType.rightEye: [0.54, 0.12],
    PoseLandmarkType.leftEyeInner: [0.47, 0.12],
    PoseLandmarkType.rightEyeInner: [0.53, 0.12],
    PoseLandmarkType.leftEyeOuter: [0.44, 0.12],
    PoseLandmarkType.rightEyeOuter: [0.56, 0.12],
    PoseLandmarkType.leftEar: [0.40, 0.14],
    PoseLandmarkType.rightEar: [0.60, 0.14],
    PoseLandmarkType.mouthLeft: [0.47, 0.18],
    PoseLandmarkType.mouthRight: [0.53, 0.18],
    PoseLandmarkType.leftShoulder: [0.35, 0.30],
    PoseLandmarkType.rightShoulder: [0.65, 0.30],
    PoseLandmarkType.leftElbow: [0.25, 0.45],
    PoseLandmarkType.rightElbow: [0.75, 0.45],
    PoseLandmarkType.leftWrist: [0.20, 0.55],
    PoseLandmarkType.rightWrist: [0.80, 0.55],
    PoseLandmarkType.leftPinky: [0.18, 0.58],
    PoseLandmarkType.rightPinky: [0.82, 0.58],
    PoseLandmarkType.leftIndex: [0.19, 0.59],
    PoseLandmarkType.rightIndex: [0.81, 0.59],
    PoseLandmarkType.leftThumb: [0.21, 0.56],
    PoseLandmarkType.rightThumb: [0.79, 0.56],
  };

  @override
  String get name => 'MockPoseDetector (Windows Development)';

  @override
  bool get isReady => _isReady;

  @override
  Future<void> initialize() async {
    // Simulate initialization delay
    await Future.delayed(const Duration(milliseconds: 500));
    _isReady = true;
  }

  @override
  Future<PoseResult?> detectPose(InputImageData imageData) async {
    if (!_isReady) return null;

    // Simulate processing delay (typically 30-50ms for real ML)
    await Future.delayed(const Duration(milliseconds: 30));

    _frameCount++;
    
    // Generate landmarks with natural micro-movements
    final landmarks = <PoseLandmarkType, PoseLandmark>{};
    
    // Time-based oscillation for natural movement
    final time = _frameCount / 30.0; // Assume ~30fps
    
    // Simulate occasional bad posture patterns
    final posturePhase = math.sin(time * 0.1) * 0.5 + 0.5; // 0-1 cycle
    final neckBendOffset = math.sin(time * 0.3) * 0.02 * posturePhase;
    final shoulderTiltOffset = math.sin(time * 0.2) * 0.01 * posturePhase;
    
    for (final entry in _basePositions.entries) {
      final type = entry.key;
      final baseX = entry.value[0];
      final baseY = entry.value[1];
      
      // Add micro-movements (breathing, minor adjustments)
      double x = baseX + _random.nextDouble() * 0.005 - 0.0025;
      double y = baseY + _random.nextDouble() * 0.005 - 0.0025;
      
      // Add posture drift for neck/head
      if (type == PoseLandmarkType.nose ||
          type == PoseLandmarkType.leftEye ||
          type == PoseLandmarkType.rightEye ||
          type == PoseLandmarkType.leftEar ||
          type == PoseLandmarkType.rightEar) {
        x += neckBendOffset;
        y += math.sin(time * 0.5) * 0.01; // Slight vertical bobbing
      }
      
      // Add shoulder tilt
      if (type == PoseLandmarkType.leftShoulder) {
        y += shoulderTiltOffset;
      } else if (type == PoseLandmarkType.rightShoulder) {
        y -= shoulderTiltOffset;
      }
      
      landmarks[type] = PoseLandmark(
        type: type,
        x: x.clamp(0.0, 1.0),
        y: y.clamp(0.0, 1.0),
        z: _random.nextDouble() * 0.1 - 0.05, // Small depth variation
        confidence: 0.85 + _random.nextDouble() * 0.15, // 0.85-1.0 confidence
      );
    }

    return PoseResult(
      landmarks: landmarks,
      frameNumber: _frameCount,
    );
  }

  @override
  Future<PoseResult?> processFrame(dynamic cameraImage) async {
    // For mock, we ignore the actual camera image and generate fake data
    return detectPose(InputImageData(
      bytes: Uint8List(0),
      width: 640,
      height: 480,
    ));
  }

  @override
  void dispose() {
    _isReady = false;
    _frameCount = 0;
  }
}
