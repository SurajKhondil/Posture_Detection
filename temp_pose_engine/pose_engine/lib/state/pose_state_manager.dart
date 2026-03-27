import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import '../models/pose_result.dart';
import '../models/posture_metrics.dart';
import '../painters/pose_painter.dart';
import '../services/pose_detector_service.dart';
import '../services/mediapipe_pose_detector.dart';

/// Callback type for emitting data to Team 2 & 3
typedef DataEmitCallback = void Function(Map<String, dynamic> payload);

/// State manager for pose detection (ChangeNotifier for Provider)
class PoseStateManager extends ChangeNotifier {
  final PoseDetectorService _detector;
  StreamSubscription<PoseResult>? _poseSubscription;
  
  // View mode state
  ViewMode _viewMode = ViewMode.front;
  ViewMode get viewMode => _viewMode;

  // Calibration state
  bool _isCalibrated = false;
  bool get isCalibrated => _isCalibrated;
  
  PostureMetrics? _calibrationBaseline;
  PostureMetrics? get calibrationBaseline => _calibrationBaseline;

  // Calibration buffer for stable frame capture
  final List<PostureMetrics> _calibrationBuffer = [];
  static const int _calibrationFramesRequired = 30; // ~1 second at 30fps
  bool _isCalibrating = false;
  bool get isCalibrating => _isCalibrating;
  double get calibrationProgress => 
      _calibrationBuffer.length / _calibrationFramesRequired;

  // Current detection state
  PoseResult? _currentPose;
  PoseResult? get currentPose => _currentPose;

  PostureMetrics? _currentMetrics;
  PostureMetrics? get currentMetrics => _currentMetrics;

  PostureMetrics? _calibratedMetrics;
  PostureMetrics? get calibratedMetrics => _calibratedMetrics;

  // Detection statistics
  int _framesProcessed = 0;
  int get framesProcessed => _framesProcessed;
  
  DateTime? _lastFrameTime;
  double _fps = 0.0;
  double get fps => _fps;

  // Data emission callback
  DataEmitCallback? onDataEmit;

  // Error state
  String? _error;
  String? get error => _error;
  
  // Connection status for MediaPipe backend
  bool _isConnected = false;
  bool get isConnected => _isConnected;
  String _connectionMessage = 'Not connected';
  String get connectionMessage => _connectionMessage;

  // Current video frame (base64 encoded JPEG)
  String? _currentFrame;
  String? get currentFrame => _currentFrame;
  StreamSubscription<String>? _frameSubscription;

  PoseStateManager({required PoseDetectorService detector}) : _detector = detector;

  /// Initialize the detector
  Future<void> initialize() async {
    try {
      // Set up connection status callback if using MediaPipe detector
      if (_detector is MediaPipePoseDetector) {
        final mpDetector = _detector as MediaPipePoseDetector;
        mpDetector.onConnectionStatus = (connected, message) {
          _isConnected = connected;
          _connectionMessage = message;
          if (!connected) {
            _error = message;
            _currentFrame = null; // Clear frame on disconnect
          } else {
            _error = null;
          }
          notifyListeners();
        };
      }
      
      await _detector.initialize();
      
      // Subscribe to streams if using MediaPipe detector
      if (_detector is MediaPipePoseDetector) {
        final mpDetector = _detector as MediaPipePoseDetector;
        
        // Subscribe to pose stream
        _poseSubscription = mpDetector.poseStream.listen(_handlePoseResult);
        
        // Subscribe to frame stream
        _frameSubscription = mpDetector.frameStream.listen((frame) {
          _currentFrame = frame;
          notifyListeners();
        });
        
        debugPrint('✅ Subscribed to MediaPipe pose and frame streams');
      }
      
      _error = null;
      notifyListeners();
    } catch (e) {
      _error = 'Failed to initialize detector: $e';
      debugPrint('❌ Initialization error: $_error');
      notifyListeners();
    }
  }
  
  /// Handle incoming pose result from stream
  void _handlePoseResult(PoseResult pose) {
    if (pose.hasMinimumKeypoints || pose.landmarks.isNotEmpty) {
      _currentPose = pose;
      _framesProcessed++;

      // Calculate FPS
      final now = DateTime.now();
      if (_lastFrameTime != null) {
        final delta = now.difference(_lastFrameTime!).inMilliseconds;
        if (delta > 0) {
          _fps = 1000 / delta;
        }
      }
      _lastFrameTime = now;

      // Calculate metrics
      _currentMetrics = PostureMathEngine.calculate(
        pose,
        isSideView: _viewMode == ViewMode.side,
      );

      // Handle calibration phase
      if (_isCalibrating && _currentMetrics != null) {
        _handleCalibrationFrame(_currentMetrics!);
      }

      // Apply calibration if available
      if (_isCalibrated && _calibrationBaseline != null && _currentMetrics != null) {
        _calibratedMetrics = _currentMetrics!.applyCalibration(_calibrationBaseline!);
      } else {
        _calibratedMetrics = _currentMetrics;
      }

      // Emit data to Team 2 & 3
      _emitData();

      _error = null;
      notifyListeners();
    }
  }

  /// Process a camera frame (for non-streaming detectors)
  Future<void> processFrame(dynamic cameraImage) async {
    // If using MediaPipe detector, pose comes from stream - just return
    if (_detector is MediaPipePoseDetector) {
      return;
    }
    
    if (!_detector.isReady) return;

    try {
      // Detect pose
      final pose = await _detector.processFrame(cameraImage);
      
      if (pose != null) {
        _handlePoseResult(pose);
      }
    } catch (e) {
      _error = 'Frame processing error: $e';
      notifyListeners();
    }
  }

  /// Toggle view mode (F = Front, S = Side)
  void setViewMode(ViewMode mode) {
    if (_viewMode != mode) {
      _viewMode = mode;
      // Clear calibration when switching modes
      _isCalibrated = false;
      _calibrationBaseline = null;
      _calibratedMetrics = null;
      notifyListeners();
    }
  }

  /// Start calibration process
  void startCalibration() {
    _isCalibrating = true;
    _calibrationBuffer.clear();
    notifyListeners();
  }

  /// Cancel calibration
  void cancelCalibration() {
    _isCalibrating = false;
    _calibrationBuffer.clear();
    notifyListeners();
  }

  /// Handle keyboard input for mode toggles
  bool handleKeyEvent(KeyEvent event) {
    if (event is! KeyDownEvent) return false;

    switch (event.logicalKey) {
      case LogicalKeyboardKey.keyF:
        setViewMode(ViewMode.front);
        return true;
      case LogicalKeyboardKey.keyS:
        setViewMode(ViewMode.side);
        return true;
      case LogicalKeyboardKey.keyC:
        if (_isCalibrating) {
          cancelCalibration();
        } else {
          startCalibration();
        }
        return true;
      default:
        return false;
    }
  }

  /// Handle a frame during calibration
  void _handleCalibrationFrame(PostureMetrics metrics) {
    _calibrationBuffer.add(metrics);

    if (_calibrationBuffer.length >= _calibrationFramesRequired) {
      // Calculate average baseline from buffer
      _calibrationBaseline = _calculateAverageMetrics(_calibrationBuffer);
      _isCalibrated = true;
      _isCalibrating = false;
      
      // Persist baseline to local storage (optional)
      _saveBaseline();
    }
    
    notifyListeners();
  }

  /// Calculate average metrics from calibration buffer
  PostureMetrics _calculateAverageMetrics(List<PostureMetrics> buffer) {
    if (buffer.isEmpty) return PostureMetrics.empty();

    double totalNeckBend = 0;
    double totalShoulderSlope = 0;
    double totalTorsoTilt = 0;
    double totalHeadForward = 0;
    double totalNeckConf = 0;
    double totalShoulderConf = 0;
    double totalTorsoConf = 0;
    double totalHeadConf = 0;
    double totalConfidence = 0;

    for (final m in buffer) {
      totalNeckBend += m.neckBendAngle;
      totalShoulderSlope += m.shoulderSlopeAngle;
      totalTorsoTilt += m.torsoTiltPercent;
      totalHeadForward += m.headForwardRatio;
      
      totalNeckConf += m.neckBendConfidence;
      totalShoulderConf += m.shoulderSlopeConfidence;
      totalTorsoConf += m.torsoTiltConfidence;
      totalHeadConf += m.headForwardConfidence;
      totalConfidence += m.confidence;
    }

    final count = buffer.length;
    return PostureMetrics(
      neckBendAngle: totalNeckBend / count,
      neckBendConfidence: totalNeckConf / count,
      shoulderSlopeAngle: totalShoulderSlope / count,
      shoulderSlopeConfidence: totalShoulderConf / count,
      torsoTiltPercent: totalTorsoTilt / count,
      torsoTiltConfidence: totalTorsoConf / count,
      headForwardRatio: totalHeadForward / count,
      headForwardConfidence: totalHeadConf / count,
      confidence: totalConfidence / count,
      timestamp: DateTime.now(),
    );
  }

  /// Emit data payload to Team 2 & 3
  void _emitData() {
    if (_calibratedMetrics == null) return;

    final timestamp = DateTime.now().millisecondsSinceEpoch;
    final cameraAngle = _viewMode == ViewMode.front ? 'FRONT' : 'SIDE';
    
    // Construct strict JSON payload manually
    final Map<String, dynamic> dataObj = {};

    if (_viewMode == ViewMode.front) {
      dataObj['neck_bend_degree'] = double.parse(_calibratedMetrics!.neckBendAngle.toStringAsFixed(2));
      dataObj['neck_camera_angle'] = cameraAngle;
      dataObj['neck_is_calibrated'] = _isCalibrated;
      dataObj['neck_confidence'] = double.parse(_calibratedMetrics!.neckBendConfidence.toStringAsFixed(3));
      dataObj['neck_timestamp'] = timestamp;

      dataObj['shoulder_slope_degree'] = double.parse(_calibratedMetrics!.shoulderSlopeAngle.toStringAsFixed(2));
      dataObj['shoulder_camera_angle'] = cameraAngle;
      dataObj['shoulder_is_calibrated'] = _isCalibrated;
      dataObj['shoulder_confidence'] = double.parse(_calibratedMetrics!.shoulderSlopeConfidence.toStringAsFixed(3));
      dataObj['shoulder_timestamp'] = timestamp;

      dataObj['torso_tilt_degree'] = double.parse(_calibratedMetrics!.torsoTiltPercent.toStringAsFixed(2));
      dataObj['torso_camera_angle'] = cameraAngle;
      dataObj['torso_is_calibrated'] = _isCalibrated;
      dataObj['torso_confidence'] = double.parse(_calibratedMetrics!.torsoTiltConfidence.toStringAsFixed(3));
      dataObj['torso_timestamp'] = timestamp;
    } else {
      // SIDE View
      dataObj['head_forward_index'] = double.parse(_calibratedMetrics!.headForwardRatio.toStringAsFixed(3));
      dataObj['head_forward_camera_angle'] = cameraAngle;
      dataObj['head_forward_is_calibrated'] = _isCalibrated;
      dataObj['head_forward_confidence'] = double.parse(_calibratedMetrics!.headForwardConfidence.toStringAsFixed(3));
      dataObj['head_forward_timestamp'] = timestamp;
    }

    final Map<String, dynamic> finalPayload = {
      "scan_id": "frame_$timestamp",
      "camera_angle": cameraAngle,
      "is_calibrated": _isCalibrated,
      "data": dataObj
    };

    final jsonString = jsonEncode(finalPayload);

    // Call the emission callback
    onDataEmit?.call(finalPayload);

    // Log for debugging (Strict JSON format)
    if (kDebugMode) {
       // Print every 30th frame to avoid spam
       if (_framesProcessed % 30 == 0) {
         print('📊 STR_JSON: $jsonString');
       }
    }
  }


  /// Save baseline to local storage
  Future<void> _saveBaseline() async {
    // Implementation would use shared_preferences or similar
    // For now, just log
    if (kDebugMode && _calibrationBaseline != null) {
      debugPrint('💾 Baseline saved: $_calibrationBaseline');
    }
  }

  /// Load baseline from local storage
  Future<void> loadBaseline() async {
    // Implementation would use shared_preferences or similar
    // For now, no-op
  }

  /// Reset all state
  void reset() {
    _currentPose = null;
    _currentMetrics = null;
    _calibratedMetrics = null;
    _isCalibrated = false;
    _calibrationBaseline = null;
    _calibrationBuffer.clear();
    _isCalibrating = false;
    _framesProcessed = 0;
    _fps = 0;
    _error = null;
    notifyListeners();
  }

  @override
  void dispose() {
    _poseSubscription?.cancel();
    _frameSubscription?.cancel();
    _detector.dispose();
    super.dispose();
  }
}
