import 'dart:ui' as ui;

/// Translates normalized pose coordinates (0-1) to canvas pixel coordinates
/// Handles aspect ratio differences between camera image and canvas
class CoordinateTranslator {
  final double imageWidth;
  final double imageHeight;
  final double canvasWidth;
  final double canvasHeight;
  final bool isMirrored;

  // Calculated values
  late final double _scaleX;
  late final double _scaleY;
  late final double _offsetX;
  late final double _offsetY;
  late final double _scale;

  CoordinateTranslator({
    required this.imageWidth,
    required this.imageHeight,
    required this.canvasWidth,
    required this.canvasHeight,
    this.isMirrored = true, // Front camera is usually mirrored
  }) {
    _calculateTransform();
  }

  void _calculateTransform() {
    // Calculate aspect ratios
    final imageAspect = imageWidth / imageHeight;
    final canvasAspect = canvasWidth / canvasHeight;

    // Fit image to canvas while maintaining aspect ratio (cover mode)
    if (imageAspect > canvasAspect) {
      // Image is wider - fit height, crop width
      _scale = canvasHeight / imageHeight;
      _scaleY = canvasHeight;
      _scaleX = imageWidth * _scale;
      _offsetX = (canvasWidth - _scaleX) / 2;
      _offsetY = 0;
    } else {
      // Image is taller - fit width, crop height
      _scale = canvasWidth / imageWidth;
      _scaleX = canvasWidth;
      _scaleY = imageHeight * _scale;
      _offsetX = 0;
      _offsetY = (canvasHeight - _scaleY) / 2;
    }
  }

  /// Translate normalized x coordinate (0-1) to canvas pixel x
  double translateX(double normalizedX) {
    double x = normalizedX * _scaleX + _offsetX;
    
    // Mirror for front camera
    if (isMirrored) {
      x = canvasWidth - x;
    }
    
    return x;
  }

  /// Translate normalized y coordinate (0-1) to canvas pixel y
  double translateY(double normalizedY) {
    return normalizedY * _scaleY + _offsetY;
  }

  /// Translate a normalized point to canvas coordinates
  ui.Offset translatePoint(double normalizedX, double normalizedY) {
    return ui.Offset(translateX(normalizedX), translateY(normalizedY));
  }

  /// Scale a distance from normalized to canvas pixels
  double scaleDistance(double normalizedDistance) {
    // Use the minimum scale to maintain proportions
    return normalizedDistance * (_scaleX < _scaleY ? _scaleX : _scaleY);
  }

  /// Get the effective drawing area on the canvas
  ui.Rect get drawingArea => ui.Rect.fromLTWH(_offsetX, _offsetY, _scaleX, _scaleY);

  /// Check if a point is within the visible canvas area
  bool isVisible(double normalizedX, double normalizedY) {
    final x = translateX(normalizedX);
    final y = translateY(normalizedY);
    return x >= 0 && x <= canvasWidth && y >= 0 && y <= canvasHeight;
  }
}
