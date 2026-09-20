import 'package:flutter/material.dart';
import '../../constants/app_colors.dart';
import '../../constants/app_text_styles.dart';
import '../../services/api_service.dart';
import '../../widgets/common_app_bar.dart';
import '../../widgets/status_badge.dart';
import '../reports/official_reports_screen.dart';

class EmergencySosScreen extends StatefulWidget {
  const EmergencySosScreen({super.key});

  @override
  State<EmergencySosScreen> createState() => _EmergencySosScreenState();
}

class _EmergencySosScreenState extends State<EmergencySosScreen> {
  bool _isSosActive = false;
  bool _isBroadcasting = false;
  
  bool _isLoading = true;
  Map<String, dynamic>? _stressData;
  List<Map<String, dynamic>> _protocols = [];

  @override
  void initState() {
    super.initState();
    _loadData();
  }
  
  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    final stress = await ApiService().getBiophysicalStress();
    final protos = await ApiService().getEmergencyProtocols();
    if (mounted) {
      setState(() {
        _stressData = stress;
        _protocols = protos;
        _isLoading = false;
      });
    }
  }

  void _confirmAndTriggerSos() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFFFEF2F2),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: const BorderSide(color: AppColors.danger, width: 2),
        ),
        title: Row(
          children: const [
            Text('🚨 ', style: TextStyle(fontSize: 24)),
            Expanded(
              child: Text(
                'TRIGGER EMERGENCY DISTRESS BEACON?',
                style: TextStyle(color: AppColors.danger, fontWeight: FontWeight.w800, fontSize: 14),
              ),
            ),
          ],
        ),
        content: const Text(
          'This will immediately broadcast satellite GPS coordinates to 108 Emergency Ambulance, KVK Mobile Clinic, and Dr. Priya Sharma.',
          style: AppTextStyles.body,
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.danger),
            onPressed: () async {
              Navigator.pop(ctx);
              setState(() => _isBroadcasting = true);
              await ApiService().triggerEmergencySos({
                'worker_id': 'WORKER-001',
                'worker_name': 'Sunita Devi',
                'gps_lat': 30.9010,
                'gps_lon': 75.8573,
                'emergency_type': 'Field Calamity / Medical SOS',
                'details': 'Distress beacon triggered via AGRIOS Android Mobile App.',
              });
              if (mounted) {
                setState(() {
                  _isBroadcasting = false;
                  _isSosActive = true;
                });
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('🚨 SOS BROADCAST ACTIVE! Emergency services and agronomist alerted.'),
                    backgroundColor: AppColors.danger,
                    duration: Duration(seconds: 5),
                  ),
                );
              }
            },
            child: const Text('TRANSMIT SOS NOW', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: CommonAppBar(
        title: 'Emergency SOS & Biophysics',
        subtitle: 'Medical First Aid & ISO 7243 Heat Safety',
        actions: [
          IconButton(
            icon: const Icon(Icons.description_outlined, color: Colors.white),
            tooltip: 'Safety Report',
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => const OfficialReportsScreen(initialReportType: 'emergency'),
              ),
            ),
          ),
        ],
      ),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
        : SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Big SOS Distress Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: _isSosActive ? const Color(0xFFFEF2F2) : AppColors.surface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.danger, width: 2),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.danger.withOpacity(0.2),
                    blurRadius: 16,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: Column(
                children: [
                  StatusBadge(
                    text: _isSosActive ? '🚨 DISTRESS BEACON ACTIVE' : 'SATELLITE DISTRESS STANDBY',
                    type: BadgeType.danger,
                  ),
                  const SizedBox(height: 16),
                  GestureDetector(
                    onTap: _isBroadcasting ? null : _confirmAndTriggerSos,
                    child: Container(
                      width: 110,
                      height: 110,
                      decoration: BoxDecoration(
                        color: AppColors.danger,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.danger.withOpacity(0.4),
                            blurRadius: 20,
                            spreadRadius: 4,
                          ),
                        ],
                      ),
                      alignment: Alignment.center,
                      child: _isBroadcasting
                          ? const CircularProgressIndicator(color: Colors.white)
                          : const Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.warning_amber_rounded, size: 36, color: Colors.white),
                                Text(
                                  'SOS',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 20,
                                    fontWeight: FontWeight.w900,
                                    letterSpacing: 1.5,
                                  ),
                                ),
                              ],
                            ),
                    ),
                  ),
                  const SizedBox(height: 14),
                  Text(
                    'Tap to broadcast live GPS coordinates to 108 Ambulance and Regional KVK Extension Cell.',
                    textAlign: TextAlign.center,
                    style: AppTextStyles.caption.copyWith(fontSize: 11.5),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Biophysical Heat Stress Gauge Card
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFBAE6FD)),
                boxShadow: AppColors.softShadow,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'ISO 7243 WBGT HEAT STRAIN MONITOR',
                        style: AppTextStyles.caption.copyWith(
                          color: AppColors.info,
                          fontWeight: FontWeight.w800,
                          fontSize: 10.5,
                        ),
                      ),
                      const StatusBadge(text: 'Moderate Strain', type: BadgeType.info),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('${_stressData?['wbgt_index'] ?? 29.4}°C WBGT', style: AppTextStyles.h2.copyWith(color: const Color(0xFF0369A1))),
                            Text('Ambient: ${_stressData?['temperature'] ?? '33.5°C'} • RH: ${_stressData?['humidity'] ?? '62%'}', style: AppTextStyles.caption),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          color: AppColors.infoBg,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Column(
                          children: [
                            const Text('Rest Allocation', style: AppTextStyles.caption),
                            Text('${_stressData?['heat_risk_level'] == 'HIGH' ? '15 Mins / Hr' : '10 Mins / Hr'}', style: AppTextStyles.bodyBold),
                          ],
                        ),
                      ),
                    ],
                  ),
                  if (_stressData?['recommendations'] != null) ...[
                    const SizedBox(height: 12),
                    ...(_stressData!['recommendations'] as List).map((r) => Padding(
                      padding: const EdgeInsets.only(bottom: 4),
                      child: Text('• $r', style: AppTextStyles.caption.copyWith(color: AppColors.info)),
                    )),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 20),

            // SOPs
            Text(
              'STANDARD OPERATING PROCEDURES (SOPs)',
              style: AppTextStyles.caption.copyWith(
                fontWeight: FontWeight.w800,
                letterSpacing: 0.6,
                color: AppColors.textMuted,
              ),
            ),
            const SizedBox(height: 10),

            ..._protocols.map((p) => Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: _buildSopTile(p['title'], (p['steps'] as List).join('\n')),
            )),
          ],
        ),
      ),
    );
  }

  Widget _buildSopTile(String title, String details) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.cardBorder),
        boxShadow: AppColors.softShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.shield_outlined, size: 16, color: AppColors.danger),
              const SizedBox(width: 8),
              Expanded(child: Text(title, style: AppTextStyles.bodyBold.copyWith(fontSize: 13))),
            ],
          ),
          const SizedBox(height: 4),
          Text(details, style: AppTextStyles.caption.copyWith(height: 1.35, color: AppColors.textSecondary)),
        ],
      ),
    );
  }
}
