import 'package:flutter/material.dart';
import '../../constants/app_colors.dart';
import '../../constants/app_text_styles.dart';
import '../../widgets/common_app_bar.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/status_badge.dart';

class FertilizerLogisticsScreen extends StatefulWidget {
  const FertilizerLogisticsScreen({super.key});

  @override
  State<FertilizerLogisticsScreen> createState() => _FertilizerLogisticsScreenState();
}

class _FertilizerLogisticsScreenState extends State<FertilizerLogisticsScreen> {
  final List<Map<String, dynamic>> _rakes = [
    {
      'source': 'Mundra Port',
      'destination': 'Ludhiana Railhead',
      'cargo': '1,800 MT Urea',
      'status': 'In Transit',
      'badge': BadgeType.warning,
    },
    {
      'source': 'Kandla Port',
      'destination': 'Dhuri Railhead',
      'cargo': '2,400 MT DAP',
      'status': 'Unloading at Depot',
      'badge': BadgeType.info,
    },
    {
      'source': 'Kandla Port',
      'destination': 'Bathinda Railhead',
      'cargo': '1,500 MT NPK 12:32:16',
      'status': 'Scheduled Departure',
      'badge': BadgeType.neutral,
    },
  ];

  void _showRequisitionForm() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) {
        return Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom,
            left: 16,
            right: 16,
            top: 24,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('District Stock Rebalancing Requisition', style: AppTextStyles.h2),
              const SizedBox(height: 16),
              const TextField(
                decoration: InputDecoration(
                  labelText: 'Target District',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),
              const TextField(
                decoration: InputDecoration(
                  labelText: 'Fertilizer Type (Urea/DAP/NPK)',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),
              const TextField(
                keyboardType: TextInputType.number,
                decoration: InputDecoration(
                  labelText: 'Quantity (MT)',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: CustomButton(
                  text: 'Submit Requisition',
                  onPressed: () {
                    Navigator.pop(context);
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Requisition submitted to Rail Logistics Control.')),
                    );
                  },
                ),
              ),
              const SizedBox(height: 16),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: const CommonAppBar(
        title: 'Fertilizer Logistics Tracker',
        subtitle: 'Rail Freight Rake Movements',
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _rakes.length,
        itemBuilder: (context, index) {
          final rake = _rakes[index];
          return Card(
            margin: const EdgeInsets.only(bottom: 12),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(rake['cargo'], style: AppTextStyles.h3),
                      StatusBadge(text: rake['status'], type: rake['badge']),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      const Icon(Icons.directions_transit, color: AppColors.textMuted, size: 20),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text('${rake['source']} ➔ ${rake['destination']}', style: AppTextStyles.bodyBold),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          );
        },
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showRequisitionForm,
        backgroundColor: AppColors.primary,
        icon: const Icon(Icons.sync_alt, color: Colors.white),
        label: const Text('Rebalance Stock', style: TextStyle(color: Colors.white)),
      ),
    );
  }
}
