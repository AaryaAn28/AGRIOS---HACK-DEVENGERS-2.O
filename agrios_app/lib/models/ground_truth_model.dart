class GroundTruthModel {
  final String id;
  final String fieldParcel;
  final String crop;
  final double soilMoisturePct;
  final String weedInfestation;
  final String? canopyCoverage;
  final String? nitrogenStatus;
  final double compositeStressScore;
  final String? stressClassification;
  final String? recommendation;
  final String timestamp;

  GroundTruthModel({
    required this.id,
    required this.fieldParcel,
    required this.crop,
    required this.soilMoisturePct,
    required this.weedInfestation,
    this.canopyCoverage,
    this.nitrogenStatus,
    required this.compositeStressScore,
    this.stressClassification,
    this.recommendation,
    required this.timestamp,
  });

  factory GroundTruthModel.fromJson(Map<String, dynamic> json) {
    final eval = json['ml_evaluation'] as Map<String, dynamic>? ?? {};
    return GroundTruthModel(
      id: json['id']?.toString() ?? 'GT-${DateTime.now().millisecondsSinceEpoch}',
      fieldParcel: json['field_parcel']?.toString() ?? 'Plot 1',
      crop: json['crop']?.toString() ?? 'Wheat',
      soilMoisturePct: (json['soil_moisture_pct'] as num?)?.toDouble() ?? 25.0,
      weedInfestation: json['weed_infestation']?.toString() ?? 'Low (<5%)',
      canopyCoverage: json['canopy_coverage']?.toString() ?? '90%',
      nitrogenStatus: json['nitrogen_status']?.toString() ?? 'Optimal',
      compositeStressScore: (eval['composite_stress_score'] as num?)?.toDouble() ?? 24.5,
      stressClassification: eval['stress_classification']?.toString() ?? 'OPTIMAL_HEALTH',
      recommendation: eval['agronomic_recommendation']?.toString() ?? 'Maintain current irrigation interval',
      timestamp: json['timestamp']?.toString() ?? DateTime.now().toIso8601String(),
    );
  }
}
