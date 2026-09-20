import 'package:flutter/material.dart';
import '../../constants/app_colors.dart';
import '../../constants/app_text_styles.dart';
import '../../widgets/common_app_bar.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/status_badge.dart';

class PestRadarScreen extends StatefulWidget {
  const PestRadarScreen({super.key});

  @override
  State<PestRadarScreen> createState() => _PestRadarScreenState();
}

class _PestRadarScreenState extends State<PestRadarScreen> {
  int _forecastHorizon = 7;
  bool _isSimulating = false;
  double _spreadRadius = 12.5;
  int _acreageAtRisk = 4500;
  double _economicLossAtRisk = 125.0;

  final List<Map<String, dynamic>> _hotspots = [
    {
      'district': 'Ludhiana',
      'pest': 'Yellow Rust',
      'severity': BadgeType.danger,
    },
    {
      'district': 'Bathinda',
      'pest': 'Whitefly Vector',
      'severity': BadgeType.warning,
    },
    {
      'district': 'Sangrur',
      'pest': 'Stem Borer',
      'severity': BadgeType.warning,
    },
    {
      'district': 'Firozpur',
      'pest': 'Pink Bollworm',
      'severity': BadgeType.danger,
    },
  ];

  void _runSimulation() async {
    setState(() {
      _isSimulating = true;
    });
    
    await Future.delayed(const Duration(seconds: 2));
    
    setState(() {
      _isSimulating = false;
      if (_forecastHorizon == 7) {
        _spreadRadius = 12.5;
        _acreageAtRisk = 4500;
        _economicLossAtRisk = 125.0;
      } else if (_forecastHorizon == 14) {
        _spreadRadius = 28.0;
        _acreageAtRisk = 12000;
        _economicLossAtRisk = 350.5;
      } else {
        _spreadRadius = 65.4;
        _acreageAtRisk = 35000;
        _economicLossAtRisk = 980.0;
      }
    });

    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Vector dispersion simulation completed.')),
    );
  }

  void _declareCordon() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Declare Containment Cordon', style: AppTextStyles.h2),
        content: const Text('Are you sure you want to declare a biosecurity containment cordon? This will notify all local authorities.', style: AppTextStyles.body),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          CustomButton(
            text: 'Declare Cordon',
            variant: ButtonVariant.danger,
            onPressed: () {
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Containment cordon declared successfully.')),
              );
            },
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: const CommonAppBar(
        title: 'Pest Radar Surveillance',
        subtitle: 'State Pest Outbreak & Vector Dispersion',
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Active Vector Hotspots', style: AppTextStyles.h2),
            const SizedBox(height: 12),
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: _hotspots.length,
              itemBuilder: (context, index) {
                final spot = _hotspots[index];
                return Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: ListTile(
                    leading: const Icon(Icons.bug_report, color: AppColors.danger),
                    title: Text(spot['district'], style: AppTextStyles.bodyBold),
                    subtitle: Text(spot['pest'], style: AppTextStyles.subtitle),
                    trailing: StatusBadge(
                      text: spot['severity'] == BadgeType.danger ? 'Critical' : 'Warning',
                      type: spot['severity'],
                    ),
                  ),
                );
              },
            ),
            const SizedBox(height: 24),
            const Text('Spatiotemporal Vector Dispersion Simulator', style: AppTextStyles.h2),
            const SizedBox(height: 12),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Forecast Horizon', style: AppTextStyles.bodyBold),
                    const SizedBox(height: 8),
                    SegmentedButton<int>(
                      segments: const [
                        ButtonSegment(value: 7, label: Text('7 Days')),
                        ButtonSegment(value: 14, label: Text('14 Days')),
                        ButtonSegment(value: 30, label: Text('30 Days')),
                      ],
                      selected: {_forecastHorizon},
                      onSelectionChanged: (Set<int> newSelection) {
                        setState(() {
                          _forecastHorizon = newSelection.first;
                        });
                      },
                    ),
                    const SizedBox(height: 24),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        _buildStatItem('Spread Radius', '$_spreadRadius km'),
                        _buildStatItem('At Risk Acreage', '$_acreageAtRisk ac'),
                        _buildStatItem('Econ. Loss', '₹$_economicLossAtRisk L'),
                      ],
                    ),
                    const SizedBox(height: 24),
                    SizedBox(
                      width: double.infinity,
                      child: CustomButton(
                        text: 'Run Vector Spread Simulation',
                        isLoading: _isSimulating,
                        icon: const Icon(Icons.radar, color: Colors.white, size: 18),
                        onPressed: _runSimulation,
                      ),
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: CustomButton(
                        text: '🛡️ Declare Containment Cordon',
                        variant: ButtonVariant.danger,
                        onPressed: _declareCordon,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatItem(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: AppTextStyles.caption),
        const SizedBox(height: 4),
        Text(value, style: AppTextStyles.h3.copyWith(color: AppColors.primaryDark)),
      ],
    );
  }
}
