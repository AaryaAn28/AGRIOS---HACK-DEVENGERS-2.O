import 'package:flutter/material.dart';
import '../../constants/app_colors.dart';
import '../../constants/app_text_styles.dart';
import '../../services/auth_service.dart';
import '../../widgets/common_app_bar.dart';
import '../../widgets/kpi_card.dart';
import '../operations/tasks_screen.dart';
import '../reports/official_reports_screen.dart';

class FarmerDashboardScreen extends StatelessWidget {
  const FarmerDashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = AuthService().currentUser;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: CommonAppBar(
        title: 'Farmer Operational Portal',
        subtitle: '${user?.fullName ?? 'Balwinder Singh'} • Greenfield Model Farm',
        showBack: false,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Crop Plan Directive Status Banner
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppColors.primaryContainer,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppColors.primaryBorder),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'ACTIVE CROP CYCLE • RABI 2026-27',
                        style: AppTextStyles.caption.copyWith(
                          fontWeight: FontWeight.w800,
                          color: AppColors.primaryDark,
                          letterSpacing: 0.5,
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: AppColors.primary,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: const Text(
                          'Wheat (PBW-550)',
                          style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w700),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Growth Stage 1: Sowing & Seed Priming (Day 1)',
                    style: AppTextStyles.bodyBold.copyWith(color: AppColors.primaryDark, fontSize: 14),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    'Assigned and supervised by Dr. Priya Sharma (PB-AGRO-001). Tasks locked to current stage.',
                    style: AppTextStyles.caption.copyWith(color: AppColors.primary),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),

            // Farm Metrics Grid
            Row(
              children: [
                Expanded(
                  child: KpiCard(
                    title: 'Soil Moisture',
                    value: '26.8%',
                    subtitle: 'Optimal Hydrology',
                    icon: '💧',
                    iconColor: AppColors.info,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: KpiCard(
                    title: 'Foliar Health',
                    value: '95.2%',
                    subtitle: 'Sentinel-2 NDVI',
                    icon: '🌿',
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
                    title: 'Weather Risk',
                    value: 'Low',
                    subtitle: '28.5°C • Clear Sky',
                    icon: '☀️',
                    iconColor: AppColors.warning,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: KpiCard(
                    title: 'Machinery',
                    value: 'Booked',
                    subtitle: 'Laser Land Leveler',
                    icon: '🚜',
                    iconColor: AppColors.roleFarmer,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Actions Section
            Text(
              'FARM MANAGEMENT ACTIONS',
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
              leading: const Text('📋', style: TextStyle(fontSize: 22)),
              title: const Text('View Dispatched Day Tasks', style: AppTextStyles.bodyBold),
              subtitle: const Text('Monitor field worker progress and geotag verifications', style: AppTextStyles.caption),
              trailing: const Icon(Icons.arrow_forward_ios, size: 14),
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const TasksScreen())),
            ),
            const SizedBox(height: 8),

            ListTile(
              tileColor: AppColors.surface,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
                side: const BorderSide(color: AppColors.cardBorder),
              ),
              leading: const Text('📊', style: TextStyle(fontSize: 22)),
              title: const Text('Farm Regulatory Reports', style: AppTextStyles.bodyBold),
              subtitle: const Text('View official soil hydrology and biosecurity statements', style: AppTextStyles.caption),
              trailing: const Icon(Icons.arrow_forward_ios, size: 14),
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const OfficialReportsScreen())),
            ),
          ],
        ),
      ),
    );
  }
}
