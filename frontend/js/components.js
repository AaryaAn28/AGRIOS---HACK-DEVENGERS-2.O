// AGRIOS Reusable UI Component Library
window.AgriosUI = {
  showToast(title, message, icon = "🌱", duration = 5000) {
    let container = document.getElementById("toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "toast-container";
      document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `
      <div class="toast-icon">${icon}</div>
      <div class="toast-content">
        <h4>${title}</h4>
        <p>${message}</p>
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

  renderNavbar(currentPortalName = "Farmer Portal", activePage = "home") {
    const user = AgriosAPI.getCurrentUser() || { full_name: "Balwinder Singh", role: "farmer" };
    return `
      <nav class="agrios-nav">
        <a href="index.html" class="logo-container">
          <div class="logo-badge">🌿</div>
          <div>
            <span class="logo-text">AGRIOS</span>
            <span class="portal-badge">${currentPortalName}</span>
          </div>
        </a>

        <div class="portal-switcher">
          <a href="farmer.html" class="portal-btn ${activePage === 'farmer' ? 'active' : ''}">Farmer</a>
          <a href="worker.html" class="portal-btn ${activePage === 'worker' ? 'active' : ''}">Krishi Sakhi</a>
          <a href="agronomist.html" class="portal-btn ${activePage === 'agronomist' ? 'active' : ''}">Agronomist</a>
          <a href="government.html" class="portal-btn ${activePage === 'government' ? 'active' : ''}">Command Center</a>
          <a href="simulator.html" class="portal-btn ${activePage === 'simulator' ? 'active' : ''}" style="border: 1px dashed var(--accent-neon); color: var(--accent-neon);">🎮 Simulator</a>
        </div>

        <div class="nav-actions">
          <div class="live-beacon">
            <span class="beacon-dot"></span>
            <span class="beacon-text">Live Sync</span>
          </div>
          <div style="font-size: 0.85rem; display: flex; align-items: center; gap: 0.5rem;">
            <span style="color: var(--text-muted);">Role:</span>
            <strong style="color: var(--text-emerald);">${user.role.toUpperCase()}</strong>
          </div>
          <button class="btn btn-secondary" onclick="AgriosAPI.logout()" style="padding: 0.35rem 0.75rem; font-size: 0.75rem;">Sign Out</button>
        </div>
      </nav>
    `;
  },

  renderHealthScoreRing(score = 90) {
    const color = score >= 80 ? "var(--accent-emerald)" : (score >= 50 ? "var(--accent-amber)" : "var(--accent-rose)");
    return `
      <div class="health-ring-container">
        <div class="ring-circle" style="--score: ${score}; background: conic-gradient(${color} calc(${score} * 1%), rgba(255,255,255,0.05) 0);">
          <div class="ring-value" style="color: ${color};">${Math.round(score)}%</div>
        </div>
        <div>
          <h3 style="font-size: 1.1rem; font-weight: 700;">Farm Biological Vitality</h3>
          <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.2rem;">
            Weighted index based on NDVI telemetry, root moisture, and pest pressure.
          </p>
          <span class="badge ${score >= 80 ? 'badge-optimal' : (score >= 50 ? 'badge-warning' : 'badge-critical')}" style="margin-top: 0.4rem;">
            ${score >= 80 ? 'Optimal Performance' : (score >= 50 ? 'Active Vigilance' : 'Critical Intervention')}
          </span>
        </div>
      </div>
    `;
  }
};
