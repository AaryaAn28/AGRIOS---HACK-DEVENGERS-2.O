import 'package:flutter/material.dart';
import '../../constants/app_colors.dart';
import '../../constants/app_text_styles.dart';
import '../../constants/static_content.dart';
import '../../services/api_service.dart';
import '../../widgets/common_app_bar.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/status_badge.dart';

class OfficialReportsScreen extends StatefulWidget {
  final String initialReportType;

  const OfficialReportsScreen({
    super.key,
    this.initialReportType = 'ground-truth',
  });

  @override
  State<OfficialReportsScreen> createState() => _OfficialReportsScreenState();
}

class _OfficialReportsScreenState extends State<OfficialReportsScreen> {
  late String _activeType;
  Map<String, dynamic>? _reportData;
  bool _isLoading = true;

  final List<Map<String, String>> _reportTypes = [
    {'type': 'ground-truth', 'title': 'Ground Truth Audit', 'endpoint': '/api/workforce-ops/ground-truth/report'},
    {'type': 'equipment', 'title': 'Equipment Prognostics', 'endpoint': '/api/workforce-ops/equipment-kit/audit-report'},
    {'type': 'hotline', 'title': 'Advisory Transcript', 'endpoint': '/api/workforce-ops/hotline/transcript-report'},
    {'type': 'training', 'title': 'Training Transcript', 'endpoint': '/api/workforce-ops/training/transcript-report'},
    {'type': 'leaves', 'title': 'Welfare & DBT Ledger', 'endpoint': '/api/workforce-ops/leaves/welfare-statement'},
    {'type': 'scorecard', 'title': 'Annual Merit Ledger', 'endpoint': '/api/workforce-ops/scorecard/WORKER-001/merit-report'},
    {'type': 'emergency', 'title': 'Safety & Biosecurity', 'endpoint': '/api/workforce-ops/emergency/safety-report'},
  ];

  @override
  void initState() {
    super.initState();
    _activeType = widget.initialReportType;
    _fetchReport();
  }

  Future<void> _fetchReport() async {
    setState(() => _isLoading = true);
    final target = _reportTypes.firstWhere(
      (r) => r['type'] == _activeType,
      orElse: () => _reportTypes.first,
    );
    final data = await ApiService().getReport(target['endpoint']!);
    if (mounted) {
      setState(() {
        _reportData = data;
        _isLoading = false;
      });
    }
  }

  void _exportNotification(String format) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('✓ Exported "$_activeType" report in $format format.'),
        backgroundColor: AppColors.primary,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final rep = _reportData;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: const CommonAppBar(
        title: 'Official Regulatory Reports',
        subtitle: 'Government of Punjab • Official Field Audits',
      ),
      body: Column(
        children: [
          // Filter Tabs
          Container(
            height: 48,
            color: AppColors.surface,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              itemCount: _reportTypes.length,
              itemBuilder: (context, index) {
                final r = _reportTypes[index];
                final isSelected = r['type'] == _activeType;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(r['title']!),
                    selected: isSelected,
                    selectedColor: AppColors.primary,
                    labelStyle: TextStyle(
                      color: isSelected ? Colors.white : AppColors.textPrimary,
                      fontSize: 11.5,
                      fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                    ),
                    onSelected: (val) {
                      if (val) {
                        setState(() => _activeType = r['type']!);
                        _fetchReport();
                      }
                    },
                  ),
                );
              },
            ),
          ),

          // Main Report Content
          Expanded(
            child: _isLoading || rep == null
                ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
                : SingleChildScrollView(
                    padding: const EdgeInsets.all(16),
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: AppColors.cardBorder),
                        boxShadow: AppColors.softShadow,
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          // Letterhead Header
                          Row(
                            children: [
                              Container(
                                width: 44,
                                height: 44,
                                decoration: BoxDecoration(
                                  color: AppColors.primaryContainer,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                alignment: Alignment.center,
                                child: const Text('🏛️', style: TextStyle(fontSize: 22)),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      StaticContent.govHeader,
                                      style: AppTextStyles.caption.copyWith(
                                        color: AppColors.primaryDark,
                                        fontWeight: FontWeight.w800,
                                        fontSize: 9.5,
                                      ),
                                    ),
                                    Text(
                                      rep['title'] ?? 'Official Regulatory Report',
                                      style: AppTextStyles.h3.copyWith(fontSize: 14),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          const Divider(height: 24),

                          // Metadata Strip
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text('REFERENCE CODE', style: AppTextStyles.caption),
                                  Text(rep['report_id'] ?? rep['statement_id'] ?? 'REP-2026', style: AppTextStyles.code),
                                ],
                              ),
                              const StatusBadge(text: '✓ Certified Authentic', type: BadgeType.success),
                            ],
                          ),
                          const SizedBox(height: 14),

                          // Summary Metric Cards
                          Text('EXECUTIVE SUMMARY',
                              style: AppTextStyles.caption.copyWith(fontWeight: FontWeight.w800, color: AppColors.textMuted)),
                          const SizedBox(height: 8),

                          if (rep['summary'] != null)
                            Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              children: (rep['summary'] as Map<String, dynamic>).entries.map((e) {
                                final label = e.key.replaceAll('_', ' ').toUpperCase();
                                return Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                  decoration: BoxDecoration(
                                    color: AppColors.cardSubtle,
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(color: AppColors.cardBorder),
                                  ),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(label, style: const TextStyle(fontSize: 9.5, color: AppColors.textMuted, fontWeight: FontWeight.w700)),
                                      Text('${e.value}', style: AppTextStyles.bodyBold.copyWith(color: AppColors.primaryDark)),
                                    ],
                                  ),
                                );
                              }).toList(),
                            ),
                          const SizedBox(height: 20),

                          // Signatures Seal
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: AppColors.primaryContainer,
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: AppColors.primaryBorder),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: const [
                                    Text('Extension Cadre:', style: AppTextStyles.caption),
                                    Text('Sunita Devi (WORKER-001)', style: AppTextStyles.bodyBold),
                                    Text('✓ GPS Telemetry Latch', style: TextStyle(fontSize: 10, color: AppColors.success)),
                                  ],
                                ),
                                Container(
                                  width: 50,
                                  height: 50,
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    border: Border.all(color: AppColors.primary, width: 2),
                                    color: Colors.white,
                                  ),
                                  alignment: Alignment.center,
                                  child: const Text('STATE\nSEAL', textAlign: TextAlign.center, style: TextStyle(fontSize: 8, fontWeight: FontWeight.w800, color: AppColors.primary)),
                                ),
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.end,
                                  children: const [
                                    Text('Agronomist Signatory:', style: AppTextStyles.caption),
                                    Text('Dr. Priya Sharma', style: AppTextStyles.bodyBold),
                                    Text('PB-AGRO-001', style: TextStyle(fontSize: 10, color: AppColors.textMuted)),
                                  ],
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 20),

                          // Export Action Buttons
                          Row(
                            children: [
                              Expanded(
                                child: CustomButton(
                                  text: '⬇️ CSV',
                                  variant: ButtonVariant.secondary,
                                  height: 38,
                                  onPressed: () => _exportNotification('CSV'),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: CustomButton(
                                  text: '⬇️ JSON',
                                  variant: ButtonVariant.secondary,
                                  height: 38,
                                  onPressed: () => _exportNotification('JSON'),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: CustomButton(
                                  text: '🖨️ Print PDF',
                                  height: 38,
                                  onPressed: () => _exportNotification('PDF'),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}
