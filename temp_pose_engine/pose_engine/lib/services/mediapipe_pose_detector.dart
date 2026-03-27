import 'dart:async';
import 'dart:convert';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:flutter/foundation.dart';
import 'pose_detector_service.dart';
import '../models/pose_landmark.dart';
import '../models/pose_result.dart';

/// MediaPipe pose detector that connects to Python backend via WebSocket
/// 
/// This detector communicates with the Python MediaPipe server to get
/// real-time pose detection data from the camera.
class MediaPipePoseDetector implements PoseDetectorService {
  WebSocketChannel? _channel;
  bool _isReady = false;
  int _frameCount = 0;
  
  final String _host;
  final int _port;
  
  // Stream controller for pose results
  final StreamController<PoseResult> _poseStreamController = 
      StreamController<PoseResult>.broadcast();
  
  // Latest pose result for synchronous access
  PoseResult? _latestPose;
  
  // Connection status callback
  Function(bool connected, String message)? onConnectionStatus;
  
  MediaPipePoseDetector({
    String host = 'localhost',
    int port = 8765,
  }) : _host = host, _port = port;

  @override
  String get name => 'MediaPipePoseDetector (Python Backend)';

  @override
  bool get isReady => _isReady;
  
  /// Stream of pose detection results
  Stream<PoseResult> get poseStream => _poseStreamController.stream;

  @override
  Future<void> initialize() async {
    try {
      final uri = Uri.parse('ws://$_host:$_port');
      debugPrint('🔌 Connecting to MediaPipe server at $uri');
      
      _channel = WebSocketChannel.connect(uri);
      
      // Wait for connection
      await _channel!.ready;
      
      debugPrint('✅ Connected to MediaPipe server');
      
      // Listen for messages
      _channel!.stream.listen(
        _handleMessage,
        onError: (error) {
          debugPrint('❌ WebSocket error: $error');
          _isReady = false;
          onConnectionStatus?.call(false, 'Connection error: $error');
        },
        onDone: () {
          debugPrint('🔌 WebSocket connection closed');
          _isReady = false;
          onConnectionStatus?.call(false, 'Connection closed');
        },
      );
      
      // Send start command to begin camera capture on Python side
      _sendCommand({'command': 'start', 'camera_index': 0});
      
      _isReady = true;
      onConnectionStatus?.call(true, 'Connected to MediaPipe server');
      
    } catch (e) {
      debugPrint('❌ Failed to connect to MediaPipe server: $e');
      _isReady = false;
      onConnectionStatus?.call(false, 'Failed to connect: $e');
      rethrow;
    }
  }
  
  void _sendCommand(Map<String, dynamic> command) {
    if (_channel != null) {
      _channel!.sink.add(jsonEncode(command));
    }
  }
  
  // Stream controller for video frames (base64 encoded)
  final StreamController<String> _frameStreamController = 
      StreamController<String>.broadcast();
      
  /// Stream of video frames (base64 encoded JPEG)
  Stream<String> get frameStream => _frameStreamController.stream;

  void _handleMessage(dynamic message) {
    try {
      final data = jsonDecode(message as String);
      final type = data['type'] as String?;
      
      switch (type) {
        case 'frame':
          // Handle both pose and image
          if (data['pose'] != null) {
            _handlePoseData(data['pose']);
          }
          if (data['image'] != null) {
            _frameStreamController.add(data['image'] as String);
          }
          break;
        case 'pose':
          _handlePoseData(data['data']);
          break;
        case 'status':
          final success = data['success'] as bool;
          final msg = data['message'] as String;
          debugPrint('📊 Status: $msg');
          onConnectionStatus?.call(success, msg);
          break;
        case 'pong':
          debugPrint('🏓 Pong received');
          break;
      }
    } catch (e) {
      debugPrint('Error parsing message: $e');
    }
  }
  
  void _handlePoseData(Map<String, dynamic> poseData) {
    final detected = poseData['detected'] as bool? ?? false;
    final landmarks = <PoseLandmarkType, PoseLandmark>{};
    
    if (detected && poseData['landmarks'] != null) {
      final landmarkList = poseData['landmarks'] as List;
      
      for (final lm in landmarkList) {
        final index = lm['index'] as int;
        final type = PoseLandmarkType.fromLandmarkIndex(index);
        
        if (type != null) {
          landmarks[type] = PoseLandmark(
            type: type,
            // Flip X since we're using a mirrored frontend view but MediaPipe returns normal coords
            // Or keep as is, coordinate translator usually handles mirroring
            x: (lm['x'] as num).toDouble(),
            y: (lm['y'] as num).toDouble(),
            z: (lm['z'] as num).toDouble(),
            confidence: (lm['visibility'] as num).toDouble(),
          );
        }
      }
    }
    
    _frameCount++;
    _latestPose = PoseResult(
      landmarks: landmarks,
      frameNumber: _frameCount,
    );
    
    // Emit to stream
    _poseStreamController.add(_latestPose!);
  }

  @override
  Future<PoseResult?> detectPose(InputImageData imageData) async {
    // Not used - pose comes from Python backend stream
    return _latestPose;
  }

  @override
  Future<PoseResult?> processFrame(dynamic cameraImage) async {
    // Return the latest pose from the Python backend
    // The Python backend handles its own camera, so we don't process frames here
    return _latestPose;
  }
  
  /// Send ping to check connection
  void ping() {
    _sendCommand({'command': 'ping'});
  }

  @override
  void dispose() {
    _sendCommand({'command': 'stop'});
    _channel?.sink.close();
    _poseStreamController.close();
    _frameStreamController.close();
    _isReady = false;
  }
}
