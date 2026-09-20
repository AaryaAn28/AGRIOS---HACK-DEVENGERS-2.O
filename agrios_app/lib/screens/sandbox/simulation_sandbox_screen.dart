import 'package:flutter/material.dart';
import '../../constants/app_colors.dart';
import '../../constants/app_text_styles.dart';
import '../../widgets/common_app_bar.dart';
import '../../widgets/custom_button.dart';

class SimulationSandboxScreen extends StatefulWidget {
  const SimulationSandboxScreen({super.key});

  @override
  State<SimulationSandboxScreen> createState() => _SimulationSandboxScreenState();
}

class _SimulationSandboxScreenState extends State<SimulationSandboxScreen> {
  String? _activeEmergency;
  final List<Map<String, dynamic>> _eventLog = [];

  final List<Map<String, dynamic>> _disasters = [
    {
      'id': 'HAILSTORM',
      'title': '⚡ Severe Hailstorm Strike (Day 30)',
      'severity': 'CRITICAL',
      'icon': '🌩️',
      'color': Colors.blueGrey,
      'description': '30mm hailstones over Ludhiana North Sector. Triggers instant -38% NDVI foliar loss, auto-generates 4 emergency tasks, and files PMFBY insurance claims.',
      'effects': [
        'NDVI Vigor: Drops from 0.82 to 0.44',
        'Krishi Sakhi: Dispatches Foliar Damage Assessment Task',
        'Agronomist: Generates Micronutrient Recovery Spray',
        'Government: Declares District Compensation Directive',
      ],
    },
    {
      'id': 'WHITEFLY',
      'title': '🐛 Whitefly Vector Swarm Invasion (Day 48)',
      'severity': 'HIGH_BIOSECURITY',
      'icon': '🦟',
      'color': Colors.amber,
      'description': 'Aerobiological wind vector carries Bemisia tabaci across Bathinda basin. Triggers Pest Radar warning and automated 3km Biosecurity Cordon Sanitaire.',
      'effects': [
        'Pest Radar: Vector spore density 48 spores/m³',
        'Buffer Zone: Auto-activates 3km containment perimeter',
        'Agronomist: Issues Tilt 25% EC + Neem Oil prescription',
        'Krishi Sakhi: Dispatched for border misting check',
      ],
    },
    {
      'id': 'CANAL_BREACH',
      'title': '🌊 Sirhind Canal Inundation Breach (Day 15)',
      'severity': 'HIGH',
      'icon': '🌊',
      'color': Colors.cyan,
      'description': 'Secondary irrigation canal breach floods East Cereal Field. TDR probes alarm at 48% saturation. Auto-triggers solar drainage pump activation.',
      'effects': [
        'Soil Moisture: Spikes to 48.2% (Anoxic risk)',
        'Farmer: Emergency solar drain pump activated',
        'Krishi Sakhi: Soil drainage diversion task issued',
        'Government: Irrigation dept notified via event bus',
      ],
    },
    {
      'id': 'HEATWAVE',
      'title': '☀️ ISO 7243 WBGT Severe Heatwave (Day 65)',
      'severity': 'WARNING',
      'icon': '🌡️',
      'color': Colors.deepOrange,
      'description': 'Ambient temperature 43.5°C with WBGT index 33.2°C. Triggers mandatory 45-min rest advisory per hour for field cadre and micro-drip wetting cycles.',
      'effects': [
        'WBGT Heat Index: 33.2°C (Category IV Critical)',
        'Workforce: Mandatory rest alarm broadcast',
        'Farmer: Micro-sprinkler canopy cooling active',
        'Agronomist: Anti-transpirant spray advisory',
      ],
    },
  ];

  void _triggerDisaster(Map<String, dynamic> disaster) {
    setState(() {
      _activeEmergency = disaster['id'];
      _eventLog.insert(0, {
        'time': 'Just now',
        'title': disaster['title'],
        'effects': disaster['effects'],
      });
    });

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Row(
          children: [
            Text(disaster['icon'], style: const TextStyle(fontSize: 22)),
            const SizedBox(width: 8),
            const Expanded(child: Text('Emergency Triggered!', style: AppTextStyles.h3)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(disaster['description'], style: AppTextStyles.body),
            const SizedBox(height: 12),
            const Text('SYSTEM RESPONSE PROPAGATION:', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: AppColors.primaryDark)),
            const SizedBox(height: 6),
            ...((disaster['effects'] as List).map((eff) => Padding(
                  padding: const EdgeInsets.only(bottom: 4),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('• ', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold)),
                      Expanded(child: Text(eff, style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w600))),
                    ],
                  ),
                ))),
          ],
        ),
        actions: [
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Acknowledge & Observe Portals', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  void _resetSimulation() {
    setState(() {
      _activeEmergency = null;
      _eventLog.clear();
    });
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('✓ Simulation sandbox reset to baseline nominal parameters.'), backgroundColor: AppColors.primary),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: CommonAppBar(
        title: '🧪 Judge\'s Simulation Sandbox',
        subtitle: 'Trigger Stresses & Observe System-Wide Reaction',
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.white),
            tooltip: 'Reset Sandbox',
            onPressed: _resetSimulation,
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Intro Banner
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF1E293B), Color(0xFF0F172A)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFF334155)),
              ),
              child: const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text('⚖️ ', style: TextStyle(fontSize: 20)),
                      Text(
                        'HACKATHON EVALUATION SUITE',
                        style: TextStyle(color: Color(0xFF38BDF8), fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 0.6),
                      ),
                    ],
                  ),
                  SizedBox(height: 6),
                  Text('Cross-Portal Shock Test Lab', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w800)),
                  SizedBox(height: 2),
                  Text(
                    'Trigger catastrophic climate, pest vector, or water breaches below to verify automated cross-portal event bus propagation across Agronomist, Farmer, Government, and Krishi Sakhi.',
                    style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11.5),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Disasters List
            const Text('SELECT TEST SHOCK EVENT:', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: AppColors.textMuted)),
            const SizedBox(height: 8),

            ..._disasters.map((d) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                        color: _activeEmergency == d['id'] ? d['color'] : const Color(0xFFE2E8F0),
                        width: _activeEmergency == d['id'] ? 2.0 : 1.0,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: (d['color'] as Color).withValues(alpha: 0.08),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text(d['icon'], style: const TextStyle(fontSize: 24)),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(d['title'], style: AppTextStyles.bodyBold),
                                  const SizedBox(height: 2),
                                  Text(
                                    d['description'],
                                    style: AppTextStyles.caption.copyWith(fontSize: 11),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        CustomButton(
                          text: _activeEmergency == d['id'] ? 'Active Emergency Running' : 'Trigger ${d['id']}',
                          variant: _activeEmergency == d['id'] ? ButtonVariant.danger : ButtonVariant.primary,
                          onPressed: () => _triggerDisaster(d),
                        ),
                      ],
                    ),
                  ),
                )),

            const SizedBox(height: 12),

            // Event Log
            if (_eventLog.isNotEmpty) ...[
              const Text('DISPATCH LOG AUDIT TRAIL:', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: AppColors.textMuted)),
              const SizedBox(height: 8),
              ..._eventLog.map((log) => Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: const Color(0xFFCBD5E1)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(log['title'], style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800)),
                            Text(log['time'], style: const TextStyle(fontSize: 10, color: AppColors.textMuted)),
                          ],
                        ),
                        const SizedBox(height: 4),
                        ...((log['effects'] as List).map((e) => Text('• $e', style: const TextStyle(fontSize: 10.5, color: Color(0xFF334155))))),
                      ],
                    ),
                  )),
            ],
          ],
        ),
      ),
    );
  }
}
