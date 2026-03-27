import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:camera/camera.dart';
import 'package:provider/provider.dart';
import '../models/posture_metrics.dart';
import '../painters/pose_painter.dart';
import '../state/pose_state_manager.dart';

/// Main view with camera preview (or placeholder), pose overlay, and control panel
class HomeView extends StatefulWidget {
  final List<CameraDescription> cameras;

  const HomeView({super.key, required this.cameras});

  @override
  State<HomeView> createState() => _HomeViewState();
}

class _HomeViewState extends State<HomeView> with WidgetsBindingObserver {
  CameraController? _cameraController;
  bool _isCameraInitialized = false;
  String _errorMessage = '';
  Timer? _frameTimer;
  
  // On desktop, Python handles the camera - don't use Flutter camera
  bool get _useFlutterCamera => !Platform.isWindows && !Platform.isLinux && !Platform.isMacOS;
  
  // Focus node for keyboard input
  final FocusNode _focusNode = FocusNode();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    
    // Only initialize Flutter camera on mobile platforms
    if (_useFlutterCamera) {
      _initializeCamera();
    } else {
      // On desktop, just mark as ready (Python backend handles camera)
      _isCameraInitialized = true;
    }
    
    // Use post frame callback to safely access context
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _initializePoseDetector();
    });
  }

  Future<void> _initializePoseDetector() async {
    if (!mounted) return;
    final stateManager = context.read<PoseStateManager>();
    await stateManager.initialize();
  }

  Future<void> _initializeCamera() async {
    if (widget.cameras.isEmpty) {
      setState(() => _errorMessage = 'No cameras found on this device.');
      return;
    }

    try {
      _cameraController = CameraController(
        widget.cameras.first,
        ResolutionPreset.medium,
        enableAudio: false,
        imageFormatGroup: ImageFormatGroup.yuv420,
      );

      await _cameraController!.initialize();
      
      if (mounted) {
        setState(() => _isCameraInitialized = true);
        _startFrameProcessing();
      }
    } catch (e) {
      setState(() => _errorMessage = 'Camera failed to start: $e');
    }
  }

  void _startFrameProcessing() {
    // Only needed for mobile where we process frames locally
    if (!_useFlutterCamera) return;
    
    // Process frames at ~30fps for pose detection
    _frameTimer = Timer.periodic(const Duration(milliseconds: 33), (_) {
      _processCurrentFrame();
    });
  }

  Future<void> _processCurrentFrame() async {
    if (!mounted) return;
    if (_cameraController == null || !_cameraController!.value.isInitialized) {
      return;
    }

    try {
      final stateManager = context.read<PoseStateManager>();
      await stateManager.processFrame(null);
    } catch (e) {
      debugPrint('Frame processing error: $e');
    }
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (!_useFlutterCamera) return;
    if (_cameraController == null || !_cameraController!.value.isInitialized) {
      return;
    }

    if (state == AppLifecycleState.inactive) {
      _cameraController?.dispose();
    } else if (state == AppLifecycleState.resumed) {
      _initializeCamera();
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _frameTimer?.cancel();
    _cameraController?.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF1A1A2E),
      body: KeyboardListener(
        focusNode: _focusNode,
        autofocus: true,
        onKeyEvent: (event) {
          final stateManager = context.read<PoseStateManager>();
          stateManager.handleKeyEvent(event);
        },
        child: SafeArea(
          child: Column(
            children: [
              // Header
              _buildHeader(),
              
              // Main content
              Expanded(
                child: Row(
                  children: [
                    // Camera view with overlay
                    Expanded(flex: 3, child: _buildCameraView()),
                    
                    // Metrics panel
                    Expanded(flex: 1, child: _buildMetricsPanel()),
                  ],
                ),
              ),
              
              // Control bar
              _buildControlBar(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Consumer<PoseStateManager>(
      builder: (context, state, _) {
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          decoration: BoxDecoration(
            color: const Color(0xFF16213E),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.3),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            children: [
              // Logo/Title
              const Icon(Icons.accessibility_new, color: Color(0xFF00D4FF), size: 28),
              const SizedBox(width: 12),
              const Text(
                'Pose Engine',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.2,
                ),
              ),
              
              const Spacer(),
              
              // Connection status (for MediaPipe backend)
              if (!_useFlutterCamera)
                _buildStatusIndicator(
                  'MediaPipe',
                  state.isConnected,
                  Icons.cloud_done,
                ),
              if (!_useFlutterCamera)
                const SizedBox(width: 16),
              
              // Status indicators
              _buildStatusIndicator(
                'Detector',
                state.error == null,
                Icons.psychology,
              ),
              const SizedBox(width: 16),
              _buildStatusIndicator(
                'Pose',
                state.currentPose != null && state.currentPose!.landmarks.isNotEmpty,
                Icons.person,
              ),
              const SizedBox(width: 16),
              _buildStatusIndicator(
                'Calibrated',
                state.isCalibrated,
                Icons.tune,
              ),
              
              const SizedBox(width: 24),
              
              // FPS counter
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.3),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Text(
                  '${state.fps.toStringAsFixed(1)} FPS',
                  style: const TextStyle(
                    color: Color(0xFF00D4FF),
                    fontSize: 14,
                    fontFamily: 'monospace',
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildStatusIndicator(String label, bool isActive, IconData icon) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 10,
          height: 10,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: isActive ? const Color(0xFF4CAF50) : const Color(0xFFF44336),
            boxShadow: [
              BoxShadow(
                color: (isActive ? Colors.green : Colors.red).withOpacity(0.5),
                blurRadius: 6,
                spreadRadius: 1,
              ),
            ],
          ),
        ),
        const SizedBox(width: 6),
        Icon(icon, color: Colors.white70, size: 18),
        const SizedBox(width: 4),
        Text(
          label,
          style: const TextStyle(color: Colors.white70, fontSize: 12),
        ),
      ],
    );
  }

  Widget _buildCameraView() {
    if (_errorMessage.isNotEmpty) {
      return _buildErrorView();
    }

    return Consumer<PoseStateManager>(
      builder: (context, state, _) {
        // On desktop, show pose visualization without camera preview
        // (Python backend handles camera)
        if (!_useFlutterCamera) {
          return _buildDesktopPoseView(state);
        }
        
        // On mobile, show camera preview with pose overlay
        if (!_isCameraInitialized || _cameraController == null) {
          return _buildLoadingView();
        }

        return _buildMobileCameraView(state);
      },
    );
  }
  
  Widget _buildDesktopPoseView(PoseStateManager state) {
    return Container(
      margin: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: _getBorderColor(state.calibratedMetrics?.overallQuality),
          width: 3,
        ),
        boxShadow: [
          BoxShadow(
            color: _getBorderColor(state.calibratedMetrics?.overallQuality)
                .withOpacity(0.3),
            blurRadius: 20,
            spreadRadius: 2,
          ),
        ],
        gradient: const LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            Color(0xFF1E2A4A),
            Color(0xFF16213E),
          ],
        ),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(13),
        child: Stack(
          fit: StackFit.expand,
          children: [
            // Camera Feed (from Python backend)
            if (state.currentFrame != null)
              Transform(
                alignment: Alignment.center,
                transform: Matrix4.rotationY(3.14159), // Mirror 180 degrees
                child: Image.memory(
                  base64Decode(state.currentFrame!),
                  fit: BoxFit.contain, // Maintain aspect ratio
                  gaplessPlayback: true,
                ),
              )
            else
              // Fallback to grid if no frame received
              CustomPaint(
                painter: _GridPainter(),
              ),
            
            // Pose overlay
            if (state.currentPose != null)
              CustomPaint(
                painter: PosePainter(
                  pose: state.currentPose,
                  viewMode: state.viewMode,
                  metrics: state.calibratedMetrics,
                  imageWidth: 640,  // Python backend camera width
                  imageHeight: 480, // Python backend camera height
                ),
              ),
            
            // Connection status overlay
            if (!state.isConnected)
              Container(
                color: Colors.black.withOpacity(0.7),
                child: Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const CircularProgressIndicator(
                        valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF00D4FF)),
                      ),
                      const SizedBox(height: 24),
                      const Text(
                        'Connecting to MediaPipe Server...',
                        style: TextStyle(color: Colors.white, fontSize: 18),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        state.connectionMessage,
                        style: const TextStyle(color: Colors.white70, fontSize: 14),
                      ),
                      const SizedBox(height: 16),
                      const Text(
                        'Make sure pose_server.py is running',
                        style: TextStyle(color: Colors.amber, fontSize: 12),
                      ),
                    ],
                  ),
                ),
              ),
            
            // No pose detected overlay
            if (state.isConnected && (state.currentPose == null || state.currentPose!.landmarks.isEmpty))
              Positioned(
                bottom: 20,
                left: 0,
                right: 0,
                child: Center(
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.amber.withOpacity(0.8),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Text(
                      'No pose detected - Position yourself in front of the camera',
                      style: TextStyle(color: Colors.black87, fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
              ),
            
            // Calibration overlay
            if (state.isCalibrating)
              _buildCalibrationOverlay(state.calibrationProgress),
            
            // Mode indicator
            Positioned(
              top: 16,
              left: 16,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.6),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      state.viewMode == ViewMode.front 
                          ? Icons.person 
                          : Icons.person_outline,
                      color: Colors.white,
                      size: 18,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      state.viewMode == ViewMode.front ? 'FRONT VIEW' : 'SIDE VIEW',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1.5,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            
            // Landmark count indicator
            if (state.currentPose != null)
              Positioned(
                top: 16,
                right: 16,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.6),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    '${state.currentPose!.landmarks.length} landmarks',
                    style: const TextStyle(
                      color: Color(0xFF00D4FF),
                      fontSize: 12,
                      fontFamily: 'monospace',
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildMobileCameraView(PoseStateManager state) {
    return Container(
      margin: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: _getBorderColor(state.calibratedMetrics?.overallQuality),
          width: 3,
        ),
        boxShadow: [
          BoxShadow(
            color: _getBorderColor(state.calibratedMetrics?.overallQuality)
                .withOpacity(0.3),
            blurRadius: 20,
            spreadRadius: 2,
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(13),
        child: Stack(
          fit: StackFit.expand,
          children: [
            // Camera preview
            CameraPreview(_cameraController!),
            
            // Pose overlay
            CustomPaint(
              painter: PosePainter(
                pose: state.currentPose,
                viewMode: state.viewMode,
                metrics: state.calibratedMetrics,
                imageWidth: _cameraController!.value.previewSize?.width ?? 640,
                imageHeight: _cameraController!.value.previewSize?.height ?? 480,
              ),
            ),
            
            // Calibration overlay
            if (state.isCalibrating)
              _buildCalibrationOverlay(state.calibrationProgress),
            
            // Mode indicator
            Positioned(
              top: 16,
              left: 16,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.6),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      state.viewMode == ViewMode.front 
                          ? Icons.person 
                          : Icons.person_outline,
                      color: Colors.white,
                      size: 18,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      state.viewMode == ViewMode.front ? 'FRONT VIEW' : 'SIDE VIEW',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1.5,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCalibrationOverlay(double progress) {
    return Container(
      color: Colors.black.withOpacity(0.7),
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.accessibility_new,
              color: Color(0xFF00D4FF),
              size: 64,
            ),
            const SizedBox(height: 24),
            const Text(
              'CALIBRATING',
              style: TextStyle(
                color: Colors.white,
                fontSize: 24,
                fontWeight: FontWeight.bold,
                letterSpacing: 3,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Hold still in your ideal posture',
              style: TextStyle(
                color: Colors.white70,
                fontSize: 14,
              ),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: 200,
              child: LinearProgressIndicator(
                value: progress,
                backgroundColor: Colors.white24,
                valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF00D4FF)),
                minHeight: 8,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              '${(progress * 100).toInt()}%',
              style: const TextStyle(
                color: Color(0xFF00D4FF),
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorView() {
    return Container(
      margin: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF16213E),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.red.withOpacity(0.5)),
      ),
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline, color: Colors.red, size: 64),
            const SizedBox(height: 16),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 32),
              child: Text(
                _errorMessage,
                style: const TextStyle(color: Colors.red, fontSize: 16),
                textAlign: TextAlign.center,
              ),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () {
                setState(() => _errorMessage = '');
                if (_useFlutterCamera) {
                  _initializeCamera();
                }
              },
              icon: const Icon(Icons.refresh),
              label: const Text('Retry'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF00D4FF),
                foregroundColor: Colors.black,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLoadingView() {
    return Container(
      margin: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF16213E),
        borderRadius: BorderRadius.circular(16),
      ),
      child: const Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            CircularProgressIndicator(
              valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF00D4FF)),
            ),
            SizedBox(height: 16),
            Text(
              'Initializing Camera...',
              style: TextStyle(color: Colors.white70, fontSize: 16),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMetricsPanel() {
    return Consumer<PoseStateManager>(
      builder: (context, state, _) {
        final metrics = state.calibratedMetrics;
        
        return Container(
          margin: const EdgeInsets.fromLTRB(0, 16, 16, 16),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFF16213E),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.white.withOpacity(0.1)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Panel header
              const Row(
                children: [
                  Icon(Icons.analytics, color: Color(0xFF00D4FF), size: 20),
                  SizedBox(width: 8),
                  Text(
                    'POSTURE METRICS',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1.2,
                    ),
                  ),
                ],
              ),
              
              const Divider(color: Colors.white24, height: 24),
              
              // Metrics cards
              Expanded(
                child: state.viewMode == ViewMode.front
                    ? _buildFrontViewMetrics(metrics)
                    : _buildSideViewMetrics(metrics),
              ),
              
              const Divider(color: Colors.white24, height: 24),
              
              // Overall quality indicator
              _buildOverallQuality(metrics?.overallQuality),
            ],
          ),
        );
      },
    );
  }

  Widget _buildFrontViewMetrics(PostureMetrics? metrics) {
    return Column(
      children: [
        _buildMetricCard(
          'Neck Bend',
          metrics?.neckBendAngle ?? 0,
          '°',
          metrics?.neckBendQuality ?? PostureQuality.good,
          Icons.compare_arrows,
        ),
        const SizedBox(height: 12),
        _buildMetricCard(
          'Shoulder Slope',
          metrics?.shoulderSlopeAngle ?? 0,
          '°',
          metrics?.shoulderSlopeQuality ?? PostureQuality.good,
          Icons.straighten,
        ),
        const SizedBox(height: 12),
        _buildMetricCard(
          'Torso Tilt',
          metrics?.torsoTiltPercent ?? 0,
          '%',
          metrics?.torsoTiltQuality ?? PostureQuality.good,
          Icons.vertical_align_center,
        ),
      ],
    );
  }

  Widget _buildSideViewMetrics(PostureMetrics? metrics) {
    return Column(
      children: [
        _buildMetricCard(
          'Neck Bend',
          metrics?.neckBendAngle ?? 0,
          '°',
          metrics?.neckBendQuality ?? PostureQuality.good,
          Icons.compare_arrows,
        ),
        const SizedBox(height: 12),
        _buildMetricCard(
          'Head Forward',
          (metrics?.headForwardRatio ?? 0) * 100,
          '%',
          metrics?.headForwardQuality ?? PostureQuality.good,
          Icons.arrow_forward,
        ),
      ],
    );
  }

  Widget _buildMetricCard(
    String label,
    double value,
    String unit,
    PostureQuality quality,
    IconData icon,
  ) {
    final color = _getQualityColor(quality);
    
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Row(
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: const TextStyle(
                    color: Colors.white70,
                    fontSize: 12,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${value.toStringAsFixed(1)}$unit',
                  style: TextStyle(
                    color: color,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    fontFamily: 'monospace',
                  ),
                ),
              ],
            ),
          ),
          Container(
            width: 12,
            height: 12,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: color,
              boxShadow: [
                BoxShadow(
                  color: color.withOpacity(0.5),
                  blurRadius: 6,
                  spreadRadius: 2,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOverallQuality(PostureQuality? quality) {
    final color = _getQualityColor(quality ?? PostureQuality.good);
    final label = quality?.name.toUpperCase() ?? 'UNKNOWN';
    
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [color.withOpacity(0.3), color.withOpacity(0.1)],
        ),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.5)),
      ),
      child: Column(
        children: [
          const Text(
            'OVERALL',
            style: TextStyle(
              color: Colors.white70,
              fontSize: 10,
              letterSpacing: 2,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              color: color,
              fontSize: 24,
              fontWeight: FontWeight.bold,
              letterSpacing: 2,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildControlBar() {
    return Consumer<PoseStateManager>(
      builder: (context, state, _) {
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          decoration: BoxDecoration(
            color: const Color(0xFF16213E),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.3),
                blurRadius: 8,
                offset: const Offset(0, -2),
              ),
            ],
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Front view button
              _buildControlButton(
                label: 'FRONT (F)',
                icon: Icons.person,
                isActive: state.viewMode == ViewMode.front,
                onPressed: () => state.setViewMode(ViewMode.front),
              ),
              
              const SizedBox(width: 16),
              
              // Side view button
              _buildControlButton(
                label: 'SIDE (S)',
                icon: Icons.person_outline,
                isActive: state.viewMode == ViewMode.side,
                onPressed: () => state.setViewMode(ViewMode.side),
              ),
              
              const SizedBox(width: 32),
              
              // Calibration button
              _buildControlButton(
                label: state.isCalibrating 
                    ? 'CANCEL (C)' 
                    : (state.isCalibrated ? 'RECALIBRATE (C)' : 'CALIBRATE (C)'),
                icon: state.isCalibrating 
                    ? Icons.cancel 
                    : (state.isCalibrated ? Icons.check_circle : Icons.tune),
                isActive: state.isCalibrating,
                isSuccess: state.isCalibrated && !state.isCalibrating,
                onPressed: () {
                  if (state.isCalibrating) {
                    state.cancelCalibration();
                  } else {
                    state.startCalibration();
                  }
                },
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildControlButton({
    required String label,
    required IconData icon,
    required bool isActive,
    bool isSuccess = false,
    required VoidCallback onPressed,
  }) {
    Color bgColor;
    Color fgColor;
    
    if (isActive) {
      bgColor = const Color(0xFF00D4FF);
      fgColor = Colors.black;
    } else if (isSuccess) {
      bgColor = const Color(0xFF4CAF50);
      fgColor = Colors.white;
    } else {
      bgColor = Colors.white.withOpacity(0.1);
      fgColor = Colors.white;
    }
    
    return ElevatedButton.icon(
      onPressed: onPressed,
      icon: Icon(icon, size: 20),
      label: Text(label),
      style: ElevatedButton.styleFrom(
        backgroundColor: bgColor,
        foregroundColor: fgColor,
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(24),
        ),
      ),
    );
  }

  Color _getBorderColor(PostureQuality? quality) {
    return _getQualityColor(quality ?? PostureQuality.good).withOpacity(0.7);
  }

  Color _getQualityColor(PostureQuality quality) {
    switch (quality) {
      case PostureQuality.good:
        return const Color(0xFF4CAF50);
      case PostureQuality.warning:
        return const Color(0xFFFFC107);
      case PostureQuality.bad:
        return const Color(0xFFF44336);
    }
  }
}

/// Grid painter for desktop view background
class _GridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.white.withOpacity(0.05)
      ..strokeWidth = 1;
    
    const spacing = 40.0;
    
    // Vertical lines
    for (double x = 0; x < size.width; x += spacing) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }
    
    // Horizontal lines
    for (double y = 0; y < size.height; y += spacing) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }
    
    // Center crosshair
    final centerPaint = Paint()
      ..color = Colors.white.withOpacity(0.15)
      ..strokeWidth = 2;
    
    canvas.drawLine(
      Offset(size.width / 2, 0),
      Offset(size.width / 2, size.height),
      centerPaint,
    );
    canvas.drawLine(
      Offset(0, size.height / 2),
      Offset(size.width, size.height / 2),
      centerPaint,
    );
  }
  
  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
