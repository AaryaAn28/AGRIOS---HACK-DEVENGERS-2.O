import 'package:flutter/material.dart';
import '../../constants/app_colors.dart';
import '../../constants/app_text_styles.dart';
import '../../models/task_model.dart';
import '../../services/api_service.dart';
import '../../widgets/common_app_bar.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/status_badge.dart';

class TasksScreen extends StatefulWidget {
  const TasksScreen({super.key});

  @override
  State<TasksScreen> createState() => _TasksScreenState();
}

class _TasksScreenState extends State<TasksScreen> {
  List<TaskModel> _tasks = [];
  bool _isLoading = true;
  int _activeDay = 1;

  @override
  void initState() {
    super.initState();
    _loadTasks();
  }

  Future<void> _loadTasks() async {
    setState(() => _isLoading = true);
    final api = ApiService();
    final day = await api.getActiveDispatchedDay();
    final list = await api.getTasks();
    if (mounted) {
      setState(() {
        _activeDay = day;
        _tasks = list;
        _isLoading = false;
      });
    }
  }

  Future<void> _handleCompleteTask(TaskModel task) async {
    final success = await ApiService().completeTask(task.id);
    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('✓ Completed: "${task.title}". GPS geotag recorded.'),
          backgroundColor: AppColors.success,
        ),
      );
      _loadTasks();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: const CommonAppBar(
        title: 'Day Tasks Execution',
        subtitle: 'Field Operations & GPS Geotag Check-in',
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : RefreshIndicator(
              onRefresh: _loadTasks,
              color: AppColors.primary,
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                children: [
                  // Locked Directive Header
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.primaryContainer,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: AppColors.primaryBorder),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.verified, color: AppColors.primaryDark, size: 20),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Active Schedule: Growth Day $_activeDay (Assigned by Dr. Priya Sharma)',
                            style: AppTextStyles.bodyBold.copyWith(
                              color: AppColors.primaryDark,
                              fontSize: 12.5,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),

                  if (_tasks.isEmpty)
                    Container(
                      padding: const EdgeInsets.all(32),
                      alignment: Alignment.center,
                      child: Text(
                        'No active tasks dispatched for Day $_activeDay.\nWaiting for agronomist dispatch.',
                        textAlign: TextAlign.center,
                        style: AppTextStyles.caption.copyWith(fontSize: 13),
                      ),
                    )
                  else
                    ..._tasks.map((t) {
                      return Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: AppColors.surface,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: t.isCompleted ? AppColors.primaryBorder : AppColors.cardBorder,
                          ),
                          boxShadow: AppColors.softShadow,
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                StatusBadge(
                                  text: t.isCompleted ? '✓ COMPLETED' : 'PENDING EXECUTION',
                                  type: t.isCompleted ? BadgeType.success : BadgeType.warning,
                                ),
                                if (t.fieldParcel != null)
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: AppColors.cardSubtle,
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: Text(
                                      t.fieldParcel!,
                                      style: AppTextStyles.caption.copyWith(
                                        color: AppColors.textPrimary,
                                        fontWeight: FontWeight.w600,
                                        fontSize: 10.5,
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text(
                              t.title,
                              style: AppTextStyles.h3.copyWith(
                                fontSize: 14.5,
                                decoration: t.isCompleted ? TextDecoration.lineThrough : null,
                                color: t.isCompleted ? AppColors.textMuted : AppColors.textPrimary,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              t.description,
                              style: AppTextStyles.body.copyWith(
                                fontSize: 12.5,
                                color: AppColors.textSecondary,
                              ),
                            ),
                            if (t.gpsLat != null) ...[
                              const SizedBox(height: 8),
                              Row(
                                children: [
                                  const Icon(Icons.location_on, size: 14, color: AppColors.primary),
                                  const SizedBox(width: 4),
                                  Text(
                                    'GPS: ${t.gpsLat!.toStringAsFixed(4)}, ${t.gpsLon!.toStringAsFixed(4)} (Verified)',
                                    style: AppTextStyles.code.copyWith(fontSize: 11),
                                  ),
                                ],
                              ),
                            ],
                            if (!t.isCompleted) ...[
                              const SizedBox(height: 12),
                              CustomButton(
                                text: 'Verify GPS & Complete Task',
                                icon: const Icon(Icons.check_circle_outline, size: 16, color: Colors.white),
                                height: 38,
                                onPressed: () => _handleCompleteTask(t),
                              ),
                            ],
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
