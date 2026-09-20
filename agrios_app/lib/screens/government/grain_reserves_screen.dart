import 'package:flutter/material.dart';
import '../../constants/app_colors.dart';
import '../../constants/app_text_styles.dart';
import '../../widgets/common_app_bar.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/status_badge.dart';

class GrainReservesScreen extends StatefulWidget {
  const GrainReservesScreen({super.key});

  @override
  State<GrainReservesScreen> createState() => _GrainReservesScreenState();
}

class _GrainReservesScreenState extends State<GrainReservesScreen> {
  void _triggerOMSSRelease() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Trigger OMSS Release', style: AppTextStyles.h3),
        content: const Text('Are you sure you want to trigger Open Market Sale Scheme release for price stabilization?', style: AppTextStyles.body),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          CustomButton(
            text: 'Confirm Release',
            onPressed: () {
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('OMSS Release Triggered Successfully.')),
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
        title: 'Strategic Grain Reserves',
        subtitle: 'Food Buffer & Silo AI Spoilage Monitor',
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Card(
              child: Padding(
                padding: EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Total State Buffer Stock', style: AppTextStyles.h2),
                    SizedBox(height: 8),
                    Text('14.8 LMT', style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: AppColors.primaryDark)),
                    Text('Across PUNSUP, Markfed, and FCI Silos', style: AppTextStyles.subtitle),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            const Text('Stock Breakdown', style: AppTextStyles.h3),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: Card(
                    color: AppColors.warningBg,
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        children: [
                          const Icon(Icons.grass, color: AppColors.warning, size: 32),
                          const SizedBox(height: 8),
                          const Text('Wheat', style: AppTextStyles.bodyBold),
                          Text('9.2 LMT', style: AppTextStyles.h3.copyWith(color: AppColors.warning)),
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Card(
                    color: AppColors.infoBg,
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        children: [
                          const Icon(Icons.rice_bowl, color: AppColors.info, size: 32),
                          const SizedBox(height: 8),
                          const Text('Rice', style: AppTextStyles.bodyBold),
                          Text('5.6 LMT', style: AppTextStyles.h3.copyWith(color: AppColors.info)),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            const Text('Compliance & Actions', style: AppTextStyles.h3),
            const SizedBox(height: 12),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  children: [
                    const Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Food Security Norms', style: AppTextStyles.bodyBold),
                        StatusBadge(text: '142% Above Norm', type: BadgeType.success),
                      ],
                    ),
                    const Divider(height: 32),
                    SizedBox(
                      width: double.infinity,
                      child: CustomButton(
                        text: 'Trigger OMSS Price Stabilization Release',
                        variant: ButtonVariant.primary,
                        icon: const Icon(Icons.price_check, color: Colors.white, size: 18),
                        onPressed: _triggerOMSSRelease,
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
}
