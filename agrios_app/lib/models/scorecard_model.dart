class ScorecardModel {
  final double compositeScore;
  final int completedTasks;
  final double punctualityRate;
  final double accuracyRate;
  final double accruedBonus;
  final List<Map<String, dynamic>> badges;

  ScorecardModel({
    required this.compositeScore,
    required this.completedTasks,
    required this.punctualityRate,
    required this.accuracyRate,
    required this.accruedBonus,
    required this.badges,
  });

  factory ScorecardModel.fromJson(Map<String, dynamic> json) {
    return ScorecardModel(
      compositeScore: (json['composite_performance_score'] as num?)?.toDouble() ?? 98.4,
      completedTasks: (json['completed_tasks_count'] as num?)?.toInt() ?? 12,
      punctualityRate: (json['punctuality_rate_pct'] as num?)?.toDouble() ?? 99.2,
      accuracyRate: (json['ground_truth_accuracy_pct'] as num?)?.toDouble() ?? 96.8,
      accruedBonus: (json['incentive_bonus_inr'] as num?)?.toDouble() ?? 3400.0,
      badges: (json['earned_badges'] as List<dynamic>?)
              ?.map((b) => Map<String, dynamic>.from(b as Map))
              .toList() ??
          [],
    );
  }
}
