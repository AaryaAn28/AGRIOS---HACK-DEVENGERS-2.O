import 'package:flutter/material.dart';
import '../../constants/app_colors.dart';
import '../../constants/app_text_styles.dart';
import '../../services/auth_service.dart';
import '../../widgets/common_app_bar.dart';
import '../../widgets/kpi_card.dart';
import '../operations/hotline_screen.dart';
import '../operations/ground_truth_screen.dart';
import '../reports/official_reports_screen.dart';

class AgronomistDashboardScreen extends StatelessWidget {
  const AgronomistDashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = AuthService().currentUser;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: CommonAppBar(
        title: 'Agronomist Intelligence Lab',
        subtitle: '${user?.fullName ?? 'Dr. Priya Sharma'} • Senior Scientist',
        showBack: false,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Scientist Bridge Ribbon
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppColors.infoBg,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFFBAE6FD)),
              ),
              child: Row(
                children: [
                  const Text('🔬', style: TextStyle(fontSize: 26)),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'PAU REGIONAL RESEARCH STATION • LUDHIANA',
                          style: AppTextStyles.caption.copyWith(
                            color: AppColors.roleAgronomist,
                            fontWeight: FontWeight.w800,
                            fontSize: 10,
                          ),
                        ),
                        Text(
                          'Scientific Surveillance & Task Dispatching',
                          style: AppTextStyles.bodyBold.copyWith(
                            color: const Color(0xFF0C4A6E),
                            fontSize: 13.5,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),

            // Metrics
            Row(
              children: [
                Expanded(
                  child: KpiCard(
                    title: 'Active Directives',
                    value: 'Day 1',
                    subtitle: 'Wheat Stage 1 Sowing',
                    icon: '🚀',
                    iconColor: AppColors.primary,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: KpiCard(
                    title: 'Hotline Inquiries',
                    value: '2 Live',
                    subtitle: 'AI Triaged (100%)',
                    icon: '💬',
                    iconColor: AppColors.info,
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const HotlineScreen())),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: KpiCard(
                    title: 'Telemetry Audits',
                    value: '2 Parcels',
                    subtitle: 'Sentinel Cross-Calibrated',
                    icon: '📡',
                    iconColor: AppColors.success,
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const GroundTruthScreen())),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: KpiCard(
                    title: 'Field Cadre',
                    value: '1 Active',
                    subtitle: 'Sunita Devi (WORKER-001)',
                    icon: '👩‍🌾',
                    iconColor: AppColors.roleOperator,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Actions
            Text(
              'SCIENTIFIC LAB ACTIONS',
              style: AppTextStyles.caption.copyWith(
                fontWeight: FontWeight.w800,
                letterSpacing: 0.6,
                color: AppColors.textMuted,
              ),
            ),
            const SizedBox(height: 10),

            ListTile(
              tileColor: AppColors.surface,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
                side: const BorderSide(color: AppColors.cardBorder),
              ),
              leading: const Text('💬', style: TextStyle(fontSize: 22)),
              title: const Text('Agronomist Hotline Bridge', style: AppTextStyles.bodyBold),
              subtitle: const Text('Respond to worker field inquiries & verify AI triage Rx', style: AppTextStyles.caption),
              trailing: const Icon(Icons.arrow_forward_ios, size: 14),
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const HotlineScreen())),
            ),
            const SizedBox(height: 8),

            ListTile(
              tileColor: AppColors.surface,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
                side: const BorderSide(color: AppColors.cardBorder),
              ),
              leading: const Text('📡', style: TextStyle(fontSize: 22)),
              title: const Text('Ground Truth Stress Verification', style: AppTextStyles.bodyBold),
              subtitle: const Text('Review micro-plot sensor readings & ML CWSI scores', style: AppTextStyles.caption),
              trailing: const Icon(Icons.arrow_forward_ios, size: 14),
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const GroundTruthScreen())),
            ),
            const SizedBox(height: 8),

            ListTile(
              tileColor: AppColors.surface,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
                side: const BorderSide(color: AppColors.cardBorder),
              ),
              leading: const Text('📊', style: TextStyle(fontSize: 22)),
              title: const Text('Audit Reports & Prescriptions', style: AppTextStyles.bodyBold),
              subtitle: const Text('Export official ICAR-PAU accredited certificates & reports', style: AppTextStyles.caption),
              trailing: const Icon(Icons.arrow_forward_ios, size: 14),
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const OfficialReportsScreen())),
            ),
          ],
        ),
      ),
    );
  }
}
