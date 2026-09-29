import React from "react";
import { Settings, ShieldAlert, Cpu, Layers, Info, Radio } from "lucide-react";
import { isOnlineAiConfigured, getActiveAiProvider } from "../engine/onlineAI.js";

export function SettingsPage() {
  const isOnline = isOnlineAiConfigured();
  const activeProvider = getActiveAiProvider();

  return (
    <div className="be-page-container">
      <div className="be-page-header">
        <h2>SYSTEM SETTINGS & CONFIGURATION</h2>
        <p>Telemetry preferences, AI model options, risk thresholds, and safety disclaimers.</p>
      </div>

      <div className="be-grid-span-12 be-card mb-6">
        <div className="be-card-header">
          <h3 className="be-card-title"><Radio size={16} /> DATA MODE</h3>
        </div>
        <div className="be-setting-row">
          <label className="be-radio-label active">
            <input type="radio" name="datamode" defaultChecked />
            <span>● DEMO SIMULATION MODE (Active for SIH26025 Prototype)</span>
          </label>
        </div>
        <div className="be-setting-row opacity-60">
          <label className="be-radio-label disabled">
            <input type="radio" name="datamode" disabled />
            <span>○ LIVE IOT SENSOR STREAM — <strong className="text-warning">COMING SOON (Hardware Integration Ready)</strong></span>
          </label>
        </div>
      </div>

      <div className="be-grid-span-12 be-card mb-6">
        <div className="be-card-header">
          <h3 className="be-card-title"><Cpu size={16} /> AI CONFIGURATION</h3>
        </div>
        <div className="be-setting-item">
          <span>Offline Explainable Weighted Risk Model:</span>
          <span className="text-safe font-bold">Enabled (Primary - Zero API Key Needed)</span>
        </div>
        <div className="be-setting-item">
          <span>Online LLM Synthesis Model:</span>
          <span className={isOnline ? "text-safe font-bold" : "text-muted font-bold"}>
            {isOnline ? `Enabled (${activeProvider?.provider || "Online LLM"})` : "Optional (Configure VITE_OPENAI_API_KEY, VITE_GEMINI_API_KEY, or VITE_NVIDIA_API_KEY in .env)"}
          </span>
        </div>
      </div>

      <div className="be-grid-span-12 be-card mb-6">
        <div className="be-card-header">
          <h3 className="be-card-title"><Layers size={16} /> PROTOTYPE RISK THRESHOLDS</h3>
        </div>
        <div className="be-threshold-list">
          <div className="be-thresh-item safe">
            <span>SAFE STATUS:</span>
            <strong>0 – 29 Risk Score (&lt; 30)</strong>
          </div>
          <div className="be-thresh-item info">
            <span>ANOMALY STATUS:</span>
            <strong>30 – 44 Risk Score (≥ 30)</strong>
          </div>
          <div className="be-thresh-item warning">
            <span>WARNING STATUS:</span>
            <strong>45 – 74 Risk Score (≥ 45)</strong>
          </div>
          <div className="be-thresh-item critical">
            <span>CRITICAL STATUS:</span>
            <strong>75 – 100 Risk Score (≥ 75)</strong>
          </div>
        </div>
      </div>

      <div className="be-card be-disclaimer-card">
        <div className="be-card-header">
          <h3 className="be-card-title text-warning"><ShieldAlert size={18} /> SAFETY &amp; ACCURACY DISCLAIMER</h3>
        </div>
        <p className="be-disclaimer-text">
          BLACK EYE is a student prototype developed for SIH26025 (Mine Subsidence Monitoring &amp; Early Warning System). Risk scores and simulated sensor data are intended for demonstration and development purposes only and are not a substitute for certified mine-safety monitoring systems.
        </p>
      </div>
    </div>
  );
}
