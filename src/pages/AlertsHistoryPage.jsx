import React, { useState } from "react";
import { Bell, Filter, CheckCircle2, ShieldAlert, AlertTriangle } from "lucide-react";

export function AlertsHistoryPage({ alerts = [], onAcknowledgeAlert }) {
  const [filter, setFilter] = useState("ALL"); // 'ALL', 'CRITICAL', 'WARNING', 'ACKNOWLEDGED'

  const filteredAlerts = alerts.filter(a => {
    if (filter === "CRITICAL") return a.severity === "critical";
    if (filter === "WARNING") return a.severity === "warning";
    if (filter === "ACKNOWLEDGED") return a.acknowledged;
    return true;
  });

  return (
    <div className="be-page-container">
      <div className="be-page-header">
        <h2>ALERT HISTORY & EVENT LOG</h2>
        <p>Complete historical log of system warnings, critical displacement alerts, and acknowledgments.</p>
      </div>

      <div className="be-filter-bar">
        <div className="be-status-filter-buttons">
          {["ALL", "CRITICAL", "WARNING", "ACKNOWLEDGED"].map(f => (
            <button
              key={f}
              className={`be-filter-btn ${filter === f ? "active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="be-card">
        <div className="be-table-container">
          <table className="be-table">
            <thead>
              <tr>
                <th>TIME</th>
                <th>STATION</th>
                <th>SEVERITY</th>
                <th>SENSOR TYPE</th>
                <th>RISK SCORE</th>
                <th>ALERT MESSAGE</th>
                <th>STATUS</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-6 text-muted">
                    No alerts match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredAlerts.map(alert => {
                  const isCritical = alert.severity === "critical";
                  const badgeClass = isCritical ? "badge-critical" : "badge-warning";

                  return (
                    <tr key={alert.id}>
                      <td className="font-mono">{alert.time}</td>
                      <td className="font-mono font-bold">{alert.station}</td>
                      <td><span className={`be-status-pill ${badgeClass}`}>● {alert.severity.toUpperCase()}</span></td>
                      <td>{alert.sensor || "Tilt + Displacement"}</td>
                      <td className="font-bold">{alert.riskScore || 64} / 100</td>
                      <td>{alert.message}</td>
                      <td>{alert.acknowledged ? <span className="text-safe">Acknowledged</span> : <span className="text-warning font-bold">ACTIVE</span>}</td>
                      <td>
                        {!alert.acknowledged ? (
                          <button className="be-btn-ack" onClick={() => onAcknowledgeAlert(alert.id)}>
                            ACK
                          </button>
                        ) : (
                          <span className="text-muted text-xs">Logged</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
