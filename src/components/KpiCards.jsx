import React from "react";
import { Radio, ShieldCheck, AlertTriangle, ShieldAlert, Activity, Wifi } from "lucide-react";

export function KpiCards({ stations = [], overallRisk = {}, networkHealth = 96, isHardwareMode = false }) {
  const total = stations.length;
  const safeCount = stations.filter(s => s.status === "SAFE").length;
  const warningCount = stations.filter(s => s.status === "WARNING" || s.status === "ANOMALY").length;
  const criticalCount = stations.filter(s => s.status === "CRITICAL").length;

  let riskLabel = "LOW";
  let riskColor = "var(--safe-color)";
  if (overallRisk.compositeScore >= 70) {
    riskLabel = "HIGH";
    riskColor = "var(--critical-color)";
  } else if (overallRisk.compositeScore >= 35) {
    riskLabel = "MEDIUM";
    riskColor = "var(--warning-color)";
  }

  return (
    <div className="be-kpi-grid">
      <div className="be-kpi-card">
        <div className="be-kpi-header">
          <Radio size={16} className="be-kpi-icon text-muted" />
          <span>{isHardwareMode ? "HARDWARE SENSORS" : "TOTAL STATIONS"}</span>
        </div>
        <div className="be-kpi-body">
          <span className="be-kpi-value">{total}</span>
          <span className="be-kpi-unit">{isHardwareMode ? (total === 1 ? "live node" : "nodes") : "nodes"}</span>
        </div>
        <div className="be-kpi-sub">
          {isHardwareMode ? "NodeMCU ESP8266 Active (Port 5000)" : "100% Surface Mesh Synchronized"}
        </div>
      </div>

      <div className="be-kpi-card safe">
        <div className="be-kpi-header">
          <ShieldCheck size={16} className="be-kpi-icon text-safe" />
          <span>SAFE</span>
        </div>
        <div className="be-kpi-body">
          <span className="be-kpi-value text-safe">{safeCount}</span>
          <span className="be-kpi-unit">stations</span>
        </div>
        <div className="be-kpi-sub text-safe">Baseline telemetry normal</div>
      </div>

      <div className="be-kpi-card warning">
        <div className="be-kpi-header">
          <AlertTriangle size={16} className="be-kpi-icon text-warning" />
          <span>WARNING</span>
        </div>
        <div className="be-kpi-body">
          <span className="be-kpi-value text-warning">{warningCount}</span>
          <span className="be-kpi-unit">stations</span>
        </div>
        <div className="be-kpi-sub text-warning">Elevated displacement/tilt</div>
      </div>

      <div className="be-kpi-card critical">
        <div className="be-kpi-header">
          <ShieldAlert size={16} className="be-kpi-icon text-critical" />
          <span>CRITICAL</span>
        </div>
        <div className="be-kpi-body">
          <span className="be-kpi-value text-critical">{criticalCount}</span>
          <span className="be-kpi-unit">stations</span>
        </div>
        <div className="be-kpi-sub text-critical">Requires immediate check</div>
      </div>

      <div className="be-kpi-card">
        <div className="be-kpi-header">
          <Activity size={16} className="be-kpi-icon text-accent" />
          <span>OVERALL RISK</span>
        </div>
        <div className="be-kpi-body">
          <span className="be-kpi-value" style={{ color: riskColor }}>{riskLabel}</span>
          <span className="be-kpi-unit">({overallRisk.compositeScore || 27}/100)</span>
        </div>
        <div className="be-kpi-sub">Prototype AI Risk Matrix</div>
      </div>

      <div className="be-kpi-card">
        <div className="be-kpi-header">
          <Wifi size={16} className="be-kpi-icon text-muted" />
          <span>NETWORK HEALTH</span>
        </div>
        <div className="be-kpi-body">
          <span className="be-kpi-value">{networkHealth}%</span>
          <span className="be-kpi-unit">mesh</span>
        </div>
        <div className="be-kpi-sub">23 Connected / 1 Standby Gateway</div>
      </div>
    </div>
  );
}
