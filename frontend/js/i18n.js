/**
 * AGRIOS Multilingual Translation Engine (i18n)
 * Supports English (en), Hindi / हिन्दी (hi), and Odia / ଓଡ଼ିଆ (or).
 * Provides 1-click real-time language switching across all portals.
 */

window.AgriosI18n = {
  currentLang: localStorage.getItem("agrios_lang") || "en",

  translations: {
    en: {
      // General
      portal_brand: "AGRIOS",
      portal_tagline: "Living Agricultural Operating System",
      nav_help: "Help & SOP Guide",
      nav_navigation: "Navigation",
      nav_notif: "Notifications",
      nav_signout: "Sign Out",
      search_placeholder: "Search operations, parcels, diagnostics...",
      lang_english: "🌐 English",
      lang_hindi: "🇮🇳 हिन्दी (Hindi)",
      lang_odia: "🌾 ଓଡ଼ିଆ (Odia)",

      // Personas & Roles
      role_agronomist: "Lead Agronomist",
      role_farmer: "Progressive Farmer",
      role_worker: "Krishi Sakhi Specialist",
      role_government: "State Command Director",
      cadre_locked: "🔒 Cadre Locked • Non-Modifiable",

      // Agronomist Navigation & Features
      tab_cropplan: "Master Crop Plan",
      tab_digitaltwin: "3D Farm Digital Twin",
      tab_subordinates: "Workforce & Attendance",
      tab_pathogen: "AI Pathogen Lab & Rx",
      tab_weather: "Weather Safeguards",
      tab_comms: "Broadcast Advisories",
      tab_notifications: "Notifications",

      // Farmer Navigation
      tab_overview: "Farm Overview & 3D Twin",
      tab_farmer_cropplan: "Growing Plan Calendar",
      tab_tasks: "Agricultural Work Queue",
      tab_care: "AI Crop Health Scanner",
      tab_fields: "Fields & Soil Telemetry",
      tab_resources: "Bio-Inputs & Seed Inventory",
      tab_machinery: "Machinery & CHC Booking",
      tab_harvest: "Yield & Harvest Forecast",
      tab_mandi: "APMC Mandi Live Prices",

      // Worker Navigation
      tab_workplan: "Today's Work Plan",
      tab_scanner: "Mobile Vision Scanner",
      tab_attendance: "Attendance & Logbook",
      tab_groundtruth: "Ground Truth Logs",
      tab_equipment: "Field Kit & Tools",
      tab_advisory: "Agronomist Hotline",
      tab_training: "Training & Certification",
      tab_leaves: "Leave & Welfare Requests",
      tab_performance: "Performance Scorecard",
      tab_emergency: "Emergency Protocols & SOS",

      // Government Navigation
      tab_gov_overview: "Statewide Executive Command",
      tab_pest_radar: "Pest Outbreak Radar",
      tab_buffer_zones: "Biosecurity Buffer Zones",
      tab_dbt: "DBT Subsidies & Benefits",
      tab_reserves: "Grain Reserves & Stocks",
      tab_fertilizer: "Fertilizer Rake Logistics",
      tab_reports: "Official State Reports",
      tab_workforce_reg: "Workforce Cadre Registry",

      // Common Actions & Badges
      btn_refresh: "↻ Refresh Feed",
      btn_mark_all_read: "✓ Mark All Read",
      btn_mark_read: "Mark as Read",
      btn_read: "✓ Read",
      btn_submit: "Submit Application",
      btn_execute: "Execute & Verify GPS",
      btn_gps_attendance: "📍 GPS Geotag Attendance",
      btn_open_scanner: "📷 Open Leaf Scanner",
      btn_trigger_sos: "🚨 TRIGGER DISTRESS BEACON (SOS)",
      btn_export_report: "📊 Generate Official Report",
      btn_offline_guide: "📥 Offline Field Manual",
      btn_print_report: "🖨️ Print / Save PDF",
      btn_download_csv: "⬇️ Download CSV",
      btn_download_json: "⬇️ Download JSON",
      directive_banner_title: "Agronomist Master Plan Directive",
      directive_banner_sub: "Active Directive: Growth Day {day} Tasks (Assigned by Dr. Priya Sharma)",

      // Help Modal
      help_title: "AGRIOS Standard Operating Procedures & Feature Guide",
      help_subtitle: "Comprehensive architectural, operational, and field execution manual.",
      help_search: "Search SOP topics, features, APIs...",
      help_purpose: "💡 Operational Purpose",
      help_sop: "📋 Step-by-Step Execution SOP",
      help_under_hood: "⚙️ Under-the-Hood Operations"
    },

    hi: {
      // General
      portal_brand: "एग्रीओस (AGRIOS)",
      portal_tagline: "सक्रिय डिजिटल कृषि ऑपरेटिंग सिस्टम",
      nav_help: "सहायता एवं एसओपी गाइड",
      nav_navigation: "नेविगेशन",
      nav_notif: "अधिसूचनाएं",
      nav_signout: "लॉग आउट",
      search_placeholder: "कार्य, खेत, फसल निदान खोजें...",
      lang_english: "🌐 English",
      lang_hindi: "🇮🇳 हिन्दी (Hindi)",
      lang_odia: "🌾 ଓଡ଼ିଆ (Odia)",

      // Personas & Roles
      role_agronomist: "मुख्य कृषि वैज्ञानिक (डॉ. प्रिया शर्मा)",
      role_farmer: "प्रगतिशील किसान",
      role_worker: "कृषि सखी विशेषज्ञ (सुनीता देवी)",
      role_government: "राज्य कृषि निदेशक",
      cadre_locked: "🔒 संवर्ग सुरक्षित • अपरिवर्तनीय",

      // Agronomist Navigation & Features
      tab_cropplan: "मास्टर फसल योजना",
      tab_digitaltwin: "3D फार्म डिजिटल ट्विन",
      tab_subordinates: "कार्यबल एवं उपस्थिति ऑडिट",
      tab_pathogen: "एआई रोग लैब व प्रिस्क्रिप्शन",
      tab_weather: "मौसम सुरक्षा प्रोटोकॉल",
      tab_comms: "कृषि परामर्श परिपत्र",
      tab_notifications: "अधिसूचनाएं",

      // Farmer Navigation
      tab_overview: "खेत अवलोकन एवं डिजिटल ट्विन",
      tab_farmer_cropplan: "फसल विकास कैलेंडर",
      tab_tasks: "कृषि कार्य सूची",
      tab_care: "एआई फसल स्वास्थ्य स्कैनर",
      tab_fields: "खेत व मृदा परीक्षण",
      tab_resources: "जैव-आदान व बीज भंडार",
      tab_machinery: "कृषि यंत्र व सीएचसी बुकिंग",
      tab_harvest: "उत्पादन एवं कटाई पूर्वानुमान",
      tab_mandi: "मंडी ई-नाम दैनिक भाव",

      // Worker Navigation
      tab_workplan: "आज की कार्य योजना",
      tab_scanner: "मोबाइल पत्ती स्कैनर",
      tab_attendance: "जीपीएस उपस्थिति एवं लॉगबुक",
      tab_groundtruth: "जमीनी सत्य रिपोर्ट (Ground Truth)",
      tab_equipment: "फील्ड किट व उपकरण",
      tab_advisory: "वैज्ञानिक हॉटलाइन (हेल्पलाइन)",
      tab_training: "प्रशिक्षण व आईसीएआर प्रमाणन",
      tab_leaves: "अवकाश एवं अग्रिम वेतन",
      tab_performance: "प्रदर्शन स्कोरकार्ड",
      tab_emergency: "आपातकालीन प्रोटोकॉल व एसओएस",

      // Government Navigation
      tab_gov_overview: "राज्यस्तरीय कमान केंद्र",
      tab_pest_radar: "कीट प्रकोप रडार",
      tab_buffer_zones: "जैविक सुरक्षा बफर क्षेत्र",
      tab_dbt: "डीबीटी सब्सिडी व अनुदान",
      tab_reserves: "अनाज भंडार व बफर स्टॉक",
      tab_fertilizer: "उर्वरक रैक रसद",
      tab_reports: "आधिकारिक सरकारी रिपोर्ट",
      tab_workforce_reg: "कार्यबल संवर्ग रजिस्टर",

      // Common Actions & Badges
      btn_refresh: "↻ रीफ्रेश करें",
      btn_mark_all_read: "✓ सभी को पढ़ा हुआ मार्क करें",
      btn_mark_read: "पढ़ा हुआ मार्क करें",
      btn_read: "✓ पढ़ा गया",
      btn_submit: "आवेदन जमा करें",
      btn_execute: "सत्यापित करें एवं जीपीएस दर्ज करें",
      btn_gps_attendance: "📍 जीपीएस उपस्थिति दर्ज करें",
      btn_open_scanner: "📷 पत्ती स्कैनर खोलें",
      btn_trigger_sos: "🚨 आपातकालीन संकट बीकन भेजें (SOS)",
      btn_export_report: "📊 आधिकारिक रिपोर्ट बनाएं",
      btn_offline_guide: "📥 ऑफलाइन फील्ड मैनुअल",
      btn_print_report: "🖨️ प्रिंट / पीडीएफ",
      btn_download_csv: "⬇️ सीएसवी डाउनलोड",
      btn_download_json: "⬇️ जेएसओएन डाउनलोड",
      directive_banner_title: "कृषि वैज्ञानिक मास्टर योजना निर्देश",
      directive_banner_sub: "सक्रिय निर्देश: विकास दिवस {day} कार्य (डॉ. प्रिया शर्मा द्वारा आवंटित)",

      // Help Modal
      help_title: "एग्रीओस मानक संचालन प्रक्रिया (SOP) एवं गाइड",
      help_subtitle: "संपूर्ण तकनीकी, कृषि संचालन एवं फील्ड निष्पादन नियमावली।",
      help_search: "विषय, सुविधा या एपीआई खोजें...",
      help_purpose: "💡 मुख्य उद्देश्य",
      help_sop: "📋 चरण-दर-चरण संचालन विधि (SOP)",
      help_under_hood: "⚙️ बैकएंड और तकनीकी प्रक्रिया"
    },

    or: {
      // General
      portal_brand: "ଏଗ୍ରିଓସ (AGRIOS)",
      portal_tagline: "ଜୀବନ୍ତ ଡିଜିଟାଲ କୃଷି ଅପରେଟିଂ ସିଷ୍ଟମ",
      nav_help: "ସହାୟତା ଓ ଏସଓପି ଗାଇଡ୍",
      nav_navigation: "ନାଭିଗେସନ",
      nav_notif: "ବିଜ୍ଞପ୍ତି (Notifications)",
      nav_signout: "ଲଗ୍ ଆଉଟ୍",
      search_placeholder: "କାର୍ଯ୍ୟ, ଜମି, ରୋଗ ନିରାକରଣ ଖୋଜନ୍ତୁ...",
      lang_english: "🌐 English",
      lang_hindi: "🇮🇳 हिन्दी (Hindi)",
      lang_odia: "🌾 ଓଡ଼ିଆ (Odia)",

      // Personas & Roles
      role_agronomist: "ମୁଖ୍ୟ କୃଷି ବୈଜ୍ଞାନିକ (ଡଃ ପ୍ରିୟା ଶର୍ମା)",
      role_farmer: "ପ୍ରଗତିଶୀଳ ଚାଷୀ",
      role_worker: "କୃଷି ସଖୀ ବିଶେଷଜ୍ଞ (ସୁନୀତା ଦେବୀ)",
      role_government: "ରାଜ୍ୟ କୃଷି ନିର୍ଦ୍ଦେଶକ",
      cadre_locked: "🔒 ସଂରକ୍ଷିତ • ଅପରିବର୍ତ୍ତନୀୟ",

      // Agronomist Navigation & Features
      tab_cropplan: "ମାଷ୍ଟର ଫସଲ ଯୋଜନା",
      tab_digitaltwin: "୩ଡି ଫାର୍ମ ଡିଜିଟାଲ ଟ୍ୱିନ୍",
      tab_subordinates: "କାର୍ଯ୍ୟବଳ ଓ ଉପସ୍ଥିତି ଅଡିଟ୍",
      tab_pathogen: "ଏଆଇ ରୋଗ ଲ୍ୟାବ୍ ଓ ଔଷଧ ପରାମର୍ଶ",
      tab_weather: "ପାଣିପାଗ ସୁରକ୍ଷା ପ୍ରୋଟୋକଲ",
      tab_comms: "କୃଷି ପରାମର୍ଶ ବାର୍ତ୍ତା",
      tab_notifications: "ବିଜ୍ଞପ୍ତି",

      // Farmer Navigation
      tab_overview: "ଜମି ଅବଲୋକନ ଓ ଡିଜିଟାଲ ଟ୍ୱିନ୍",
      tab_farmer_cropplan: "ଫସଲ ବିକାଶ କ୍ୟାଲେଣ୍ଡର",
      tab_tasks: "କୃଷି କାର୍ଯ୍ୟ ତାଲିକା",
      tab_care: "ଏଆଇ ଫସଲ ସ୍ୱାସ୍ଥ୍ୟ ସ୍କାନର",
      tab_fields: "ଜମି ଓ ମୃତ୍ତିକା ପରୀକ୍ଷା",
      tab_resources: "ଜୈବ ଖତ ଓ ବିହନ ଭଣ୍ଡାର",
      tab_machinery: "କୃଷି ଯନ୍ତ୍ରପାତି ବୁକିଂ",
      tab_harvest: "ଅମଳ ପୂର୍ବାନୁମାନ",
      tab_mandi: "ମଣ୍ଡି ଦୈନିକ ଦର",

      // Worker Navigation
      tab_workplan: "ଆଜିର କାର୍ଯ୍ୟ ଯୋଜନା",
      tab_scanner: "ମୋବାଇଲ ପତ୍ର ସ୍କାନର",
      tab_attendance: "ଜିପିଏସ ଉପସ୍ଥିତି ଲଗବୁକ୍",
      tab_groundtruth: "ଜମି ସତ୍ୟତା ରିପୋର୍ଟ (Ground Truth)",
      tab_equipment: "ଫିଲ୍ଡ କିଟ୍ ଓ ଯନ୍ତ୍ରପାତି",
      tab_advisory: "କୃଷି ବୈଜ୍ଞାନିକ ହଟଲାଇନ",
      tab_training: "ପ୍ରଶିକ୍ଷଣ ଓ ପ୍ରମାଣପତ୍ର",
      tab_leaves: "ଛୁଟି ଓ ଅଗ୍ରିମ ମଜୁରୀ ଆବେଦନ",
      tab_performance: "କାର୍ଯ୍ୟଦକ୍ଷତା ସ୍କୋରକାର୍ଡ",
      tab_emergency: "ଜରୁରୀକାଳୀନ ପ୍ରୋଟୋକଲ ଓ ଏସଓଏସ (SOS)",

      // Government Navigation
      tab_gov_overview: "ରାଜ୍ୟସ୍ତରୀୟ ନିୟନ୍ତ୍ରଣ କେନ୍ଦ୍ର",
      tab_pest_radar: "ପୋକ ଆକ୍ରମଣ ରାଡାର",
      tab_buffer_zones: "ଜୈବ ସୁରକ୍ଷା ବଫର ଜୋନ",
      tab_dbt: "ଡିବିଟି ସବସିଡି ଓ ସହାୟତା",
      tab_reserves: "ଶସ୍ୟ ଭଣ୍ଡାର ଓ ମହଜୁଦ",
      tab_fertilizer: "ସାର ଯୋଗାଣ ଲଜିଷ୍ଟିକ୍ସ",
      tab_reports: "ସରକାରୀ ରିପୋର୍ଟ",
      tab_workforce_reg: "କର୍ମଚାରୀ ରେଜିଷ୍ଟର",

      // Common Actions & Badges
      btn_refresh: "↻ ନୂତନ କରନ୍ତୁ",
      btn_mark_all_read: "✓ ସବୁ ପଢାଗଲା ବୋଲି ଚିହ୍ନଟ କରନ୍ତୁ",
      btn_mark_read: "ପଢାଗଲା",
      btn_read: "✓ ପଢାସରିଛି",
      btn_submit: "ଦାଖଲ କରନ୍ତୁ",
      btn_execute: "ଜିପିଏସ ସହ ସମ୍ପୂର୍ଣ୍ଣ କରନ୍ତୁ",
      btn_gps_attendance: "📍 ଜିପିଏସ ଉପସ୍ଥିତି ଦିଅନ୍ତୁ",
      btn_open_scanner: "📷 ପତ୍ର ସ୍କାନର ଖୋଲନ୍ତୁ",
      btn_trigger_sos: "🚨 ଜରୁରୀକାଳୀନ ସଂକେତ ପଠାନ୍ତୁ (SOS)",
      btn_export_report: "📊 ସରକାରୀ ରିପୋର୍ଟ ପ୍ରସ୍ତୁତ କରନ୍ତୁ",
      btn_offline_guide: "📥 ଅଫଲାଇନ ଫିଲ୍ଡ ମାନୁଆଲ",
      btn_print_report: "🖨️ ପ୍ରିଣ୍ଟ / ପିଡିଏଫ୍",
      btn_download_csv: "⬇️ ସିଏସଭି ଡାଉନଲୋଡ୍",
      btn_download_json: "⬇️ ଜେଏସଓଏନ ଡାଉନଲୋଡ୍",
      directive_banner_title: "କୃଷି ବୈଜ୍ଞାନିକ ମୁଖ୍ୟ ଯୋଜନା ନିର୍ଦ୍ଦେଶ",
      directive_banner_sub: "ସକ୍ରିୟ ନିର୍ଦ୍ଦେଶ: ବିକାଶ ଦିବସ {day} କାର୍ଯ୍ୟ (ଡଃ ପ୍ରିୟା ଶର୍ମାଙ୍କ ଦ୍ୱାରା ଧାର୍ଯ୍ୟ)",

      // Help Modal
      help_title: "ଏଗ୍ରିଓସ ମାନକ କାର୍ଯ୍ୟ ପ୍ରଣାଳୀ (SOP) ଓ ସହାୟିକା",
      help_subtitle: "ସମ୍ପୂର୍ଣ୍ଣ ବୈଷୟିକ ଏବଂ କ୍ଷେତ୍ରସ୍ତରୀୟ ପରିଚାଳନା ପୁସ୍ତିକା।",
      help_search: "ବିଷୟ ବା ସୁବିଧା ଖୋଜନ୍ତୁ...",
      help_purpose: "💡 ମୁଖ୍ୟ ଉଦ୍ଦେଶ୍ୟ",
      help_sop: "📋 ପଦକ୍ଷେପ ଅନୁଯାୟୀ ପ୍ରଣାଳୀ (SOP)",
      help_under_hood: "⚙️ ବ୍ୟାକଏଣ୍ଡ ଏବଂ ବୈଷୟିକ କାର୍ଯ୍ୟ"
    }
  },

  t(key, params = {}) {
    const lang = this.currentLang || "en";
    const dict = this.translations[lang] || this.translations["en"];
    let text = dict[key] || this.translations["en"][key] || key;
    for (const [pKey, pVal] of Object.entries(params)) {
      text = text.replace(`{${pKey}}`, pVal);
    }
    return text;
  },

  setLanguage(lang) {
    if (!this.translations[lang]) lang = "en";
    this.currentLang = lang;
    localStorage.setItem("agrios_lang", lang);

    // Update select dropdowns
    document.querySelectorAll(".portal-lang-select").forEach(sel => {
      sel.value = lang;
    });

    // Re-render UI components if present
    if (window.AgriosUI) {
      if (typeof window.renderNavigation === "function") {
        window.renderNavigation();
      }
    }

    // Apply translations across DOM elements
    this.applyTranslations();

    // Dispatch event
    window.dispatchEvent(new CustomEvent("agrios:language_changed", { detail: { lang } }));
  },

  applyTranslations() {
    const lang = this.currentLang || localStorage.getItem("agrios_lang") || "en";
    const dict = this.translations[lang] || this.translations["en"];

    // Keep dropdowns in sync
    document.querySelectorAll(".portal-lang-select").forEach(sel => {
      if (sel.value !== lang) sel.value = lang;
    });

    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      if (dict[key]) {
        if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
          el.placeholder = dict[key];
        } else {
          el.innerText = dict[key];
        }
      }
    });

    // Translate menu items in sidebar
    document.querySelectorAll(".sidebar .menu-item span[data-i18n]").forEach(span => {
      const key = span.getAttribute("data-i18n");
      if (dict[key]) span.innerText = dict[key];
    });
  },

  init() {
    this.currentLang = localStorage.getItem("agrios_lang") || "en";
    this.applyTranslations();

    // Auto-reapply when custom events fire
    window.addEventListener("agrios:language_changed", () => {
      this.applyTranslations();
    });

    // Auto-preserve language across tab switches and dynamic loaders
    if (window.MutationObserver) {
      let debounceTimer = null;
      const observer = new MutationObserver(() => {
        if (this._suppressObserver) return;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          this._suppressObserver = true;
          this.applyTranslations();
          this._suppressObserver = false;
        }, 60);
      });

      if (document.body) {
        observer.observe(document.body, { childList: true, subtree: true });
      } else {
        document.addEventListener("DOMContentLoaded", () => {
          observer.observe(document.body, { childList: true, subtree: true });
        });
      }
    }
  }
};

document.addEventListener("DOMContentLoaded", () => {
  window.AgriosI18n.init();
});
