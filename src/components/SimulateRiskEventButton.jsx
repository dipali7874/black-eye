import React from "react";
import { Sparkles, AlertTriangle } from "lucide-react";

export function SimulateRiskEventButton({ onClick, isSimulating, isHardwareMode = false }) {
  if (isHardwareMode) {
    return (
      <div className="be-simulate-widget">
        <button
          disabled
          className="be-simulate-button"
          style={{
            background: "rgba(56, 189, 248, 0.12)",
            borderColor: "rgba(56, 189, 248, 0.4)",
            color: "#38bdf8",
            cursor: "default",
            boxShadow: "none"
          }}
        >
          <Sparkles className="be-sparkle-icon" size={18} />
          <span>📡 LIVE HARDWARE MONITORING ACTIVE</span>
        </button>
        <p className="be-simulate-caption" style={{ color: "#94a3b8" }}>
          Synthetic demo simulation is disabled. Physical telemetry streaming from NodeMCU ESP8266 (S-001).
        </p>
      </div>
    );
  }

  return (
    <div className="be-simulate-widget">
      <button
        onClick={onClick}
        disabled={isSimulating}
        className={`be-simulate-button ${isSimulating ? "simulating" : ""}`}
      >
        <Sparkles className="be-sparkle-icon" size={18} />
        <span>{isSimulating ? "SIMULATING RISK EVENT..." : "SIMULATE RISK EVENT"}</span>
      </button>
      <p className="be-simulate-caption">
        Triggers demo risk escalation (SAFE → ANOMALY → WARNING → CRITICAL) &amp; runs Offline AI.
      </p>
    </div>
  );
}
