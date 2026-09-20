import 'package:flutter/material.dart';
import '../../constants/app_colors.dart';
import '../../constants/app_text_styles.dart';
import '../../services/api_service.dart';
import '../../services/auth_service.dart';
import '../../widgets/common_app_bar.dart';
import '../../widgets/kpi_card.dart';

// 3D Twin & Farmer Screens
import '../3d_twin/digital_twin_3d_screen.dart';
import '../farmer/machinery_booking_screen.dart';
import '../farmer/harvest_silo_screen.dart';
import '../farmer/mandi_prices_screen.dart';
import '../farmer/subsidy_schemes_screen.dart';

// Operations
import '../operations/ground_truth_screen.dart';
import '../operations/equipment_kit_screen.dart';
import '../operations/hotline_screen.dart';
import '../reports/official_reports_screen.dart';
import '../sandbox/simulation_sandbox_screen.dart';

class FarmerDashboardScreen extends StatefulWidget {
  const FarmerDashboardScreen({super.key});

  @override
  State<FarmerDashboardScreen> createState() => _FarmerDashboardScreenState();
}

class _FarmerDashboardScreenState extends State<FarmerDashboardScreen> {
  String _soilMoisture = '26.8%';
  final String _foliarHealth = '95.2%';
  final String _weatherRisk = 'Low';
  int _activeTasks = 0;
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
      final groundTruth = await api.getGroundTruthLogs();
      final tasks = await api.getTasks();

      if (mounted) {
        setState(() {
          if (groundTruth.isNotEmpty) {
            _soilMoisture = '${groundTruth.first.soilMoisturePct}%';
          }
          _activeTasks = tasks.where((t) => !t.isCompleted).length;
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
        title: 'Farmer Custodian Portal',
        subtitle: '${user?.fullName ?? 'Balwinder Singh'} • ${user?.personaCode ?? 'FARMER-001'}',
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
        color: AppColors.roleFarmer,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (_isLoading) ...[
                const LinearProgressIndicator(minHeight: 2, color: AppColors.roleFarmer),
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
                    border: Border.all(color: const Color(0xFF10B981), width: 1.4),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF10B981).withValues(alpha: 0.3),
                        blurRadius: 18,
                        offset: const Offset(0, 6),
                      ),
                    ],
                  ),
                  child: const Row(
                    children: [
                      Text('🌾', style: TextStyle(fontSize: 34)),
                      SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'LIVING FARM 3D TWIN',
                              style: TextStyle(color: Color(0xFF34D399), fontSize: 10.5, fontWeight: FontWeight.w800, letterSpacing: 0.8),
                            ),
                            SizedBox(height: 2),
                            Text(
                              'Greenfield Model Farm (14.2 Ha)',
                              style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w700),
                            ),
                            SizedBox(height: 2),
                            Text(
                              'Interactive 3D crops, ponds, and parcel health',
                              style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11),
                            ),
                          ],
                        ),
                      ),
                      Icon(Icons.arrow_forward_ios, color: Color(0xFF34D399), size: 16),
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
                      title: 'Soil Moisture',
                      value: _soilMoisture,
                      subtitle: 'Micro-Trial Plot',
                      icon: '💧',
                      iconColor: AppColors.info,
                      onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const GroundTruthScreen())),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: KpiCard(
                      title: 'Foliar Health',
                      value: _foliarHealth,
                      subtitle: 'NDVI Calibrated',
                      icon: '🌿',
                      iconColor: AppColors.roleFarmer,
                      onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const GroundTruthScreen())),
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
                      value: _weatherRisk,
                      subtitle: 'Clear Skies',
                      icon: '☀️',
                      iconColor: AppColors.warning,
                      onTap: () {},
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: KpiCard(
                      title: 'Active Tasks',
                      value: '$_activeTasks',
                      subtitle: 'Field Operations',
                      icon: '🚜',
                      iconColor: AppColors.primary,
                      onTap: () {},
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // Section Title: Operational Actions
              Text(
                'FARM HOLDING OPERATIONS & TOOLS',
                style: AppTextStyles.caption.copyWith(
                  fontWeight: FontWeight.w800,
                  letterSpacing: 0.6,
                  color: AppColors.textMuted,
                ),
              ),
              const SizedBox(height: 10),

              _buildOperationTile(
                icon: '🌐',
                title: '3D Living Farm Model',
                subtitle: 'Explore 3D parcels, aquaculture pond & polyhouse status',
                color: AppColors.roleFarmer,
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const DigitalTwin3dScreen())),
              ),
              const SizedBox(height: 8),

              _buildOperationTile(
                icon: '🚜',
                title: 'Precision Machinery & Drone Booking',
                subtitle: 'Laser leveler, 16L drone sprayer & combine harvester CHC hire',
                color: const Color(0xFFD97706),
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const MachineryBookingScreen())),
              ),
              const SizedBox(height: 8),

              _buildOperationTile(
                icon: '🏛️',
                title: 'Harvest Forecaster & Silo Aeration',
                subtitle: 'Grain yield projection, spoilage risk index & aeration fan controls',
                color: const Color(0xFF0284C7),
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const HarvestSiloScreen())),
              ),
              const SizedBox(height: 8),

              _buildOperationTile(
                icon: '📈',
                title: 'Live APMC Mandi Market Prices',
                subtitle: 'Real-time Khanna, Ludhiana & APMC trade rates & MSP trends',
                color: const Color(0xFF16A34A),
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const MandiPricesScreen())),
              ),
              const SizedBox(height: 8),

              _buildOperationTile(
                icon: '📑',
                title: 'PM-KISAN & Subsidy Applications',
                subtitle: 'Direct DBT claims, PMFBY crop insurance & solar pump subsidy',
                color: const Color(0xFF7C3AED),
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const SubsidySchemesScreen())),
              ),
              const SizedBox(height: 8),

              _buildOperationTile(
                icon: '📡',
                title: 'Ground Truth Telemetry',
                subtitle: 'View micro-plot moisture, canopy coverage & nitrogen levels',
                color: AppColors.info,
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const GroundTruthScreen())),
              ),
              const SizedBox(height: 8),

              _buildOperationTile(
                icon: '🧰',
                title: 'Equipment & Precision Tools',
                subtitle: 'Check equipment wear, TDR probes, and battery levels',
                color: AppColors.warning,
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const EquipmentKitScreen())),
              ),
              const SizedBox(height: 8),

              _buildOperationTile(
                icon: '💬',
                title: 'Agronomist Advisory Hotline',
                subtitle: 'Direct helpline with Dr. Priya Sharma and PAU scientists',
                color: AppColors.primaryDark,
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const HotlineScreen())),
              ),
              const SizedBox(height: 8),

              _buildOperationTile(
                icon: '📊',
                title: 'Official Farm Audit Reports',
                subtitle: 'Export Punjab Department of Agriculture verified records',
                color: AppColors.textPrimary,
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const OfficialReportsScreen())),
              ),
              const SizedBox(height: 8),

              _buildOperationTile(
                icon: '⚡',
                title: 'Judge\'s Simulation Sandbox',
                subtitle: 'Trigger hailstorms, pest outbreaks & observe farm reaction',
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
