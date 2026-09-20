import 'package:flutter/material.dart';
import '../../constants/app_colors.dart';
import '../../constants/app_text_styles.dart';
import '../../services/api_service.dart';
import '../../widgets/common_app_bar.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/status_badge.dart';
import '../reports/official_reports_screen.dart';

class LeavesWelfareScreen extends StatefulWidget {
  const LeavesWelfareScreen({super.key});

  @override
  State<LeavesWelfareScreen> createState() => _LeavesWelfareScreenState();
}

class _LeavesWelfareScreenState extends State<LeavesWelfareScreen> {
  final _reasonController = TextEditingController();
  String _category = 'Medical / Health';
  final _amountController = TextEditingController(text: '2500');

  void _showWageAdvanceDialog() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('💰 Request Emergency Wage Advance', style: AppTextStyles.h3),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Advance Amount (₹)', style: AppTextStyles.caption),
            const SizedBox(height: 4),
            TextField(
              controller: _amountController,
              keyboardType: TextInputType.number,
              decoration: InputDecoration(
                prefixText: '₹ ',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
              ),
              style: AppTextStyles.bodyBold,
            ),
            const SizedBox(height: 10),
            const Text('Repayment Term', style: AppTextStyles.caption),
            const SizedBox(height: 4),
            DropdownButtonFormField<String>(
              value: '2 Months',
              decoration: InputDecoration(border: OutlineInputBorder(borderRadius: BorderRadius.circular(8))),
              items: const [
                DropdownMenuItem(value: '1 Month', child: Text('1 Month (Deducted from next DBT)')),
                DropdownMenuItem(value: '2 Months', child: Text('2 Months (Equal split)')),
                DropdownMenuItem(value: '3 Months', child: Text('3 Months (Welfare split)')),
              ],
              onChanged: (_) {},
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
            onPressed: () async {
              Navigator.pop(ctx);
              showDialog(context: context, barrierDismissible: false, builder: (_) => const Center(child: CircularProgressIndicator()));
              final res = await ApiService().requestWageAdvance({
                'amount': double.tryParse(_amountController.text) ?? 2500,
                'term': '2 Months',
              });
              if (mounted) {
                Navigator.pop(context); // pop loading
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('✓ Wage Advance Authorized! ₹${res['amount']} DBT initiated. TXN: ${res['dbt_transaction_id']}'),
                    backgroundColor: AppColors.success,
                  ),
                );
              }
            },
            child: const Text('Authorize DBT', style: TextStyle(color: Colors.white)),
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
        title: 'Leave & PM-KISAN Welfare',
        subtitle: 'Auto-cadre Reassignment & DBT Advances',
        actions: [
          IconButton(
            icon: const Icon(Icons.description_outlined, color: Colors.white),
            tooltip: 'Welfare Statement',
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => const OfficialReportsScreen(initialReportType: 'leaves'),
              ),
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Leave Form Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.cardBorder),
                boxShadow: AppColors.softShadow,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text('REQUEST PLANNED LEAVE',
                      style: AppTextStyles.caption.copyWith(fontWeight: FontWeight.w800, color: AppColors.primaryDark)),
                  const SizedBox(height: 12),
                  const Text('Leave Category', style: AppTextStyles.caption),
                  const SizedBox(height: 4),
                  DropdownButtonFormField<String>(
                    value: _category,
                    decoration: InputDecoration(
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    items: const [
                      DropdownMenuItem(value: 'Medical / Health', child: Text('Medical / Health Rest')),
                      DropdownMenuItem(value: 'Harvest Seasonal', child: Text('Harvest Seasonal Family Labor')),
                      DropdownMenuItem(value: 'Personal / Family', child: Text('Personal / Family Obligation')),
                    ],
                    onChanged: (v) {
                      if (v != null) setState(() => _category = v);
                    },
                  ),
                  const SizedBox(height: 10),
                  const Text('Reason for Absence', style: AppTextStyles.caption),
                  const SizedBox(height: 4),
                  TextField(
                    controller: _reasonController,
                    maxLines: 2,
                    decoration: InputDecoration(
                      hintText: 'e.g. Seasonal recovery or family assistance...',
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    style: AppTextStyles.body,
                  ),
                  const SizedBox(height: 14),
                  CustomButton(
                    text: 'Submit Leave Application',
                    onPressed: () async {
                      showDialog(context: context, barrierDismissible: false, builder: (_) => const Center(child: CircularProgressIndicator()));
                      final res = await ApiService().submitLeaveRequest({
                        'category': _category,
                        'reason': _reasonController.text,
                      });
                      if (mounted) {
                        Navigator.pop(context); // pop loading
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text('✓ ${res['message']} ID: ${res['leave_id']}'),
                            backgroundColor: AppColors.primary,
                          ),
                        );
                        _reasonController.clear();
                      }
                    },
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Emergency Advance Button
            CustomButton(
              text: '💰 Request Emergency Wage Advance (PM-KISAN Pool)',
              variant: ButtonVariant.secondary,
              onPressed: _showWageAdvanceDialog,
            ),
            const SizedBox(height: 20),

            // Welfare Ledger Summary Card
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.cardBorder),
                boxShadow: AppColors.softShadow,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('ACTIVE WELFARE LEDGER', style: AppTextStyles.bodyBold),
                      const StatusBadge(text: 'Aadhaar DBT Verified', type: BadgeType.success),
                    ],
                  ),
                  const SizedBox(height: 10),
                  const Text('Direct Benefit Advances:', style: AppTextStyles.caption),
                  const SizedBox(height: 4),
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    dense: true,
                    leading: const Text('💳', style: TextStyle(fontSize: 20)),
                    title: const Text('₹2,500.00 • Family Medical Care', style: AppTextStyles.bodyBold),
                    subtitle: const Text('Repayment: 2 Months (₹1,250/mo) • Status: Active Nominal', style: AppTextStyles.caption),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
