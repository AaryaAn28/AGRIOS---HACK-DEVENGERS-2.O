import 'package:flutter/material.dart';
import '../../constants/app_colors.dart';
import '../../constants/app_text_styles.dart';
import '../../constants/static_content.dart';
import '../../services/auth_service.dart';
import '../../widgets/common_app_bar.dart';
import '../../widgets/status_badge.dart';

class HelpGuideScreen extends StatefulWidget {
  final String? initialRole;

  const HelpGuideScreen({super.key, this.initialRole});

  @override
  State<HelpGuideScreen> createState() => _HelpGuideScreenState();
}

class _HelpGuideScreenState extends State<HelpGuideScreen> {
  late String _selectedRole;
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _selectedRole = widget.initialRole ?? AuthService().currentUser?.role ?? 'farmer';
    if (!['agronomist', 'farmer', 'government', 'worker'].contains(_selectedRole)) {
      _selectedRole = 'farmer';
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  // Comprehensive Knowledgebase matching Web App
  Map<String, List<Map<String, dynamic>>> _getHelpData(String lang) {
    return {
      'agronomist': [
        {
          'title': lang == 'hi'
              ? '1. मास्टर फसल योजना और विकास चरण समय-सारणी'
              : lang == 'or'
                  ? '୧. ମାଷ୍ଟର ଫସଲ ଯୋଜନା ଓ ବିକାଶ ପର୍ଯ୍ୟାୟ'
                  : '1. Master Crop Plan Generation & Stage Scheduling',
          'icon': '🌾',
          'purpose': lang == 'hi'
              ? 'फसल प्रजाति, अधिकार क्षेत्र (पंजाब, ओडिशा) और मिट्टी की जल विज्ञान के अनुसार बहु-चरणीय कृषि कैलेंडर तैयार करता है।'
              : 'Synthesizes multi-stage calibrated agronomic calendars tailored to crop species, jurisdiction (Punjab, Odisha), and soil hydrology.',
          'sop': '1. Select cultivar (e.g. Wheat PBW-550).\n2. Input acreage and registered workforce count.\n3. Click "Synthesize Calibrated Engine".\n4. Expand daily schedules to inspect day-by-day objectives.',
          'underHood': 'Calls POST /api/crop-plans/generate-and-calibrate, stores plan in _FARM_CROP_PLANS, updates User.has_completed_onboarding, and sets up growth stage nodes.',
        },
        {
          'title': lang == 'hi'
              ? '2. 3D डिजिटल ट्विन और इंटरएक्टिव CAD'
              : lang == 'or'
                  ? '୨. ୩D ଡିଜିଟାଲ୍ ଟ୍ୱିନ୍ ଓ CAD ଡ୍ରଇଂ'
                  : '2. 3D Farm Digital Twin Calibration & Interactive CAD',
          'icon': '🌐',
          'purpose': 'Renders real-time spatial digital twin with authentic botanical low-poly 3D models, procedural terrain, wind sway vertex animations, and CAD drawing tools.',
          'sop': '1. Navigate to "3D Farm Digital Twin".\n2. Use touch orbit and presets to inspect plots.\n3. Switch between Day 1 to 120 slider.\n4. Use Draw Field / Draw Road CAD tools to draft new parcels.',
          'underHood': 'Three.js & Canvas 3D viewport with procedural plant shaders, and POST /api/farm-structures/boundary CAD persistence committed to God Database.',
        },
        {
          'title': '3. Workforce Attendance Audit & Subordinate Cadre',
          'icon': '👥',
          'purpose': 'Live oversight of field workforce check-ins, latched GPS coordinates, task completion velocity, and rest allocations.',
          'sop': '1. Click "Workforce & Attendance" tab.\n2. View live audit ledger with real check-in timestamps, GPS pins, and assigned parcels.\n3. Monitor Krishi Sakhi shift statuses.',
          'underHood': 'Queries GET /api/workforce/attendance, displaying latched coordinates, verified tasks, and worker profile availability status.',
        },
        {
          'title': '4. AI Pathogen Laboratory & Official Rx Prescription Certification',
          'icon': '🔬',
          'purpose': 'Automated botanical disease diagnosis across Rice, Wheat, Tomato, Potato, Maize, and Cotton with official accredited prescription certification.',
          'sop': '1. Open "AI Pathogen Lab & Rx".\n2. Inspect uploaded foliar samples.\n3. Review AI confidence score and recommended chemical/biological remedies.\n4. Click "Certify Agronomic Prescription" to issue printable Rx certificate.',
          'underHood': 'POST /api/agronomist/diagnose-leaf executes multi-class pathogen vision inference, generates official laboratory serial number, and emits DOMAIN_EVENT for treatment order.',
        },
        {
          'title': '5. Granular Day Task Dispatch & Cross-Portal Notifications',
          'icon': '🚀',
          'purpose': 'Releases specific growth stage directives straight to Farmer and Krishi Sakhi task queues, preventing workforce confusion.',
          'sop': '1. Under Master Crop Plan, expand granular daily schedule.\n2. Click "Dispatch Day X Tasks".\n3. System immediately alerts all portals via audio/visual toasts and updates notification counters.',
          'underHood': 'POST /api/crop-plans/dispatch-day-tasks creates FarmTask records with "Day X", creates AdvisoryMessage, sets _ACTIVE_DISPATCHED_DAY, and broadcasts TASK_CREATED.',
        },
        {
          'title': '6. Weather Adaptation Safeguards & Biosecurity Alerts',
          'icon': '⛈️',
          'purpose': 'Injects dynamic agronomic adaptations (anti-transpirants, drainage protocols) during unseasonal rain or heatwaves.',
          'sop': '1. Go to "Weather Safeguards" tab.\n2. Select safeguard trigger (e.g. Unseasonal Western Disturbance Rain).\n3. Click "Activate Protocol".',
          'underHood': 'Updates stage adaptation in database, generates emergency AdvisoryMessage, and broadcasts WEATHER_PROTOCOL_ACTIVATED event across cadre.',
        },
      ],

      'farmer': [
        {
          'title': '1. Living Digital Twin Farm Telemetry & Climate Simulator',
          'icon': '🌱',
          'purpose': 'Continuous bio-physical visualization of crop health, soil moisture, NDVI photosynthetic vigor, and simulated micro-climates.',
          'sop': '1. Open Overview tab.\n2. Review biological vitality ring and NPK balances.\n3. Click climate simulation buttons (Sunny, Rain, Heatwave, Wind) to preview crop resilience.',
          'underHood': 'Digital twin 2D/3D botanical canvas simulator reacting to dynamic soil moisture grids and weather parameters in real time.',
        },
        {
          'title': '2. Master Crop Plan Growing Calendar (120 Days)',
          'icon': '📅',
          'purpose': 'Complete life-cycle guide containing phenological stage milestones, basal fertilizer schedules, and water application regimes.',
          'sop': '1. Click "Growing Plan Calendar".\n2. Review current stage requirements.\n3. Click "View Granular Daily Tasks" to see daily agronomic objectives.',
          'underHood': 'GET /api/crop-plans/farm/{farm_id} retrieves agronomist-synthesized multi-stage schedule with calibrated inputs.',
        },
        {
          'title': '3. Agricultural Work Queue (Locked to Active Dispatched Day)',
          'icon': '📋',
          'purpose': 'Displays strict operational directives for the active growth day assigned by Dr. Priya Sharma. Locked to prevent mis-sequenced fieldwork.',
          'sop': '1. Open "Agricultural Work Queue".\n2. Check the green "Active Directive" banner.\n3. Execute field tasks and tap "✓ Complete" once finished with GPS geotag.',
          'underHood': 'GET /api/crop-plans/farm/{farm_id}/active-dispatched-day enforces display strictly for Day X. Complete action updates database and emits TASK_COMPLETED.',
        },
        {
          'title': '4. AI Crop Health Scanner & Fungicide Ordering',
          'icon': '📷',
          'purpose': 'Instant edge AI diagnosis of diseased leaves with one-click direct booking of prescribed agro-inputs.',
          'sop': '1. Navigate to "AI Crop Care".\n2. Capture or pick foliar photo.\n3. Tap "Run Neural Diagnosis".\n4. Review pathogen and tap "Order Prescribed Fungicide Lot".',
          'underHood': 'POST /api/agronomist/diagnose-leaf classifies disease, returns treatment protocols, and queues input reservation in resource inventory.',
        },
        {
          'title': '5. Precision Machinery & Drone Spraying CHC Booking',
          'icon': '🚜',
          'purpose': 'Direct booking of heavy agricultural equipment (Laser Leveler, 16L Hexacopter Drone, Harvester) from local Custom Hiring Centers.',
          'sop': '1. Navigate to "Machinery & Equipment Booking".\n2. Select required machine and enter required hours/acres.\n3. Tap "Reserve Equipment Lot with PM-KISAN Subsidy".',
          'underHood': 'Reserves inventory in equipment pool, calculates fuel + operator rates, and emits MACHINERY_BOOKED domain event.',
        },
        {
          'title': '6. APMC Mandi Market Prices & Direct Trade Rates',
          'icon': '📈',
          'purpose': 'Real-time grain mandi tickers for Khanna, Ludhiana, and Kotkapura markets with daily MSP variances and trade inquiry submissions.',
          'sop': '1. Open "Live Mandi Prices".\n2. Inspect commodity prices (Wheat PBW-550, Basmati 1121, Mustard).\n3. Submit bulk selling inquiry to registered APMC commission agents.',
          'underHood': 'Aggregates Agmarknet price feeds, calculates price spread above statutory MSP, and logs trade intent.',
        },
      ],

      'government': [
        {
          'title': '1. State Pest Outbreak Radar & Vector Spread Simulation',
          'icon': '📡',
          'purpose': 'Continuous epidemiological surveillance across all 23 Punjab districts with physical vector dispersion forecasting.',
          'sop': '1. Open "Pest Outbreak Radar".\n2. Select active hotspot.\n3. Choose forecast window (7, 14, or 30 days) and tap "Run Vector Spread Simulation".\n4. Tap "🛡️ Enforce Recommended Cordon".',
          'underHood': 'POST /api/government/pest-radar/simulate-dispersion calculates Gaussian plume dispersion, affected crop acreage, and economic loss at risk.',
        },
        {
          'title': '2. Biosecurity Buffer Zones & Cordon Sanitaire Orders',
          'icon': '🛡️',
          'purpose': 'Enforcing 3-5km containment zones, police checkpoints, and chemical misting barriers under the Destructive Insects & Pests Act, 1914.',
          'sop': '1. Open "Biosecurity Buffer Zones".\n2. Inspect active cordons and manned checkpoints.\n3. Update zone status (Enforced / Monitoring / Lifted) or declare new cordon.',
          'underHood': 'POST /api/government/biosecurity/buffer-zones issues statutory legal order, activates spatial buffer ring, and emits QUARANTINE_ZONE_ACTIVATED.',
        },
        {
          'title': '3. Direct Benefit Transfer (DBT) & PMFBY Batch Disbursals',
          'icon': '💳',
          'purpose': 'Bulk Aadhaar payment bridge payouts for disaster relief, input subsidies, and crop insurance compensations.',
          'sop': '1. Open "DBT Batch Disbursal".\n2. Inspect pending batches.\n3. Tap "Authorize Batch DBT Disbursal" with biometric admin signature.',
          'underHood': 'Simulates PFMS-Aadhaar payment bridge gateway, updates beneficiary transaction status, and generates bank audit voucher.',
        },
        {
          'title': '4. Strategic Grain Buffer Reserves & Silo AI Spoilage',
          'icon': '🌾',
          'purpose': 'Real-time oversight of 14.8 LMT state grain buffer stock across PUNSUP, Markfed, and FCI silos with OMSS market price stabilization.',
          'sop': '1. Navigate to "Strategic Grain Reserves".\n2. Check buffer norm compliance percentage.\n3. Tap "Trigger OMSS Open Market Sale" if retail prices exceed ceiling.',
          'underHood': 'Tracks silo internal temperature, humidity, and spoilage risk index with automated aerator fan triggers.',
        },
        {
          'title': '5. Fertilizer Freight Rake Rail Logistics Tracker',
          'icon': '🚆',
          'purpose': 'Tracking Urea and DAP freight rake movements from maritime ports to district railheads with automated stock rebalancing.',
          'sop': '1. Open "Fertilizer Logistics".\n2. Review active rake dispatches.\n3. Submit emergency district rebalancing requisition if buffer drops below 7-day reserve.',
          'underHood': 'Monitors rake movement stages (Port Dispatched, In-Transit, Unloading) and updates district inventory levels.',
        },
        {
          'title': '6. State Orbital Satellite Telemetry (Sentinel-2)',
          'icon': '🛰️',
          'purpose': 'Multi-spectral satellite telemetry (NDVI, NDWI, SAVI, EVI) across all 23 Punjab districts for macro vegetative health oversight.',
          'sop': '1. Open "Satellite Telemetry".\n2. Review district spectral health rankings.\n3. Filter by resolution or cloud cover percentage.',
          'underHood': 'Processes 10m Sentinel-2 multi-spectral bands to compute normalized indices and detect regional drought or waterlogging stress.',
        },
      ],

      'worker': [
        {
          'title': '1. Dispatched Directive Tasks Execution & GPS Geotagging',
          'icon': '📋',
          'purpose': 'Carrying out strictly assigned growth day tasks with high-precision GPS coordinate verification.',
          'sop': '1. Open "Day Tasks Execution".\n2. Read task objectives and required tools.\n3. Tap "Verify GPS & Complete Task" upon execution.',
          'underHood': 'Calls PUT /api/tasks/{id}/status with Trimble GNSS coordinates, updates task completion ledger, and accrues performance bonus.',
        },
        {
          'title': '2. Mobile Leaf AI Vision Scanner & Instant Hotline Sync',
          'icon': '📷',
          'purpose': 'In-situ leaf disease diagnosis using neural computer vision and immediate dispatch to supervising agronomist.',
          'sop': '1. Tap "AI Scanner" on dashboard.\n2. Select target crop and symptoms.\n3. Tap "Capture Leaf & Run AI Triage".\n4. Tap "Transmit to Supervising Agronomist" for confirmation.',
          'underHood': 'Runs edge vision model, outputs pathogen name, confidence score, and dual chemical + biological prescriptions.',
        },
        {
          'title': '3. Ground Truth Telemetry & Soil Moisture Probing',
          'icon': '📡',
          'purpose': 'In-situ logging of TDR 350 volumetric soil moisture %, weed infestation %, and composite stress index.',
          'sop': '1. Open "Ground Truth Telemetry".\n2. Adjust soil moisture slider and weed severity.\n3. Tap "Run ML Evaluation & Submit Observation".',
          'underHood': 'Calls POST /api/workforce-ops/ground-truth, calculates ML composite stress score, and updates micro-plot telemetry.',
        },
        {
          'title': '4. Field Kit Health, Prognostics & Doorstep Swaps',
          'icon': '🧰',
          'purpose': 'Tracking precision tool degradation, electrode sensor drift, battery health, and ordering doorstep replacement swaps.',
          'sop': '1. Open "Field Kit & Tools".\n2. Inspect battery and wear prognosis.\n3. Tap "Report Damage & Request Swap" if electrodes drift.',
          'underHood': 'Calls /report-damage and /request-replacement, generates swap ticket, and routes dispatch to Ludhiana KVK depot.',
        },
        {
          'title': '5. Emergency Protocols, WBGT Heat Rest & SOS Beacon',
          'icon': '🚨',
          'purpose': 'Satellite distress broadcasting and ISO 7243 WBGT micro-climate heat stress protection for field cadre.',
          'sop': '1. Open "Emergency Protocols & SOS".\n2. Observe live WBGT heat rest advisory.\n3. Tap and hold "SOS" circular beacon to trigger satellite distress dispatch.',
          'underHood': 'Posts distress beacon to event bus, dispatches 108 Ambulance alert, and notifies Dr. Priya Sharma.',
        },
        {
          'title': '6. Leave Applications & PM-KISAN Emergency Wage Advance',
          'icon': '📑',
          'purpose': 'Applying for planned leave with automated cadre reassignment, and requesting emergency DBT wage advance.',
          'sop': '1. Open "Leave & Welfare".\n2. Submit leave form with reason.\n3. Tap "Request Emergency Wage Advance" for instant ₹2,500 DBT credit.',
          'underHood': 'Calls /api/workforce-ops/leaves and /wage-advance, generates DBT transaction ID, and reassigns active parcels.',
        },
      ],
    };
  }

  @override
  Widget build(BuildContext context) {
    final auth = AuthService();
    final lang = auth.activeLanguage;
    final allHelpData = _getHelpData(lang);
    final currentTopics = allHelpData[_selectedRole] ?? allHelpData['farmer']!;

    final filteredTopics = _searchQuery.isEmpty
        ? currentTopics
        : currentTopics.where((topic) {
            final q = _searchQuery.toLowerCase();
            return (topic['title'] as String).toLowerCase().contains(q) ||
                (topic['purpose'] as String).toLowerCase().contains(q) ||
                (topic['sop'] as String).toLowerCase().contains(q) ||
                (topic['underHood'] as String).toLowerCase().contains(q);
          }).toList();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: CommonAppBar(
        title: lang == 'hi'
            ? '❓ सहायता एवं मानक संचालन नियमावली (SOP)'
            : lang == 'or'
                ? '❓ ସହାୟତା ଓ ମାନକ କାର୍ଯ୍ୟ ନିୟମାବଳୀ (SOP)'
                : '❓ AGRIOS Help & SOP Guide',
        subtitle: lang == 'hi'
            ? 'संपूर्ण तकनीकी, कृषि संचालन एवं फील्ड निष्पादन नियमावली'
            : lang == 'or'
                ? 'ସମ୍ପୂର୍ଣ୍ଣ ବୈଷୟିକ ଏବଂ କ୍ଷେତ୍ରସ୍ତରୀୟ ପରିଚାଳନା ପୁସ୍ତିକା'
                : 'Comprehensive Standard Operating Procedures & Feature Guide',
      ),
      body: Column(
        children: [
          // 1. Role Selector Tabs Bar
          Container(
            color: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _buildRoleChip('farmer', '🌾 Farmer Custodian', AppColors.roleFarmer),
                  const SizedBox(width: 8),
                  _buildRoleChip('agronomist', '🔬 Lead Agronomist', AppColors.roleAgronomist),
                  const SizedBox(width: 8),
                  _buildRoleChip('government', '🏛️ State Command', AppColors.roleGovernment),
                  const SizedBox(width: 8),
                  _buildRoleChip('worker', '👩‍🌾 Krishi Sakhi Cadre', AppColors.primary),
                ],
              ),
            ),
          ),
          const Divider(height: 1, color: Color(0xFFE2E8F0)),

          // 2. Search Input Bar
          Container(
            color: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: lang == 'hi'
                    ? 'विषय, सुविधा या एपीआई खोजें...'
                    : lang == 'or'
                        ? 'ବିଷୟ ବା ସୁବିଧା ଖୋଜନ୍ତୁ...'
                        : 'Search features, SOP steps, APIs...',
                prefixIcon: const Icon(Icons.search, color: AppColors.textMuted, size: 20),
                suffixIcon: _searchQuery.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear, size: 18),
                        onPressed: () {
                          _searchController.clear();
                          setState(() => _searchQuery = '');
                        },
                      )
                    : null,
                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                filled: true,
                fillColor: const Color(0xFFF8FAFC),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: const BorderSide(color: Color(0xFFCBD5E1)),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                ),
              ),
              onChanged: (v) => setState(() => _searchQuery = v),
            ),
          ),
          const Divider(height: 1, color: Color(0xFFE2E8F0)),

          // 3. Topics List
          Expanded(
            child: filteredTopics.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Text('🔍', style: TextStyle(fontSize: 40)),
                        const SizedBox(height: 8),
                        Text(
                          'No SOP topics match "$_searchQuery"',
                          style: AppTextStyles.bodyBold.copyWith(color: AppColors.textMuted),
                        ),
                      ],
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: filteredTopics.length,
                    itemBuilder: (context, index) {
                      final item = filteredTopics[index];
                      return _buildHelpCard(item, lang);
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildRoleChip(String role, String label, Color color) {
    final isSelected = _selectedRole == role;
    return ChoiceChip(
      label: Text(
        label,
        style: TextStyle(
          fontSize: 12,
          fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
          color: isSelected ? Colors.white : AppColors.textPrimary,
        ),
      ),
      selected: isSelected,
      selectedColor: color,
      backgroundColor: const Color(0xFFF1F5F9),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      side: BorderSide(color: isSelected ? color : const Color(0xFFCBD5E1)),
      onSelected: (_) => setState(() => _selectedRole = role),
    );
  }

  Widget _buildHelpCard(Map<String, dynamic> item, String lang) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(14),
        child: Container(
          decoration: const BoxDecoration(
            border: Border(left: BorderSide(color: AppColors.primary, width: 4)),
          ),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Text(item['icon'] as String, style: const TextStyle(fontSize: 24)),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      item['title'] as String,
                      style: AppTextStyles.h3.copyWith(fontSize: 15, color: AppColors.textPrimary),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // Operational Purpose
              _buildSectionHeader(
                lang == 'hi' ? '💡 मुख्य उद्देश्य' : lang == 'or' ? '💡 ମୁଖ୍ୟ ଉଦ୍ଦେଶ୍ୟ' : '💡 Operational Purpose',
                AppColors.primaryDark,
              ),
              const SizedBox(height: 4),
              Text(item['purpose'] as String, style: AppTextStyles.body.copyWith(fontSize: 13)),
              const SizedBox(height: 12),

              // Step by Step Execution SOP
              _buildSectionHeader(
                lang == 'hi' ? '📋 चरण-दर-चरण संचालन विधि (SOP)' : lang == 'or' ? '📋 ପଦକ୍ଷେପ ଅନୁଯାୟୀ ପ୍ରଣାଳୀ (SOP)' : '📋 Step-by-Step Execution SOP',
                const Color(0xFF2563EB),
              ),
              const SizedBox(height: 4),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Text(
                  item['sop'] as String,
                  style: const TextStyle(fontSize: 12.5, height: 1.45, color: Color(0xFF334155), fontFamily: 'monospace'),
                ),
              ),
              const SizedBox(height: 12),

              // Under the Hood Operations
              _buildSectionHeader(
                lang == 'hi' ? '⚙️ बैकएंड और तकनीकी प्रक्रिया' : lang == 'or' ? '⚙️ ବ୍ୟାକଏଣ୍ଡ ଓ ବୈଷୟିକ କାର୍ଯ୍ୟ' : '⚙️ Under-the-Hood Operations',
                const Color(0xFF475569),
              ),
              const SizedBox(height: 4),
              Text(
                item['underHood'] as String,
                style: AppTextStyles.caption.copyWith(fontSize: 11.5, color: const Color(0xFF64748B)),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title, Color color) {
    return Text(
      title,
      style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w800, color: color, letterSpacing: 0.2),
    );
  }
}
