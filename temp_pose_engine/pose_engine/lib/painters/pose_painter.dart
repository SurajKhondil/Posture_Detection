import 'package:flutter/material.dart';
import 'coordinate_translator.dart';
import '../models/pose_landmark.dart';
import '../models/pose_result.dart';
import '../models/posture_metrics.dart';

/// View mode for pose detection
enum ViewMode {
  front,
  side,
}

/// CustomPainter for drawing skeleton overlay on camera preview
class PosePainter extends CustomPainter {
  final PoseResult? pose;
  final ViewMode viewMode;
  final PostureMetrics? metrics;
  final double imageWidth;
  final double imageHeight;
  final bool showLandmarks;
  final bool showSkeleton;
  final bool showMetrics;

  // Skeleton connections for upper body
  static const _frontViewConnections = [
    // Face
    [PoseLandmarkType.leftEar, PoseLandmarkType.leftEye],
    [PoseLandmarkType.leftEye, PoseLandmarkType.nose],
    [PoseLandmarkType.nose, PoseLandmarkType.rightEye],
    [PoseLandmarkType.rightEye, PoseLandmarkType.rightEar],
    // Shoulders
    [PoseLandmarkType.leftShoulder, PoseLandmarkType.rightShoulder],
    // Arms
    [PoseLandmarkType.leftShoulder, PoseLandmarkType.leftElbow],
    [PoseLandmarkType.leftElbow, PoseLandmarkType.leftWrist],
    [PoseLandmarkType.rightShoulder, PoseLandmarkType.rightElbow],
    [PoseLandmarkType.rightElbow, PoseLandmarkType.rightWrist],
    // Neck (nose to shoulder midpoint - drawn separately)
  ];

  static const _sideViewConnections = [
    // Face
    [PoseLandmarkType.leftEar, PoseLandmarkType.leftEye],
    [PoseLandmarkType.leftEye, PoseLandmarkType.nose],
    // Or right side
    [PoseLandmarkType.rightEar, PoseLandmarkType.rightEye],
    [PoseLandmarkType.rightEye, PoseLandmarkType.nose],
    // Shoulder to elbow
    [PoseLandmarkType.leftShoulder, PoseLandmarkType.leftElbow],
    [PoseLandmarkType.rightShoulder, PoseLandmarkType.rightElbow],
  ];

  PosePainter({
    required this.pose,
    this.viewMode = ViewMode.front,
    this.metrics,
    required this.imageWidth,
    required this.imageHeight,
    this.showLandmarks = true,
    this.showSkeleton = true,
    this.showMetrics = true,
  });

  @override
  void paint(Canvas canvas, Size size) {
    if (pose == null || pose!.isEmpty) return;

    final translator = CoordinateTranslator(
      imageWidth: imageWidth,
      imageHeight: imageHeight,
      canvasWidth: size.width,
      canvasHeight: size.height,
      isMirrored: true, // Front camera
    );

    // Draw skeleton connections
    if (showSkeleton) {
      _drawSkeleton(canvas, translator);
    }

    // Draw landmark points
    if (showLandmarks) {
      _drawLandmarks(canvas, translator);
    }

    // Draw metrics visualization
    if (showMetrics && metrics != null) {
      _drawMetricsOverlay(canvas, size, translator);
    }
  }

  void _drawSkeleton(Canvas canvas, CoordinateTranslator translator) {
    final connections = viewMode == ViewMode.front 
        ? _frontViewConnections 
        : _sideViewConnections;

    final paint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3.0
      ..strokeCap = StrokeCap.round;

    for (final connection in connections) {
      final start = pose!.getLandmark(connection[0]);
      final end = pose!.getLandmark(connection[1]);

      if (start == null || end == null) continue;
      if (!start.isVisible || !end.isVisible) continue;

      // Color based on confidence
      final avgConfidence = (start.confidence + end.confidence) / 2;
      paint.color = _getConfidenceColor(avgConfidence).withOpacity(0.8);

      final startPoint = translator.translatePoint(start.x, start.y);
      final endPoint = translator.translatePoint(end.x, end.y);

      // Draw shadow/outline for better visibility on video
      final outlinePaint = Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = 5.0
        ..color = Colors.black.withOpacity(0.5)
        ..strokeCap = StrokeCap.round;
      canvas.drawLine(startPoint, endPoint, outlinePaint);

      // Draw main line
      canvas.drawLine(startPoint, endPoint, paint);
    }

    // Draw neck line (nose to sternum)
    _drawNeckLine(canvas, translator);
  }

  void _drawNeckLine(Canvas canvas, CoordinateTranslator translator) {
    final nose = pose!.getLandmark(PoseLandmarkType.nose);
    final sternum = pose!.sternum;

    if (nose == null || sternum == null) return;
    if (!nose.isVisible) return;

    final paint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 4.0
      ..strokeCap = StrokeCap.round;

    // Color based on neck bend quality
    if (metrics != null) {
      paint.color = _getQualityColor(metrics!.neckBendQuality);
    } else {
      paint.color = Colors.cyan;
    }

    final nosePoint = translator.translatePoint(nose.x, nose.y);
    final sternumPoint = translator.translatePoint(sternum.x, sternum.y);

    canvas.drawLine(nosePoint, sternumPoint, paint);
  }

  void _drawLandmarks(Canvas canvas, CoordinateTranslator translator) {
    final paint = Paint()..style = PaintingStyle.fill;

    for (final landmark in pose!.visibleLandmarks) {
      final point = translator.translatePoint(landmark.x, landmark.y);
      
      // Size based on landmark importance
      double radius = 6.0;
      if (landmark.type == PoseLandmarkType.nose ||
          landmark.type == PoseLandmarkType.leftShoulder ||
          landmark.type == PoseLandmarkType.rightShoulder) {
        radius = 10.0;
      } else if (landmark.type == PoseLandmarkType.leftEar ||
                 landmark.type == PoseLandmarkType.rightEar) {
        radius = 8.0;
      }

      // Outer glow
      paint.color = _getConfidenceColor(landmark.confidence).withOpacity(0.3);
      canvas.drawCircle(point, radius + 4, paint);

      // Inner solid
      paint.color = _getConfidenceColor(landmark.confidence);
      canvas.drawCircle(point, radius, paint);

      // Center dot
      paint.color = Colors.white;
      canvas.drawCircle(point, radius * 0.4, paint);
    }
  }

  void _drawMetricsOverlay(Canvas canvas, Size size, CoordinateTranslator translator) {
    // Draw shoulder alignment line
    _drawShoulderAlignmentGuide(canvas, size, translator);
    
    // Draw center line for torso tilt reference
    _drawCenterGuide(canvas, size);
  }

  void _drawShoulderAlignmentGuide(Canvas canvas, Size size, CoordinateTranslator translator) {
    final leftShoulder = pose!.getLandmark(PoseLandmarkType.leftShoulder);
    final rightShoulder = pose!.getLandmark(PoseLandmarkType.rightShoulder);

    if (leftShoulder == null || rightShoulder == null) return;

    final paint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0
      ..strokeCap = StrokeCap.round;

    // Draw ideal horizontal line through shoulders
    paint.color = Colors.white.withOpacity(0.3);
    final avgY = (leftShoulder.y + rightShoulder.y) / 2;
    final leftPoint = translator.translatePoint(0.1, avgY);
    final rightPoint = translator.translatePoint(0.9, avgY);
    
    // Dashed line effect
    final path = Path();
    path.moveTo(leftPoint.dx, leftPoint.dy);
    path.lineTo(rightPoint.dx, rightPoint.dy);
    
    canvas.drawPath(path, paint);
  }

  void _drawCenterGuide(Canvas canvas, Size size) {
    final paint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0
      ..color = Colors.white.withOpacity(0.2);

    // Draw vertical center line
    canvas.drawLine(
      Offset(size.width / 2, 0),
      Offset(size.width / 2, size.height),
      paint,
    );
  }

  Color _getConfidenceColor(double confidence) {
    if (confidence >= 0.8) return Colors.greenAccent;
    if (confidence >= 0.5) return Colors.yellowAccent;
    return Colors.redAccent;
  }

  Color _getQualityColor(PostureQuality quality) {
    switch (quality) {
      case PostureQuality.good:
        return const Color(0xFF4CAF50); // Green
      case PostureQuality.warning:
        return const Color(0xFFFFC107); // Yellow/Amber
      case PostureQuality.bad:
        return const Color(0xFFF44336); // Red
    }
  }

  @override
  bool shouldRepaint(PosePainter oldDelegate) {
    return oldDelegate.pose != pose ||
           oldDelegate.viewMode != viewMode ||
           oldDelegate.metrics != metrics;
  }
}
