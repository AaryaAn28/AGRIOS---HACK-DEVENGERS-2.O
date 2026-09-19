import 'package:flutter/material.dart';
import '../../constants/app_colors.dart';
import '../../constants/app_text_styles.dart';
import '../../constants/static_content.dart';
import '../../models/training_model.dart';
import '../../services/api_service.dart';
import '../../widgets/common_app_bar.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/status_badge.dart';
import '../reports/official_reports_screen.dart';

class TrainingScreen extends StatefulWidget {
  const TrainingScreen({super.key});

  @override
  State<TrainingScreen> createState() => _TrainingScreenState();
}

class _TrainingScreenState extends State<TrainingScreen> {
  List<TrainingModuleModel> _modules = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadModules();
  }

  Future<void> _loadModules() async {
    setState(() => _isLoading = true);
    final list = await ApiService().getTrainingModules();
    if (mounted) {
      setState(() {
        _modules = list;
        _isLoading = false;
      });
    }
  }

  void _showOfflineGuideDialog(TrainingModuleModel m) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('📖 Offline Field Manual: ${m.crop}', style: AppTextStyles.h3),
        content: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppColors.infoBg,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  'This manual is pre-cached for offline low-connectivity operations.',
                  style: AppTextStyles.caption.copyWith(color: AppColors.info),
                ),
              ),
              const SizedBox(height: 12),
              Text(m.title, style: AppTextStyles.bodyBold),
              const SizedBox(height: 6),
              Text(m.description, style: AppTextStyles.body.copyWith(fontSize: 13)),
              const SizedBox(height: 14),
              const Text('Field Quick-Reference Rx:', style: AppTextStyles.caption),
              const SizedBox(height: 4),
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppColors.successBg,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  '• Tilt 25% EC @ 1ml/L water\n• Pseudomonas fluorescens @ 1.5 kg/acre\n• Emergency Hotline: 1800-180-1551',
                  style: AppTextStyles.caption.copyWith(color: AppColors.primaryDark, height: 1.4),
                ),
              ),
            ],
          ),
        ),
        actions: [
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Close Manual', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  void _showQuizDialog(TrainingModuleModel m) {
    int selectedAnswer = 0;
    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDlgState) {
          final q = m.quiz.isNotEmpty ? m.quiz.first : null;
          return AlertDialog(
            title: Text('✍️ Examination: ${m.crop}', style: AppTextStyles.h3),
            content: q == null
                ? const Text('Quiz completed or not required.')
                : Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(q.question, style: AppTextStyles.bodyBold),
                      const SizedBox(height: 10),
                      ...List.generate(q.options.length, (idx) {
                        return RadioListTile<int>(
                          value: idx,
                          groupValue: selectedAnswer,
                          dense: true,
                          contentPadding: EdgeInsets.zero,
                          title: Text(q.options[idx], style: AppTextStyles.body.copyWith(fontSize: 13)),
                          onChanged: (val) {
                            if (val != null) setDlgState(() => selectedAnswer = val);
                          },
                        );
                      }),
                    ],
                  ),
            actions: [
              TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
              ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
                onPressed: () {
                  Navigator.pop(ctx);
                  _showCertificateDialog(m);
                },
                child: const Text('Submit & Certify', style: TextStyle(color: Colors.white)),
              ),
            ],
          );
        },
      ),
    );
  }

  void _showCertificateDialog(TrainingModuleModel m) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFFFFFBEB),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: const BorderSide(color: AppColors.warning, width: 2),
        ),
        title: Column(
          children: [
            const Text('📜', style: TextStyle(fontSize: 32)),
            const SizedBox(height: 4),
            Text(
              StaticContent.icarHeader,
              style: AppTextStyles.caption.copyWith(color: AppColors.warning, fontWeight: FontWeight.w800, fontSize: 9),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 2),
            const Text('Certificate of Agronomic Competency', style: AppTextStyles.h3, textAlign: TextAlign.center),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            const Text('Awarded to:', style: AppTextStyles.caption),
            const Text('Sunita Devi (WORKER-001)', style: AppTextStyles.bodyBold),
            const SizedBox(height: 8),
            Text('Has successfully mastered: ${m.title}', style: AppTextStyles.caption, textAlign: TextAlign.center),
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: AppColors.successBg,
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: AppColors.primaryBorder),
              ),
              child: const Text('GRADE: DISTINCTION (98.5%)', style: TextStyle(fontWeight: FontWeight.w800, color: AppColors.success, fontSize: 11)),
            ),
            const SizedBox(height: 6),
            const Text('Credential Code: CERT-ICAR-PB-2026-9042', style: AppTextStyles.code),
          ],
        ),
        actions: [
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.warning),
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Close Certificate', style: TextStyle(color: Colors.white)),
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
        title: 'Training & Certification',
        subtitle: 'ICAR-PAU Accredited Multi-Crop Curricula',
        actions: [
          IconButton(
            icon: const Icon(Icons.description_outlined, color: Colors.white),
            tooltip: 'Qualifications Transcript',
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => const OfficialReportsScreen(initialReportType: 'training'),
              ),
            ),
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              itemCount: _modules.length,
              itemBuilder: (context, index) {
                final m = _modules[index];
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
                          StatusBadge(text: m.crop, type: BadgeType.success),
                          StatusBadge(text: m.duration, type: BadgeType.neutral),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(m.title, style: AppTextStyles.bodyBold.copyWith(fontSize: 14)),
                      const SizedBox(height: 4),
                      Text(m.description, style: AppTextStyles.body.copyWith(fontSize: 12.5, color: AppColors.textSecondary)),
                      const SizedBox(height: 8),
                      Text('Level: ${m.level} • Category: ${m.category}', style: AppTextStyles.caption),
                      const SizedBox(height: 12),

                      Row(
                        children: [
                          Expanded(
                            child: CustomButton(
                              text: '📖 Offline Guide',
                              variant: ButtonVariant.secondary,
                              height: 36,
                              onPressed: () => _showOfflineGuideDialog(m),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: CustomButton(
                              text: '✍️ Exam & Certify',
                              height: 36,
                              onPressed: () => _showQuizDialog(m),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                );
              },
            ),
    );
  }
}
