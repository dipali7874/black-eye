import React from "react";
import { Cpu, ShieldCheck, AlertOctagon, TrendingUp, Info } from "lucide-react";
import { isOnlineAiConfigured } from "../engine/onlineAI.js";

export function AiMonitorPanel({ stations = [], overallRisk = {}, lastAnalysisTime = "Just now" }) {
  const isOnline = isOnlineAiConfigured();

  const totalStations = stations.length;
  const anomalies = stations.filter(s => s.status === "ANOMALY" || s.status === "WARNING" || s.status === "CRITICAL").length;
  const highRiskStations = stations.filter(s => s.status === "CRITICAL" || s.status === "WARNING");
  const topAffected = [...stations].sort((a, b) => b.riskScore - a.riskScore)[0] || null;

  const anomalyPercentage = Math.round((anomalies / (totalStations || 1)) * 100);

  return (
    <div className="be-card be-ai-monitor-card">
      <div className="be-card-header">
        <div className="be-header-title-icon">
          <Cpu size={18} className="text-accent" />
          <h3 className="be-card-title">BLACK EYE AI MONITOR</h3>
        </div>
        <span className="be-timestamp">Last Analysis: {lastAnalysisTime}</span>
      </div>

      <div className="be-ai-monitor-grid">
        {/* Left Side: System Status */}
        <div className="be-ai-status-column">
          <div className="be-ai-status-row">
            <span className="be-ai-sys-label">Offline AI (Primary)</span>
            <span className="be-status-pill badge-safe">● READY</span>
          </div>

          <div className="be-ai-status-row">
            <span className="be-ai-sys-label">Online AI (Optional)</span>
            <span className={`be-status-pill ${isOnline ? "badge-safe" : "badge-neutral"}`}>
              {isOnline ? "● ACTIVE" : "● NOT CONFIGURED"}
            </span>
          </div>

          <div className="be-ai-stats-list">
            <div className="be-ai-stat-item">
              <span className="be-ai-stat-num">{totalStations}</span>
              <span className="be-ai-stat-lbl">Stations Analysed</span>
            </div>
            <div className="be-ai-stat-item">
              <span className="be-ai-stat-num text-warning">{anomalies}</span>
              <span className="be-ai-stat-lbl">Anomalies Detected</span>
            </div>
            <div className="be-ai-stat-item">
              <span className="be-ai-stat-num text-critical">{highRiskStations.length}</span>
              <span className="be-ai-stat-lbl">High Risk Stations</span>
            </div>
          </div>
        </div>

        {/* Right Side: AI Diagnostic Analysis */}
        <div className="be-ai-diag-column">
          <div className="be-diag-header">
            <h4>AI DIAGNOSTIC ANALYSIS</h4>
            <span className="be-trend-badge"><TrendingUp size={14} /> Increasing ↗</span>
          </div>

          <div className="be-anomaly-meter-row">
            <div className="be-meter-info">
              <span>Anomaly Detection Rate</span>
              <strong>{anomalyPercentage}%</strong>
            </div>
            <div className="be-meter-bg">
              <div className="be-meter-fill" style={{ width: `${anomalyPercentage}%` }}></div>
            </div>
          </div>

          {topAffected && (
            <div className="be-affected-station-box">
              <span className="be-aff-lbl">Primary Affected Station:</span>
              <span className="be-aff-val">{topAffected.id} ({topAffected.panel}) — Risk Score: {topAffected.riskScore}/100</span>
            </div>
          )}

          <div className="be-ai-explanation-box">
            <p>
              {topAffected && topAffected.riskScore > 40
                ? `Station ${topAffected.id} is showing an increasing deformation trend compared with its recent baseline (Tilt: ${topAffected.tilt}°, Displacement: ${topAffected.displacement}mm). Goaf stress relaxation suspected.`
                : "All sensor stations report steady telemetry. No immediate subsurface deformation risk detected across active panels."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
