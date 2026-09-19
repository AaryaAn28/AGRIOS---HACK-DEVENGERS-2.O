import 'package:flutter/material.dart';
import '../../constants/app_colors.dart';
import '../../constants/app_text_styles.dart';
import '../../services/auth_service.dart';
import '../../widgets/common_app_bar.dart';
import '../../widgets/kpi_card.dart';
import '../reports/official_reports_screen.dart';

class GovernmentDashboardScreen extends StatelessWidget {
  const GovernmentDashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = AuthService().currentUser;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: CommonAppBar(
        title: 'State Command Center',
        subtitle: '${user?.fullName ?? 'Dr. Vikramaditya Sen'} • Director of Agriculture',
        showBack: false,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // State Emblem Banner
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFFFAF5FF),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFFE9D5FF)),
              ),
              child: Row(
                children: [
                  const Text('🏛️', style: TextStyle(fontSize: 26)),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'DEPARTMENT OF AGRICULTURE • GOVERNMENT OF PUNJAB',
                          style: AppTextStyles.caption.copyWith(
                            color: AppColors.roleGovernment,
                            fontWeight: FontWeight.w800,
                            fontSize: 10,
                          ),
                        ),
                        Text(
                          'State Biosecurity & Regulatory Oversight',
                          style: AppTextStyles.bodyBold.copyWith(
                            color: const Color(0xFF581C87),
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

            // State KPIs
            Row(
              children: [
                Expanded(
                  child: KpiCard(
                    title: 'Welfare Disbursed',
                    value: '₹18,500',
                    subtitle: 'PM-KISAN DBT Direct',
                    icon: '💰',
                    iconColor: AppColors.roleGovernment,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: KpiCard(
                    title: 'Quarantines',
                    value: '0 Active',
                    subtitle: 'Cordon Sanitaire Clear',
                    icon: '🛡️',
                    iconColor: AppColors.success,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: KpiCard(
                    title: 'Certified Cadre',
                    value: '42 Active',
                    subtitle: 'ICAR-PAU Accredited',
                    icon: '📜',
                    iconColor: AppColors.primary,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: KpiCard(
                    title: 'Distress Alerts',
                    value: '0 SOS',
                    subtitle: '108 Ambulance Standby',
                    icon: '🚨',
                    iconColor: AppColors.danger,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Actions
            Text(
              'REGULATORY & WELFARE AUDITS',
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
              leading: const Text('📊', style: TextStyle(fontSize: 22)),
              title: const Text('State-Wide Regulatory Audit Ledgers', style: AppTextStyles.bodyBold),
              subtitle: const Text('Inspect all 8 official reports with verifiable cryptographic hashes', style: AppTextStyles.caption),
              trailing: const Icon(Icons.arrow_forward_ios, size: 14),
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const OfficialReportsScreen())),
            ),
          ],
        ),
      ),
    );
  }
}
