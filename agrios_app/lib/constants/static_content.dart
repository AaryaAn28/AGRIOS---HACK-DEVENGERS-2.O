class StaticContent {
  // App Identifiers & Government Letterhead
  static const String appName = 'AGRIOS Precision OS';
  static const String appTagline = 'Next-Gen Precision Agriculture & Workforce Operating System';
  static const String govHeader = 'GOVERNMENT OF PUNJAB • DEPARTMENT OF AGRICULTURE & FARMERS WELFARE';
  static const String icarHeader = 'PUNJAB AGRICULTURAL UNIVERSITY & ICAR EXTENSION DIRECTORATE';
  static const String operatorPortalTitle = 'Krishi Sakhi Field Operations';

  // 4 Quick Demo Personas
  static const List<Map<String, dynamic>> quickDemoPersonas = [
    {
      'id': 'dr_priya_sharma',
      'name': 'Dr. Priya Sharma',
      'role': 'agronomist',
      'roleTitle': 'Lead Agronomist & Scientist',
      'email': 'agronomist@agrios.in',
      'code': 'PB-AGRO-001',
      'avatar': '🔬',
      'station': 'PAU Regional Research Station, Ludhiana',
      'description': 'Dispatches daily crop plan stages, monitors soil health, runs ML foliar diagnosis.',
      'badge': 'Scientist Lead',
    },
    {
      'id': 'dr_vikram_sen',
      'name': 'Dr. Vikramaditya Sen',
      'role': 'government',
      'roleTitle': 'Director of Agriculture',
      'email': 'government@agrios.in',
      'code': 'PB-GOV-001',
      'avatar': '🏛️',
      'station': 'State Agricultural Directorate, Chandigarh',
      'description': 'State-wide biosecurity radar, quarantine buffer enforcement, PM-KISAN subsidy allocation.',
      'badge': 'State Command',
    },
    {
      'id': 'balwinder_singh',
      'name': 'Balwinder Singh',
      'role': 'farmer',
      'roleTitle': 'Farmer Custodian',
      'email': 'farmer@agrios.in',
      'code': 'FARMER-001',
      'avatar': '🌾',
      'station': 'Greenfield Model Farm, Ludhiana',
      'description': 'Monitors parcel growth stages, approves farm activities, schedules precision equipment.',
      'badge': 'Farm Owner',
    },
    {
      'id': 'sunita_devi',
      'name': 'Sunita Devi',
      'role': 'worker',
      'roleTitle': 'Krishi Sakhi Specialist',
      'email': 'worker@agrios.in',
      'code': 'WORKER-001',
      'avatar': '👩‍🌾',
      'station': 'Extension Cadre Cluster #4, Ludhiana',
      'description': 'Performs in-situ ground truth, runs mobile leaf scanner, attends agronomist hotline.',
      'badge': 'Field Operator',
    },
  ];

  // Multilingual Dictionaries (English, Hindi, Odia)
  static const Map<String, Map<String, String>> localizedStrings = {
    'en': {
      'login_title': 'Precision Agricultural Login',
      'login_operator': 'Login as Operator (Krishi Sakhi)',
      'login_standard': 'Standard Role Login',
      'quick_demo_title': 'Quick Demo Logins (1-Tap Test)',
      'email_label': 'Email / Extension ID',
      'password_label': 'Password',
      'sign_in_btn': 'Sign In to AGRIOS',
      'tasks_title': 'Day Tasks Execution',
      'ground_truth_title': 'Ground Truth Telemetry',
      'equipment_title': 'Field Kit & Tools',
      'hotline_title': 'Agronomist Hotline',
      'training_title': 'Training & Certification',
      'leaves_title': 'Leave & Welfare',
      'scorecard_title': 'Performance Scorecard',
      'emergency_title': 'Emergency SOS Beacon',
      'reports_title': 'Official Regulatory Reports',
      'offline_guide_title': 'Offline Field Manual',
    },
    'hi': {
      'login_title': 'सटीक कृषि लॉगिन',
      'login_operator': 'ऑपरेटर के रूप में लॉगिन करें (कृषि सखी)',
      'login_standard': 'मानक भूमिका लॉगिन',
      'quick_demo_title': 'त्वरित डेमो लॉगिन (1-टैप परीक्षण)',
      'email_label': 'ईमेल / विस्तार कोड',
      'password_label': 'पासवर्ड',
      'sign_in_btn': 'एग्रीओस में साइन इन करें',
      'tasks_title': 'दैनिक कार्य निष्पादन',
      'ground_truth_title': 'जमीनी सत्य टेलीमेट्री',
      'equipment_title': 'फील्ड किट और उपकरण',
      'hotline_title': 'कृषि वैज्ञानिक हॉटलाइन',
      'training_title': 'प्रशिक्षण और प्रमाणन',
      'leaves_title': 'अवकाश और कल्याण',
      'scorecard_title': 'प्रदर्शन स्कोरकार्ड',
      'emergency_title': 'आपातकालीन एसओएस बीकन',
      'reports_title': 'आधिकारिक विनियामक रिपोर्ट',
      'offline_guide_title': 'ऑफ़लाइन फील्ड गाइड',
    },
    'or': {
      'login_title': 'ସଠିକ୍ କୃଷି ଲଗଇନ୍',
      'login_operator': 'ଅପରେଟର ଭାବରେ ଲଗଇନ୍ କରନ୍ତୁ (କୃଷି ସଖୀ)',
      'login_standard': 'ମାନକ ଭୂମିକା ଲଗଇନ୍',
      'quick_demo_title': 'ଦ୍ରୁତ ଡେମୋ ଲଗଇନ୍ (୧-ଟ୍ୟାପ୍ ପରୀକ୍ଷଣ)',
      'email_label': 'ଇମେଲ୍ / ସମ୍ପ୍ରସାରଣ କୋଡ୍',
      'password_label': 'ପାସୱାର୍ଡ',
      'sign_in_btn': 'ଆଗ୍ରିଓସ୍ ରେ ସାଇନ୍ ଇନ୍ କରନ୍ତୁ',
      'tasks_title': 'ଦୈନିକ କାର୍ଯ୍ୟ ସମ୍ପାଦନ',
      'ground_truth_title': 'କ୍ଷେତ୍ର ବାସ୍ତବତା ଟେଲିମେଟ୍ରି',
      'equipment_title': 'କ୍ଷେତ୍ର ଉପକରଣ ଏବଂ ସାଧନ',
      'hotline_title': 'କୃଷି ବୈଜ୍ଞାନିକ ହଟଲାଇନ୍',
      'training_title': 'ପ୍ରଶିକ୍ଷଣ ଏବଂ ପ୍ରମାଣପତ୍ର',
      'leaves_title': 'ଛୁଟି ଏବଂ କଲ୍ୟାଣ',
      'scorecard_title': 'କାର୍ଯ୍ୟଦକ୍ଷତା ସ୍କୋରକାର୍ଡ',
      'emergency_title': 'ଜରୁରୀକାଳୀନ ଏସଓଏସ ବିକନ',
      'reports_title': 'ସରକାରୀ ନିୟାମକ ରିପୋର୍ଟ',
      'offline_guide_title': 'ଅଫଲାଇନ ଫିଲ୍ଡ ଗାଇଡ୍',
    },
  };

  static String t(String key, [String lang = 'en']) {
    return localizedStrings[lang]?[key] ?? localizedStrings['en']?[key] ?? key;
  }
}
