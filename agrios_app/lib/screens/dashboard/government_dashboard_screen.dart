import 'package:flutter/material.dart';
import '../../constants/app_colors.dart';
import '../../constants/app_text_styles.dart';
import '../../services/api_service.dart';
import '../../services/auth_service.dart';
import '../../widgets/common_app_bar.dart';
import '../../widgets/kpi_card.dart';

// 3D Twin & Government Screens
import '../3d_twin/digital_twin_3d_screen.dart';
import '../government/pest_radar_screen.dart';
import '../government/biosecurity_buffer_screen.dart';
import '../government/dbt_batch_disbursal_screen.dart';
import '../government/grain_reserves_screen.dart';
import '../government/fertilizer_logistics_screen.dart';
import '../government/satellite_telemetry_screen.dart';
import '../government/disaster_directives_screen.dart';

// Operations
import '../operations/scorecard_screen.dart';
import '../operations/emergency_sos_screen.dart';
import '../reports/official_reports_screen.dart';
import '../sandbox/simulation_sandbox_screen.dart';

class GovernmentDashboardScreen extends StatefulWidget {
  const GovernmentDashboardScreen({super.key});

  @override
  State<GovernmentDashboardScreen> createState() => _GovernmentDashboardScreenState();
}

class _GovernmentDashboardScreenState extends State<GovernmentDashboardScreen> {
  final String _welfareDisbursed = '₹60.5L';
  final int _activeQuarantineZones = 2;
  final int _certifiedCadre = 42;
  final int _sosAlerts = 0;
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
      await api.getActiveDispatchedDay();
      if (mounted) {
        setState(() => _isLoading = false);
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
        title: 'State Agricultural Command',
        subtitle: '${user?.fullName ?? 'Dr. Vikramaditya Sen'} • ${user?.personaCode ?? 'GOV-001'}',
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
        color: AppColors.roleGovernment,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (_isLoading) ...[
                const LinearProgressIndicator(minHeight: 2, color: AppColors.roleGovernment),
                const SizedBox(height: 8),
              ],

              // State Command Hero Shortcut Banner
              GestureDetector(
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const PestRadarScreen())),
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    gradient: const RadialGradient(
                      center: Alignment.centerLeft,
                      radius: 1.2,
                      colors: [Color(0xFF1E1B4B), Color(0xFF0F172A)],
                    ),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFF818CF8), width: 1.4),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF7C3AED).withValues(alpha: 0.3),
                        blurRadius: 18,
                        offset: const Offset(0, 6),
                      ),
                    ],
                  ),
                  child: const Row(
                    children: [
                      Text('📡', style: TextStyle(fontSize: 34)),
                      SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'STATE PEST SURVEILLANCE RADAR',
                              style: TextStyle(color: Color(0xFFA5B4FC), fontSize: 10.5, fontWeight: FontWeight.w800, letterSpacing: 0.8),
                            ),
                            SizedBox(height: 2),
                            Text(
                              'Aerobiological Vector Spread Simulator',
                              style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w700),
                            ),
                            SizedBox(height: 2),
                            Text(
                              'Active bio-hotspots & automated cordon sanitaires',
                              style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11),
                            ),
                          ],
                        ),
                      ),
                      Icon(Icons.arrow_forward_ios, color: Color(0xFFA5B4FC), size: 16),
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
                      title: 'Welfare Disbursed',
                      value: _welfareDisbursed,
                      subtitle: 'Aadhaar DBT Direct',
                      icon: '💰',
                      iconColor: AppColors.roleGovernment,
                      onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const DbtBatchDisbursalScreen())),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: KpiCard(
                      title: 'Quarantine Cordons',
                      value: '$_activeQuarantineZones Active',
                      subtitle: '3km Buffer Enforced',
                      icon: '🛡️',
                      iconColor: AppColors.danger,
                      onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const BiosecurityBufferScreen())),
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
                      value: '$_certifiedCadre',
                      subtitle: 'PAU-ICAR Licensed',
                      icon: '👩‍🌾',
                      iconColor: AppColors.success,
                      onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ScorecardScreen())),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: KpiCard(
                      title: 'Distress Alerts',
                      value: '$_sosAlerts Active',
                      subtitle: 'Emergency SOS Nom',
                      icon: '🚨',
                      iconColor: AppColors.warning,
                      onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const EmergencySosScreen())),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // Section Title: Operational Actions
              Text(
                'STATE BIOSECURITY & REGULATORY COMMAND',
                style: AppTextStyles.caption.copyWith(
                  fontWeight: FontWeight.w800,
                  letterSpacing: 0.6,
                  color: AppColors.textMuted,
                ),
              ),
              const SizedBox(height: 10),

              _buildOperationTile(
                icon: '📡',
                title: 'Pest Outbreak Radar & Simulation',
                subtitle: 'Vector dispersion models, hotspot spore density & economic loss forecast',
                color: const Color(0xFFDC2626),
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const PestRadarScreen())),
              ),
              const SizedBox(height: 8),

              _buildOperationTile(
                icon: '🛡️',
                title: 'Biosecurity Buffer Zones & Cordons',
                subtitle: 'Enforce statutory quarantine perimeters & chemical misting barriers',
                color: const Color(0xFFD97706),
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const BiosecurityBufferScreen())),
              ),
              const SizedBox(height: 8),

              _buildOperationTile(
                icon: '💳',
                title: 'DBT & PMFBY Batch Disbursals',
                subtitle: 'Aadhaar payment bridge batch authorization for relief & subsidies',
                color: const Color(0xFF059669),
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const DbtBatchDisbursalScreen())),
              ),
              const SizedBox(height: 8),

              _buildOperationTile(
                icon: '🌾',
                title: 'Strategic Grain Buffer Reserves',
                subtitle: 'FCI & Markfed silo stocks, national buffer compliance & OMSS release',
                color: const Color(0xFF2563EB),
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const GrainReservesScreen())),
              ),
              const SizedBox(height: 8),

              _buildOperationTile(
                icon: '🚆',
                title: 'Fertilizer Freight Rake Logistics',
                subtitle: 'Port-to-depot rail movements, Urea/DAP rakes & district rebalancing',
                color: const Color(0xFF4F46E5),
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const FertilizerLogisticsScreen())),
              ),
              const SizedBox(height: 8),

              _buildOperationTile(
                icon: '🛰️',
                title: 'State Orbital Satellite Telemetry',
                subtitle: 'Sentinel-2 & Landsat-9 NDVI, NDWI & SAVI maps across 23 districts',
                color: const Color(0xFF0284C7),
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const SatelliteTelemetryScreen())),
              ),
              const SizedBox(height: 8),

              _buildOperationTile(
                icon: '📜',
                title: 'Emergency Gazette Directives',
                subtitle: 'Statutory orders under Destructive Insects & Pests Act, 1914',
                color: const Color(0xFF7C3AED),
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const DisasterDirectivesScreen())),
              ),
              const SizedBox(height: 8),

              _buildOperationTile(
                icon: '🌐',
                title: '3D Farm Digital Twin Oversight',
                subtitle: 'Audit farm structures, acreage versions and boundary geometries',
                color: AppColors.roleGovernment,
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const DigitalTwin3dScreen())),
              ),
              const SizedBox(height: 8),

              _buildOperationTile(
                icon: '🏅',
                title: 'Workforce Scorecard & Accreditation',
                subtitle: 'Audit cadre accuracy, merit ledger & DBT performance bonus',
                color: AppColors.primary,
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ScorecardScreen())),
              ),
              const SizedBox(height: 8),

              _buildOperationTile(
                icon: '🚨',
                title: 'Emergency SOS Command Center',
                subtitle: 'Real-time satellite distress alerts & ambulance dispatch',
                color: AppColors.danger,
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const EmergencySosScreen())),
              ),
              const SizedBox(height: 8),

              _buildOperationTile(
                icon: '📊',
                title: 'Official State Regulatory Reports',
                subtitle: 'Gazette digest, biosecurity cordons and financial audits',
                color: AppColors.textPrimary,
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const OfficialReportsScreen())),
              ),
              const SizedBox(height: 8),

              _buildOperationTile(
                icon: '⚡',
                title: 'Judge\'s Simulation Sandbox',
                subtitle: 'Trigger state-wide disaster shocks & verify automated response',
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
