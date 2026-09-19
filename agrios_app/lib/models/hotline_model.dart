class HotlineMessageModel {
  final String id;
  final String sender;
  final String message;
  final String timestamp;
  final String? urgency;
  final Map<String, dynamic>? mlTriage;

  HotlineMessageModel({
    required this.id,
    required this.sender,
    required this.message,
    required this.timestamp,
    this.urgency,
    this.mlTriage,
  });

  bool get isWorker => sender.toLowerCase().contains('worker') || sender.toLowerCase().contains('sunita');

  factory HotlineMessageModel.fromJson(Map<String, dynamic> json) {
    return HotlineMessageModel(
      id: json['id']?.toString() ?? 'MSG-${DateTime.now().millisecondsSinceEpoch}',
      sender: json['sender']?.toString() ?? 'Worker',
      message: json['message']?.toString() ?? '',
      timestamp: json['timestamp']?.toString() ?? DateTime.now().toIso8601String(),
      urgency: json['urgency']?.toString(),
      mlTriage: json['ml_triage'] as Map<String, dynamic>? ??
          json['ml_evaluation'] as Map<String, dynamic>?,
    );
  }
}
