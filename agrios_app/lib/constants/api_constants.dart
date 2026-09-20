import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;

class ApiConstants {
  // Platform-aware base URL
  static String get baseUrl {
    if (kIsWeb) return 'http://localhost:8000';
    if (Platform.isAndroid) return 'http://10.0.2.2:8000';
    return 'http://127.0.0.1:8000';
  }
  static String activeFarmId = '9fca8bd1-344e-46b1-b5f8-4a94ebd4167c';

  // Auth Endpoints
  static const String quickPersonas = '/api/auth/quick-personas';
  static const String token = '/api/auth/token';
  static const String me = '/api/auth/me';

  // Tasks & Dispatches
  static const String tasks = '/api/tasks';
  static String activeDispatchedDay(String farmId) =>
      '/api/crop-plans/farm/$farmId/active-dispatched-day';

  // Workforce Operations
  static const String groundTruth = '/api/workforce-ops/ground-truth';
  static const String groundTruthReport = '/api/workforce-ops/ground-truth/report';
  static const String equipmentKit = '/api/workforce-ops/equipment-kit';
  static const String reportDamage = '/api/workforce-ops/equipment-kit/report-damage';
  static const String requestReplacement = '/api/workforce-ops/equipment-kit/request-replacement';
  static const String equipmentReport = '/api/workforce-ops/equipment-kit/audit-report';
  static const String hotlineMessages = '/api/workforce-ops/hotline/messages';
  static const String hotlineSend = '/api/workforce-ops/hotline/send';
  static const String hotlineReport = '/api/workforce-ops/hotline/transcript-report';
  static const String trainingModules = '/api/workforce-ops/training/modules';
  static const String trainingCertify = '/api/workforce-ops/training/certify';
  static const String trainingReport = '/api/workforce-ops/training/transcript-report';
  static String trainingOfflineGuide(String moduleId) =>
      '/api/workforce-ops/training/offline-guide/$moduleId';
  static const String leaves = '/api/workforce-ops/leaves';
  static const String attendance = '/api/workforce-ops/attendance';
  static const String wageAdvance = '/api/workforce-ops/wage-advance';
  static const String leavesReport = '/api/workforce-ops/leaves/welfare-statement';
  static String scorecard(String workerId) =>
      '/api/workforce-ops/scorecard/$workerId';
  static String scorecardReport(String workerId) =>
      '/api/workforce-ops/scorecard/$workerId/merit-report';
  static const String biophysicalStress = '/api/workforce-ops/biophysical-stress';
  static const String emergencyProtocols = '/api/workforce-ops/emergency-protocols';
  static const String emergencySos = '/api/workforce-ops/emergency-sos';
  static const String emergencyReport = '/api/workforce-ops/emergency/safety-report';
}
