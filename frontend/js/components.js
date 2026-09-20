// AGRIOS Reusable// AGRIOS Component Library — VIZITOR Professional UI Elements
window.logout = function() {
  try {
    localStorage.removeItem("agrios_token");
    localStorage.removeItem("agrios_user");
    sessionStorage.clear();
  } catch (e) {
    console.warn("Storage cleanup failed:", e);
  }
  window.location.href = "/";
};

const AgriosUI = {
  showToast(title, message, icon = "🌱", duration = 5000) {
    let container = document.getElementById("toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "toast-container";
      container.style.cssText = "position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:10px;";
      document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.style.cssText = `
      background: #ffffff;
      border: 1px solid #a7f3d0;
      border-left: 4px solid #10b981;
      padding: 12px 18px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 300px;
      max-width: 420px;
      font-family: 'Inter', sans-serif;
    `;
    toast.innerHTML = `
      <div style="font-size:1.4rem;">${icon}</div>
      <div style="flex-grow:1;">
        <h4 style="font-size:0.9rem;font-weight:700;color:#0f172a;margin-bottom:2px;">${title}</h4>
        <p style="font-size:0.8rem;color:#475569;margin:0;">${message}</p>
      </div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = "opacity 0.4s ease, transform 0.4s ease";
      toast.style.opacity = "0";
      toast.style.transform = "translateX(100%)";
      setTimeout(() => toast.remove(), 400);
    }, duration);
  },

  toggleMobileSidebar() {
    const sidebar = document.querySelector(".sidebar");
    let backdrop = document.getElementById("mobile-sidebar-backdrop");
    if (!backdrop) {
      backdrop = document.createElement("div");
      backdrop.id = "mobile-sidebar-backdrop";
      backdrop.className = "mobile-sidebar-backdrop";
      backdrop.onclick = () => AgriosUI.closeMobileSidebar();
      document.body.appendChild(backdrop);
    }
    if (sidebar) {
      sidebar.classList.toggle("mobile-open");
      backdrop.classList.toggle("active", sidebar.classList.contains("mobile-open"));
      document.body.classList.toggle("sidebar-locked", sidebar.classList.contains("mobile-open"));
    }
  },

  closeMobileSidebar() {
    const sidebar = document.querySelector(".sidebar");
    const backdrop = document.getElementById("mobile-sidebar-backdrop");
    if (sidebar) sidebar.classList.remove("mobile-open");
    if (backdrop) backdrop.classList.remove("active");
    document.body.classList.remove("sidebar-locked");
  },

  toggleSidebarGroup(groupId) {
    const grp = document.getElementById(`group-${groupId}`);
    if (grp) {
      const isOpen = grp.classList.contains("open");
      grp.classList.toggle("open", !isOpen);
      const btn = grp.querySelector(".sidebar-group-header");
      if (btn) {
        btn.setAttribute("aria-expanded", !isOpen ? "true" : "false");
      }
    }
  },

  updateSidebarActive(tabId) {
    const sidebarContainer = document.getElementById("sidebar-container");
    if (!sidebarContainer) return;
    const items = sidebarContainer.querySelectorAll(".menu-item, .sub-menu-item");
    items.forEach(item => {
      const onclickAttr = item.getAttribute("onclick") || "";
      const dataTab = item.getAttribute("data-tab") || "";
      if (onclickAttr.includes(`'${tabId}'`) || dataTab === tabId) {
        item.classList.add("active");
        const parentGroup = item.closest(".sidebar-group");
        if (parentGroup) {
          parentGroup.classList.add("open", "has-active");
          const btn = parentGroup.querySelector(".sidebar-group-header");
          if (btn) btn.setAttribute("aria-expanded", "true");
        }
      } else {
        item.classList.remove("active");
      }
    });

    sidebarContainer.querySelectorAll(".sidebar-group").forEach(grp => {
      if (!grp.querySelector(".menu-item.active, .sub-menu-item.active")) {
        grp.classList.remove("has-active");
      }
    });
  },

  // VIZITOR Header bar: With live notification bell, language switcher, help modal, and global search
  renderNavbar(currentPortalName = "Farmer Portal", activePage = "home") {
    const user = AgriosAPI.getCurrentUser() || { full_name: "Agronomist", role: "agronomist" };
    const lang = (window.AgriosI18n && window.AgriosI18n.currentLang) || localStorage.getItem("agrios_lang") || "en";
    const helpLabel = window.AgriosI18n ? window.AgriosI18n.t("nav_help") : "Help";
    const logoutLabel = window.AgriosI18n ? window.AgriosI18n.t("nav_signout") : "Logout";

    return `
      <header class="top-header">
        <div class="header-left">
          <button class="mobile-menu-toggle-btn" onclick="AgriosUI.toggleMobileSidebar()" aria-label="Toggle Navigation Menu">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <div class="header-title-wrapper" style="display:flex;align-items:center;gap:8px;">
            <div style="font-weight:800;font-size:1.1rem;color:#0f172a;letter-spacing:-0.02em;" id="header-portal-title">${currentPortalName}</div>
            <span class="header-active-zone-badge" style="font-size:0.7rem;font-weight:700;padding:2px 8px;border-radius:12px;background:#ecfdf5;color:#059669;border:1px solid #a7f3d0;">
              Active Zone
            </span>
          </div>
        </div>

        <div class="header-right" style="display:flex; align-items:center; gap:8px;">
          <div class="search-bar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" placeholder="Search crops, tasks, fields, telemetry..." id="vizitor-global-search" data-i18n="search_placeholder">
          </div>

          <!-- 3-Language Multilingual Switcher -->
          <div style="position:relative;">
            <select class="portal-lang-select" onchange="window.AgriosI18n.setLanguage(this.value)" style="height:34px; padding:0 8px; font-size:0.78rem; font-weight:700; border-radius:8px; border:1px solid #cbd5e1; background:#ffffff; color:#0f172a; cursor:pointer; outline:none; transition:border 0.2s;">
              <option value="en" ${lang === 'en' ? 'selected' : ''}>🌐 English</option>
              <option value="hi" ${lang === 'hi' ? 'selected' : ''}>🇮🇳 हिन्दी (Hindi)</option>
              <option value="or" ${lang === 'or' ? 'selected' : ''}>🌾 ଓଡ଼ିଆ (Odia)</option>
            </select>
          </div>

          <!-- Portal Help & SOP Guide Button -->
          <button class="btn-secondary" onclick="AgriosUI.openHelpModal('${activePage || user.role || 'farmer'}')" title="Comprehensive Standard Operating Procedures & Feature Guide" style="height:34px; font-size:0.78rem; padding:0 10px; display:inline-flex; align-items:center; gap:5px; border-radius:8px; cursor:pointer; background:#f8fafc; border:1px solid #cbd5e1; color:#334155; font-weight:600;">
            <span>❓</span>
            <span data-i18n="nav_help">${helpLabel}</span>
          </button>

          <button id="universal-connectivity-btn" class="connectivity-status-btn status-online" type="button" title="System Connectivity: Live Sync">
            <span class="conn-dot"></span><span class="conn-btn-text">Live Sync</span>
          </button>

          <!-- Real-Time Notification Bell Indicator -->
          <button class="nav-bell-btn" id="nav-notification-bell" onclick="switchTab('notifications')" title="Notifications & Real-time Alerts" style="background:#ffffff; border:1px solid #e2e8f0; border-radius:8px; width:36px; height:36px; display:flex; align-items:center; justify-content:center; cursor:pointer; position:relative; color:#475569; transition:all 0.2s;">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <span id="nav-notif-count" style="display:none; position:absolute; top:-4px; right:-4px; background:#dc2626; color:white; font-size:0.65rem; font-weight:700; border-radius:10px; min-width:16px; height:16px; line-height:16px; text-align:center; padding:0 3px; border:2px solid #ffffff;">0</span>
          </button>

          <div class="profile-badge">
            <div class="profile-avatar">${(user.full_name || "A").substring(0, 2).toUpperCase()}</div>
            <div class="profile-info">
              <span class="profile-name">${user.full_name || "System User"}</span>
              <span class="profile-role">${(user.role || "").toUpperCase()} ${user.persona_code ? '• ' + user.persona_code : ''}</span>
            </div>
            <button class="btn-secondary" onclick="logout()" style="height:32px;padding:0 10px;font-size:0.75rem;margin-left:8px;" title="Sign Out">
              <span data-i18n="nav_signout">${logoutLabel}</span>
            </button>
          </div>
        </div>
      </header>
    `;
  },

  // VIZITOR Sticky Left Sidebar Navigation Component (Expandable Functional Groups)
  renderSidebar(role = "agronomist", activeTab = "overview") {
    const notifIcon = `<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>`;
    let standaloneItems = [];
    let groupItems = [];

    if (role === "agronomist") {
      standaloneItems = [
        {
          id: "overview",
          label: "Agronomy Lab Overview",
          icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>`,
          tab: "overview",
          i18nKey: "tab_overview"
        }
      ];

      groupItems = [
        {
          id: "twin_spatial",
          label: "3D Farm & Digital Twin",
          icon: "🌐",
          badge: "3D Twin",
          items: [
            { id: "twin_view", label: "3D Living Farm World", icon: "🌐", tab: "fieldcalibration", action: "switchTab('fieldcalibration')" },
            { id: "twin_walk", label: "Walk & Calibrate Boundary", icon: "📱", tab: "fieldcalibration", action: "switchTab('fieldcalibration'); setTimeout(function(){ var el = document.getElementById('btn-walk-cadre'); if(el) el.scrollIntoView({behavior:'smooth'}); }, 100);", badge: "GPS" },
            { id: "twin_cad", label: "CAD Farm Studio (Edit Farm)", icon: "📐", tab: "fieldcalibration", action: "switchTab('fieldcalibration'); setTimeout(function(){ if (window._dt3dToggleEditMode) window._dt3dToggleEditMode(); else if (twinAdapter3D) twinAdapter3D.setEditMode(true); }, 150);", badge: "CAD" },
            { id: "twin_precision", label: "11-Step Precision Wizard", icon: "⚙️", tab: "fieldcalibration", action: "openOnboardingWizard(false)", badge: "11 Steps" },
            { id: "twin_tractor", label: "55HP Tractor Operations", icon: "🚜", tab: "fieldcalibration", action: "switchTab('fieldcalibration'); setTimeout(function(){ if(window._dt3dToggleTractor) window._dt3dToggleTractor(); }, 150);", badge: "Drive" },
            { id: "twin_livestock", label: "Agro-Pastoral Livestock", icon: "🐄", tab: "fieldcalibration", action: "switchTab('fieldcalibration'); setTimeout(function(){ if(window._dt3dTriggerCuteAnimal) window._dt3dTriggerCuteAnimal(); }, 150);" },
            { id: "twin_disaster", label: "Extreme Disaster Engine", icon: "🌪️", tab: "fieldcalibration", action: "switchTab('fieldcalibration'); setTimeout(function(){ var el = document.getElementById('dt3d-disaster-select'); if(el) el.scrollIntoView({behavior:'smooth'}); }, 100);", badge: "Sim" },
            { id: "twin_names", label: "Hide / Show Name Tags", icon: "👤🏷️", tab: "fieldcalibration", action: "if(window._dt3dToggleWorkerNames) window._dt3dToggleWorkerNames();" }
          ]
        },
        {
          id: "crop_science",
          label: "Master Crop Science",
          icon: "🌾",
          badge: "Crop",
          items: [
            { id: "crop_schedule", label: "Master Growing Schedule", icon: "📅", tab: "cropplan", action: "switchTab('cropplan')" },
            { id: "crop_stages", label: "Botanical Stages Timeline", icon: "📈", tab: "cropplan", action: "switchTab('cropplan'); setTimeout(function(){ var el = document.getElementById('crop-plan-stages-container'); if(el) el.scrollIntoView({behavior:'smooth'}); }, 100);" },
            { id: "crop_cultivar", label: "Cultivar Selector & Days", icon: "🌾", tab: "cropplan", action: "if(window.openWizardToStep) openWizardToStep(7); else { openOnboardingWizard(false); jumpToStep(7); }" },
            { id: "crop_rotation", label: "Strategic Crop Rotation", icon: "🔄", tab: "overview", action: "switchTab('overview'); setTimeout(function(){ var el = document.getElementById('crop-rotation-card'); if(el) el.scrollIntoView({behavior:'smooth'}); }, 100);" }
          ]
        },
        {
          id: "pathogen_ai",
          label: "Pathogen AI & Lab",
          icon: "🔬",
          badge: "AI",
          items: [
            { id: "diag_lab", label: "Pathogen AI Diagnostic Lab", icon: "🔬", tab: "diagnostics", action: "switchTab('diagnostics')", badge: "AI" },
            { id: "diag_cams", label: "IoT Field Vision Cameras", icon: "📹", tab: "diagnostics", action: "switchTab('diagnostics'); setTimeout(function(){ var el = document.getElementById('camera-obs-grid'); if(el) el.scrollIntoView({behavior:'smooth'}); }, 100);" },
            { id: "diag_soil", label: "Root Zone Soil Nutrition", icon: "🧪", tab: "overview", action: "switchTab('overview'); setTimeout(function(){ var el = document.getElementById('soil-analysis-card'); if(el) el.scrollIntoView({behavior:'smooth'}); }, 100);" },
            { id: "diag_beacon", label: "North Sector Pest Beacon", icon: "🚨", tab: "fieldcalibration", action: "switchTab('fieldcalibration'); setTimeout(function(){ if(twinAdapter3D) twinAdapter3D.setOutbreakBeacon(true); }, 150);" }
          ]
        },
        {
          id: "workforce",
          label: "Assign Farmers & Team",
          icon: "👥",
          badge: "Team",
          items: [
            { id: "wf_roster", label: "Field Cadre Roster", icon: "👥", tab: "subordinates", action: "switchTab('subordinates')" },
            { id: "wf_register", label: "Register New Personnel", icon: "➕", tab: "subordinates", action: "if(window.openWizardToStep) openWizardToStep(1); else { openOnboardingWizard(false); jumpToStep(1); }", badge: "Add" },
            { id: "wf_tasks", label: "Task & Exertion Ledger", icon: "⏱️", tab: "subordinates", action: "switchTab('subordinates'); setTimeout(function(){ var el = document.getElementById('attendance-table-body'); if(el) el.scrollIntoView({behavior:'smooth'}); }, 100);" }
          ]
        },
        {
          id: "prescriptions",
          label: "Prescriptions & Directives",
          icon: "📋",
          badge: "Rx",
          items: [
            { id: "rx_ledger", label: "Rx Chemical Spray Ledger", icon: "💊", tab: "prescriptions", action: "switchTab('prescriptions')" },
            { id: "rx_weather", label: "Spray Weather Micro-Check", icon: "🌤️", tab: "prescriptions", action: "switchTab('prescriptions'); setTimeout(function(){ if(typeof loadSprayWeatherCheck === 'function') loadSprayWeatherCheck(); }, 150);", badge: "Check" },
            { id: "rx_broadcast", label: "Broadcast Agro-Advisories", icon: "📢", tab: "circulars", action: "switchTab('circulars')" }
          ]
        }
      ];
    } else if (role === "farmer") {
      standaloneItems = [
        {
          id: "overview",
          label: "Living Farm Twin Overview",
          icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>`,
          tab: "overview"
        }
      ];

      groupItems = [
        {
          id: "farmer_crops",
          label: "Crops & Daily Tasks",
          icon: "🌾",
          badge: "Tasks",
          items: [
            { id: "cropplan", label: "Crop Growing Plan Calendar", icon: "📅", tab: "cropplan", action: "switchTab('cropplan')" },
            { id: "tasks", label: "Priority Field Task Queue", icon: "⚡", tab: "tasks", action: "switchTab('tasks')", badge: "Due" },
            { id: "harvest", label: "Harvest & Silo Storage", icon: "🚜", tab: "harvest", action: "switchTab('harvest')" }
          ]
        },
        {
          id: "farmer_care",
          label: "Plant Health & Fields",
          icon: "🛡️",
          badge: "Health",
          items: [
            { id: "care", label: "AI Leaf Pathogen Scanner", icon: "🔬", tab: "care", action: "switchTab('care')", badge: "AI" },
            { id: "fields", label: "Fields & Soil Telemetry", icon: "🌱", tab: "fields", action: "switchTab('fields')" },
            { id: "resources", label: "Bio-Inputs & Machinery", icon: "📦", tab: "resources", action: "switchTab('resources')" }
          ]
        },
        {
          id: "farmer_mandi",
          label: "Mandi & Direct Schemes",
          icon: "🏛️",
          badge: "Govt",
          items: [
            { id: "mandi", label: "APMC Mandi & Govt Schemes", icon: "💰", tab: "mandi", action: "switchTab('mandi')" }
          ]
        }
      ];
    } else if (role === "government") {
      standaloneItems = [
        {
          id: "overview",
          label: "Executive Command Center",
          icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>`,
          tab: "overview"
        }
      ];

      groupItems = [
        {
          id: "gov_biosecurity",
          label: "Biosecurity & Surveillance",
          icon: "🛡️",
          badge: "Radar",
          items: [
            { id: "surveillance", label: "Pest Outbreak Radar", icon: "📡", tab: "surveillance", action: "switchTab('surveillance')", badge: "Live" },
            { id: "quarantine", label: "Containment Buffer Zones", icon: "⭕", tab: "quarantine", action: "switchTab('quarantine')" },
            { id: "compliance", label: "Biosecurity Audit & Compliance", icon: "📋", tab: "compliance", action: "switchTab('compliance')" },
            { id: "directives", label: "Disaster Directives Dispatch", icon: "🚨", tab: "directives", action: "switchTab('directives')" }
          ]
        },
        {
          id: "gov_reserves",
          label: "Grain & Resource Buffers",
          icon: "🌾",
          badge: "Supply",
          items: [
            { id: "foodsecurity", label: "Strategic Grain Reserves", icon: "🏛️", tab: "foodsecurity", action: "switchTab('foodsecurity')" },
            { id: "fertilizers", label: "Fertilizer Rakes & Buffers", icon: "🧪", tab: "fertilizers", action: "switchTab('fertilizers')" },
            { id: "telemetry", label: "State Satellite Telemetry", icon: "🛰️", tab: "telemetry", action: "switchTab('telemetry')" },
            { id: "cropintel", label: "Crop Intelligence & Analytics", icon: "📊", tab: "cropintel", action: "switchTab('cropintel')" }
          ]
        },
        {
          id: "gov_fiscal",
          label: "Fiscal & Workforce Cadre",
          icon: "💼",
          badge: "Fiscal",
          items: [
            { id: "workforce", label: "Workforce Cadre Registry", icon: "👥", tab: "workforce", action: "switchTab('workforce')" },
            { id: "subsidies", label: "DBT & Insurance Claims", icon: "💳", tab: "subsidies", action: "switchTab('subsidies')" },
            { id: "finance", label: "Financial Oversight & Budget", icon: "📈", tab: "finance", action: "switchTab('finance')" },
            { id: "infrastructure", label: "Infrastructure & IoT Network", icon: "⚙️", tab: "infrastructure", action: "switchTab('infrastructure')" },
            { id: "reports", label: "Reports & Executive Export", icon: "📑", tab: "reports", action: "switchTab('reports')" }
          ]
        }
      ];
    } else if (role === "worker") {
      standaloneItems = [
        {
          id: "overview",
          label: "Today's Work Plan",
          icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`,
          tab: "overview"
        }
      ];

      groupItems = [
        {
          id: "worker_field",
          label: "Field Work & Tools",
          icon: "🔧",
          badge: "Field",
          items: [
            { id: "scanner", label: "Mobile Leaf Scanner", icon: "📷", tab: "scanner", action: "switchTab('scanner')", badge: "AI" },
            { id: "groundtruth", label: "Ground Truth Logs", icon: "📝", tab: "groundtruth", action: "switchTab('groundtruth')" },
            { id: "equipment", label: "Field Kit & Tools", icon: "🧰", tab: "equipment", action: "switchTab('equipment')" }
          ]
        },
        {
          id: "worker_welfare",
          label: "Attendance & Welfare",
          icon: "🤝",
          badge: "Logs",
          items: [
            { id: "logbook", label: "Attendance & Shift Log", icon: "⏱️", tab: "logbook", action: "switchTab('logbook')" },
            { id: "performance", label: "Performance Scorecard", icon: "🏆", tab: "performance", action: "switchTab('performance')" },
            { id: "advisory", label: "Agronomist Hotline", icon: "📞", tab: "advisory", action: "switchTab('advisory')" },
            { id: "training", label: "Training & Certification", icon: "🎓", tab: "training", action: "switchTab('training')" },
            { id: "leaves", label: "Leave & Advance Requests", icon: "🌴", tab: "leaves", action: "switchTab('leaves')" },
            { id: "emergency", label: "Emergency Protocols & SOS", icon: "🆘", tab: "emergency", action: "switchTab('emergency')", badge: "SOS" }
          ]
        }
      ];
    }

    const standaloneHTML = standaloneItems.map(item => {
      const tabKey = item.i18nKey || `tab_${item.id}`;
      const translated = window.AgriosI18n ? window.AgriosI18n.t(tabKey) : item.label;
      const display = (translated && translated !== tabKey) ? translated : item.label;
      const isActive = activeTab === item.tab;
      return `
        <a href="javascript:void(0)" class="menu-item ${isActive ? 'active' : ''}" 
           onclick="switchTab('${item.tab}'); if(window.AgriosUI) AgriosUI.closeMobileSidebar();" 
           data-tab="${item.tab}"
           style="position:relative; display:flex; align-items:center;">
          ${item.icon.startsWith('<') ? item.icon : `<span style="font-size:1.1rem; width:22px; display:inline-flex; align-items:center; justify-content:center;">${item.icon}</span>`}
          <span style="flex:1;" data-i18n="${tabKey}">${display}</span>
        </a>
      `;
    }).join("");

    const groupsHTML = groupItems.map(group => {
      const hasActiveChild = group.items.some(sub => sub.tab === activeTab);
      const isExpanded = hasActiveChild;
      const subItemsHTML = group.items.map(sub => {
        const isSubActive = activeTab === sub.tab;
        const subAction = sub.action ? sub.action : `switchTab('${sub.tab}')`;
        return `
          <a href="javascript:void(0)" class="menu-item sub-menu-item ${isSubActive ? 'active' : ''}" 
             onclick="${subAction}; if(window.AgriosUI) AgriosUI.closeMobileSidebar();" 
             data-tab="${sub.tab}"
             title="${sub.label}">
            <span class="sub-item-icon">${sub.icon}</span>
            <span class="sub-item-text">${sub.label}</span>
            ${sub.badge ? `<span class="sub-item-badge">${sub.badge}</span>` : ''}
          </a>
        `;
      }).join("");

      return `
        <div class="sidebar-group ${isExpanded ? 'open' : ''} ${hasActiveChild ? 'has-active' : ''}" id="group-${group.id}">
          <button type="button" class="sidebar-group-header" onclick="AgriosUI.toggleSidebarGroup('${group.id}')" aria-expanded="${isExpanded ? 'true' : 'false'}">
            <span class="group-icon">${group.icon}</span>
            <span class="group-label">${group.label}</span>
            ${group.badge ? `<span class="group-badge">${group.badge}</span>` : ''}
            <span class="group-arrow">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </span>
          </button>
          <div class="sidebar-sub-menu">
            ${subItemsHTML}
          </div>
        </div>
      `;
    }).join("");

    const navLabel = window.AgriosI18n ? window.AgriosI18n.t("nav_navigation") : "Navigation";
    const notifLabel = window.AgriosI18n ? window.AgriosI18n.t("nav_notif") : "Notifications";
    const signoutLabel = window.AgriosI18n ? window.AgriosI18n.t("nav_signout") : "Sign Out";

    return `
      <aside class="sidebar">
        <div class="sidebar-brand">
          <div class="sidebar-brand-icon">🌱</div>
          <span class="sidebar-brand-text">AGRIOS</span>
          <span class="sidebar-brand-badge">${role}</span>
          <button class="mobile-sidebar-close-btn" onclick="AgriosUI.closeMobileSidebar()" aria-label="Close Sidebar" title="Close Menu">✕</button>
        </div>

        <div class="sidebar-label" data-i18n="nav_navigation">${navLabel}</div>
        <nav class="sidebar-menu">
          ${standaloneHTML}
          ${groupsHTML}
        </nav>

        <div class="sidebar-footer">
          <!-- Notifications Tab Docked Directly Above Sign Out -->
          <a href="javascript:void(0)" class="menu-item ${activeTab === 'notifications' ? 'active' : ''}" onclick="switchTab('notifications'); if(window.AgriosUI) AgriosUI.closeMobileSidebar();" data-tab="notifications" style="position:relative; display:flex; align-items:center;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              ${notifIcon}
            </svg>
            <span style="flex:1;" data-i18n="nav_notif">${notifLabel}</span>
            <span class="notif-badge-pill" id="sidebar-notif-badge" style="display:none; background:#dc2626; color:white; font-size:0.65rem; font-weight:700; border-radius:10px; min-width:18px; height:18px; line-height:18px; text-align:center; padding:0 5px; margin-left:auto;">0</span>
          </a>

          <a href="javascript:void(0)" class="menu-item" onclick="logout()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            <span data-i18n="nav_signout">${signoutLabel}</span>
          </a>
        </div>
      </aside>
    `;
  },

  renderHealthScoreRing(score = 90) {
    const color = score >= 80 ? "#059669" : (score >= 50 ? "#d97706" : "#dc2626");
    return `
      <div style="display:flex;align-items:center;gap:16px;background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;padding:16px;">
        <div style="width:64px;height:64px;border-radius:50%;background:conic-gradient(${color} calc(${score} * 1%), #f1f5f9 0);display:flex;align-items:center;justify-content:center;position:relative;">
          <div style="width:50px;height:50px;border-radius:50%;background:#ffffff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:1.1rem;color:${color};">
            ${Math.round(score)}%
          </div>
        </div>
        <div>
          <h4 style="font-size:0.95rem;font-weight:700;color:#0f172a;margin:0 0 4px 0;">Biological Crop Vitality</h4>
          <p style="font-size:0.8rem;color:#64748b;margin:0;">NDVI vegetative index, root zone hydration, and pathogen defense</p>
        </div>
      </div>
    `;
  },

  renderNotificationsTab() {
    return `
      <div class="card-panel">
        <div class="panel-header" style="flex-wrap:wrap; gap:12px;">
          <div>
            <h3 class="panel-title" style="display:flex; align-items:center; gap:8px;">
              <span>🔔</span> System & Field Notifications
            </h3>
            <p class="panel-subtitle">Real-time alerts, task dispatches, worker execution updates, and biosecurity directives.</p>
          </div>
          <div style="display:flex; gap:8px;">
            <button type="button" class="btn-secondary" onclick="window.AgriosNotifications.markAllRead()" style="height:32px; font-size:0.75rem; padding:0 10px;">
              ✓ Mark All Read
            </button>
            <button type="button" class="btn-primary" onclick="window.AgriosNotifications.loadNotifications()" style="height:32px; font-size:0.75rem; padding:0 10px;">
              ↻ Refresh Feed
            </button>
          </div>
        </div>

        <!-- Filter bar -->
        <div style="display:flex; gap:8px; margin-bottom:14px; flex-wrap:wrap;">
          <button type="button" class="btn-secondary active notif-filter-btn" onclick="window.AgriosNotifications.setFilter('all', this)" style="height:28px; font-size:0.72rem; padding:0 12px; border-radius:14px;">
            All
          </button>
          <button type="button" class="btn-secondary notif-filter-btn" onclick="window.AgriosNotifications.setFilter('task_dispatch', this)" style="height:28px; font-size:0.72rem; padding:0 12px; border-radius:14px;">
            🚀 Task Dispatches
          </button>
          <button type="button" class="btn-secondary notif-filter-btn" onclick="window.AgriosNotifications.setFilter('task_completion', this)" style="height:28px; font-size:0.72rem; padding:0 12px; border-radius:14px;">
            ✅ Completed Tasks
          </button>
          <button type="button" class="btn-secondary notif-filter-btn" onclick="window.AgriosNotifications.setFilter('warning', this)" style="height:28px; font-size:0.72rem; padding:0 12px; border-radius:14px;">
            🚨 Risk Alerts
          </button>
        </div>

        <div id="notifications-feed-list" style="display:flex; flex-direction:column; gap:10px;">
          <div style="text-align:center; padding:2rem; color:#64748b;">Loading notifications...</div>
        </div>
      </div>
    `;
  },

  openHelpModal(portalRole = "farmer") {
    let modal = document.getElementById("agrios-help-guide-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "agrios-help-guide-modal";
      modal.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(15,23,42,0.7); backdrop-filter:blur(5px); z-index:99999; display:flex; align-items:center; justify-content:center; padding:1.5rem; box-sizing:border-box;";
      document.body.appendChild(modal);
    }
    modal.innerHTML = AgriosUI.renderHelpModalContent(portalRole);
    modal.style.display = "flex";
  },

  closeHelpModal() {
    const modal = document.getElementById("agrios-help-guide-modal");
    if (modal) modal.style.display = "none";
  },

  filterHelpTopics(query) {
    const q = (query || "").toLowerCase().trim();
    document.querySelectorAll(".help-feature-card").forEach(card => {
      const text = card.innerText.toLowerCase();
      card.style.display = text.includes(q) ? "block" : "none";
    });
  },

  renderHelpModalContent(portalRole) {
    const role = (portalRole || "farmer").toLowerCase();
    const lang = (window.AgriosI18n && window.AgriosI18n.currentLang) || "en";

    // Comprehensive Help Knowledgebase for all 4 Portals
    const helpData = {
      agronomist: [
        {
          title: "1. Master Crop Plan Generation & Stage Scheduling",
          icon: "🌾",
          purpose: "Synthesizes multi-stage calibrated agronomic calendars tailored to crop species, jurisdiction (Punjab, Odisha, etc.), and soil hydrology.",
          sop: "1. Select cultivar (e.g. Wheat PBW-550). 2. Input acreage and registered workforce count. 3. Click 'Synthesize Calibrated Engine'. 4. Expand daily schedules to inspect day-by-day objectives.",
          underHood: "Calls POST /api/crop-plans/generate-and-calibrate, stores plan in _FARM_CROP_PLANS, updates User.has_completed_onboarding, and sets up growth stage nodes."
        },
        {
          title: "2. 3D Farm Digital Twin Calibration & Interactive CAD",
          icon: "🌐",
          purpose: "Renders real-time spatial digital twin with authentic botanical low-poly 3D models, procedural terrain, wind sway vertex animations, and CAD drawing tools.",
          sop: "1. Navigate to '3D Farm Digital Twin'. 2. Use WASD / Arrow keys and mouse orbit to inspect plots. 3. Switch between Normal, Infrared, Thermal, and Stress inspection shaders. 4. Use Draw Field / Draw Road CAD tools.",
          underHood: "Three.js WebGL viewport in frontend/js/digital_twin_3d.js with BufferGeometry vertex coloring, procedural plant shaders, and POST /api/farm-structures/boundary CAD persistence."
        },
        {
          title: "3. Workforce Attendance Audit & Subordinate Cadre",
          icon: "👥",
          purpose: "Live oversight of field workforce check-ins, latched GPS coordinates, task completion velocity, and rest allocations.",
          sop: "1. Click 'Workforce & Attendance' tab. 2. View live audit ledger with real check-in timestamps, GPS pins, and assigned parcels. 3. Monitor Krishi Sakhi shift statuses.",
          underHood: "Queries GET /api/workforce/attendance, displaying latched coordinates, verified tasks, and worker profile availability status."
        },
        {
          title: "4. AI Pathogen Laboratory & Official Rx Prescription Certification",
          icon: "🔬",
          purpose: "Automated botanical disease diagnosis across Rice, Wheat, Tomato, Potato, Maize, and Cotton with official accredited prescription certification.",
          sop: "1. Open 'AI Pathogen Lab & Rx'. 2. Inspect uploaded foliar samples. 3. Review AI confidence score and recommended chemical/biological remedies. 4. Click 'Certify Agronomic Prescription' to issue printable Rx certificate.",
          underHood: "POST /api/agronomist/diagnose-leaf executes multi-class pathogen vision inference, generates official laboratory serial number, and emits DOMAIN_EVENT for treatment order."
        },
        {
          title: "5. Granular Day Task Dispatch & Cross-Portal Notifications",
          icon: "🚀",
          purpose: "Releases specific growth stage directives straight to Farmer and Krishi Sakhi task queues, preventing workforce confusion.",
          sop: "1. Under Master Crop Plan, expand granular daily schedule. 2. Click 'Dispatch Day X Tasks'. 3. System immediately alerts all portals via audio/visual toasts and updates notification counters.",
          underHood: "POST /api/crop-plans/dispatch-day-tasks creates FarmTask records with 'Day X', creates AdvisoryMessage, sets _ACTIVE_DISPATCHED_DAY, and broadcasts TASK_CREATED."
        },
        {
          title: "6. Weather Adaptation Safeguards & Biosecurity Alerts",
          icon: "⛈️",
          purpose: "Injects dynamic agronomic adaptations (anti-transpirants, drainage protocols) during unseasonal rain or heatwaves.",
          sop: "1. Go to 'Weather Safeguards' tab. 2. Select safeguard trigger (e.g. Unseasonal Western Disturbance Rain). 3. Click 'Activate Protocol'.",
          underHood: "Updates stage adaptation in database, generates emergency AdvisoryMessage, and broadcasts WEATHER_PROTOCOL_ACTIVATED event across cadre."
        }
      ],

      farmer: [
        {
          title: "1. Living Digital Twin Farm Telemetry & Climate Simulator",
          icon: "🌱",
          purpose: "Continuous bio-physical visualization of crop health, soil moisture, NDVI photosynthetic vigor, and simulated micro-climates.",
          sop: "1. Open Overview tab. 2. Review biological vitality ring and NPK balances. 3. Click climate simulation buttons (Sunny, Rain, Heatwave, Wind) to preview crop resilience.",
          underHood: "Digital twin 2D botanical canvas simulator reacting to dynamic soil moisture grids and weather parameters in real time."
        },
        {
          title: "2. Master Crop Plan Growing Calendar (120 Days)",
          icon: "📅",
          purpose: "Complete life-cycle guide containing phenological stage milestones, basal fertilizer schedules, and water application regimes.",
          sop: "1. Click 'Growing Plan Calendar'. 2. Review current stage requirements. 3. Click 'View Granular Daily Tasks' to see daily agronomic objectives.",
          underHood: "GET /api/crop-plans/farm/{farm_id} retrieves agronomist-synthesized multi-stage schedule with calibrated inputs."
        },
        {
          title: "3. Agricultural Work Queue (Locked to Agronomist Assigned Day)",
          icon: "📋",
          purpose: "Displays the strict operational directives for the active growth day assigned by Dr. Priya Sharma. Locked to prevent mis-sequenced fieldwork.",
          sop: "1. Open 'Agricultural Work Queue'. 2. Check the green 'Active Directive' banner. 3. Execute field tasks and click '✓ Complete' once finished.",
          underHood: "GET /api/crop-plans/farm/{farm_id}/active-dispatched-day enforces display strictly for Day X. Complete action updates database and emits TASK_COMPLETED."
        },
        {
          title: "4. AI Crop Health Scanner & Fungicide Ordering",
          icon: "📷",
          purpose: "Instant edge AI diagnosis of diseased leaves with one-click direct booking of prescribed agro-inputs.",
          sop: "1. Navigate to 'AI Crop Care'. 2. Click 'Select Image' to upload foliar photo. 3. Click '⚡ Run Neural Diagnosis'. 4. Review pathogen and click 'Order Prescribed Fungicide Lot'.",
          underHood: "POST /api/agronomist/diagnose-leaf classifies disease, returns treatment protocols, and queues input reservation in resource inventory."
        },
        {
          title: "5. Fields, Parcels & Soil Laboratory Telemetry",
          icon: "🧪",
          purpose: "Audited soil test balance sheets (Available N, P2O5, K2O, pH, EC) and GPS parcel cadastres.",
          sop: "1. Open 'Fields & Soil Telemetry'. 2. Review soil test cards for North Parcel and Polyhouse. 3. Follow fertilizer recommendations to maintain soil organic carbon.",
          underHood: "Aggregates soil chemistry and field parcel geometry from database farm structures."
        },
        {
          title: "6. Machinery & Custom Hiring Center (CHC) Booking",
          icon: "🚜",
          purpose: "Allows booking heavy machinery (Rotavator, Laser Leveler, High-Clearance Sprayer) from the Punjab State CHC pool.",
          sop: "1. Open 'Machinery & CHC Booking'. 2. Choose machine and reservation date. 3. Click 'Reserve Machine'.",
          underHood: "POST /api/resources/book-equipment registers machinery schedule, calculates subsidized rental rate, and broadcasts EQUIPMENT_BOOKED."
        },
        {
          title: "7. Yield Forecasting & APMC Mandi Live Prices",
          icon: "📈",
          purpose: "Predicts harvest yield per acre and monitors real-time e-NAM wholesale market auction prices across Khanna and Ludhiana mandis.",
          sop: "1. Inspect 'Yield & Harvest' for projected metric tonnes. 2. Check 'APMC Mandi Prices' for current MSP and modal mandi rates to plan optimal harvest sales.",
          underHood: "Combines growing plan parameters with real-time agricultural mandi price feeds."
        }
      ],

      worker: [
        {
          title: "1. Today's Work Plan (Agronomist Day Locked)",
          icon: "🚜",
          purpose: "Lists the exact field operations assigned for the active growth day by Dr. Priya Sharma. Worker cannot alter or skip days.",
          sop: "1. Review active day banner at top of work plan. 2. Read task instructions. 3. Execute field work and click '✓ Execute & Verify GPS Fix' to submit completion.",
          underHood: "Queries active dispatched day from backend. Latching GPS lat/lon updates task status to COMPLETED and alerts Dr. Priya Sharma."
        },
        {
          title: "2. Mobile Vision Leaf Scanner & Diagnostic Certificates",
          icon: "📸",
          purpose: "In-field smartphone camera pathology diagnosis with instant printable PAU-ICAR diagnostic certificates.",
          sop: "1. Open 'Mobile Vision Scanner'. 2. Select crop (Rice, Wheat, Tomato, etc.). 3. Upload or snap photo. 4. Click 'Analyze Leaf'. 5. Click 'Print Official Certificate' for farmer hand-off.",
          underHood: "Calls POST /api/agronomist/diagnose-leaf with real botanical symptom classifier, returning accredited lab certificate data."
        },
        {
          title: "3. GPS Geotag Attendance Check-In & Logbook",
          icon: "📍",
          purpose: "Cryptographic proof of field presence, parcel verification, and shift duration for DBT wage payouts.",
          sop: "1. Click '📍 GPS Geotag Attendance'. 2. Browser latches GPS coordinates. 3. Review entry in Attendance & Logbook table.",
          underHood: "POST /api/workforce-ops/attendance logs GPS coordinates and parcel name, emitting ATTENDANCE_LOGGED to agronomist audit panel."
        },
        {
          title: "4. Ground Truth Telemetry & ML Crop Stress Prediction",
          icon: "📋",
          purpose: "Field sensor logging with real Machine Learning regression estimating Crop Water Stress Index (CWSI), weed pressure, and nitrogen deficits.",
          sop: "1. Navigate to 'Ground Truth Logs'. 2. Enter soil moisture %, weed level, canopy cover %, and foliar notes. 3. Click 'Submit Observation'. 4. Review live ML stress score.",
          underHood: "POST /api/workforce-ops/ground-truth runs WorkforceAgronomicMLService.evaluate_ground_truth to compute multi-factor stress scores."
        },
        {
          title: "5. Field Kit Registry, Tool Health & Damage Requisitions",
          icon: "🔧",
          purpose: "Prognostic wear tracking for DGPS, soil probes, and sprayers with instant doorstep maintenance requisitions.",
          sop: "1. Open 'Field Kit & Tools'. 2. Inspect battery health, sensor drift %, and calibration status. 3. Click 'Report Issue' to raise a repair ticket.",
          underHood: "WorkforceAgronomicMLService.predict_equipment_health computes degradation index, RUL hours, and notifies KVK central depot."
        },
        {
          title: "6. Agronomist Hotline & Botanical NLP Triage Engine",
          icon: "💬",
          purpose: "Interactive two-way direct communication with Dr. Priya Sharma with automated AI symptom triage assistance.",
          sop: "1. Open 'Agronomist Hotline'. 2. Type symptoms or inquiry. 3. Click 'Send Inquiry'. 4. Receive immediate AI preliminary triage advice while Dr. Priya reviews.",
          underHood: "POST /api/workforce-ops/hotline/send processes inquiry via NLP symptom extractor, assigns urgency score, and alerts agronomist."
        },
        {
          title: "7. Multi-Crop Training & PAU-ICAR Accredited Certificates",
          icon: "🎓",
          purpose: "Interactive specialized curriculum across 8+ crops with knowledge checks and official accredited printable Certificate of Competency.",
          sop: "1. Open 'Training & Certification'. 2. Click 'Start Course' on any module. 3. Complete 3-question knowledge quiz. 4. Click 'Submit & Certify' to generate verifiable certificate.",
          underHood: "POST /api/workforce-ops/training/certify grades test, creates verification hash, and generates official PAU-ICAR certificate."
        },
        {
          title: "8. Leave Applications & Emergency Wage Advances",
          icon: "🏖️",
          purpose: "Formal leave requests and fast-track welfare wage advances via the PM-KISAN Krishi Sakhi pool.",
          sop: "1. Open 'Leave & Welfare Requests'. 2. Select leave category, dates, and reason. 3. Click 'Submit Application'. 4. Use 'Request Emergency Wage Advance' if funds needed.",
          underHood: "POST /api/workforce-ops/leaves routes request to agronomist supervisor; POST /wage-advance logs DBT disbursement record."
        },
        {
          title: "9. Emergency Protocols & Life-Safety SOS Distress Beacon",
          icon: "🚨",
          purpose: "Instant emergency broadcasting for snakebite, heatstroke, chemical spill, or machinery trauma.",
          sop: "1. Open 'Emergency Protocols & SOS'. 2. Read first-aid SOP cards. 3. In true emergency, click '🚨 TRIGGER DISTRESS BEACON (SOS)'.",
          underHood: "POST /api/workforce-ops/emergency-sos creates critical RiskAlert, latches GPS, alerts 108 Ambulance, and broadcasts emergency alert across all portals."
        }
      ],

      government: [
        {
          title: "1. Statewide Agricultural Executive Command",
          icon: "🏛️",
          purpose: "Real-time state overview of crop acreage, workforce density, active biosecurity alerts, and regional grain balances.",
          sop: "1. Review state production telemetry cards. 2. Monitor active agricultural alerts and district-by-district crop coverage.",
          underHood: "Aggregates canonical data across all registered farms, crop growing plans, and workforce attendance records."
        },
        {
          title: "2. Pest Outbreak Radar & Cordon Sanitaire Buffer Zones",
          icon: "📡",
          purpose: "Statewide epidemiological surveillance tracking Spodoptera frugiperda and Puccinia outbreaks with 5km/15km containment rings.",
          sop: "1. Inspect 'Pest Outbreak Radar'. 2. Click 'Containment Buffer Zones' to inspect quarantined sectors and chemical buffer boundaries.",
          underHood: "Queries active biosecurity alerts and calculates spatial quarantine buffers around infected farm parcel centroids."
        },
        {
          title: "3. DBT Subsidies & Direct Benefit Verification",
          icon: "💳",
          purpose: "Audits and approves direct electronic disbursements for PM-KISAN, crop insurance, and solar pump subsidies.",
          sop: "1. Navigate to 'DBT & Insurance Claims'. 2. Review pending farmer applications. 3. Verify Aadhaar/Kisan Card match and click 'Approve DBT Disbursal'.",
          underHood: "Validates beneficiary credentials against agricultural profiles and logs transaction references in government ledger."
        },
        {
          title: "4. Strategic Grain Reserves & Food Security Buffer",
          icon: "🌾",
          purpose: "Monitors statewide warehouse storage levels (CWC/PUNGRAIN) against national buffer stock norms.",
          sop: "1. Open 'Strategic Grain Reserves'. 2. Inspect wheat and rice silo capacities. 3. Set alert thresholds for buffer replenishment.",
          underHood: "Tracks silo metrics and dispatches alerts when district storage falls below mandatory buffer norms."
        },
        {
          title: "5. Official Punjab Department Letterhead Reports & Data Exports",
          icon: "📄",
          purpose: "Generates authentic formal state executive briefs with Punjab Department of Agriculture letterhead, Print PDF, CSV export, and JSON export.",
          sop: "1. Open 'Official State Reports'. 2. Select report type and district. 3. Click 'Print Official PDF' or 'Export CSV / JSON'.",
          underHood: "Formats live state metrics into official executive letterheads with cryptographic verification stamps."
        }
      ]
    };

    const currentTopics = helpData[role] || helpData["farmer"];
    const portalTitles = {
      agronomist: "Lead Agronomist Portal",
      farmer: "Progressive Farmer Operational Portal",
      worker: "Krishi Sakhi Field Worker Portal",
      government: "Statewide Government Command Center"
    };

    return `
      <div style="background:#ffffff; border-radius:14px; width:100%; max-width:880px; max-height:90vh; display:flex; flex-direction:column; overflow:hidden; box-shadow:0 25px 50px -12px rgba(0,0,0,0.25); font-family:'Inter', sans-serif;">
        <!-- Header -->
        <div style="padding:1.25rem 1.5rem; background:#0f172a; color:#ffffff; display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:1.4rem;">❓</span>
              <h3 style="margin:0; font-size:1.15rem; font-weight:800; color:#ffffff;" data-i18n="help_title">
                ${window.AgriosI18n ? window.AgriosI18n.t("help_title") : "AGRIOS Standard Operating Procedures & Guide"}
              </h3>
            </div>
            <p style="margin:4px 0 0 0; font-size:0.8rem; color:#94a3b8;">
              ${portalTitles[role] || "Portal"} • Operational & Technical Manual
            </p>
          </div>
          <button onclick="AgriosUI.closeHelpModal()" style="background:none; border:none; color:#94a3b8; font-size:1.6rem; cursor:pointer; padding:0 6px; line-height:1;" title="Close">&times;</button>
        </div>

        <!-- Search & Filter Bar -->
        <div style="padding:0.75rem 1.5rem; background:#f8fafc; border-bottom:1px solid #e2e8f0; display:flex; gap:10px; align-items:center;">
          <span style="font-size:1.1rem;">🔍</span>
          <input type="text" placeholder="Search features, SOP steps, APIs..." oninput="AgriosUI.filterHelpTopics(this.value)" style="flex:1; height:34px; padding:0 10px; font-size:0.82rem; border:1px solid #cbd5e1; border-radius:6px; outline:none;" data-i18n="help_search">
          <span style="font-size:0.75rem; color:#64748b; font-weight:600;">${currentTopics.length} Comprehensive Topics</span>
        </div>

        <!-- Content Body (Scrollable) -->
        <div style="padding:1.5rem; overflow-y:auto; flex:1; display:flex; flex-direction:column; gap:1.25rem;" id="help-topics-container">
          ${currentTopics.map(t => `
            <div class="help-feature-card" style="background:#ffffff; border:1px solid #e2e8f0; border-left:4px solid #059669; border-radius:8px; padding:1.25rem; transition:box-shadow 0.2s;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <h4 style="margin:0; font-size:1rem; font-weight:700; color:#0f172a; display:flex; align-items:center; gap:8px;">
                  <span>${t.icon}</span> ${t.title}
                </h4>
                <span class="card-badge badge-success" style="font-size:0.7rem;">Verified SOP</span>
              </div>

              <!-- Purpose -->
              <div style="margin-bottom:8px;">
                <span style="font-size:0.75rem; font-weight:700; color:#065f46; text-transform:uppercase;">💡 Operational Purpose:</span>
                <p style="margin:2px 0 0 0; font-size:0.83rem; color:#334155; line-height:1.45;">${t.purpose}</p>
              </div>

              <!-- Step-by-Step SOP -->
              <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:10px 12px; margin-bottom:8px;">
                <span style="font-size:0.75rem; font-weight:700; color:#0f172a; text-transform:uppercase;">📋 Step-by-Step Execution SOP:</span>
                <p style="margin:2px 0 0 0; font-size:0.82rem; color:#475569; line-height:1.45;">${t.sop}</p>
              </div>

              <!-- Under the Hood -->
              <div style="background:#f1f5f9; border-radius:6px; padding:8px 12px; font-family:'JetBrains Mono', monospace; font-size:0.75rem; color:#334155;">
                <strong style="color:#0f172a;">⚙️ Under-the-Hood Operations:</strong> ${t.underHood}
              </div>
            </div>
          `).join("")}
        </div>

        <!-- Footer -->
        <div style="padding:0.75rem 1.5rem; background:#f8fafc; border-top:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:0.75rem; color:#64748b;">AGRIOS Precision Agronomic Architecture • Standards Compliant</span>
          <button class="btn-primary" onclick="AgriosUI.closeHelpModal()" style="height:32px; font-size:0.78rem; padding:0 14px;">
            Close Guide
          </button>
        </div>
      </div>
    `;
  }
};

window.AgriosNotifications = {
  notifications: [],
  unreadCount: 0,
  currentFilter: 'all',

  async loadNotifications(farmId) {
    try {
      const activeFarm = farmId || localStorage.getItem("agrios_active_farm_id") || "default";
      const url = `/api/communications?farm_id=${encodeURIComponent(activeFarm)}`;
      const res = await fetch(url);
      if (res.ok) {
        this.notifications = await res.json();
      } else {
        const fallbackRes = await fetch('/api/communications');
        if (fallbackRes.ok) this.notifications = await fallbackRes.json();
      }
      this.updateBadgeCounts();
      this.renderFeed(this.currentFilter);
    } catch (e) {
      console.warn("[Notifications] Failed to load:", e);
    }
  },

  updateBadgeCounts() {
    const unread = this.notifications.filter(n => !n.is_read).length;
    this.unreadCount = unread;
    const navBadge = document.getElementById("nav-notif-count");
    if (navBadge) {
      if (unread > 0) {
        navBadge.innerText = unread > 99 ? '99+' : unread;
        navBadge.style.display = "inline-block";
      } else {
        navBadge.style.display = "none";
      }
    }
    const sideBadge = document.getElementById("sidebar-notif-badge");
    if (sideBadge) {
      if (unread > 0) {
        sideBadge.innerText = unread > 99 ? '99+' : unread;
        sideBadge.style.display = "inline-block";
      } else {
        sideBadge.style.display = "none";
      }
    }
  },

  setFilter(filter, btn) {
    this.currentFilter = filter;
    document.querySelectorAll('.notif-filter-btn').forEach(b => {
      b.classList.remove('active');
      b.style.background = '';
      b.style.color = '';
    });
    if (btn) {
      btn.classList.add('active');
      btn.style.background = '#059669';
      btn.style.color = '#ffffff';
    }
    this.renderFeed(filter);
  },

  async markAllRead() {
    try {
      const activeFarm = localStorage.getItem("agrios_active_farm_id");
      const url = activeFarm ? `/api/communications/mark-all-read?farm_id=${encodeURIComponent(activeFarm)}` : '/api/communications/mark-all-read';
      await fetch(url, { method: "POST" });
      this.notifications.forEach(n => n.is_read = true);
      this.updateBadgeCounts();
      this.renderFeed(this.currentFilter);
      if (window.AgriosUI) AgriosUI.showToast("All Caught Up", "All notifications marked as read.", "✓");
    } catch (e) {
      console.error(e);
    }
  },

  async markRead(msgId) {
    try {
      await fetch(`/api/communications/${msgId}/read`, { method: "PUT" });
      const item = this.notifications.find(n => n.id === msgId);
      if (item) item.is_read = true;
      this.updateBadgeCounts();
      this.renderFeed(this.currentFilter);
    } catch (e) {
      console.error(e);
    }
  },

  addIncoming(notif) {
    this.notifications.unshift(notif);
    this.updateBadgeCounts();
    this.renderFeed(this.currentFilter);
  },

  renderFeed(filter = "all") {
    const container = document.getElementById("notifications-feed-list");
    if (!container) return;

    let items = this.notifications;
    if (filter === "task_dispatch") {
      items = items.filter(n => n.advisory_type === "task_dispatch");
    } else if (filter === "task_completion") {
      items = items.filter(n => n.advisory_type === "task_completion");
    } else if (filter === "warning") {
      items = items.filter(n => n.priority === "urgent" || n.priority === "high" || n.advisory_type === "emergency_warning");
    }

    if (!items || items.length === 0) {
      container.innerHTML = `
        <div style="text-align:center; padding:3rem 1rem; color:#64748b; background:#ffffff; border:1px dashed #cbd5e1; border-radius:10px;">
          <div style="font-size:2rem; margin-bottom:8px;">🔔</div>
          <strong style="font-size:0.95rem; color:#0f172a;">No notifications in this view</strong>
          <p style="font-size:0.8rem; margin-top:4px;">Task dispatches, completions, and alerts will appear here in real time.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = items.map(n => {
      let icon = "📢";
      let borderCol = "#0284c7";
      let typeLabel = "Advisory";
      let badgeClass = "badge-neutral";

      if (n.advisory_type === "task_dispatch") {
        icon = "🚀";
        borderCol = "#059669";
        typeLabel = "Task Dispatch";
        badgeClass = "badge-success";
      } else if (n.advisory_type === "task_completion") {
        icon = "✅";
        borderCol = "#10b981";
        typeLabel = "Task Completed";
        badgeClass = "badge-success";
      } else if (n.priority === "urgent" || n.priority === "high" || n.advisory_type === "emergency_warning") {
        icon = "🚨";
        borderCol = "#dc2626";
        typeLabel = "High Priority";
        badgeClass = "badge-danger";
      }

      const timeStr = n.created_at ? new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now';

      return `
        <div style="background:${n.is_read ? '#ffffff' : '#f0fdf4'}; border:1px solid ${n.is_read ? '#e2e8f0' : '#bbf7d0'}; border-left:4px solid ${borderCol}; border-radius:8px; padding:14px 18px; display:flex; gap:14px; align-items:flex-start; transition:all 0.2s;">
          <div style="font-size:1.5rem; line-height:1; margin-top:2px;">${icon}</div>
          <div style="flex:1;">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px;">
              <strong style="font-size:0.92rem; color:#0f172a;">${n.subject || 'Notification'}</strong>
              <div style="display:flex; align-items:center; gap:8px;">
                <span class="card-badge ${badgeClass}" style="font-size:0.7rem;">${typeLabel}</span>
                <span style="font-size:0.72rem; color:#64748b;">${timeStr}</span>
              </div>
            </div>
            <p style="font-size:0.83rem; color:#475569; margin:6px 0 8px 0; line-height:1.45;">${n.body || ''}</p>
            <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.75rem; color:#64748b;">
              <span>👤 From: <strong style="color:#0f172a;">${n.sender_name || n.sender_role || 'System'}</strong></span>
              ${!n.is_read ? `
                <button type="button" class="btn-secondary" onclick="window.AgriosNotifications.markRead('${n.id}')" style="height:24px; font-size:0.7rem; padding:0 8px;">
                  Mark as Read
                </button>
              ` : `<span style="color:#059669; font-weight:600;">✓ Read</span>`}
            </div>
          </div>
        </div>
      `;
    }).join("");
  }
};

