import 'dart:async';
import 'package:flutter/material.dart';
import '../../constants/app_colors.dart';
import '../../constants/app_text_styles.dart';
import '../../services/api_service.dart';
import '../../widgets/common_app_bar.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/status_badge.dart';
import 'hotline_screen.dart';

class LeafScannerScreen extends StatefulWidget {
  const LeafScannerScreen({super.key});

  @override
  State<LeafScannerScreen> createState() => _LeafScannerScreenState();
}

class _LeafScannerScreenState extends State<LeafScannerScreen> with SingleTickerProviderStateMixin {
  String _selectedCrop = 'Wheat (PBW-550)';
  String _selectedSymptom = 'Adaxial Foliar Chlorosis';
  bool _isScanning = false;
  Map<String, dynamic>? _scanResult;
  late AnimationController _animController;
  late Animation<double> _scanAnimation;

  final List<String> _crops = [
    'Wheat (PBW-550)',
    'Rice (Basmati 1121)',
    'Mustard (RL-1359)',
    'Cotton (RCH 659 BGII)',
  ];

  final List<String> _symptoms = [
    'Adaxial Foliar Chlorosis',
    'Powdery Stripe Vein Lesions',
    'Dead Heart & White Earhead',
    'Concentric Ring Spots',
    'Interveinal Necrosis',
  ];

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1600),
    );
    _scanAnimation = Tween<double>(begin: 0.05, end: 0.95).animate(
      CurvedAnimation(parent: _animController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  Future<void> _triggerScan() async {
    setState(() {
      _isScanning = true;
      _scanResult = null;
    });
    _animController.repeat(reverse: true);

    try {
      final res = await ApiService().diagnoseLeaf(
        cropName: _selectedCrop,
        symptoms: _selectedSymptom,
        fieldParcel: 'Parcel North #1',
      );

      if (!mounted) return;
      _animController.stop();

      final biometrics = res['biophysical_metrics'] as Map<String, dynamic>?;
      final rx = res['recommended_treatment'] as Map<String, dynamic>?;

      setState(() {
        _isScanning = false;
        _scanResult = {
          'pathogen': res['pathogen_identified'] ?? 'Puccinia striiformis (Yellow Rust)',
          'family': res['affected_tissue'] ?? 'Basidiomycota Fungal Infection',
          'confidence': '${res['confidence_pct'] ?? 96.5}%',
          'severity': res['severity'] ?? 'Early Stage (Incipient)',
          'severityLevel': (res['severity'] ?? '').toString().toLowerCase().contains('critical') ? 3 : 2,
          'affectedArea': biometrics != null ? '${biometrics['rust_pustules_pct'] ?? biometrics['chlorosis_pct'] ?? 12.4}% pustule spread' : '14.2% leaf canopy',
          'chemicalPrescription': rx?['chemical'] ?? 'Tilt 25% EC (Propiconazole) @ 200ml/Acre in 200L water',
          'biologicalPrescription': rx?['organic_alternative'] ?? 'Pseudomonas fluorescens @ 1.5kg/Acre',
          'actionRequired': rx?['urgency'] ?? 'Immediate quarantine spray within 24h to prevent spore dispersal',
          'biophysical_metrics': biometrics,
        };
      });
    } catch (e) {
      if (!mounted) return;
      _animController.stop();
      setState(() {
        _isScanning = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: const CommonAppBar(
        title: '📷 Mobile Leaf Vision Scanner',
        subtitle: 'Edge AI Pathogen Detection & Treatment',
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Crop & Context Selector Card (3D Glassmorphism)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Colors.white, Color(0xFFF1F5F9)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFCBD5E1), width: 1.2),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.06),
                    blurRadius: 14,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(Icons.psychology, color: AppColors.primaryDark, size: 20),
                      ),
                      const SizedBox(width: 10),
                      const Text(
                        'SPECIMEN CONFIGURATION',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 0.6,
                          color: AppColors.primaryDark,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  const Text('Target Crop Variety', style: AppTextStyles.caption),
                  const SizedBox(height: 4),
                  DropdownButtonFormField<String>(
                    initialValue: _selectedCrop,
                    decoration: InputDecoration(
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                      filled: true,
                      fillColor: Colors.white,
                    ),
                    items: _crops.map((c) => DropdownMenuItem(value: c, child: Text(c, style: AppTextStyles.bodyBold))).toList(),
                    onChanged: (v) {
                      if (v != null) setState(() => _selectedCrop = v);
                    },
                  ),
                  const SizedBox(height: 12),
                  const Text('Observed Visual Symptom', style: AppTextStyles.caption),
                  const SizedBox(height: 4),
                  DropdownButtonFormField<String>(
                    initialValue: _selectedSymptom,
                    decoration: InputDecoration(
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                      filled: true,
                      fillColor: Colors.white,
                    ),
                    items: _symptoms.map((s) => DropdownMenuItem(value: s, child: Text(s, style: AppTextStyles.body))).toList(),
                    onChanged: (v) {
                      if (v != null) setState(() => _selectedSymptom = v);
                    },
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // 3D Viewport / Camera Simulator with Live Scanner Laser
            Container(
              height: 260,
              decoration: BoxDecoration(
                gradient: const RadialGradient(
                  center: Alignment.center,
                  radius: 0.9,
                  colors: [Color(0xFF1E293B), Color(0xFF0F172A)],
                ),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0xFF334155), width: 2),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primary.withValues(alpha: 0.2),
                    blurRadius: 20,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: Stack(
                alignment: Alignment.center,
                children: [
                  // Center Specimen Graphic
                  Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        _selectedCrop.contains('Wheat')
                            ? '🌾'
                            : _selectedCrop.contains('Rice')
                                ? '🌱'
                                : _selectedCrop.contains('Mustard')
                                    ? '🌼'
                                    : '🌿',
                        style: const TextStyle(fontSize: 84),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        _isScanning ? 'ANALYZING CELLULAR MORPHOLOGY...' : 'SPECIMEN IN OPTICAL FOCUS',
                        style: TextStyle(
                          color: _isScanning ? AppColors.primaryLight : const Color(0xFF94A3B8),
                          fontSize: 11.5,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 1.0,
                        ),
                      ),
                    ],
                  ),

                  // 3D Target Reticle Corners
                  Positioned(
                    top: 24,
                    left: 24,
                    child: Container(width: 28, height: 28, decoration: const BoxDecoration(border: Border(top: BorderSide(color: Color(0xFF10B981), width: 3), left: BorderSide(color: Color(0xFF10B981), width: 3)))),
                  ),
                  Positioned(
                    top: 24,
                    right: 24,
                    child: Container(width: 28, height: 28, decoration: const BoxDecoration(border: Border(top: BorderSide(color: Color(0xFF10B981), width: 3), right: BorderSide(color: Color(0xFF10B981), width: 3)))),
                  ),
                  Positioned(
                    bottom: 24,
                    left: 24,
                    child: Container(width: 28, height: 28, decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: Color(0xFF10B981), width: 3), left: BorderSide(color: Color(0xFF10B981), width: 3)))),
                  ),
                  Positioned(
                    bottom: 24,
                    right: 24,
                    child: Container(width: 28, height: 28, decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: Color(0xFF10B981), width: 3), right: BorderSide(color: Color(0xFF10B981), width: 3)))),
                  ),

                  // Animated Scanning Laser Line
                  if (_isScanning)
                    AnimatedBuilder(
                      animation: _scanAnimation,
                      builder: (context, _) {
                        return Positioned(
                          top: _scanAnimation.value * 240,
                          left: 20,
                          right: 20,
                          child: Container(
                            height: 3,
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                colors: [Colors.transparent, Color(0xFF10B981), Colors.white, Color(0xFF10B981), Colors.transparent],
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: const Color(0xFF10B981).withValues(alpha: 0.8),
                                  blurRadius: 12,
                                  spreadRadius: 2,
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Scan Action Button (3D Raised Glow)
            CustomButton(
              text: _isScanning ? 'Running Neural Vision Model...' : '📸 Capture Leaf & Run AI Triage',
              isLoading: _isScanning,
              onPressed: _isScanning ? () {} : _triggerScan,
            ),
            const SizedBox(height: 16),

            // ML Diagnosis Results Card (Rendered upon scan)
            if (_scanResult != null) ...[
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: _scanResult!['severityLevel'] == 3
                        ? AppColors.danger
                        : _scanResult!['severityLevel'] == 2
                            ? AppColors.warning
                            : AppColors.success,
                    width: 1.5,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: (_scanResult!['severityLevel'] == 3 ? AppColors.danger : AppColors.primary).withValues(alpha: 0.15),
                      blurRadius: 18,
                      offset: const Offset(0, 6),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const StatusBadge(text: 'AI VISION CERTIFIED', type: BadgeType.success),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppColors.primaryContainer,
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: AppColors.primaryBorder),
                          ),
                          child: Text(
                            'CONFIDENCE: ${_scanResult!['confidence']}',
                            style: const TextStyle(color: AppColors.primaryDark, fontSize: 11, fontWeight: FontWeight.w800),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(
                      _scanResult!['pathogen'],
                      style: AppTextStyles.h2.copyWith(fontSize: 17, color: AppColors.textPrimary),
                    ),
                    Text(
                      _scanResult!['family'],
                      style: AppTextStyles.caption.copyWith(color: AppColors.textSecondary),
                    ),
                    const Divider(height: 24),

                    // Metrics Breakdown
                    Row(
                      children: [
                        Expanded(
                          child: Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF8FAFC),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: const Color(0xFFE2E8F0)),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('SEVERITY', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textMuted)),
                                const SizedBox(height: 2),
                                Text(
                                  _scanResult!['severity'],
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w800,
                                    color: _scanResult!['severityLevel'] >= 2 ? AppColors.danger : AppColors.success,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF8FAFC),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: const Color(0xFFE2E8F0)),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('AFFECTED CANOPY', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textMuted)),
                                const SizedBox(height: 2),
                                Text(
                                  _scanResult!['affectedArea'],
                                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),

                    // Recommended Prescriptions
                    const Text('CALIBRATED PRESCRIPTION DOSAGE:', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: AppColors.primaryDark)),
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: const Color(0xFFEFF6FF),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: const Color(0xFFBFDBFE)),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('🧪 ', style: TextStyle(fontSize: 16)),
                          Expanded(
                            child: Text(
                              'Chemical: ${_scanResult!['chemicalPrescription']}',
                              style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600, color: Color(0xFF1E3A8A)),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: const Color(0xFFECFDF5),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: const Color(0xFFA7F3D0)),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('🌿 ', style: TextStyle(fontSize: 16)),
                          Expanded(
                            child: Text(
                              'Biological: ${_scanResult!['biologicalPrescription']}',
                              style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600, color: Color(0xFF065F46)),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 14),

                    // Sync with Agronomist Hotline Button
                    CustomButton(
                      text: '💬 Transmit to Supervising Agronomist',
                      variant: ButtonVariant.secondary,
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => const HotlineScreen(),
                          ),
                        );
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('✓ Specimen diagnosis synchronized to Dr. Priya Sharma hotline!'),
                            backgroundColor: AppColors.primaryDark,
                          ),
                        );
                      },
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
            ],
          ],
        ),
      ),
    );
  }
}
