class EmergencySopModel {
  final String hazard;
  final String action;
  final String details;

  EmergencySopModel({
    required this.hazard,
    required this.action,
    required this.details,
  });

  factory EmergencySopModel.fromJson(Map<String, dynamic> json) {
    return EmergencySopModel(
      hazard: json['hazard']?.toString() ?? 'Emergency Hazard',
      action: json['action']?.toString() ?? 'Call 108 immediately',
      details: json['details']?.toString() ?? '',
    );
  }
}
