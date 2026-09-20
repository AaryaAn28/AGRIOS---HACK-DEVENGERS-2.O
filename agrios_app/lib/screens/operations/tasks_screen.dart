import 'package:flutter/material.dart';
import '../../constants/app_colors.dart';
import '../../constants/app_text_styles.dart';
import '../../models/task_model.dart';
import '../../services/api_service.dart';
import '../../services/auth_service.dart';
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
    final user = AuthService().currentUser;
    final workerName = (user?.fullName ?? 'sunita').toLowerCase();
    final workerId = (user?.id ?? 'worker-001').toLowerCase();

    // Filter strictly for active day and current worker, and deduplicate by title
    final dayRegex = RegExp(r'\bDay\s*' + day.toString() + r'\b', caseSensitive: false);
    final seenTitles = <String>{};
    final filtered = list.where((t) {
      // 1. Day matching
      final matchesDay = dayRegex.hasMatch(t.title) || dayRegex.hasMatch(t.description);
      if (!matchesDay) return false;

      // 2. Worker matching (if assignedTo is specified)
      if (t.assignedTo != null && t.assignedTo!.isNotEmpty) {
        final assigned = t.assignedTo!.toLowerCase();
        final matchesWorker = assigned.contains(workerName) ||
            assigned.contains(workerId) ||
            assigned.contains('worker') ||
            assigned.contains('sakhi') ||
            assigned.contains('field operator');
        if (!matchesWorker) return false;
      }

      // 3. Deduplicate identical task titles
      final normTitle = t.title.trim().toLowerCase();
      if (seenTitles.contains(normTitle)) return false;
      seenTitles.add(normTitle);

      return true;
    }).toList();

    if (mounted) {
      setState(() {
        _activeDay = day;
        _tasks = filtered;
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
      setState(() {
        final index = _tasks.indexWhere((t) => t.id == task.id);
        if (index != -1) {
          _tasks[index] = TaskModel(
            id: task.id,
            title: task.title,
            description: task.description,
            status: 'COMPLETED',
            priority: task.priority,
            assignedTo: task.assignedTo,
            fieldParcel: task.fieldParcel,
            gpsLat: task.gpsLat,
            gpsLon: task.gpsLon,
            dueDate: task.dueDate,
          );
        }
      });
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
