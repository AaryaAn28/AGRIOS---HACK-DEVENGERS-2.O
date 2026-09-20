import 'package:flutter/material.dart';
import '../../constants/app_colors.dart';
import '../../constants/app_text_styles.dart';
import '../../widgets/common_app_bar.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/status_badge.dart';

class CropPlanEngineScreen extends StatefulWidget {
  const CropPlanEngineScreen({super.key});

  @override
  State<CropPlanEngineScreen> createState() => _CropPlanEngineScreenState();
}

class _CropPlanEngineScreenState extends State<CropPlanEngineScreen> {
  String selectedCrop = 'PBW-550 Wheat';
  final List<String> crops = ['PBW-550 Wheat', 'Basmati Rice', 'Mustard', 'Cotton'];
  double currentDay = 1.0;
  bool frostAlert = false;
  bool heatStress = false;

  void _dispatchDirective() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Confirm Dispatch'),
        content: Text('Dispatch Day ${currentDay.toInt()} directive for $selectedCrop?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          CustomButton(
            text: 'Confirm',
            onPressed: () {
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Directive dispatched successfully!')),
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
      appBar: const CommonAppBar(title: 'Master Crop Growing Plan Engine', subtitle: '60-120 Day Calendar'),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Select Crop Variant', style: AppTextStyles.h2),
            const SizedBox(height: 8),
            DropdownButtonFormField<String>(
              value: selectedCrop,
              items: crops.map((c) => DropdownMenuItem(value: c, child: Text(c))).toList(),
              onChanged: (v) => setState(() => selectedCrop = v!),
              decoration: const InputDecoration(border: OutlineInputBorder()),
            ),
            const SizedBox(height: 16),
            const Text('Weather Adaptation Triggers', style: AppTextStyles.h2),
            SwitchListTile(
              title: const Text('Frost Alert (+3 days delay)'),
              value: frostAlert,
              onChanged: (v) => setState(() => frostAlert = v),
            ),
            SwitchListTile(
              title: const Text('Heat Stress (+20% irrigation volume)'),
              value: heatStress,
              onChanged: (v) => setState(() => heatStress = v),
            ),
            const SizedBox(height: 16),
            const Text('Day Directive Dispatcher', style: AppTextStyles.h2),
            Slider(
              value: currentDay,
              min: 1,
              max: 120,
              divisions: 119,
              label: 'Day ${currentDay.toInt()}',
              onChanged: (v) => setState(() => currentDay = v),
            ),
            Text('Active Day: ${currentDay.toInt()}', style: AppTextStyles.bodyBold),
            const SizedBox(height: 16),
            const Text('Stage Timeline', style: AppTextStyles.h2),
            _buildTimeline(),
            const SizedBox(height: 24),
            CustomButton(text: 'Dispatch Day Directive', onPressed: _dispatchDirective, width: double.infinity),
          ],
        ),
      ),
    );
  }

  Widget _buildTimeline() {
    final stages = [
      {'title': 'Stage 0 Pre-sowing', 'day': 1},
      {'title': 'Stage 1 Crown Root Initiation', 'day': 21},
      {'title': 'Stage 2 Tillering', 'day': 45},
      {'title': 'Stage 3 Jointing/Booting', 'day': 65},
      {'title': 'Stage 4 Flowering', 'day': 85},
      {'title': 'Stage 5 Grain Filling/Maturity', 'day': 110},
    ];

    return Column(
      children: stages.map((s) {
        final day = s['day'] as int;
        final isActive = currentDay >= day;
        return ListTile(
          leading: StatusBadge(
            text: 'Day $day',
            type: isActive ? BadgeType.success : BadgeType.neutral,
          ),
          title: Text(s['title'] as String, style: AppTextStyles.bodyBold),
        );
      }).toList(),
    );
  }
}
