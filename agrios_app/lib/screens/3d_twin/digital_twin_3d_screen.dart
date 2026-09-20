import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../../constants/app_colors.dart';
import '../../constants/app_text_styles.dart';
import '../../widgets/common_app_bar.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/status_badge.dart';
import 'walk_and_calibrate_screen.dart';

class DigitalTwin3dScreen extends StatefulWidget {
  const DigitalTwin3dScreen({super.key});

  @override
  State<DigitalTwin3dScreen> createState() => _DigitalTwin3dScreenState();
}

class _DigitalTwin3dScreenState extends State<DigitalTwin3dScreen> with SingleTickerProviderStateMixin {
  // 3D Viewport Transformations
  double _rotationAngle = 0.785; // 45 degrees
  double _tiltAngle = 0.65;     // pitch
  double _zoomScale = 1.0;
  Offset _panOffset = Offset.zero;

  // Simulation Time Horizon
  double _currentDay = 30.0;
  final double _maxDays = 120.0;

  // Plant Health Metrics
  int _healthyCount = 8420;
  int _stressedCount = 1140;
  int _deadCount = 180;

  // CAD-lite Edit Mode
  bool _isCadEditMode = false;
  String _cadTool = 'ROAD'; // 'ROAD' or 'FIELD'
  final List<Offset> _cadPoints = [];

  // Outbreak Beacons
  List<Map<String, dynamic>> _outbreaks = [
    {'day': 14, 'sector': 'South Nursery Plot', 'pest': 'Aphis gossypii (Aphid Colony)', 'color': Colors.amber},
    {'day': 30, 'sector': 'North Sector Farm', 'pest': 'Spodoptera frugiperda (Fall Armyworm)', 'color': Colors.red},
    {'day': 48, 'sector': 'East Cereal Field', 'pest': 'Puccinia striiformis (Yellow Rust)', 'color': Colors.pink},
    {'day': 72, 'sector': 'Central Irrigated Plot', 'pest': 'Scirpophaga incertulas (Stem Borer)', 'color': Colors.deepOrange},
    {'day': 95, 'sector': 'West Field Parcel', 'pest': 'Tilletia indica (Kernel Smut)', 'color': Colors.purple},
  ];

  // Selected Parcel Inspector
  Map<String, dynamic>? _selectedParcel;

  late AnimationController _fishAnim;

  @override
  void initState() {
    super.initState();
    _fishAnim = AnimationController(vsync: this, duration: const Duration(seconds: 2))..repeat();
    _recalculatePlantHealth();
  }

  @override
  void dispose() {
    _fishAnim.dispose();
    super.dispose();
  }

  void _recalculatePlantHealth() {
    final dayInt = _currentDay.toInt();
    // Plant counts shift as days advance and diseases peak
    final total = 9740;
    int dead = (dayInt * 2.2).toInt();
    int stressed = ((math.sin(dayInt / 10.0) + 1.0) * 800 + 400).toInt();
    if (dayInt >= 28 && dayInt <= 35) stressed += 1200; // Day 30 outbreak spike
    int healthy = total - stressed - dead;

    setState(() {
      _healthyCount = healthy.clamp(1000, 9740);
      _stressedCount = stressed.clamp(0, 5000);
      _deadCount = dead.clamp(0, 3000);
    });
  }

  void _randomizeOutbreaks() {
    final rng = math.Random();
    setState(() {
      _outbreaks = [
        {'day': rng.nextInt(20) + 10, 'sector': 'South Nursery Plot', 'pest': 'Aphid Bio-Vector', 'color': Colors.amber},
        {'day': rng.nextInt(20) + 30, 'sector': 'North Sector Farm', 'pest': 'Fall Armyworm Bio-Risk', 'color': Colors.red},
        {'day': rng.nextInt(20) + 50, 'sector': 'East Cereal Field', 'pest': 'Foliar Stripe Rust Blight', 'color': Colors.pink},
        {'day': rng.nextInt(20) + 70, 'sector': 'Central Irrigated Plot', 'pest': 'Yellow Stem Borer Larvae', 'color': Colors.deepOrange},
        {'day': rng.nextInt(20) + 90, 'sector': 'West Field Parcel', 'pest': 'Kernel Smut Head Blight', 'color': Colors.purple},
      ];
    });
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('🎲 Outbreak beacons randomized across crop cycle!'), backgroundColor: AppColors.primary),
    );
  }

  void _setCameraPreset(String preset) {
    setState(() {
      switch (preset) {
        case 'TOP':
          _rotationAngle = 0.0;
          _tiltAngle = 1.4;
          _zoomScale = 0.85;
          _panOffset = Offset.zero;
          break;
        case 'ISO':
          _rotationAngle = 0.785;
          _tiltAngle = 0.65;
          _zoomScale = 1.0;
          _panOffset = Offset.zero;
          break;
        case 'NORTH':
          _rotationAngle = 0.2;
          _tiltAngle = 0.55;
          _zoomScale = 1.35;
          _panOffset = const Offset(-40, 50);
          break;
        case 'SILO':
          _rotationAngle = 1.2;
          _tiltAngle = 0.6;
          _zoomScale = 1.4;
          _panOffset = const Offset(60, -30);
          break;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A), // Modern 3D CAD Dark Canvas
      appBar: CommonAppBar(
        title: '🌐 3D Digital Twin Farm World',
        subtitle: 'Ludhiana Model Farm (14.2 Ha) • Living Agricultural Twin',
        actions: [
          IconButton(
            icon: const Icon(Icons.pin_drop, color: Colors.white),
            tooltip: 'GPS Walk & Calibrate',
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const WalkAndCalibrateScreen()),
            ),
          ),
          IconButton(
            icon: Icon(
              _isCadEditMode ? Icons.check_circle : Icons.edit_road,
              color: _isCadEditMode ? AppColors.primaryLight : Colors.white,
            ),
            tooltip: 'CAD Edit Farm Mode',
            onPressed: () {
              setState(() {
                _isCadEditMode = !_isCadEditMode;
                _cadPoints.clear();
              });
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(_isCadEditMode ? '✏️ CAD Edit Mode ACTIVE: Tap canvas to draw $_cadTool' : 'CAD Mode Closed.'),
                  backgroundColor: AppColors.primaryDark,
                ),
              );
            },
          ),
        ],
      ),
      body: Stack(
        children: [
          // 1. Interactive 3D Canvas
          GestureDetector(
            onScaleUpdate: (details) {
              setState(() {
                if (details.pointerCount == 1 && !_isCadEditMode) {
                  _rotationAngle += details.focalPointDelta.dx * 0.008;
                  _tiltAngle = (_tiltAngle - details.focalPointDelta.dy * 0.006).clamp(0.2, 1.45);
                } else if (details.pointerCount >= 2) {
                  _zoomScale = (_zoomScale * details.scale).clamp(0.5, 2.8);
                } else if (_isCadEditMode) {
                  _panOffset += details.focalPointDelta;
                }
              });
            },
            onTapUp: (details) {
              if (_isCadEditMode) {
                setState(() {
                  _cadPoints.add(details.localPosition - _panOffset);
                });
              } else {
                // Interactive parcel selection
                setState(() {
                  _selectedParcel = {
                    'name': 'North Sector Farm (Parcel #1)',
                    'crop': 'Wheat (PBW-550)',
                    'stage': 'Tillering & Crown Root (Stage 2)',
                    'area': '4.8 Hectares',
                    'soilMoisture': '26.4% (TDR nominal)',
                    'ndvi': '0.78 (Optimal Vigor)',
                    'gdd': '412°C Day Accumulation',
                    'status': _currentDay >= 28 && _currentDay <= 35 ? 'CRITICAL PEST ALERT' : 'HEALTHY NOMINAL',
                  };
                });
              }
            },
            child: CustomPaint(
              size: Size.infinite,
              painter: Farm3dPainter(
                rotation: _rotationAngle,
                tilt: _tiltAngle,
                zoom: _zoomScale,
                pan: _panOffset,
                currentDay: _currentDay,
                cadPoints: _cadPoints,
                cadTool: _cadTool,
                isCadMode: _isCadEditMode,
                outbreaks: _outbreaks,
                fishPulse: _fishAnim.value,
              ),
            ),
          ),

          // 2. Top HUD: Plant Health Counters & Biosecurity Status
          Positioned(
            top: 12,
            left: 12,
            right: 12,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: const Color(0xFF1E293B).withValues(alpha: 0.92),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFF334155)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.4),
                    blurRadius: 16,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _buildHudBadge('HEALTHY', '$_healthyCount', const Color(0xFF10B981)),
                  _buildHudBadge('STRESSED', '$_stressedCount', const Color(0xFFF59E0B)),
                  _buildHudBadge('DEAD', '$_deadCount', const Color(0xFFEF4444)),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: (_currentDay >= 28 && _currentDay <= 35)
                          ? const Color(0xFF991B1B)
                          : const Color(0xFF065F46),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      _currentDay >= 28 && _currentDay <= 35 ? '⚠️ BIO-RISK' : '✓ 98.2% HEALTH',
                      style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w800),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // 3. Camera Angle Quick Presets
          Positioned(
            top: 76,
            right: 12,
            child: Column(
              children: [
                _buildCameraPresetBtn('ISO', '45°', () => _setCameraPreset('ISO')),
                const SizedBox(height: 6),
                _buildCameraPresetBtn('TOP', '⬇️', () => _setCameraPreset('TOP')),
                const SizedBox(height: 6),
                _buildCameraPresetBtn('N', '🌾', () => _setCameraPreset('NORTH')),
                const SizedBox(height: 6),
                _buildCameraPresetBtn('SILO', '🏛️', () => _setCameraPreset('SILO')),
              ],
            ),
          ),

          // 4. CAD Mode Floating Dock (Active during edit mode)
          if (_isCadEditMode)
            Positioned(
              top: 76,
              left: 12,
              child: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color(0xFF1E293B).withValues(alpha: 0.95),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.primaryLight),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('CAD DRAWING', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w800)),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        ChoiceChip(
                          label: const Text('Road', style: TextStyle(fontSize: 11)),
                          selected: _cadTool == 'ROAD',
                          onSelected: (_) => setState(() => _cadTool = 'ROAD'),
                        ),
                        const SizedBox(width: 4),
                        ChoiceChip(
                          label: const Text('Field', style: TextStyle(fontSize: 11)),
                          selected: _cadTool == 'FIELD',
                          onSelected: (_) => setState(() => _cadTool = 'FIELD'),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Points: ${_cadPoints.length}',
                      style: const TextStyle(color: Colors.white70, fontSize: 11),
                    ),
                    const SizedBox(height: 6),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        minimumSize: Size.zero,
                      ),
                      onPressed: () {
                        setState(() => _cadPoints.clear());
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('✓ CAD geometry committed to God Database!'), backgroundColor: AppColors.success),
                        );
                      },
                      child: const Text('Save CAD', style: TextStyle(fontSize: 11, color: Colors.white)),
                    ),
                  ],
                ),
              ),
            ),

          // 5. Selected Parcel Detail Inspector
          if (_selectedParcel != null && !_isCadEditMode)
            Positioned(
              bottom: 96,
              left: 14,
              right: 14,
              child: Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFF1E293B).withValues(alpha: 0.96),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFF475569)),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.5),
                      blurRadius: 20,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          _selectedParcel!['name'],
                          style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w800),
                        ),
                        IconButton(
                          icon: const Icon(Icons.close, color: Colors.white70, size: 18),
                          padding: EdgeInsets.zero,
                          constraints: const BoxConstraints(),
                          onPressed: () => setState(() => _selectedParcel = null),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        _buildInspectorPill('CROP: ${_selectedParcel!['crop']}', const Color(0xFF38BDF8)),
                        const SizedBox(width: 6),
                        _buildInspectorPill('AREA: ${_selectedParcel!['area']}', const Color(0xFF34D399)),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text('Stage: ${_selectedParcel!['stage']}', style: const TextStyle(color: Colors.white70, fontSize: 11.5)),
                    Text('Soil Hydrology: ${_selectedParcel!['soilMoisture']}', style: const TextStyle(color: Colors.white70, fontSize: 11.5)),
                    Text('Foliar Spectral NDVI: ${_selectedParcel!['ndvi']}', style: const TextStyle(color: Colors.white70, fontSize: 11.5)),
                  ],
                ),
              ),
            ),

          // 6. Bottom Time Slider Horizon & Outbreak Randomizer
          Positioned(
            bottom: 12,
            left: 12,
            right: 12,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: const Color(0xFF1E293B).withValues(alpha: 0.94),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFF334155)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.5),
                    blurRadius: 18,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.calendar_month, color: AppColors.primaryLight, size: 16),
                          const SizedBox(width: 6),
                          Text(
                            'CROP CYCLE HORIZON: DAY ${_currentDay.toInt()} / ${_maxDays.toInt()}',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 11.5,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ],
                      ),
                      ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF334155),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          minimumSize: Size.zero,
                        ),
                        icon: const Text('🎲', style: TextStyle(fontSize: 12)),
                        label: const Text('Randomize', style: TextStyle(fontSize: 11)),
                        onPressed: _randomizeOutbreaks,
                      ),
                    ],
                  ),
                  SliderTheme(
                    data: SliderTheme.of(context).copyWith(
                      activeTrackColor: AppColors.primary,
                      inactiveTrackColor: const Color(0xFF475569),
                      thumbColor: AppColors.primaryLight,
                      overlayColor: AppColors.primary.withValues(alpha: 0.2),
                      trackHeight: 4,
                    ),
                    child: Slider(
                      value: _currentDay,
                      min: 1.0,
                      max: _maxDays,
                      divisions: 119,
                      onChanged: (val) {
                        setState(() {
                          _currentDay = val;
                          _recalculatePlantHealth();
                        });
                      },
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHudBadge(String label, String value, Color color) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(label, style: TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: color)),
        Text(value, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: Colors.white)),
      ],
    );
  }

  Widget _buildCameraPresetBtn(String label, String icon, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 38,
        height: 38,
        decoration: BoxDecoration(
          color: const Color(0xFF1E293B).withValues(alpha: 0.9),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: const Color(0xFF475569)),
        ),
        alignment: Alignment.center,
        child: Text(icon, style: const TextStyle(fontSize: 16)),
      ),
    );
  }

  Widget _buildInspectorPill(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Text(text, style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.w700)),
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// 3D Isometric Agricultural World Custom Painter
// ═══════════════════════════════════════════════════════════════
class Farm3dPainter extends CustomPainter {
  final double rotation;
  final double tilt;
  final double zoom;
  final Offset pan;
  final double currentDay;
  final List<Offset> cadPoints;
  final String cadTool;
  final bool isCadMode;
  final List<Map<String, dynamic>> outbreaks;
  final double fishPulse;

  Farm3dPainter({
    required this.rotation,
    required this.tilt,
    required this.zoom,
    required this.pan,
    required this.currentDay,
    required this.cadPoints,
    required this.cadTool,
    required this.isCadMode,
    required this.outbreaks,
    required this.fishPulse,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2) + pan;

    // Helper: 3D to 2D Isometric Projection
    Offset project(double x, double y, double z) {
      final cosR = math.cos(rotation);
      final sinR = math.sin(rotation);
      final xRot = x * cosR - y * sinR;
      final yRot = x * sinR + y * cosR;

      final cosT = math.cos(tilt);
      final sinT = math.sin(tilt);
      final yTilt = yRot * cosT - z * sinT;

      return Offset(
        center.dx + xRot * zoom,
        center.dy + yTilt * zoom,
      );
    }

    // 1. Terrain Base (Ludhiana Farm Soil)
    final terrainPaint = Paint()
      ..color = const Color(0xFF3B2F2F)
      ..style = PaintingStyle.fill;
    final terrainBorder = Paint()
      ..color = const Color(0xFF5D4037)
      ..strokeWidth = 2
      ..style = PaintingStyle.stroke;

    final t0 = project(-180, -180, 0);
    final t1 = project(180, -180, 0);
    final t2 = project(180, 180, 0);
    final t3 = project(-180, 180, 0);

    final terrainPath = Path()..moveTo(t0.dx, t0.dy)..lineTo(t1.dx, t1.dy)..lineTo(t2.dx, t2.dy)..lineTo(t3.dx, t3.dy)..close();
    canvas.drawPath(terrainPath, terrainPaint);
    canvas.drawPath(terrainPath, terrainBorder);

    // 2. North Sector Cereal Field (Wheat PBW-550)
    final northFieldPaint = Paint()
      ..color = currentDay >= 28 && currentDay <= 35
          ? const Color(0xFFB45309) // Stressed amber during outbreak
          : const Color(0xFF15803D); // Lush green
    final n0 = project(-160, -160, 2);
    final n1 = project(-20, -160, 2);
    final n2 = project(-20, -20, 2);
    final n3 = project(-160, -20, 2);
    final northPath = Path()..moveTo(n0.dx, n0.dy)..lineTo(n1.dx, n1.dy)..lineTo(n2.dx, n2.dy)..lineTo(n3.dx, n3.dy)..close();
    canvas.drawPath(northPath, northFieldPaint);

    // Crop Furrows in North Field
    final furrowPaint = Paint()..color = const Color(0xFF166534)..strokeWidth = 1.2;
    for (double fy = -150; fy < -30; fy += 18) {
      final fp0 = project(-155, fy, 3);
      final fp1 = project(-25, fy, 3);
      canvas.drawLine(fp0, fp1, furrowPaint);
    }

    // 3. East Cereal Field (Basmati Rice)
    final eastPaint = Paint()..color = const Color(0xFF16A34A);
    final e0 = project(20, -160, 2);
    final e1 = project(160, -160, 2);
    final e2 = project(160, -20, 2);
    final e3 = project(20, -20, 2);
    final eastPath = Path()..moveTo(e0.dx, e0.dy)..lineTo(e1.dx, e1.dy)..lineTo(e2.dx, e2.dy)..lineTo(e3.dx, e3.dy)..close();
    canvas.drawPath(eastPath, eastPaint);

    // 4. Central Irrigated Plot
    final centralPaint = Paint()..color = const Color(0xFF22C55E);
    final c0 = project(-70, 20, 2);
    final c1 = project(70, 20, 2);
    final c2 = project(70, 160, 2);
    final c3 = project(-70, 160, 2);
    final centralPath = Path()..moveTo(c0.dx, c0.dy)..lineTo(c1.dx, c1.dy)..lineTo(c2.dx, c2.dy)..lineTo(c3.dx, c3.dy)..close();
    canvas.drawPath(centralPath, centralPaint);

    // 5. South Nursery Plot — Aquaculture Pond with Jumping Fish
    final pondPaint = Paint()..color = const Color(0xFF0284C7);
    final p0 = project(-160, 30, 2);
    final p1 = project(-90, 30, 2);
    final p2 = project(-90, 150, 2);
    final p3 = project(-160, 150, 2);
    final pondPath = Path()..moveTo(p0.dx, p0.dy)..lineTo(p1.dx, p1.dy)..lineTo(p2.dx, p2.dy)..lineTo(p3.dx, p3.dy)..close();
    canvas.drawPath(pondPath, pondPaint);

    // Jumping Fish Particle
    final fishZ = math.sin(fishPulse * math.pi) * 22;
    final fishPos = project(-125, 90, fishZ);
    canvas.drawCircle(fishPos, 3.5, Paint()..color = const Color(0xFFF97316));

    // 6. Farm Road Network (T-Junction)
    final roadPaint = Paint()..color = const Color(0xFF94A3B8)..strokeWidth = 8 * zoom;
    final r0 = project(0, -180, 2.5);
    final r1 = project(0, 180, 2.5);
    final r2 = project(-180, 0, 2.5);
    final r3 = project(180, 0, 2.5);
    canvas.drawLine(r0, r1, roadPaint);
    canvas.drawLine(r2, r3, roadPaint);

    // 7. Architectural 3D Buildings
    // Grain Silo (Cylinder Prism)
    _draw3dPrism(canvas, project, 110, 50, 20, 20, 45, const Color(0xFFCBD5E1), const Color(0xFF64748B));
    // Polyhouse Greenhouse
    _draw3dPrism(canvas, project, 100, 100, 35, 25, 20, const Color(0xFFE2E8F0), const Color(0xFF38BDF8));
    // Farm Management Office
    _draw3dPrism(canvas, project, -15, -15, 30, 30, 18, const Color(0xFFFEF3C7), const Color(0xFFD97706));

    // 8. Dynamic Multi-Day Disease Outbreak Beacons
    for (final b in outbreaks) {
      if ((currentDay - (b['day'] as int)).abs() < 5) {
        final pos = project(-90, -90, 4);
        final beaconPaint = Paint()
          ..color = (b['color'] as Color).withValues(alpha: 0.85)
          ..style = PaintingStyle.fill;
        canvas.drawCircle(pos, 8 * zoom, beaconPaint);
        canvas.drawCircle(pos, (14 + math.sin(fishPulse * 6) * 4) * zoom, beaconPaint..style = PaintingStyle.stroke..strokeWidth = 2);
      }
    }

    // 9. CAD Mode Points & Lines
    if (isCadMode && cadPoints.length >= 2) {
      final cadLinePaint = Paint()
        ..color = cadTool == 'ROAD' ? Colors.amber : Colors.cyan
        ..strokeWidth = 3
        ..style = PaintingStyle.stroke;
      final p = Path()..moveTo(cadPoints[0].dx, cadPoints[0].dy);
      for (int i = 1; i < cadPoints.length; i++) {
        p.lineTo(cadPoints[i].dx, cadPoints[i].dy);
      }
      canvas.drawPath(p, cadLinePaint);
    }
  }

  void _draw3dPrism(
    Canvas canvas,
    Offset Function(double, double, double) project,
    double x,
    double y,
    double w,
    double d,
    double h,
    Color topColor,
    Color sideColor,
  ) {
    final b0 = project(x, y, 0);
    final b1 = project(x + w, y, 0);
    final b2 = project(x + w, y + d, 0);
    final b3 = project(x, y + d, 0);

    final t0 = project(x, y, h);
    final t1 = project(x + w, y, h);
    final t2 = project(x + w, y + d, h);
    final t3 = project(x, y + d, h);

    // Front Side
    final frontPath = Path()..moveTo(b3.dx, b3.dy)..lineTo(b2.dx, b2.dy)..lineTo(t2.dx, t2.dy)..lineTo(t3.dx, t3.dy)..close();
    canvas.drawPath(frontPath, Paint()..color = sideColor);

    // Right Side
    final rightPath = Path()..moveTo(b2.dx, b2.dy)..lineTo(b1.dx, b1.dy)..lineTo(t1.dx, t1.dy)..lineTo(t2.dx, t2.dy)..close();
    canvas.drawPath(rightPath, Paint()..color = sideColor.withValues(alpha: 0.8));

    // Roof Top
    final topPath = Path()..moveTo(t0.dx, t0.dy)..lineTo(t1.dx, t1.dy)..lineTo(t2.dx, t2.dy)..lineTo(t3.dx, t3.dy)..close();
    canvas.drawPath(topPath, Paint()..color = topColor);
  }

  @override
  bool shouldRepaint(covariant Farm3dPainter oldDelegate) => true;
}
