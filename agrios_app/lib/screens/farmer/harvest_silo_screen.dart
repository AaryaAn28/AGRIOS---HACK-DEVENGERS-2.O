import 'package:flutter/material.dart';
import '../../constants/app_colors.dart';
import '../../constants/app_text_styles.dart';
import '../../widgets/common_app_bar.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/status_badge.dart';

class HarvestSiloScreen extends StatefulWidget {
  const HarvestSiloScreen({super.key});

  @override
  State<HarvestSiloScreen> createState() => _HarvestSiloScreenState();
}

class _HarvestSiloScreenState extends State<HarvestSiloScreen> {
  bool fansActive = true;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: const CommonAppBar(title: 'Harvest Yield & Silo Monitor', subtitle: 'AI Spoilage Storage Monitor'),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Yield Forecaster', style: AppTextStyles.h2),
            const Card(
              child: Padding(
                padding: EdgeInsets.all(16),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Forecasted Grain Yield:', style: AppTextStyles.body),
                        Text('21.5 Quintals/Acre', style: AppTextStyles.h2),
                      ],
                    ),
                    SizedBox(height: 8),
                    Text('Based on NDVI and GDD analysis', style: AppTextStyles.caption),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            const Text('Silo Sensor Telemetry', style: AppTextStyles.h2),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    _buildTelemetryRow('Internal Temperature', '24.2°C', BadgeType.info),
                    const Divider(),
                    _buildTelemetryRow('Relative Humidity', '58%', BadgeType.success),
                    const Divider(),
                    _buildTelemetryRow('CO2 Concentration', '420 ppm', BadgeType.warning),
                    const Divider(),
                    _buildTelemetryRow('Spoilage Risk Index', '3.4% - Safe', BadgeType.success),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            const Text('Silo Controls', style: AppTextStyles.h2),
            SwitchListTile(
              title: const Text('Automated Silo Aeration Fans'),
              value: fansActive,
              onChanged: (v) => setState(() => fansActive = v),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: CustomButton(
                    text: 'Emergency Purge',
                    variant: ButtonVariant.danger,
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Emergency Purge Activated!')));
                    },
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: CustomButton(
                    text: 'Fumigation Trigger',
                    variant: ButtonVariant.secondary,
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Fumigation Triggered!')));
                    },
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTelemetryRow(String label, String value, BadgeType type) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: AppTextStyles.bodyBold),
          StatusBadge(text: value, type: type),
        ],
      ),
    );
  }
}
