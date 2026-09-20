import 'dart:async';
import 'package:flutter/material.dart';
import '../../constants/app_colors.dart';
import '../../constants/app_text_styles.dart';
import '../../widgets/common_app_bar.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/status_badge.dart';

class WalkAndCalibrateScreen extends StatefulWidget {
  const WalkAndCalibrateScreen({super.key});

  @override
  State<WalkAndCalibrateScreen> createState() => _WalkAndCalibrateScreenState();
}

class _WalkAndCalibrateScreenState extends State<WalkAndCalibrateScreen> {
  bool _isWalking = false;
  final List<Offset> _waypoints = [];
  double _calculatedAcreage = 0.0;
  Timer? _walkTimer;
  double _currentLat = 30.9010;
  double _currentLon = 75.8573;
  double _accuracy = 0.35; // Trimble TDC600 sub-meter lock

  void _startWalk() {
    setState(() {
      _isWalking = true;
      _waypoints.clear();
      _calculatedAcreage = 0.0;
    });

    int step = 0;
    _walkTimer = Timer.periodic(const Duration(milliseconds: 600), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      step++;
      // Simulate walking around parcel boundary
      double dx = 0, dy = 0;
      if (step <= 5) {
        dx = 40.0 * step;
        dy = 0;
      } else if (step <= 10) {
        dx = 200.0;
        dy = 30.0 * (step - 5);
      } else if (step <= 15) {
        dx = 200.0 - 40.0 * (step - 10);
        dy = 150.0;
      } else if (step <= 20) {
        dx = 0;
        dy = 150.0 - 30.0 * (step - 15);
      } else {
        timer.cancel();
        setState(() {
          _isWalking = false;
          _calculatedAcreage = 4.82;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('✓ Boundary Walk Closed! Calculated Acreage: 4.82 Hectares (11.9 Acres). Committed to Version v2.'),
            backgroundColor: AppColors.success,
          ),
        );
        return;
      }

      setState(() {
        _waypoints.add(Offset(dx + 50, dy + 50));
        _currentLat += 0.0001;
        _currentLon += 0.00015;
        _calculatedAcreage = (_waypoints.length * 0.24).clamp(0.0, 4.82);
      });
    });
  }

  void _stopWalk() {
    _walkTimer?.cancel();
    setState(() => _isWalking = false);
  }

  @override
  void dispose() {
    _walkTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: const CommonAppBar(
        title: '🚶 Walk-and-Calibrate Boundary',
        subtitle: 'In-Situ GNSS Boundary Walking & Acreage Lock',
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Trimble GNSS Geotagger Status Box
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF1E293B), Color(0xFF0F172A)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFF334155)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.3),
                    blurRadius: 14,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const StatusBadge(text: 'TRIMBLE TDC600 LOCKED', type: BadgeType.success),
                      Text(
                        'PRECISION: ±${_accuracy}m',
                        style: const TextStyle(color: Color(0xFF38BDF8), fontSize: 11, fontWeight: FontWeight.w800),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('LATITUDE', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 10, fontWeight: FontWeight.w700)),
                            Text('$_currentLat° N', style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w700)),
                          ],
                        ),
                      ),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('LONGITUDE', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 10, fontWeight: FontWeight.w700)),
                            Text('$_currentLon° E', style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w700)),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Live Boundary Canvas
            Container(
              height: 250,
              decoration: BoxDecoration(
                color: const Color(0xFF1E293B),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFF475569)),
              ),
              child: CustomPaint(
                painter: WalkBoundaryPainter(waypoints: _waypoints, isWalking: _isWalking),
              ),
            ),
            const SizedBox(height: 16),

            // Acreage & Waypoint Stats
            Row(
              children: [
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('WAYPOINTS RECORDED', style: AppTextStyles.caption),
                        const SizedBox(height: 2),
                        Text('${_waypoints.length}', style: AppTextStyles.h2.copyWith(color: AppColors.primaryDark)),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('CALCULATED AREA', style: AppTextStyles.caption),
                        const SizedBox(height: 2),
                        Text('${_calculatedAcreage.toStringAsFixed(2)} Ha', style: AppTextStyles.h2.copyWith(color: AppColors.primary)),
                      ],
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Action Buttons
            if (!_isWalking)
              CustomButton(
                text: '🚶 Start GPS Perimeter Walk',
                onPressed: _startWalk,
              )
            else
              CustomButton(
                text: '🛑 Stop & Finalize Boundary',
                variant: ButtonVariant.danger,
                onPressed: _stopWalk,
              ),
          ],
        ),
      ),
    );
  }
}

class WalkBoundaryPainter extends CustomPainter {
  final List<Offset> waypoints;
  final bool isWalking;

  WalkBoundaryPainter({required this.waypoints, required this.isWalking});

  @override
  void paint(Canvas canvas, Size size) {
    // Grid Lines
    final gridPaint = Paint()..color = const Color(0xFF334155)..strokeWidth = 0.8;
    for (double x = 0; x < size.width; x += 25) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), gridPaint);
    }
    for (double y = 0; y < size.height; y += 25) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), gridPaint);
    }

    if (waypoints.isEmpty) return;

    final pathPaint = Paint()
      ..color = const Color(0xFF10B981)
      ..strokeWidth = 3
      ..style = PaintingStyle.stroke;

    final fillPaint = Paint()
      ..color = const Color(0xFF10B981).withValues(alpha: 0.15)
      ..style = PaintingStyle.fill;

    final p = Path()..moveTo(waypoints[0].dx, waypoints[0].dy);
    for (int i = 1; i < waypoints.length; i++) {
      p.lineTo(waypoints[i].dx, waypoints[i].dy);
    }

    canvas.drawPath(p, fillPaint);
    canvas.drawPath(p, pathPaint);

    // Waypoint dots
    final dotPaint = Paint()..color = Colors.white;
    for (final pt in waypoints) {
      canvas.drawCircle(pt, 3, dotPaint);
    }

    // Active position
    if (waypoints.isNotEmpty) {
      canvas.drawCircle(waypoints.last, 6, Paint()..color = Colors.orangeAccent);
    }
  }

  @override
  bool shouldRepaint(covariant WalkBoundaryPainter oldDelegate) => true;
}
