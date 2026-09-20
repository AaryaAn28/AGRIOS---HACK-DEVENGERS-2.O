// AGRIOS Central API Client
const API_BASE = "";

const AgriosAPI = {
  getToken() {
    return localStorage.getItem("agrios_token");
  },

  setToken(token) {
    localStorage.setItem("agrios_token", token);
  },

  getCurrentUser() {
    try {
      const u = localStorage.getItem("agrios_user");
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  },

  setCurrentUser(user) {
    localStorage.setItem("agrios_user", JSON.stringify(user));
  },

  logout() {
    try {
      localStorage.removeItem("agrios_token");
      localStorage.removeItem("agrios_user");
      sessionStorage.clear();
    } catch (e) {
      console.warn("Storage cleanup failed:", e);
    }
    window.location.href = "/";
  },

  async request(endpoint, options = {}) {
    const headers = options.headers || {};
    const token = this.getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    headers["Content-Type"] = "application/json";

    const config = {
      ...options,
      headers
    };

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, config);
      if (response.status === 401) {
        // Token expired
        console.warn("[API] Unauthorized. Redirecting to login.");
        // window.location.href = "index.html";
      }
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Request failed with status ${response.status}`);
      }
      return await response.json();
    } catch (err) {
      console.error(`[API Error] ${endpoint}:`, err);
      throw err;
    }
  },

  // Auth endpoints
  async login(email, password) {
    const res = await this.request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
    this.setToken(res.access_token);
    this.setCurrentUser(res.user);
    return res;
  },

  async quickLogin(role) {
    const res = await this.request(`/api/auth/quick-login/${role}`, {
      method: "POST"
    });
    this.setToken(res.access_token);
    this.setCurrentUser(res.user);
    return res;
  },

  async getProfile() {
    return await this.request("/api/auth/me");
  },

  // Farms & Fields
  async getFarms() {
    return await this.request("/api/farms");
  },

  async getFarm(farmId) {
    return await this.request(`/api/farms/${farmId}`);
  },

  // Tasks & Checklists
  async getTasks(params = {}) {
    const query = new URLSearchParams(params).toString();
    return await this.request(`/api/tasks${query ? "?" + query : ""}`);
  },

  async createTask(taskData) {
    return await this.request("/api/tasks", {
      method: "POST",
      body: JSON.stringify(taskData)
    });
  },

  async updateTaskStatus(taskId, status, notes = "", hoursLogged = 1.0) {
    return await this.request(`/api/tasks/${taskId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status, notes, hours_logged: hoursLogged })
    });
  },

  async toggleChecklist(taskId, stepIndex) {
    return await this.request(`/api/tasks/${taskId}/checklist/${stepIndex}/toggle`, {
      method: "POST"
    });
  },

  // Resources & Equipment
  async getResources(farmId) {
    return await this.request(`/api/resources${farmId ? "?farm_id=" + farmId : ""}`);
  },

  async consumeResource(resourceId, quantity, notes = "") {
    return await this.request("/api/resources/consume", {
      method: "POST",
      body: JSON.stringify({ resource_id: resourceId, quantity, notes })
    });
  },

  async getEquipment(farmId) {
    return await this.request(`/api/resources/equipment${farmId ? "?farm_id=" + farmId : ""}`);
  },

  async bookEquipment(equipmentId, farmId, purpose, startTime, endTime) {
    return await this.request("/api/resources/equipment/book", {
      method: "POST",
      body: JSON.stringify({ equipment_id: equipmentId, farm_id: farmId, purpose, start_time: startTime, end_time: endTime })
    });
  },

  // Risks & Weather
  async getAlerts(farmId) {
    return await this.request(`/api/risks/alerts${farmId ? "?farm_id=" + farmId : ""}`);
  },

  async acknowledgeAlert(alertId) {
    return await this.request(`/api/risks/alerts/${alertId}/acknowledge`, {
      method: "POST"
    });
  },

  async getWeather(district = "Ludhiana") {
    return await this.request(`/api/risks/weather?district=${district}`);
  },

  // Crops & Diagnostics
  async getCrops(farmId) {
    return await this.request(`/api/crops${farmId ? "?farm_id=" + farmId : ""}`);
  },

  async scanCropPhoto(scanData) {
    return await this.request("/api/crops/health-scan", {
      method: "POST",
      body: JSON.stringify(scanData)
    });
  },

  // Finance & Market
  async getMarketPrices(cropName = "") {
    return await this.request(`/api/finance/market-prices${cropName ? "?crop_name=" + cropName : ""}`);
  },

  async getTransactions(farmId) {
    return await this.request(`/api/finance/transactions${farmId ? "?farm_id=" + farmId : ""}`);
  },

  async getFinanceSummary(farmId) {
    return await this.request(`/api/finance/summary/${farmId}`);
  },

  // Schemes
  async getSchemes() {
    return await this.request("/api/schemes");
  },

  async getApplications(farmerId) {
    return await this.request(`/api/schemes/applications${farmerId ? "?farmer_id=" + farmerId : ""}`);
  },

  async applyForScheme(schemeId, farmId, amount) {
    return await this.request(`/api/schemes/${schemeId}/apply?farm_id=${farmId}&applied_amount=${amount}`, {
      method: "POST"
    });
  },

  async approveApplication(appId, disbursedAmount) {
    return await this.request(`/api/schemes/applications/${appId}/approve?disbursed_amount=${disbursedAmount}`, {
      method: "POST"
    });
  },

  // Communications
  async getMessages(farmId) {
    return await this.request(`/api/communications${farmId ? "?farm_id=" + farmId : ""}`);
  },

  async sendMessage(msgData) {
    return await this.request("/api/communications", {
      method: "POST",
      body: JSON.stringify(msgData)
    });
  },

  // Digital Twin
  async getDigitalTwinSnapshot(farmId) {
    return await this.request(`/api/digital-twin/snapshot/${farmId}`);
  },

  // Simulator for Judges
  async getSimulatorScenarios() {
    return await this.request("/api/simulator/scenarios");
  },

  async triggerSimulator(scenarioName, farmId = null) {
    return await this.request("/api/simulator/trigger", {
      method: "POST",
      body: JSON.stringify({ event_name: scenarioName, farm_id: farmId })
    });
  },

  // Cameras & AI Vision (Guardrail 11)
  async getCameras(farmId) {
    return await this.request(`/api/cameras${farmId ? "?farm_id=" + farmId : ""}`);
  },

  async getCameraObservations(cameraId) {
    return await this.request(`/api/cameras/${cameraId}/observations`);
  },

  async logCameraObservation(cameraId, data) {
    return await this.request(`/api/cameras/${cameraId}/observations`, {
      method: "POST",
      body: JSON.stringify(data)
    });
  },

  async reviewObservation(obsId, reviewed = true) {
    return await this.request(`/api/cameras/observations/${obsId}/review?reviewed=${reviewed}`, {
      method: "PATCH"
    });
  },

  // Workforce & Leave Management (Guardrail 13)
  async getWorkerProfiles() {
    return await this.request("/api/workforce/profiles");
  },

  async updateWorkerStatus(userId, statusData) {
    return await this.request(`/api/workforce/profiles/${userId}/status`, {
      method: "PATCH",
      body: JSON.stringify(statusData)
    });
  },

  async getLeaveRequests() {
    return await this.request("/api/workforce/leaves");
  },

  async requestLeave(data) {
    return await this.request("/api/workforce/leaves", {
      method: "POST",
      body: JSON.stringify(data)
    });
  },

  async approveLeave(leaveId, approvalData) {
    return await this.request(`/api/workforce/leaves/${leaveId}/approve`, {
      method: "POST",
      body: JSON.stringify(approvalData)
    });
  },

  // Dynamic Personas & Subordinate Registration
  async getQuickPersonas() {
    return await this.request("/api/auth/quick-personas");
  },

  async quickLoginUser(userId) {
    const res = await this.request(`/api/auth/quick-login-user/${userId}`, {
      method: "POST"
    });
    this.setToken(res.access_token);
    this.setCurrentUser(res.user);
    return res;
  },

  async registerSubordinate(data) {
    return await this.request("/api/auth/register-subordinate", {
      method: "POST",
      body: JSON.stringify(data)
    });
  },

  // 11-Step Agricultural Onboarding Wizard
  async getTaxonomy() {
    return await this.request("/api/onboarding/taxonomy");
  },

  async getOnboardingProfile(userId) {
    return await this.request(`/api/onboarding/profile/${userId}`);
  },

  async saveOnboardingProfile(data) {
    const res = await this.request("/api/onboarding/profile", {
      method: "POST",
      body: JSON.stringify(data)
    });
    if (res.user) {
      this.setCurrentUser(res.user);
    }
    return res;
  },

  // Digital Twin Farm Structures & Version History
  async getFarmStructures(farmId) {
    return await this.request(`/api/farms/${farmId}/structures`);
  },

  async createStructureVersion(farmId, data) {
    return await this.request(`/api/farms/${farmId}/structures`, {
      method: "POST",
      body: JSON.stringify(data)
    });
  },

  async updatePlantingGrid(farmId, data) {
    return await this.request(`/api/farms/${farmId}/structures/planting-grid`, {
      method: "PATCH",
      body: JSON.stringify(data)
    });
  },

  // Simulator Undo & Telemetry
  async getSimulationStatus() {
    return await this.request("/api/simulator/status");
  },

  async undoSimulation() {
    return await this.request("/api/simulator/undo", {
      method: "POST"
    });
  },

  // Walk & Calibrate and Master Crop Plan
  async walkAndCalibrateFarm(data) {
    return await this.request("/api/farms/walk-and-calibrate", {
      method: "POST",
      body: JSON.stringify(data)
    });
  },

  async getCropPlan(cropName, durationDays = null) {
    const q = `/api/crop-plans/generate?crop_name=${encodeURIComponent(cropName)}${durationDays ? '&duration_days=' + durationDays : ''}`;
    return await this.request(q);
  },

  async activateCropPlan(farmId, planData) {
    return await this.request(`/api/crop-plans/farm/${farmId}/activate`, {
      method: "POST",
      body: JSON.stringify(planData)
    });
  },

  // Ecosystem Interconnected API methods
  async getBufferReserves() {
    return await this.request("/api/government/buffer-reserves");
  },

  async dispatchLogisticsRake(data) {
    return await this.request("/api/government/logistics-rebalance", {
      method: "POST",
      body: JSON.stringify(data)
    });
  },

  async batchDisburseSubsidies() {
    return await this.request("/api/schemes/batch-disburse", {
      method: "POST"
    });
  },

  async getStateTelemetry() {
    return await this.request("/api/government/state-telemetry");
  },

  async listDisasterDirectives() {
    return await this.request("/api/government/disaster-directives");
  },

  async issueDisasterDirective(data) {
    return await this.request("/api/government/disaster-directives", {
      method: "POST",
      body: JSON.stringify(data)
    });
  },

  async getAgronomistSurveillance() {
    return await this.request("/api/agronomist/surveillance");
  },

  async listQuarantineZones() {
    return await this.request("/api/government/biosecurity/buffer-zones");
  },

  async createQuarantineZone(data) {
    return await this.request("/api/government/biosecurity/buffer-zones", {
      method: "POST",
      body: JSON.stringify(data)
    });
  },

  async getPestRadarOverview() {
    return await this.request("/api/government/pest-radar/hotspots");
  },

  async simulatePestSpread(data) {
    return await this.request("/api/government/pest-radar/simulate-spread", {
      method: "POST",
      body: JSON.stringify(data)
    });
  },

  async listBiosecurityBufferZones() {
    return await this.request("/api/government/biosecurity/buffer-zones");
  },

  async createBiosecurityBufferZone(data) {
    return await this.request("/api/government/biosecurity/buffer-zones", {
      method: "POST",
      body: JSON.stringify(data)
    });
  },

  async updateBufferZoneStatus(zoneId, data) {
    return await this.request(`/api/government/biosecurity/buffer-zones/${zoneId}/status`, {
      method: "PUT",
      body: JSON.stringify(data)
    });
  },

  async getBiosecurityIPMProtocols() {
    return await this.request("/api/government/biosecurity/ipm-protocols");
  },

  async getBiosecurityCordonReport() {
    return await this.request("/api/government/biosecurity/reports/cordon-audit");
  },

  async listPrescriptions() {
    return await this.request("/api/agronomist/prescriptions");
  },

  async createPrescription(data) {
    return await this.request("/api/agronomist/prescriptions", {
      method: "POST",
      body: JSON.stringify(data)
    });
  },

  async broadcastCircular(data) {
    return await this.request("/api/communications/broadcast", {
      method: "POST",
      body: JSON.stringify(data)
    });
  },

  async diagnoseLeaf(data) {
    return await this.request("/api/agronomist/diagnose-leaf", {
      method: "POST",
      body: JSON.stringify(data)
    });
  },

  async toggleIrrigation(farmId) {
    return await this.request(`/api/farms/${farmId || 'default'}/irrigation-toggle`, {
      method: "POST"
    });
  },

  async reorderResource(data) {
    return await this.request("/api/resources/reorder", {
      method: "POST",
      body: JSON.stringify(data)
    });
  },

  async getHarvestForecast(farmId) {
    return await this.request(`/api/crops/farm/${farmId || 'default'}/harvest-forecast`);
  },

  async listGroundTruth() {
    return await this.request("/api/workforce/ground-truth");
  },

  async submitGroundTruth(data) {
    return await this.request("/api/workforce/ground-truth", {
      method: "POST",
      body: JSON.stringify(data)
    });
  },

  async getWorkerEquipmentKit() {
    return await this.request("/api/workforce/equipment-kit");
  },

  async reportEquipmentDamage(data) {
    return await this.request("/api/workforce/equipment-kit/report-damage", {
      method: "POST",
      body: JSON.stringify(data)
    });
  },

  async completeTask(taskId, data = {}) {
    return await this.request(`/api/tasks/${taskId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status: "completed", ...data })
    });
  },

  async getSoilAnalysis(farmId) {
    return await this.request(`/api/agronomist/soil-analysis/${farmId || 'default'}`);
  },

  async getCropRotationAdvice() {
    return await this.request("/api/agronomist/crop-rotation-advice");
  },

  async getSprayWeatherCheck() {
    return await this.request("/api/agronomist/spray-weather-check");
  },

  async getIPMProtocols() {
    return await this.request("/api/agronomist/ipm-protocols");
  },

  async getPathogenObservations() {
    return await this.request("/api/agronomist/pathogen-observations");
  },

  async getBroadcastHistory() {
    return await this.request("/api/communications/broadcasts");
  }
};

window.AgriosAPI = AgriosAPI;
window.logout = function() {
  AgriosAPI.logout();
};
