import 'dart:async';
import 'dart:math' as math;
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
  int _activeStep = 1; // 1: Walk & Trace, 2: Fields & Rows Subdivision
  bool _isWalking = false;
  final List<Offset> _waypoints = [];
  double _calculatedAcreage = 0.0;
  double _calculatedHectares = 0.0;
  double _walkedDistanceM = 0.0;
  int _stepCount = 0;
  double _currentSpeedKmh = 0.0;
  double _compassHeading = 42.0;
  Timer? _walkTimer;
  double _currentLat = 30.9015;
  double _currentLon = 75.8575;
  final double _accuracy = 0.35; // RTK DGPS Sub-meter Lock

  // Subdivision Parameters
  int _selectedParcels = 4; // 1, 2, 4
  int _rowSpacingCm = 60; // 45, 60, 75, 90
  int _furrowOrientationDeg = 0; // 0 (N-S), 90 (E-W), 45 (Diagonal)
  String _selectedCrop = 'Wheat';

  final List<String> _cropOptions = [
    'Wheat',
    'Rice / Paddy',
    'Tomato',
    'Maize',
    'Potato',
    'Cotton',
    'Pisciculture',
  ];

  void _startWalk() {
    setState(() {
      _isWalking = true;
      _waypoints.clear();
      _calculatedAcreage = 0.0;
      _calculatedHectares = 0.0;
      _walkedDistanceM = 0.0;
      _stepCount = 0;
      _currentSpeedKmh = 4.2;
    });

    int tick = 0;
    _walkTimer = Timer.periodic(const Duration(milliseconds: 400), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      tick++;

      // Simulate walking around parcel boundary perimeter (approx 850 meters)
      double dx = 0, dy = 0;
      if (tick <= 8) {
        dx = 25.0 * tick;
        dy = 0;
        _compassHeading = 90.0;
      } else if (tick <= 16) {
        dx = 200.0;
        dy = 20.0 * (tick - 8);
        _compassHeading = 180.0;
      } else if (tick <= 24) {
        dx = 200.0 - 25.0 * (tick - 16);
        dy = 160.0;
        _compassHeading = 270.0;
      } else if (tick <= 32) {
        dx = 0;
        dy = 160.0 - 20.0 * (tick - 24);
        _compassHeading = 360.0;
      } else {
        timer.cancel();
        setState(() {
          _isWalking = false;
          _currentSpeedKmh = 0.0;
          _calculatedHectares = 5.86;
          _calculatedAcreage = 14.5;
          _walkedDistanceM = 824.0;
          _stepCount = 1120;
        });

        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('🎉 Boundary Loop Closed! 14.5 Acres (5.86 Ha) captured. Proceed to Subdivide Fields.'),
            backgroundColor: AppColors.success,
            duration: Duration(seconds: 4),
          ),
        );
        return;
      }

      setState(() {
        _waypoints.add(Offset(dx + 50, dy + 50));
        _currentLat += 0.00008 * math.cos(tick * 0.1);
        _currentLon += 0.00010 * math.sin(tick * 0.1);
        _stepCount += 35;
        _walkedDistanceM += 25.7;
        _calculatedAcreage = (_waypoints.length * 0.45).clamp(0.0, 14.5);
        _calculatedHectares = (_calculatedAcreage / 2.471);
      });
    });
  }

  void _stopWalk() {
    _walkTimer?.cancel();
    setState(() {
      _isWalking = false;
      _currentSpeedKmh = 0.0;
      if (_calculatedAcreage == 0 && _waypoints.isNotEmpty) {
        _calculatedAcreage = 14.5;
        _calculatedHectares = 5.86;
      }
    });
  }

  void _applyAndSaveConfiguration() {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          '🚀 3D Space Extruded! $_selectedParcels parcels with $_rowSpacingCm cm $_selectedCrop rows synthesized.',
        ),
        backgroundColor: AppColors.primaryDark,
      ),
    );
    Navigator.of(context).pop();
  }

  @override
  void dispose() {
    _walkTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0B132B),
      appBar: CommonAppBar(
        title: _activeStep == 1
            ? '📱 First-Time 3D Walk & Calibrate'
            : '🌾 In-Space Fields & Rows Subdivision',
        subtitle: _activeStep == 1
            ? 'Hold Phone & Walk to Generate 3D Space'
            : 'Subdivide Walked Space & Configure Furrows',
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Step Progress Indicator
            _buildStepIndicator(),
            const SizedBox(height: 16),

            if (_activeStep == 1) ...[
              // Telemetry Grid
              _buildTelemetryGrid(),
              const SizedBox(height: 16),

              // Live Radar Canvas
              _buildRadarCanvas(),
              const SizedBox(height: 16),

              // Walk Action Buttons
              if (!_isWalking) ...[
                CustomButton(
                  text: '🚶 Hold Phone & Start Perimeter Walk',
                  onPressed: _startWalk,
                ),
                if (_waypoints.isNotEmpty || _calculatedAcreage > 0) ...[
                  const SizedBox(height: 10),
                  CustomButton(
                    text: '➡️ Next: Subdivide Fields & Rows (${_calculatedAcreage.toStringAsFixed(1)} Ac)',
                    variant: ButtonVariant.secondary,
                    onPressed: () {
                      setState(() => _activeStep = 2);
                    },
                  ),
                ],
              ] else
                CustomButton(
                  text: '🛑 Stop & Close Boundary Loop',
                  variant: ButtonVariant.danger,
                  onPressed: _stopWalk,
                ),
            ] else ...[
              // STEP 2: FIELDS & ROWS CAD SUBDIVISION
              _buildSubdivisionControls(),
              const SizedBox(height: 20),

              Row(
                children: [
                  Expanded(
                    child: CustomButton(
                      text: '⬅ Back to Walk',
                      variant: ButtonVariant.outline,
                      onPressed: () => setState(() => _activeStep = 1),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    flex: 2,
                    child: CustomButton(
                      text: '🚀 Extrude 3D Farm Space',
                      onPressed: _applyAndSaveConfiguration,
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildStepIndicator() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF334155)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 11,
                backgroundColor: _activeStep >= 1 ? const Color(0xFF10B981) : Colors.grey,
                child: const Text('1', style: TextStyle(fontSize: 11, color: Colors.white, fontWeight: FontWeight.bold)),
              ),
              const SizedBox(width: 6),
              Text(
                '1. Walk Boundary',
                style: TextStyle(
                  color: _activeStep >= 1 ? const Color(0xFF34D399) : Colors.grey,
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
          const Icon(Icons.arrow_forward_ios, size: 12, color: Color(0xFF64748B)),
          Row(
            children: [
              CircleAvatar(
                radius: 11,
                backgroundColor: _activeStep == 2 ? const Color(0xFF10B981) : const Color(0xFF334155),
                child: const Text('2', style: TextStyle(fontSize: 11, color: Colors.white, fontWeight: FontWeight.bold)),
              ),
              const SizedBox(width: 6),
              Text(
                '2. Subdivide & Rows',
                style: TextStyle(
                  color: _activeStep == 2 ? const Color(0xFF34D399) : const Color(0xFF94A3B8),
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTelemetryGrid() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF0F172A), Color(0xFF1E293B)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFF10B981).withValues(alpha: 0.3)),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const StatusBadge(text: 'RTK DGPS ACTIVE', type: BadgeType.success),
              Text(
                'ACCURACY: ±${_accuracy}m',
                style: const TextStyle(color: Color(0xFF38BDF8), fontSize: 11, fontWeight: FontWeight.w800),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              _buildStatCell('DISTANCE WALKED', '${_walkedDistanceM.toStringAsFixed(0)} m', '$_stepCount Steps', const Color(0xFF38BDF8)),
              _buildStatCell('COMPUTED AREA', '${_calculatedAcreage.toStringAsFixed(2)} Ac', '${_calculatedHectares.toStringAsFixed(2)} Ha', const Color(0xFFF59E0B)),
              _buildStatCell('SPEED & HEADING', '${_currentSpeedKmh.toStringAsFixed(1)} km/h', '${_compassHeading.toStringAsFixed(0)}° N', const Color(0xFF10B981)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatCell(String title, String val, String sub, Color valColor) {
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 9, fontWeight: FontWeight.w700)),
          const SizedBox(height: 2),
          Text(val, style: TextStyle(color: valColor, fontSize: 14, fontWeight: FontWeight.w800)),
          Text(sub, style: const TextStyle(color: Color(0xFF64748B), fontSize: 10)),
        ],
      ),
    );
  }

  Widget _buildRadarCanvas() {
    return Container(
      height: 260,
      decoration: BoxDecoration(
        color: const Color(0xFF09101D),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF10B981).withValues(alpha: 0.25)),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: CustomPaint(
          painter: PrecisionRadarPainter(
            waypoints: _waypoints,
            isWalking: _isWalking,
            heading: _compassHeading,
          ),
        ),
      ),
    );
  }

  Widget _buildSubdivisionControls() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF334155)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.grid_view_rounded, color: Color(0xFF34D399), size: 20),
              const SizedBox(width: 8),
              Text(
                'Configuring ${_calculatedAcreage.toStringAsFixed(1)} Calibrated Acres',
                style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w800),
              ),
            ],
          ),
          const Divider(color: Color(0xFF334155), height: 24),

          // Number of Parcels
          const Text('PARCEL SUBDIVISION BLOCKS', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11, fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          Row(
            children: [1, 2, 4].map((num) {
              final isSel = _selectedParcels == num;
              return Expanded(
                child: GestureDetector(
                  onTap: () => setState(() => _selectedParcels = num),
                  child: Container(
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    decoration: BoxDecoration(
                      color: isSel ? const Color(0xFF059669) : const Color(0xFF1E293B),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: isSel ? const Color(0xFF34D399) : const Color(0xFF475569)),
                    ),
                    child: Center(
                      child: Text(
                        num == 1 ? '1 Unified' : (num == 2 ? '2 Blocks' : '4 Parcels'),
                        style: TextStyle(
                          color: isSel ? Colors.white : const Color(0xFF94A3B8),
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 16),

          // Furrow Row Pitch
          const Text('FURROW ROW PITCH / SPACING', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11, fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          Row(
            children: [45, 60, 75, 90].map((spacing) {
              final isSel = _rowSpacingCm == spacing;
              return Expanded(
                child: GestureDetector(
                  onTap: () => setState(() => _rowSpacingCm = spacing),
                  child: Container(
                    margin: const EdgeInsets.symmetric(horizontal: 3),
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    decoration: BoxDecoration(
                      color: isSel ? const Color(0xFF059669) : const Color(0xFF1E293B),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: isSel ? const Color(0xFF34D399) : const Color(0xFF475569)),
                    ),
                    child: Center(
                      child: Text(
                        '$spacing cm',
                        style: TextStyle(
                          color: isSel ? Colors.white : const Color(0xFF94A3B8),
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 16),

          // Furrow Orientation
          const Text('FURROW ORIENTATION ANGLE', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11, fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          DropdownButtonFormField<int>(
            value: _furrowOrientationDeg,
            dropdownColor: const Color(0xFF1E293B),
            style: const TextStyle(color: Colors.white, fontSize: 13),
            decoration: InputDecoration(
              filled: true,
              fillColor: const Color(0xFF1E293B),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: Color(0xFF475569))),
              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            ),
            items: const [
              DropdownMenuItem(value: 0, child: Text('0° True North-South (Solar Capture)')),
              DropdownMenuItem(value: 90, child: Text('90° East-West (Cross-Wind Protection)')),
              DropdownMenuItem(value: 45, child: Text('45° Diagonal Contour (Drainage Slope)')),
            ],
            onChanged: (val) {
              if (val != null) setState(() => _furrowOrientationDeg = val);
            },
          ),
          const SizedBox(height: 16),

          // Crop Type
          const Text('BOTANICAL CROP ASSIGNMENT', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11, fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          DropdownButtonFormField<String>(
            value: _selectedCrop,
            dropdownColor: const Color(0xFF1E293B),
            style: const TextStyle(color: Colors.white, fontSize: 13),
            decoration: InputDecoration(
              filled: true,
              fillColor: const Color(0xFF1E293B),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: Color(0xFF475569))),
              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            ),
            items: _cropOptions.map((crop) => DropdownMenuItem(value: crop, child: Text(crop))).toList(),
            onChanged: (val) {
              if (val != null) setState(() => _selectedCrop = val);
            },
          ),
        ],
      ),
    );
  }
}

class PrecisionRadarPainter extends CustomPainter {
  final List<Offset> waypoints;
  final bool isWalking;
  final double heading;

  PrecisionRadarPainter({
    required this.waypoints,
    required this.isWalking,
    required this.heading,
  });

  @override
  void paint(Canvas canvas, Size size) {
    // Concentric Radar Rings
    final center = Offset(size.width / 2, size.height / 2);
    final ringPaint = Paint()
      ..color = const Color(0xFF1E293B)
      ..strokeWidth = 1
      ..style = PaintingStyle.stroke;

    for (double r = 30; r < size.width / 2; r += 35) {
      canvas.drawCircle(center, r, ringPaint);
    }

    // Crosshairs
    canvas.drawLine(Offset(0, center.dy), Offset(size.width, center.dy), ringPaint);
    canvas.drawLine(Offset(center.dx, 0), Offset(center.dx, size.height), ringPaint);

    if (waypoints.isEmpty) return;

    // Walked Polygon Path
    final pathPaint = Paint()
      ..color = const Color(0xFF10B981)
      ..strokeWidth = 3
      ..style = PaintingStyle.stroke;

    final fillPaint = Paint()
      ..color = const Color(0xFF10B981).withValues(alpha: 0.18)
      ..style = PaintingStyle.fill;

    final p = Path()..moveTo(waypoints[0].dx, waypoints[0].dy);
    for (int i = 1; i < waypoints.length; i++) {
      p.lineTo(waypoints[i].dx, waypoints[i].dy);
    }

    canvas.drawPath(p, fillPaint);
    canvas.drawPath(p, pathPaint);

    // Start Waypoint (Blue)
    canvas.drawCircle(waypoints.first, 5, Paint()..color = const Color(0xFF38BDF8));

    // Active Head (Pulsing Green)
    final head = waypoints.last;
    canvas.drawCircle(head, 7, Paint()..color = const Color(0xFF34D399));
    canvas.drawCircle(
      head,
      14,
      Paint()
        ..color = const Color(0xFF34D399).withValues(alpha: 0.3)
        ..strokeWidth = 2
        ..style = PaintingStyle.stroke,
    );
  }

  @override
  bool shouldRepaint(covariant PrecisionRadarPainter oldDelegate) => true;
}
