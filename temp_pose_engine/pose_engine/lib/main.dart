import 'dart:io';
import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'package:provider/provider.dart';

import 'services/pose_detector_service.dart';
import 'services/mock_pose_detector.dart';
import 'services/mediapipe_pose_detector.dart';
// import 'services/mlkit_pose_detector.dart'; // Uncomment for mobile
import 'state/pose_state_manager.dart';
import 'views/home_view.dart';

List<CameraDescription> _cameras = [];

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize cameras (for Flutter camera preview, not pose detection)
  try {
    _cameras = await availableCameras();
  } on CameraException catch (e) {
    debugPrint('Error finding cameras: $e');
  }

  // Select appropriate detector based on platform
  final PoseDetectorService detector = _createPoseDetector();

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(
          create: (_) => PoseStateManager(detector: detector),
        ),
      ],
      child: PoseEngineApp(cameras: _cameras),
    ),
  );
}

/// Create the appropriate pose detector based on platform
PoseDetectorService _createPoseDetector() {
  if (Platform.isWindows || Platform.isLinux || Platform.isMacOS) {
    // Desktop platforms: Use MediaPipe via Python backend
    // Make sure to run the Python server first:
    //   cd python_backend
    //   pip install -r requirements.txt
    //   python pose_server.py
    debugPrint('🖥️ Desktop detected: Using MediaPipePoseDetector (Python backend)');
    debugPrint('⚠️ Ensure Python pose_server.py is running on ws://localhost:8765');
    return MediaPipePoseDetector(host: 'localhost', port: 8765);
  } else {
    // Mobile platforms: Use ML Kit
    // Uncomment the following line for mobile:
    // return MLKitPoseDetector();
    
    debugPrint('📱 Mobile detected: Using MockPoseDetector (swap to MLKitPoseDetector for production)');
    return MockPoseDetector();
  }
}

class PoseEngineApp extends StatelessWidget {
  final List<CameraDescription> cameras;
  
  const PoseEngineApp({super.key, required this.cameras});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Pose Engine',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        brightness: Brightness.dark,
        primaryColor: const Color(0xFF00D4FF),
        scaffoldBackgroundColor: const Color(0xFF1A1A2E),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF00D4FF),
          secondary: Color(0xFF4CAF50),
          surface: Color(0xFF16213E),
          error: Color(0xFFF44336),
        ),
        fontFamily: 'Roboto',
      ),
      home: HomeView(cameras: cameras),
    );
  }
}
