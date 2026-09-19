// AGRIOS Real-Time Event Stream & WebSocket Client
class AgriosRealtimeClient {
  constructor() {
    this.ws = null;
    this.reconnectTimer = null;
    this.reconnectInterval = 3000;
    this.listeners = [];
  }

  connect() {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host || "localhost:8000";
    const wsUrl = `${protocol}//${host}/ws/live-feed`;

    console.log(`[Realtime] Connecting to ${wsUrl}...`);
    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log("[Realtime] Connected to AGRIOS Canonical Live Stream");
        this.updateConnectionStatus(true);
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          this.handleIncomingEvent(payload);
        } catch (e) {
          console.log("[Realtime] Text frame received:", event.data);
        }
      };

      this.ws.onclose = () => {
        console.warn("[Realtime] Disconnected. Attempting reconnect in 3s...");
        this.updateConnectionStatus(false);
        this.scheduleReconnect();
      };

      this.ws.onerror = (err) => {
        console.error("[Realtime] Socket error:", err);
        this.ws.close();
      };
    } catch (e) {
      console.error("[Realtime] Could not initiate socket:", e);
      this.scheduleReconnect();
    }
  }

  scheduleReconnect() {
    if (!this.reconnectTimer) {
      this.reconnectTimer = setTimeout(() => {
        this.connect();
      }, this.reconnectInterval);
    }
  }

  updateConnectionStatus(connected) {
    const beacon = document.querySelector(".live-beacon");
    if (beacon) {
      const dot = beacon.querySelector(".beacon-dot");
      const text = beacon.querySelector(".beacon-text") || beacon;
      if (connected) {
        if (dot) dot.style.background = "var(--accent-neon)";
        text.textContent = "Live Stream Connected";
        beacon.style.borderColor = "rgba(16, 185, 129, 0.4)";
      } else {
        if (dot) dot.style.background = "var(--accent-amber)";
        text.textContent = "Reconnecting...";
        beacon.style.borderColor = "rgba(245, 158, 11, 0.4)";
      }
    }
  }

  handleIncomingEvent(msg) {
    if (msg.type === "DOMAIN_EVENT") {
      const eventData = msg.data;
      console.log(`[Realtime Event] ${eventData.event_type}:`, eventData);

      // Show contextual toast notification
      this.showEventToast(eventData);

      // Dispatch custom DOM event so individual dashboard widgets can reload selectively
      const customEvent = new CustomEvent("agrios:event", { detail: eventData });
      window.dispatchEvent(customEvent);
    }
  }

  showEventToast(eventData) {
    const type = eventData.event_type;
    let title = "AGRIOS State Update";
    let desc = `Domain event ${type} recorded.`;
    let icon = "🌱";

    if (type === "TASK_CREATED") {
      title = "New Farm Task Assigned";
      desc = eventData.payload.title || "Task created in workflow";
      icon = "📋";
    } else if (type === "TASK_STATUS_UPDATED") {
      title = `Task Status: ${eventData.payload.status?.toUpperCase()}`;
      desc = eventData.payload.title || "Task was updated";
      icon = eventData.payload.status === "completed" ? "✅" : "⚡";
    } else if (type === "RISK_ALERT_GENERATED") {
      title = `ALERT: ${eventData.payload.severity?.toUpperCase()}`;
      desc = eventData.payload.title || eventData.payload.message;
      icon = "⚠️";
    } else if (type === "RESOURCE_CONSUMED") {
      title = "Resource Depletion";
      desc = `${eventData.payload.name}: ${eventData.payload.quantity} ${eventData.payload.unit} remaining (${eventData.payload.status})`;
      icon = "🧪";
    } else if (type === "EQUIPMENT_BOOKED") {
      title = "Equipment Reserved";
      desc = `${eventData.payload.equipment_name || "Machine"} reserved for field operation`;
      icon = "🚜";
    } else if (type === "SIMULATION_TRIGGERED") {
      title = "Scenario Injected by Demo Controller";
      desc = eventData.payload.message || `Scenario: ${eventData.payload.scenario}`;
      icon = "🎯";
    } else if (type === "FARM_HEALTH_UPDATED") {
      title = "Farm Health Recalibrated";
      desc = `Health score shifted to ${eventData.payload.health_score}% (${eventData.payload.status})`;
      icon = "💚";
    }

    if (window.AgriosUI) {
      window.AgriosUI.showToast(title, desc, icon);
    }
  }
}

window.agriosRealtime = new AgriosRealtimeClient();
document.addEventListener("DOMContentLoaded", () => {
  window.agriosRealtime.connect();
});
