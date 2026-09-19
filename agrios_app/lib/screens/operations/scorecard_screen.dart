import 'package:flutter/material.dart';
import '../../constants/app_colors.dart';
import '../../constants/app_text_styles.dart';
import '../../models/scorecard_model.dart';
import '../../services/api_service.dart';
import '../../widgets/common_app_bar.dart';
import '../../widgets/kpi_card.dart';
import '../../widgets/status_badge.dart';
import '../reports/official_reports_screen.dart';

class ScorecardScreen extends StatefulWidget {
  const ScorecardScreen({super.key});

  @override
  State<ScorecardScreen> createState() => _ScorecardScreenState();
}

class _ScorecardScreenState extends State<ScorecardScreen> {
  ScorecardModel? _scorecard;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadScorecard();
  }

  Future<void> _loadScorecard() async {
    setState(() => _isLoading = true);
    final data = await ApiService().getScorecard('WORKER-001');
    if (mounted) {
      setState(() {
        _scorecard = data;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final sc = _scorecard;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: CommonAppBar(
        title: 'Krishi Sakhi Merit Scorecard',
        subtitle: 'Performance Distinction & Earned Bonuses',
        actions: [
          IconButton(
            icon: const Icon(Icons.description_outlined, color: Colors.white),
            tooltip: 'Annual Merit Certificate',
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => const OfficialReportsScreen(initialReportType: 'scorecard'),
              ),
            ),
          ),
        ],
      ),
      body: _isLoading || sc == null
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Overall Score Highlight Card
                  Container(
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      color: AppColors.primaryContainer,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: AppColors.primaryBorder, width: 1.5),
                      boxShadow: AppColors.softShadow,
                    ),
                    child: Column(
                      children: [
                        const StatusBadge(text: 'GRADE A+ (DISTINCTION)', type: BadgeType.success),
                        const SizedBox(height: 10),
                        Text(
                          '${sc.compositeScore.toStringAsFixed(1)}%',
                          style: AppTextStyles.h1.copyWith(fontSize: 38, color: AppColors.primaryDark),
                        ),
                        Text('Composite Cadre Execution Score',
                            style: AppTextStyles.caption.copyWith(fontWeight: FontWeight.w700, color: AppColors.primary)),
                        const SizedBox(height: 12),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: AppColors.primaryBorder),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('Accrued Monthly Bonus:', style: AppTextStyles.caption.copyWith(fontWeight: FontWeight.w700)),
                              Text('₹${sc.accruedBonus.toStringAsFixed(2)}',
                                  style: AppTextStyles.bodyBold.copyWith(color: AppColors.success, fontSize: 16)),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // KPI Grid
                  Row(
                    children: [
                      Expanded(
                        child: KpiCard(
                          title: 'Punctuality',
                          value: '${sc.punctualityRate}%',
                          subtitle: 'Verified GPS Geotags',
                          icon: '⚡',
                          iconColor: AppColors.warning,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: KpiCard(
                          title: 'Telemetry Accuracy',
                          value: '${sc.accuracyRate}%',
                          subtitle: 'Satellite Calibrated',
                          icon: '🎯',
                          iconColor: AppColors.roleAgronomist,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),

                  // Merit Badges Section
                  Text(
                    'EARNED CADRE MERIT BADGES',
                    style: AppTextStyles.caption.copyWith(
                      fontWeight: FontWeight.w800,
                      letterSpacing: 0.6,
                      color: AppColors.textMuted,
                    ),
                  ),
                  const SizedBox(height: 10),

                  ...sc.badges.map((b) {
                    return Container(
                      margin: const EdgeInsets.only(bottom: 10),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: AppColors.cardBorder),
                        boxShadow: AppColors.softShadow,
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 36,
                            height: 36,
                            decoration: BoxDecoration(
                              color: AppColors.warningBg,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            alignment: Alignment.center,
                            child: const Text('🏅', style: TextStyle(fontSize: 18)),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(b['badge'] ?? 'Badge', style: AppTextStyles.bodyBold.copyWith(fontSize: 13)),
                                const SizedBox(height: 2),
                                Text(b['criteria'] ?? '', style: AppTextStyles.caption.copyWith(color: AppColors.textSecondary)),
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
