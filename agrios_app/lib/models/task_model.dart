class TaskModel {
  final String id;
  final String title;
  final String description;
  final String status;
  final String priority;
  final String? assignedTo;
  final String? fieldParcel;
  final double? gpsLat;
  final double? gpsLon;
  final String? dueDate;

  TaskModel({
    required this.id,
    required this.title,
    required this.description,
    required this.status,
    required this.priority,
    this.assignedTo,
    this.fieldParcel,
    this.gpsLat,
    this.gpsLon,
    this.dueDate,
  });

  bool get isCompleted => status.toUpperCase() == 'COMPLETED';

  factory TaskModel.fromJson(Map<String, dynamic> json) {
    return TaskModel(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? 'Task',
      description: json['description']?.toString() ?? '',
      status: json['status']?.toString() ?? 'PENDING',
      priority: json['priority']?.toString() ?? 'NORMAL',
      assignedTo: json['assigned_to']?.toString(),
      fieldParcel: json['field_parcel']?.toString() ?? json['parcel']?.toString(),
      gpsLat: json['gps_lat'] != null ? (json['gps_lat'] as num).toDouble() : null,
      gpsLon: json['gps_lon'] != null ? (json['gps_lon'] as num).toDouble() : null,
      dueDate: json['due_date']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'status': status,
      'priority': priority,
      'assigned_to': assignedTo,
      'field_parcel': fieldParcel,
      'gps_lat': gpsLat,
      'gps_lon': gpsLon,
      'due_date': dueDate,
    };
  }
}
