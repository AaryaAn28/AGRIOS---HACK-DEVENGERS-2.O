import 'package:flutter/foundation.dart';
import '../models/user_model.dart';
import '../constants/static_content.dart';

class AuthService extends ChangeNotifier {
  static final AuthService _instance = AuthService._internal();
  factory AuthService() => _instance;
  AuthService._internal();

  UserModel? _currentUser;
  String _activeLanguage = 'en';

  UserModel? get currentUser => _currentUser;
  bool get isAuthenticated => _currentUser != null;
  String get activeLanguage => _activeLanguage;

  void setLanguage(String lang) {
    if (_activeLanguage != lang) {
      _activeLanguage = lang;
      notifyListeners();
    }
  }

  // 1-Tap Login as Operator (Krishi Sakhi)
  void loginAsOperator() {
    _currentUser = UserModel(
      id: 'worker-001',
      email: 'worker@agrios.in',
      fullName: 'Sunita Devi',
      role: 'worker',
      personaCode: 'WORKER-001',
      token: 'demo-token-worker-001',
    );
    notifyListeners();
  }

  // 1-Tap Login with one of the 4 Quick Demo Personas
  void loginAsPersona(Map<String, dynamic> persona) {
    _currentUser = UserModel(
      id: persona['id']?.toString() ?? 'demo-user',
      email: persona['email']?.toString() ?? 'user@agrios.in',
      fullName: persona['name']?.toString() ?? 'User',
      role: persona['role']?.toString() ?? 'worker',
      personaCode: persona['code']?.toString() ?? 'PERSONA-001',
      token: 'demo-token-${persona['id']}',
    );
    notifyListeners();
  }

  // Standard Login
  Future<bool> loginWithCredentials({
    required String email,
    required String password,
    required String role,
  }) async {
    // Check if matches one of our demo personas
    final matched = StaticContent.quickDemoPersonas.firstWhere(
      (p) => p['role'] == role || p['email'] == email,
      orElse: () => {
        'id': 'custom-user',
        'name': email.split('@').first,
        'role': role,
        'email': email,
        'code': '${role.toUpperCase()}-001',
      },
    );

    loginAsPersona(matched);
    return true;
  }

  void logout() {
    _currentUser = null;
    notifyListeners();
  }
}
