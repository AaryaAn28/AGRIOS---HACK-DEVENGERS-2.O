import 'package:flutter/material.dart';
import '../../constants/app_colors.dart';
import '../../constants/app_text_styles.dart';
import '../../models/equipment_model.dart';
import '../../services/api_service.dart';
import '../../widgets/common_app_bar.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/status_badge.dart';
import '../reports/official_reports_screen.dart';

class EquipmentKitScreen extends StatefulWidget {
  const EquipmentKitScreen({super.key});

  @override
  State<EquipmentKitScreen> createState() => _EquipmentKitScreenState();
}

class _EquipmentKitScreenState extends State<EquipmentKitScreen> {
  List<EquipmentModel> _tools = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadTools();
  }

  Future<void> _loadTools() async {
    setState(() => _isLoading = true);
    final list = await ApiService().getEquipmentKit();
    if (mounted) {
      setState(() {
        _tools = list;
        _isLoading = false;
      });
    }
  }

  void _showReportDamageDialog() {
    final descController = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('⚠️ Report Damaged Equipment', style: AppTextStyles.h3),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Select Damaged Tool', style: AppTextStyles.caption),
            const SizedBox(height: 4),
            DropdownButtonFormField<String>(
              value: _tools.first.name,
              isExpanded: true,
              items: _tools
                  .map((t) => DropdownMenuItem(value: t.name, child: Text(t.name, style: const TextStyle(fontSize: 12))))
                  .toList(),
              onChanged: (_) {},
            ),
            const SizedBox(height: 12),
            const Text('Defect / Malfunction Details', style: AppTextStyles.caption),
            const SizedBox(height: 4),
            TextField(
              controller: descController,
              maxLines: 2,
              decoration: InputDecoration(
                hintText: 'Describe issue (e.g. electrode sensor drift)...',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
              ),
              style: AppTextStyles.body,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
            onPressed: () {
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('✓ KVK Doorstep Swap Ticket Created: TKT-REP-8821. Replacement en-route.'),
                  backgroundColor: AppColors.success,
                ),
              );
            },
            child: const Text('Submit Swap Request', style: TextStyle(color: Colors.white)),
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
        title: 'Field Kit & Tools',
        subtitle: 'Wear Prognostics & KVK Tool Bank Registry',
        actions: [
          IconButton(
            icon: const Icon(Icons.description_outlined, color: Colors.white),
            tooltip: 'Audit Report',
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => const OfficialReportsScreen(initialReportType: 'equipment'),
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
                  // Action Strip
                  Row(
                    children: [
                      Expanded(
                        child: CustomButton(
                          text: '⚠️ Report Damage',
                          variant: ButtonVariant.secondary,
                          height: 40,
                          onPressed: _showReportDamageDialog,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: CustomButton(
                          text: '📑 Health Audit',
                          height: 40,
                          onPressed: () => Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => const OfficialReportsScreen(initialReportType: 'equipment'),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  Text(
                    'CALIBRATED INSTRUMENT INVENTORY',
                    style: AppTextStyles.caption.copyWith(
                      fontWeight: FontWeight.w800,
                      letterSpacing: 0.6,
                      color: AppColors.textMuted,
                    ),
                  ),
                  const SizedBox(height: 10),

                  ..._tools.map((tool) {
                    final isGood = tool.healthScore >= 85;
                    return Container(
                      margin: const EdgeInsets.only(bottom: 12),
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
                              Text(tool.category.toUpperCase(),
                                  style: AppTextStyles.caption.copyWith(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.primaryDark,
                                  )),
                              StatusBadge(
                                text: '${tool.healthScore.toStringAsFixed(0)}% Health',
                                type: isGood ? BadgeType.success : BadgeType.warning,
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Text(tool.name, style: AppTextStyles.bodyBold.copyWith(fontSize: 14)),
                          const SizedBox(height: 4),
                          Text('ID: ${tool.id} • Usage: ${tool.usageHours} hrs • Battery: ${tool.batteryPct}%',
                              style: AppTextStyles.caption),
                          const SizedBox(height: 8),

                          // Health Progress Bar
                          ClipRRect(
                            borderRadius: BorderRadius.circular(4),
                            child: LinearProgressIndicator(
                              value: tool.healthScore / 100.0,
                              minHeight: 6,
                              backgroundColor: AppColors.cardSubtle,
                              color: isGood ? AppColors.primary : AppColors.warning,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text('Advisory: ${tool.advisory}',
                              style: AppTextStyles.caption.copyWith(
                                color: isGood ? AppColors.primaryDark : AppColors.warning,
                                fontWeight: FontWeight.w600,
                              )),
                        ],
                      ),
                    );
                  }),
                ],
              ),
            ),
    );
  }
}
