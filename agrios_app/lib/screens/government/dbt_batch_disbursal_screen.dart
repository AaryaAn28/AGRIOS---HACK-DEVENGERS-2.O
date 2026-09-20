import 'package:flutter/material.dart';
import '../../constants/app_colors.dart';
import '../../constants/app_text_styles.dart';
import '../../widgets/common_app_bar.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/status_badge.dart';

class DbtBatchDisbursalScreen extends StatefulWidget {
  const DbtBatchDisbursalScreen({super.key});

  @override
  State<DbtBatchDisbursalScreen> createState() => _DbtBatchDisbursalScreenState();
}

class _DbtBatchDisbursalScreenState extends State<DbtBatchDisbursalScreen> {
  final List<Map<String, dynamic>> _batches = [
    {
      'name': 'Ludhiana Wheat Incentive Batch',
      'amount': 18.5,
      'beneficiaries': 312,
      'status': 'Pending Approval',
      'pfmsToken': 'PFMS-LUD-892',
    },
    {
      'name': 'Bathinda Hail Relief Batch',
      'amount': 42.0,
      'beneficiaries': 640,
      'status': 'Pending Approval',
      'pfmsToken': 'PFMS-BTI-104',
    },
  ];

  void _authorizeDisbursal(int index) {
    showDialog(
      context: context,
      builder: (ctx) {
        bool isLoading = false;
        final passcodeController = TextEditingController();
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              title: const Text('Authorize DBT Disbursal', style: AppTextStyles.h3),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Enter Admin Passcode / Verify Biometrics to authorize PFMS bank disbursement ledger.', style: AppTextStyles.body),
                  const SizedBox(height: 16),
                  TextField(
                    controller: passcodeController,
                    obscureText: true,
                    decoration: const InputDecoration(
                      labelText: 'Admin Passcode',
                      border: OutlineInputBorder(),
                    ),
                  ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(ctx),
                  child: const Text('Cancel'),
                ),
                CustomButton(
                  text: 'Authorize',
                  isLoading: isLoading,
                  onPressed: () async {
                    if (passcodeController.text.isEmpty) return;
                    setDialogState(() => isLoading = true);
                    await Future.delayed(const Duration(seconds: 2));
                    if (!context.mounted) return;
                    
                    setState(() {
                      _batches[index]['status'] = 'Disbursed';
                    });
                    
                    Navigator.pop(ctx);
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Batch disbursed successfully via Aadhaar DBT Bridge.')),
                    );
                  },
                ),
              ],
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: const CommonAppBar(
        title: 'DBT Batch Disbursal',
        subtitle: 'PMFBY & Relief Distribution',
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _batches.length,
        itemBuilder: (context, index) {
          final batch = _batches[index];
          final isDisbursed = batch['status'] == 'Disbursed';

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
                      Expanded(
                        child: Text(batch['name'], style: AppTextStyles.h3),
                      ),
                      StatusBadge(
                        text: batch['status'],
                        type: isDisbursed ? BadgeType.success : BadgeType.warning,
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Total Amount', style: AppTextStyles.caption),
                          Text('₹${batch['amount']} Lakhs', style: AppTextStyles.bodyBold),
                        ],
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          const Text('Beneficiaries', style: AppTextStyles.caption),
                          Text('${batch['beneficiaries']} Farmers', style: AppTextStyles.bodyBold),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text('Aadhaar DBT Bridge: Linked', style: AppTextStyles.subtitle.copyWith(color: AppColors.success)),
                  Text('PFMS Token: ${batch['pfmsToken']}', style: AppTextStyles.subtitle),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: CustomButton(
                      text: isDisbursed ? 'Disbursal Completed' : 'Authorize Batch DBT Disbursal',
                      variant: isDisbursed ? ButtonVariant.secondary : ButtonVariant.primary,
                      onPressed: isDisbursed ? () {} : () => _authorizeDisbursal(index),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
