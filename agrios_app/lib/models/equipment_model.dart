class EquipmentModel {
  final String id;
  final String name;
  final String category;
  final double usageHours;
  final double batteryPct;
  final double healthScore;
  final String status;
  final String advisory;

  EquipmentModel({
    required this.id,
    required this.name,
    required this.category,
    required this.usageHours,
    required this.batteryPct,
    required this.healthScore,
    required this.status,
    required this.advisory,
  });

  factory EquipmentModel.fromJson(Map<String, dynamic> json) {
    return EquipmentModel(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Tool',
      category: json['category']?.toString() ?? 'Precision Sensing',
      usageHours: (json['usage_hours'] as num?)?.toDouble() ?? 0.0,
      batteryPct: (json['battery_charge_pct'] as num?)?.toDouble() ??
          (json['battery_pct'] as num?)?.toDouble() ?? 100.0,
      healthScore: (json['overall_health_score'] as num?)?.toDouble() ??
          (json['health_score'] as num?)?.toDouble() ?? 95.0,
      status: json['status']?.toString() ?? 'OPERATIONAL_NOMINAL',
      advisory: json['maintenance_advisory']?.toString() ?? 'Calibrated & Nominal',
    );
  }
}
