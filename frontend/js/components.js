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

  // VIZITOR Header bar: With live notification bell and global search
  renderNavbar(currentPortalName = "Farmer Portal", activePage = "home") {
    const user = AgriosAPI.getCurrentUser() || { full_name: "Agronomist", role: "agronomist" };
    return `
      <header class="top-header">
        <div class="header-left">
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="font-weight:800;font-size:1.15rem;color:#0f172a;letter-spacing:-0.02em;">${currentPortalName}</div>
            <span style="font-size:0.75rem;font-weight:700;padding:2px 8px;border-radius:12px;background:#ecfdf5;color:#059669;border:1px solid #a7f3d0;">
              Active Zone
            </span>
          </div>
        </div>

        <div class="header-right">
          <div class="search-bar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" placeholder="Search crops, tasks, fields, telemetry..." id="vizitor-global-search">
          </div>

          <button id="universal-connectivity-btn" class="connectivity-status-btn status-online" type="button" title="System Connectivity: Live Sync">
            <span class="conn-dot"></span><span class="conn-btn-text">Live Sync</span>
          </button>

          <!-- Real-Time Notification Bell Indicator -->
          <button class="nav-bell-btn" id="nav-notification-bell" onclick="switchTab('notifications')" title="Notifications & Real-time Alerts" style="background:#ffffff; border:1px solid #e2e8f0; border-radius:8px; width:36px; height:36px; display:flex; align-items:center; justify-content:center; cursor:pointer; position:relative; color:#475569; transition:all 0.2s; margin-right:4px;">
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
              Logout
            </button>
          </div>
        </div>
      </header>
    `;
  },

  // VIZITOR Sticky Left Sidebar Navigation Component
  renderSidebar(role = "agronomist", activeTab = "overview") {
    const notifIcon = `<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>`;
    let menuItems = [];

    if (role === "government") {
      menuItems = [
        { id: "overview", label: "Executive Command", icon: `<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>` },
        { id: "notifications", label: "Notifications", icon: notifIcon },
        { id: "surveillance", label: "Pest Outbreak Radar", icon: `<circle cx="12" cy="12" r="10"/><line x1="22" y1="12" x2="18" y2="12"/><line x1="6" y1="12" x2="2" y2="12"/><line x1="12" y1="6" x2="12" y2="2"/><line x1="12" y1="22" x2="12" y2="18"/>` },
        { id: "quarantine", label: "Containment Buffer Zones", icon: `<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/>` },
        { id: "subsidies", label: "DBT & Insurance Claims", icon: `<rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>` },
        { id: "foodsecurity", label: "Strategic Grain Reserves", icon: `<path d="M12 2L2 7v10l10 5 10-5V7L12 2z"/>` },
        { id: "fertilizers", label: "Fertilizer Rakes & Buffers", icon: `<circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/>` },
        { id: "telemetry", label: "State Satellite Telemetry", icon: `<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>` },
        { id: "directives", label: "Disaster Directives", icon: `<polygon points="12 2 2 22 22 22 12 2"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>` },
        { id: "cropintel", label: "Crop Intelligence & Analytics", icon: `<path d="M18 20V10M12 20V4M6 20v-6"/>` },
        { id: "workforce", label: "Workforce Cadre Registry", icon: `<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>` },
        { id: "finance", label: "Financial Oversight & Budget", icon: `<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>` },
        { id: "infrastructure", label: "Infrastructure & IoT Network", icon: `<rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/>` },
        { id: "compliance", label: "Compliance & Biosecurity Audit", icon: `<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>` },
        { id: "reports", label: "Reports & Executive Export", icon: `<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>` }
      ];
    } else if (role === "agronomist") {
      menuItems = [
        { id: "overview", label: "Agronomy Lab (Overview)", icon: `<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>` },
        { id: "notifications", label: "Notifications", icon: notifIcon },
        { id: "cropplan", label: "Master Crop Plan", icon: `<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>` },
        { id: "fieldcalibration", label: "3D Farm & Calibrate", icon: `<polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>` },
        { id: "subordinates", label: "Assign Farmers & Team", icon: `<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/>` },
        { id: "diagnostics", label: "Pathogen AI Lab", icon: `<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>` },
        { id: "prescriptions", label: "Rx Spray Ledger", icon: `<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>` },
        { id: "circulars", label: "Broadcast Advisories", icon: `<path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>` }
      ];
    } else if (role === "farmer") {
      menuItems = [
        { id: "overview", label: "Living Farm Twin (Overview)", icon: `<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>` },
        { id: "notifications", label: "Notifications", icon: notifIcon },
        { id: "cropplan", label: "Crop Growing Plan", icon: `<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>` },
        { id: "tasks", label: "Priority Field Tasks", icon: `<polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>` },
        { id: "care", label: "AI Leaf Pathogen Scanner", icon: `<circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/>` },
        { id: "fields", label: "Fields & Soil Health", icon: `<polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>` },
        { id: "resources", label: "Inputs & Machinery", icon: `<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>` },
        { id: "harvest", label: "Harvest & Silo Storage", icon: `<path d="M12 2L2 7v10l10 5 10-5V7L12 2z"/>` },
        { id: "mandi", label: "Mandi & Govt Schemes", icon: `<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>` }
      ];
    } else if (role === "worker") {
      menuItems = [
        { id: "overview", label: "Today's Work Plan (Overview)", icon: `<polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>` },
        { id: "notifications", label: "Notifications", icon: notifIcon },
        { id: "scanner", label: "Mobile Leaf Scanner", icon: `<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>` },
        { id: "logbook", label: "Attendance & Logbook", icon: `<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>` },
        { id: "groundtruth", label: "Ground Truth Logs", icon: `<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>` },
        { id: "equipment", label: "Field Kit & Tools", icon: `<polygon points="12 2 2 22 22 22 12 2"/>` },
        { id: "advisory", label: "Agronomist Hotline", icon: `<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>` },
        { id: "training", label: "Training & Certification", icon: `<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>` },
        { id: "leaves", label: "Leave & Welfare Requests", icon: `<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>` },
        { id: "performance", label: "Performance Scorecard", icon: `<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>` },
        { id: "emergency", label: "Emergency Protocols & SOS", icon: `<polygon points="12 2 2 22 22 22 12 2"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>` }
      ];
    }

    const navLinks = menuItems.map(item => `
      <a href="javascript:void(0)" class="menu-item ${activeTab === item.id ? 'active' : ''}" onclick="switchTab('${item.id}')" style="position:relative; display:flex; align-items:center;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          ${item.icon}
        </svg>
        <span style="flex:1;">${item.label}</span>
        ${item.id === 'notifications' ? `
          <span class="notif-badge-pill" id="sidebar-notif-badge" style="display:none; background:#dc2626; color:white; font-size:0.65rem; font-weight:700; border-radius:10px; min-width:18px; height:18px; line-height:18px; text-align:center; padding:0 5px; margin-left:auto;">0</span>
        ` : ''}
      </a>
    `).join("");

    return `
      <aside class="sidebar">
        <div class="sidebar-brand">
          <div class="sidebar-brand-icon">🌱</div>
          <span class="sidebar-brand-text">AGRIOS</span>
          <span class="sidebar-brand-badge">${role}</span>
        </div>

        <div class="sidebar-label">Navigation</div>
        <nav class="sidebar-menu" style="overflow-y: auto; max-height: calc(100vh - 160px); padding-right: 4px;">
          ${navLinks}
        </nav>

        <div class="sidebar-footer">
          <a href="javascript:void(0)" class="menu-item" onclick="logout()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            <span>Sign Out</span>
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

