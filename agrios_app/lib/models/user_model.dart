class UserModel {
  final String id;
  final String email;
  final String fullName;
  final String role;
  final String? personaCode;
  final String? farmId;
  final String? token;

  UserModel({
    required this.id,
    required this.email,
    required this.fullName,
    required this.role,
    this.personaCode,
    this.farmId,
    this.token,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      fullName: json['full_name']?.toString() ?? 'User',
      role: json['role']?.toString() ?? 'worker',
      personaCode: json['persona_code']?.toString(),
      farmId: json['farm_id']?.toString(),
      token: json['access_token']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'full_name': fullName,
      'role': role,
      'persona_code': personaCode,
      'farm_id': farmId,
      'access_token': token,
    };
  }
}
