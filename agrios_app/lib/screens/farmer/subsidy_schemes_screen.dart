import 'package:flutter/material.dart';
import '../../constants/app_colors.dart';
import '../../constants/app_text_styles.dart';
import '../../widgets/common_app_bar.dart';
import '../../widgets/custom_button.dart';

class SubsidySchemesScreen extends StatefulWidget {
  const SubsidySchemesScreen({super.key});

  @override
  State<SubsidySchemesScreen> createState() => _SubsidySchemesScreenState();
}

class _SubsidySchemesScreenState extends State<SubsidySchemesScreen> {
  final schemes = [
    {'title': 'PM-KISAN', 'desc': '₹6,000/yr Direct Benefit Transfer', 'eligible': true},
    {'title': 'PMFBY', 'desc': 'Crop Insurance Scheme', 'eligible': true},
    {'title': 'PM-KUSUM', 'desc': 'Solar Agriculture Pump 90% Subsidy', 'eligible': false},
    {'title': 'SMAM', 'desc': 'Sub-Mission on Agricultural Mechanization', 'eligible': true},
  ];

  void _apply(String schemeName) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Apply for $schemeName'),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Aadhaar Verification Required.'),
            SizedBox(height: 8),
            TextField(decoration: InputDecoration(hintText: 'Enter Aadhaar Number')),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          CustomButton(
            text: 'Verify & Submit',
            onPressed: () {
              Navigator.pop(ctx);
              final dbtId = 'DBT${DateTime.now().millisecondsSinceEpoch.toString().substring(5)}';
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('Claim Submitted! Tracking ID: $dbtId')),
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
      appBar: const CommonAppBar(title: 'DBT & Subsidy Applications', subtitle: 'Government Schemes'),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: schemes.length,
        itemBuilder: (ctx, i) {
          final s = schemes[i];
          final bool eligible = s['eligible'] as bool;
          return Card(
            margin: const EdgeInsets.only(bottom: 16),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(child: Text(s['title'] as String, style: AppTextStyles.h2)),
                      Icon(
                        eligible ? Icons.check_circle : Icons.cancel,
                        color: eligible ? Colors.green : Colors.red,
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(s['desc'] as String, style: AppTextStyles.body),
                  const SizedBox(height: 16),
                  if (eligible)
                    CustomButton(
                      text: 'Submit Claim / Application',
                      onPressed: () => _apply(s['title'] as String),
                      width: double.infinity,
                    )
                  else
                    const Text('Not Eligible based on current land records.', style: TextStyle(color: Colors.red)),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
