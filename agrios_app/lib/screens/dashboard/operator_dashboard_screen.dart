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
import '../operations/leaf_scanner_screen.dart';
import '../reports/official_reports_screen.dart';
import '../3d_twin/digital_twin_3d_screen.dart';
import '../sandbox/simulation_sandbox_screen.dart';

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
  bool _attendanceLogged = false;

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

  Future<void> _handleGpsAttendance() async {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Row(
          children: [
            Text('📍 ', style: TextStyle(fontSize: 22)),
            Expanded(child: Text('GPS Geotag Attendance', style: AppTextStyles.h3)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFFCBD5E1)),
              ),
              child: const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('GEOSPATIAL AUDIT LOCK:', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: AppColors.textMuted)),
                  SizedBox(height: 4),
                  Text('Latitude: 30.9010° N', style: AppTextStyles.code),
                  Text('Longitude: 75.8573° E', style: AppTextStyles.code),
                  Text('Accuracy: ±0.35m (SBAS Lock)', style: TextStyle(fontSize: 11, color: AppColors.success, fontWeight: FontWeight.w700)),
                  Text('Cadre: Sunita Devi (WORKER-001)', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600)),
                ],
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              'Confirm shift duty check-in at Greenfield Model Farm, Ludhiana. Verified coordinates will be stamped on Punjab Agricultural Extension Ledger.',
              style: AppTextStyles.caption,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
            onPressed: () async {
              Navigator.pop(ctx);
              final res = await ApiService().logAttendance({
                'worker_id': 'WORKER-001',
                'lat': 30.9010,
                'lon': 75.8573,
                'accuracy_m': 0.35,
                'device': 'Trimble TDC600',
              });
              if (mounted) {
                setState(() => _attendanceLogged = true);
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('✓ Verified Check-In: ${res['attendance_id'] ?? 'ATT-LOGGED'}. Geotag recorded!'),
                    backgroundColor: AppColors.success,
                  ),
                );
              }
            },
            child: const Text('Confirm Geotag', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );
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
        borderRadius: BorderRadius.circular(14),
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Colors.white, Color(0xFFFAFBFD)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: const Color(0xFFE2E8F0), width: 1.2),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.03),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
              BoxShadow(
                color: color.withValues(alpha: 0.08),
                blurRadius: 14,
                offset: const Offset(2, 6),
              ),
            ],
          ),
          child: Row(
            children: [
              Container(
                width: 46,
                height: 46,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      color.withValues(alpha: 0.22),
                      color.withValues(alpha: 0.08),
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: color.withValues(alpha: 0.25)),
                  boxShadow: [
                    BoxShadow(
                      color: color.withValues(alpha: 0.12),
                      blurRadius: 6,
                      offset: const Offset(0, 2),
                    ),
                  ],
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

              // Welcome Row with Quick Geotag & Scanner Actions
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFFECFDF5), Color(0xFFD1FAE5)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.primaryBorder, width: 1.2),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primary.withValues(alpha: 0.1),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Text('👩‍🌾 ', style: TextStyle(fontSize: 20)),
                        Text(
                          'KRISHI SAKHI • EXTENSION CADRE',
                          style: AppTextStyles.caption.copyWith(
                            color: AppColors.primaryDark,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 0.6,
                            fontSize: 11,
                          ),
                        ),
                        const Spacer(),
                        if (_attendanceLogged)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppColors.primaryDark,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Text('✓ On Duty', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w700)),
                          ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    const Text('Field Operations Hub', style: AppTextStyles.h2),
                    const SizedBox(height: 2),
                    const Text(
                      'Ground truth logs, leaf disease vision scanning, and agronomic task execution.',
                      style: AppTextStyles.caption,
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: ElevatedButton.icon(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.white,
                              foregroundColor: AppColors.primaryDark,
                              elevation: 2,
                              padding: const EdgeInsets.symmetric(vertical: 10),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(10),
                                side: const BorderSide(color: AppColors.primaryBorder),
                              ),
                            ),
                            icon: const Icon(Icons.location_on, size: 16),
                            label: const Text('GPS Geotag', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
                            onPressed: _handleGpsAttendance,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: ElevatedButton.icon(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.primary,
                              foregroundColor: Colors.white,
                              elevation: 2,
                              padding: const EdgeInsets.symmetric(vertical: 10),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            ),
                            icon: const Icon(Icons.document_scanner_outlined, size: 16),
                            label: const Text('AI Scanner', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
                            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const LeafScannerScreen())),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),

              // Locked Directive Banner: Active Dispatched Day
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Colors.white, Color(0xFFF8FAFC)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                  boxShadow: AppColors.softShadow,
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withValues(alpha: 0.15),
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

              // KPI Metric Cards Grid (with 3D Aesthetics)
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
                icon: '📷',
                title: 'Mobile Leaf AI Vision Scanner',
                subtitle: 'Neural network foliar pathogen detection & instant prescriptions',
                color: AppColors.primary,
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const LeafScannerScreen())),
              ),
              const SizedBox(height: 8),

              _buildOperationTile(
                icon: '📋',
                title: 'Day Tasks Execution & Geotagging',
                subtitle: 'Execute Day $_activeDay field operations with verified GPS coordinates',
                color: AppColors.primaryLight,
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
              const SizedBox(height: 8),

              _buildOperationTile(
                icon: '🌐',
                title: '3D Farm Digital Twin World',
                subtitle: 'Explore 3D crops, ponds, polyhouses, day slider & CAD layout',
                color: AppColors.roleAgronomist,
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const DigitalTwin3dScreen())),
              ),
              const SizedBox(height: 8),

              _buildOperationTile(
                icon: '⚡',
                title: 'Judge\'s Simulation Sandbox',
                subtitle: 'Trigger hailstorms, pest outbreaks, canal breaches & observe reaction',
                color: const Color(0xFFDC2626),
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const SimulationSandboxScreen())),
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }
}
