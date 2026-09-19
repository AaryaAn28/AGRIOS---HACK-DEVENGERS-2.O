import 'package:flutter/material.dart';
import '../../constants/app_colors.dart';
import '../../constants/app_text_styles.dart';
import '../../models/ground_truth_model.dart';
import '../../services/api_service.dart';
import '../../widgets/common_app_bar.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/status_badge.dart';
import '../reports/official_reports_screen.dart';

class GroundTruthScreen extends StatefulWidget {
  const GroundTruthScreen({super.key});

  @override
  State<GroundTruthScreen> createState() => _GroundTruthScreenState();
}

class _GroundTruthScreenState extends State<GroundTruthScreen> {
  List<GroundTruthModel> _logs = [];
  bool _isLoading = true;

  final _parcelController = TextEditingController(text: 'Parcel North #1');
  final _cropController = TextEditingController(text: 'Wheat (PBW-550)');
  double _soilMoisture = 26.5;
  String _weedInfestation = 'Low (<5%)';
  String _canopyCover = '92%';
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    _loadLogs();
  }

  @override
  void dispose() {
    _parcelController.dispose();
    _cropController.dispose();
    super.dispose();
  }

  Future<void> _loadLogs() async {
    setState(() => _isLoading = true);
    final logs = await ApiService().getGroundTruthLogs();
    if (mounted) {
      setState(() {
        _logs = logs;
        _isLoading = false;
      });
    }
  }

  Future<void> _handleSubmitObservation() async {
    setState(() => _isSubmitting = true);
    final payload = {
      'farm_id': 'farm-pb-001',
      'field_parcel': _parcelController.text.trim(),
      'crop': _cropController.text.trim(),
      'soil_moisture_pct': _soilMoisture,
      'weed_infestation': _weedInfestation,
      'canopy_coverage': _canopyCover,
      'nitrogen_status': 'Optimal',
      'notes': 'Logged via AGRIOS Android Mobile App.',
      'gps_lat': 30.9010,
      'gps_lon': 75.8573,
    };

    final res = await ApiService().submitGroundTruth(payload);
    setState(() => _isSubmitting = false);

    if (mounted) {
      final ml = res['ml_evaluation'] as Map<String, dynamic>?;
      final score = ml?['composite_stress_score'] ?? 22.0;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('✓ Ground Truth Logged! ML Stress Index: $score/100 (Optimal)'),
          backgroundColor: AppColors.success,
        ),
      );
      _loadLogs();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: CommonAppBar(
        title: 'Ground Truth Telemetry',
        subtitle: 'In-Situ Sensors & ML Crop Stress Verification',
        actions: [
          IconButton(
            icon: const Icon(Icons.description_outlined, color: Colors.white),
            tooltip: 'Official Report',
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => const OfficialReportsScreen(initialReportType: 'ground-truth'),
              ),
            ),
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Form Card: Ingest Micro-Plot Observation
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.cardBorder),
                      boxShadow: AppColors.softShadow,
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'LOG FIELD OBSERVATION',
                              style: AppTextStyles.caption.copyWith(
                                fontWeight: FontWeight.w800,
                                color: AppColors.primaryDark,
                                letterSpacing: 0.5,
                              ),
                            ),
                            const StatusBadge(text: '🤖 Live ML Regression', type: BadgeType.info),
                          ],
                        ),
                        const SizedBox(height: 12),

                        // Plot Parcel
                        Text('Plot / Field Parcel', style: AppTextStyles.caption.copyWith(fontWeight: FontWeight.w700)),
                        const SizedBox(height: 4),
                        TextField(
                          controller: _parcelController,
                          decoration: InputDecoration(
                            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                          ),
                          style: AppTextStyles.body,
                        ),
                        const SizedBox(height: 10),

                        // Crop & Stage
                        Text('Crop Species', style: AppTextStyles.caption.copyWith(fontWeight: FontWeight.w700)),
                        const SizedBox(height: 4),
                        TextField(
                          controller: _cropController,
                          decoration: InputDecoration(
                            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                          ),
                          style: AppTextStyles.body,
                        ),
                        const SizedBox(height: 12),

                        // Soil Moisture Slider
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('Soil Moisture Content', style: AppTextStyles.caption.copyWith(fontWeight: FontWeight.w700)),
                            Text('${_soilMoisture.toStringAsFixed(1)}%', style: AppTextStyles.bodyBold.copyWith(color: AppColors.primary)),
                          ],
                        ),
                        Slider(
                          value: _soilMoisture,
                          min: 5.0,
                          max: 45.0,
                          divisions: 40,
                          activeColor: AppColors.primary,
                          onChanged: (val) => setState(() => _soilMoisture = val),
                        ),

                        // Weed Pressure Dropdown
                        Text('Weed Infestation Tier', style: AppTextStyles.caption.copyWith(fontWeight: FontWeight.w700)),
                        const SizedBox(height: 4),
                        DropdownButtonFormField<String>(
                          value: _weedInfestation,
                          decoration: InputDecoration(
                            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                          ),
                          items: const [
                            DropdownMenuItem(value: 'Low (<5%)', child: Text('Low (<5% Competition)')),
                            DropdownMenuItem(value: 'Moderate (12%)', child: Text('Moderate (5–15%)')),
                            DropdownMenuItem(value: 'Severe (>25%)', child: Text('Severe (>25% Canopy Choke)')),
                          ],
                          onChanged: (val) {
                            if (val != null) setState(() => _weedInfestation = val);
                          },
                        ),
                        const SizedBox(height: 14),

                        CustomButton(
                          text: 'Run ML Evaluation & Submit Observation',
                          icon: const Icon(Icons.analytics_outlined, size: 18, color: Colors.white),
                          isLoading: _isSubmitting,
                          onPressed: _handleSubmitObservation,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Ledger Title
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'VERIFIED GROUND TRUTH LEDGER',
                        style: AppTextStyles.caption.copyWith(
                          fontWeight: FontWeight.w800,
                          letterSpacing: 0.6,
                          color: AppColors.textMuted,
                        ),
                      ),
                      TextButton.icon(
                        icon: const Icon(Icons.picture_as_pdf, size: 14, color: AppColors.primary),
                        label: const Text('Export Audit', style: TextStyle(fontSize: 12, color: AppColors.primary)),
                        onPressed: () => Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => const OfficialReportsScreen(initialReportType: 'ground-truth'),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),

                  // Records List
                  ..._logs.map((log) {
                    final isHealthy = log.compositeStressScore < 40;
                    return Container(
                      margin: const EdgeInsets.only(bottom: 10),
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: AppColors.cardBorder),
                        boxShadow: AppColors.softShadow,
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(log.fieldParcel, style: AppTextStyles.bodyBold),
                              StatusBadge(
                                text: '${log.compositeStressScore.toStringAsFixed(1)} / 100 Stress',
                                type: isHealthy ? BadgeType.success : BadgeType.warning,
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text('${log.crop} • Moisture: ${log.soilMoisturePct}% • Weeds: ${log.weedInfestation}',
                              style: AppTextStyles.caption),
                          const SizedBox(height: 6),
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: isHealthy ? AppColors.successBg : AppColors.warningBg,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Row(
                              children: [
                                Icon(
                                  isHealthy ? Icons.check_circle : Icons.warning_amber_rounded,
                                  size: 14,
                                  color: isHealthy ? AppColors.success : AppColors.warning,
                                ),
                                const SizedBox(width: 6),
                                Expanded(
                                  child: Text(
                                    log.recommendation ?? 'Nominal maintenance',
                                    style: TextStyle(
                                      fontSize: 11.5,
                                      color: isHealthy ? AppColors.primaryDark : AppColors.warning,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    );
                  }),
                ],
              ),
            ),
    );
  }
}
