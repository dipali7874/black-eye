import React from "react";
import { Bell, ShieldAlert, AlertTriangle, CheckCircle, ChevronRight } from "lucide-react";

export function ActiveAlertsPanel({ alerts = [], onAcknowledgeAlert, onViewAllAlerts }) {
  const activeAlerts = alerts.filter(a => !a.acknowledged);

  return (
    <div className="be-card be-alerts-card">
      <div className="be-card-header">
        <div className="be-header-title-icon">
          <Bell size={18} className="text-warning pulse-bell" />
          <h3 className="be-card-title">ACTIVE ALERTS</h3>
        </div>
        <span className="be-badge warning-badge">
          🔔 {activeAlerts.length} Active Alerts
        </span>
      </div>

      <div className="be-alerts-list">
        {activeAlerts.length === 0 ? (
          <div className="be-no-alerts">
            <CheckCircle size={28} className="text-safe" />
            <p>No active unacknowledged alerts. All sensor nodes reporting normal telemetric range.</p>
          </div>
        ) : (
          activeAlerts.slice(0, 4).map(alert => {
            const isCritical = alert.severity === "critical";
            const Icon = isCritical ? ShieldAlert : AlertTriangle;
            const colorClass = isCritical ? "critical" : "warning";

            return (
              <div key={alert.id} className={`be-alert-item ${colorClass}`}>
                <div className="be-alert-icon-col">
                  <Icon size={18} />
                </div>
                <div className="be-alert-content">
                  <div className="be-alert-top">
                    <span className="be-alert-station">{alert.station}</span>
                    <span className="be-alert-time">{alert.time}</span>
                  </div>
                  <p className="be-alert-msg">{alert.message}</p>
                </div>
                <button
                  className="be-btn-ack"
                  onClick={() => onAcknowledgeAlert(alert.id)}
                  title="Acknowledge Alert"
                >
                  ACK
                </button>
              </div>
            );
          })
        )}
      </div>

      <div className="be-card-footer">
        <button className="be-btn-link" onClick={onViewAllAlerts}>
          View All Alerts ({alerts.length}) <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
