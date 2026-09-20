import 'package:flutter/material.dart';
import '../../constants/app_colors.dart';
import '../../constants/app_text_styles.dart';
import '../../services/api_service.dart';
import '../../services/auth_service.dart';
import '../../widgets/common_app_bar.dart';
import '../../widgets/kpi_card.dart';

// Agronomist Feature Screens
import '../3d_twin/digital_twin_3d_screen.dart';
import '../3d_twin/walk_and_calibrate_screen.dart';
import '../agronomist/crop_plan_engine_screen.dart';
import '../agronomist/pathogen_lab_screen.dart';
import '../agronomist/prescription_formulator_screen.dart';
import '../agronomist/broadcast_circulars_screen.dart';
import '../agronomist/subordinate_cadre_screen.dart';

// Operations & Core
import '../operations/hotline_screen.dart';
import '../operations/ground_truth_screen.dart';
import '../operations/training_screen.dart';
import '../operations/scorecard_screen.dart';
import '../reports/official_reports_screen.dart';
import '../sandbox/simulation_sandbox_screen.dart';

class AgronomistDashboardScreen extends StatefulWidget {
  const AgronomistDashboardScreen({super.key});

  @override
  State<AgronomistDashboardScreen> createState() => _AgronomistDashboardScreenState();
}

class _AgronomistDashboardScreenState extends State<AgronomistDashboardScreen> {
  final int _activeCropPlans = 4;
  int _hotlineInquiries = 2;
  final int _mlDiagnosesToday = 14;
  final int _fieldCadreActive = 42;
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
      final hotlineMsgs = await api.getHotlineMessages();
      if (mounted) {
        setState(() {
          _hotlineInquiries = hotlineMsgs.length;
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
        title: 'Supervising Agronomist Portal',
        subtitle: '${user?.fullName ?? 'Dr. Priya Sharma'} • ${user?.personaCode ?? 'AGRO-001'}',
        showBack: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.science, color: Colors.white),
            tooltip: 'Judge\'s Simulation Sandbox',
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const SimulationSandboxScreen()),
            ),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadDashboardData,
        color: AppColors.roleAgronomist,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (_isLoading) ...[
                const LinearProgressIndicator(minHeight: 2, color: AppColors.roleAgronomist),
                const SizedBox(height: 8),
              ],

              // 3D Digital Twin Hero Shortcut Banner
              GestureDetector(
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const DigitalTwin3dScreen())),
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    gradient: const RadialGradient(
                      center: Alignment.centerLeft,
                      radius: 1.2,
                      colors: [Color(0xFF0F172A), Color(0xFF1E293B)],
                    ),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFF38BDF8), width: 1.4),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF0284C7).withValues(alpha: 0.3),
                        blurRadius: 18,
                        offset: const Offset(0, 6),
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      const Text('🌐', style: TextStyle(fontSize: 34)),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'INTERACTIVE 3D DIGITAL TWIN',
                              style: TextStyle(color: Color(0xFF38BDF8), fontSize: 10.5, fontWeight: FontWeight.w800, letterSpacing: 0.8),
                            ),
                            const SizedBox(height: 2),
                            const Text(
                              'Living Agricultural World & CAD Editor',
                              style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w700),
                            ),
                            const SizedBox(height: 2),
                            const Text(
                              'Orbit controls, Day 1-120 slider & CAD road tool',
                              style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11),
                            ),
                          ],
                        ),
                      ),
                      const Icon(Icons.arrow_forward_ios, color: Color(0xFF38BDF8), size: 16),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 14),

              // KPI Metric Cards Grid
              Row(
                children: [
                  Expanded(
                    child: KpiCard(
                      title: 'Active Crop Plans',
                      value: '$_activeCropPlans',
                      subtitle: 'Wheat & Rice',
                      icon: '🌾',
                      iconColor: AppColors.roleAgronomist,
                      onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const CropPlanEngineScreen())),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: KpiCard(
                      title: 'Hotline Inquiries',
                      value: '$_hotlineInquiries',
                      subtitle: 'Needs Review',
                      icon: '💬',
                      iconColor: AppColors.warning,
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
                      title: 'ML Diagnoses Today',
                      value: '$_mlDiagnosesToday',
                      subtitle: 'AI Triage Auto-solved',
                      icon: '🤖',
                      iconColor: AppColors.info,
                      onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const PathogenLabScreen())),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: KpiCard(
                      title: 'Field Cadre Active',
                      value: '$_fieldCadreActive',
                      subtitle: 'GPS Verified',
                      icon: '👥',
                      iconColor: AppColors.success,
                      onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const SubordinateCadreScreen())),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // Section Title: Operational Actions
              Text(
                'AGRONOMIC MANAGEMENT & OVERSIGHT',
                style: AppTextStyles.caption.copyWith(
                  fontWeight: FontWeight.w800,
                  letterSpacing: 0.6,
                  color: AppColors.textMuted,
                ),
              ),
              const SizedBox(height: 10),

              _buildOperationTile(
                icon: '🌐',
                title: '3D Farm World & CAD Layout Editor',
                subtitle: 'Living 3D terrain, ponds, buildings & parcel drawing',
                color: AppColors.roleAgronomist,
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const DigitalTwin3dScreen())),
              ),
              const SizedBox(height: 8),

              _buildOperationTile(
                icon: '🚶',
                title: 'GPS Walk-and-Calibrate Boundary',
                subtitle: 'In-situ GNSS perimeter walking & legal acreage lock',
                color: const Color(0xFF0D9488),
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const WalkAndCalibrateScreen())),
              ),
              const SizedBox(height: 8),

              _buildOperationTile(
                icon: '📅',
                title: 'Master Crop Growing Plan Engine',
                subtitle: '60-120 day calendar, day dispatching & weather adaptation',
                color: const Color(0xFF2563EB),
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const CropPlanEngineScreen())),
              ),
              const SizedBox(height: 8),

              _buildOperationTile(
                icon: '🔬',
                title: 'Pathogen AI Diagnostic Lab',
                subtitle: 'Microscopic scouting, pathogen confirmation & lab certification',
                color: const Color(0xFF7C3AED),
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const PathogenLabScreen())),
              ),
              const SizedBox(height: 8),

              _buildOperationTile(
                icon: '🧪',
                title: 'Chemical & Bio Spray Formulator',
                subtitle: 'Foliar prescription dosing, safety intervals & nozzle calibration',
                color: const Color(0xFF059669),
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const PrescriptionFormulatorScreen())),
              ),
              const SizedBox(height: 8),

              _buildOperationTile(
                icon: '📢',
                title: 'SMS & WhatsApp Broadcast Circulars',
                subtitle: 'District agricultural warnings & advisory broadcasts',
                color: const Color(0xFFD97706),
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const BroadcastCircularsScreen())),
              ),
              const SizedBox(height: 8),

              _buildOperationTile(
                icon: '👥',
                title: 'Subordinate Cadre Assignment',
                subtitle: 'Field specialist registry, farmer allocations & duty roster',
                color: const Color(0xFF4F46E5),
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const SubordinateCadreScreen())),
              ),
              const SizedBox(height: 8),

              _buildOperationTile(
                icon: '💬',
                title: 'Hotline Advisory Bridge',
                subtitle: 'Respond to field escalations and override AI prescriptions',
                color: AppColors.warning,
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const HotlineScreen())),
              ),
              const SizedBox(height: 8),

              _buildOperationTile(
                icon: '📡',
                title: 'Ground Truth Telemetry Oversight',
                subtitle: 'Review telemetry and micro-plot soil logs',
                color: AppColors.info,
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const GroundTruthScreen())),
              ),
              const SizedBox(height: 8),

              _buildOperationTile(
                icon: '🎓',
                title: 'Training & Certification Hub',
                subtitle: 'Manage curriculum and issue cadre certifications',
                color: AppColors.success,
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const TrainingScreen())),
              ),
              const SizedBox(height: 8),

              _buildOperationTile(
                icon: '🏅',
                title: 'Workforce Scorecard Review',
                subtitle: 'Audit field performance, accuracy, and punctuality',
                color: AppColors.primary,
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ScorecardScreen())),
              ),
              const SizedBox(height: 8),

              _buildOperationTile(
                icon: '📊',
                title: 'Official Regulatory Reports',
                subtitle: 'Generate and sign agronomic compliance reports',
                color: AppColors.textPrimary,
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const OfficialReportsScreen())),
              ),
              const SizedBox(height: 8),

              _buildOperationTile(
                icon: '⚡',
                title: 'Judge\'s Simulation Sandbox',
                subtitle: 'Trigger hailstorms, pest outbreaks, canal breaches & test response',
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
