import 'package:flutter/material.dart';
import '../../constants/app_colors.dart';
import '../../constants/app_text_styles.dart';
import '../../constants/static_content.dart';
import '../../services/api_service.dart';
import '../../services/auth_service.dart';
import '../../widgets/common_app_bar.dart';
import '../../widgets/kpi_card.dart';
import '../operations/tasks_screen.dart';
import '../operations/ground_truth_screen.dart';
import '../operations/equipment_kit_screen.dart';
import '../operations/hotline_screen.dart';
import '../operations/training_screen.dart';
import '../operations/leaves_welfare_screen.dart';
import '../operations/scorecard_screen.dart';
import '../operations/emergency_sos_screen.dart';
import '../reports/official_reports_screen.dart';

class OperatorDashboardScreen extends StatefulWidget {
  const OperatorDashboardScreen({super.key});

  @override
  State<OperatorDashboardScreen> createState() => _OperatorDashboardScreenState();
}

class _OperatorDashboardScreenState extends State<OperatorDashboardScreen> {
  int _activeDay = 1;
  int _pendingCount = 2;
  int _completedCount = 1;
  double _accruedBonus = 3400.0;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadDashboardData();
  }

  Future<void> _loadDashboardData() async {
    setState(() => _isLoading = true);
    final api = ApiService();
    try {
      final day = await api.getActiveDispatchedDay();
      final tasks = await api.getTasks();
      final scorecard = await api.getScorecard('WORKER-001');

      if (mounted) {
        setState(() {
          _activeDay = day;
          _pendingCount = tasks.where((t) => !t.isCompleted).length;
          _completedCount = tasks.where((t) => t.isCompleted).length;
          _accruedBonus = scorecard.accruedBonus;
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Widget _buildOperationTile({
    required String icon,
    required String title,
    required String subtitle,
    required Color color,
    required VoidCallback onTap,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.cardBorder),
            boxShadow: AppColors.softShadow,
          ),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: color.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
                alignment: Alignment.center,
                child: Text(icon, style: const TextStyle(fontSize: 22)),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: AppTextStyles.bodyBold.copyWith(fontSize: 14)),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: AppTextStyles.caption.copyWith(fontSize: 11.5),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              const Icon(Icons.arrow_forward_ios, size: 14, color: AppColors.textMuted),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = AuthService();
    final user = auth.currentUser;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: CommonAppBar(
        title: StaticContent.operatorPortalTitle,
        subtitle: '${user?.fullName ?? 'Sunita Devi'} • ${user?.personaCode ?? 'WORKER-001'}',
        showBack: false,
      ),
      body: RefreshIndicator(
        onRefresh: _loadDashboardData,
        color: AppColors.primary,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (_isLoading) ...[
                const LinearProgressIndicator(minHeight: 2, color: AppColors.primary),
                const SizedBox(height: 8),
              ],
              // Locked Directive Banner: Active Dispatched Day
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                decoration: BoxDecoration(
                  color: AppColors.primaryContainer,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: AppColors.primaryBorder),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withOpacity(0.15),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.lock_clock, color: AppColors.primaryDark, size: 20),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text(
                                'ASSIGNED SCHEDULE DIRECTIVE',
                                style: AppTextStyles.caption.copyWith(
                                  color: AppColors.primaryDark,
                                  fontWeight: FontWeight.w800,
                                  fontSize: 10,
                                  letterSpacing: 0.5,
                                ),
                              ),
                              const Spacer(),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: AppColors.primaryDark,
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: const Text(
                                  'Dr. Priya Sharma',
                                  style: TextStyle(color: Colors.white, fontSize: 9.5, fontWeight: FontWeight.w700),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'Active Directive: Growth Day $_activeDay Tasks',
                            style: AppTextStyles.bodyBold.copyWith(
                              color: AppColors.primaryDark,
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

              // KPI Metric Cards Grid
              Row(
                children: [
                  Expanded(
                    child: KpiCard(
                      title: 'Pending Tasks',
                      value: '$_pendingCount',
                      subtitle: 'Day $_activeDay Directive',
                      icon: '⏳',
                      iconColor: AppColors.warning,
                      onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const TasksScreen())),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: KpiCard(
                      title: 'Completed',
                      value: '$_completedCount',
                      subtitle: 'GPS Verified',
                      icon: '✅',
                      iconColor: AppColors.success,
                      onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const TasksScreen())),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: KpiCard(
                      title: 'Accrued Bonus',
                      value: '₹${_accruedBonus.toStringAsFixed(0)}',
                      subtitle: 'Month-End DBT',
                      icon: '💰',
                      iconColor: AppColors.primary,
                      onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ScorecardScreen())),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: KpiCard(
                      title: 'Cadre Rating',
                      value: '98.4%',
                      subtitle: 'Grade A+ Distinction',
                      icon: '🏅',
                      iconColor: AppColors.roleAgronomist,
                      onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ScorecardScreen())),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // Section Title: Operational Actions
              Text(
                'WORKFORCE OPERATIONS & TOOLS',
                style: AppTextStyles.caption.copyWith(
                  fontWeight: FontWeight.w800,
                  letterSpacing: 0.6,
                  color: AppColors.textMuted,
                ),
              ),
              const SizedBox(height: 10),

              // Operations Tiles
              _buildOperationTile(
                icon: '📋',
                title: 'Day Tasks Execution & Geotagging',
                subtitle: 'Execute Day $_activeDay field operations with verified GPS coordinates',
                color: AppColors.primary,
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const TasksScreen())),
              ),
              const SizedBox(height: 8),

              _buildOperationTile(
                icon: '📡',
                title: 'Ground Truth Telemetry & ML Stress',
                subtitle: 'Log micro-plot soil moisture, weed competition, and ML stress index',
                color: AppColors.info,
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const GroundTruthScreen())),
              ),
              const SizedBox(height: 8),

              _buildOperationTile(
                icon: '🧰',
                title: 'Field Kit & Wear Prognostics',
                subtitle: 'Tool health registry, sensor drift tracking & doorstep swap requests',
                color: AppColors.warning,
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const EquipmentKitScreen())),
              ),
              const SizedBox(height: 8),

              _buildOperationTile(
                icon: '💬',
                title: 'Supervising Agronomist Hotline',
                subtitle: 'Direct bridge with Dr. Priya Sharma + instant AI botanical triage',
                color: AppColors.primaryDark,
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const HotlineScreen())),
              ),
              const SizedBox(height: 8),

              _buildOperationTile(
                icon: '🎓',
                title: 'ICAR-PAU Training & Offline Manuals',
                subtitle: '8+ accredited crop curricula, exams, certificates & offline field SOPs',
                color: AppColors.roleAgronomist,
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const TrainingScreen())),
              ),
              const SizedBox(height: 8),

              _buildOperationTile(
                icon: '📑',
                title: 'Leave & PM-KISAN Welfare Advances',
                subtitle: 'Apply for planned leave & request emergency wage advance DBT',
                color: AppColors.roleGovernment,
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const LeavesWelfareScreen())),
              ),
              const SizedBox(height: 8),

              _buildOperationTile(
                icon: '🏅',
                title: 'Performance Scorecard & Badges',
                subtitle: 'Merit score ledger, 4 cadre badges & DBT incentive breakdown',
                color: AppColors.success,
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ScorecardScreen())),
              ),
              const SizedBox(height: 8),

              _buildOperationTile(
                icon: '🚨',
                title: 'Emergency Protocols & SOS Beacon',
                subtitle: 'Trigger instant satellite distress calling & ISO 7243 WBGT heat rest',
                color: AppColors.danger,
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const EmergencySosScreen())),
              ),
              const SizedBox(height: 8),

              _buildOperationTile(
                icon: '📊',
                title: 'Official Regulatory Reports',
                subtitle: 'View, generate and export 8 Punjab Agricultural letterhead reports',
                color: AppColors.textPrimary,
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const OfficialReportsScreen())),
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }
}
