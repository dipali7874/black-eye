import React from "react";
import { AlertCircle, ShieldAlert, CheckCircle2, Info } from "lucide-react";

export function OverallMineStatus({ overallRisk = {}, lastAnalysisTime = "Just now", isHardwareMode = false }) {
  const { mineStatus = "NORMAL", compositeScore = 27, summary = "No immediate critical threat detected." } = overallRisk;

  let badgeClass = "badge-safe";
  let Icon = CheckCircle2;
  let statusColor = "var(--safe-color)";

  if (mineStatus === "CRITICAL") {
    badgeClass = "badge-critical";
    Icon = ShieldAlert;
    statusColor = "var(--critical-color)";
  } else if (mineStatus === "WARNING") {
    badgeClass = "badge-warning";
    Icon = AlertCircle;
    statusColor = "var(--warning-color)";
  }

  return (
    <div className="be-card be-mine-status-card">
      <div className="be-card-header">
        <h3 className="be-card-title">{isHardwareMode ? "HARDWARE STRATA STATUS" : "MINE STATUS"}</h3>
        <span className="be-timestamp">Last analysis: {lastAnalysisTime}</span>
      </div>

      <div className="be-mine-status-body">
        <div className="be-status-main">
          <div className={`be-status-pill ${badgeClass}`}>
            <Icon size={18} />
            <span>● {mineStatus}</span>
          </div>

          <div className="be-score-container">
            <span className="be-score-label">Overall Risk Score</span>
            <div className="be-score-row">
              <span className="be-score-big" style={{ color: statusColor }}>{compositeScore}</span>
              <span className="be-score-denom">/ 100</span>
            </div>
          </div>
        </div>

        <div className="be-score-bar-bg">
          <div
            className="be-score-bar-fill"
            style={{
              width: `${compositeScore}%`,
              backgroundColor: statusColor
            }}
          ></div>
        </div>

        <p className="be-status-summary">
          {isHardwareMode
            ? "Live physical strata telemetry stream active from Station S-001 (NodeMCU ESP8266)."
            : summary}
        </p>

        <div className="be-disclaimer-box">
          <Info size={14} className="be-disclaimer-icon" />
          <span>
            {isHardwareMode
              ? "LIVE HARDWARE TELEMETRY STREAM — REAL-TIME SENSOR FEED"
              : "PROTOTYPE AI RISK ASSESSMENT — SIMULATED DEMO DATA ONLY"}
          </span>
        </div>
      </div>
    </div>
  );
}
