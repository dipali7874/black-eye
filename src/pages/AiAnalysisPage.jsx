import React, { useState } from "react";
import { Cpu, ShieldCheck, Zap, BarChart2, AlertCircle, RefreshCw, Sparkles, CheckCircle2 } from "lucide-react";
import { isOnlineAiConfigured, runOnlineAiAnalysis } from "../engine/onlineAI.js";

export function AiAnalysisPage({ stations = [], overallRisk = {}, currentMine = {} }) {
  const isOnline = isOnlineAiConfigured();
  const highRisk = stations.filter(s => s.status === "CRITICAL" || s.status === "WARNING");
  
  const [onlineReport, setOnlineReport] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      const res = await runOnlineAiAnalysis(currentMine?.name || "Jharia Coalfield", stations, overallRisk);
      setOnlineReport(res);
    } catch (err) {
      setOnlineReport({
        configured: false,
        status: "Error",
        message: "Failed to generate online analysis. Offline AI remains fully active."
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="be-page-container">
      <div className="be-page-header">
        <h2>AI DIAGNOSTICS & ANOMALY DETECTION MODEL</h2>
        <p>Overview of Offline Explainable Weighted Risk Engine & Online LLM Synthesis.</p>
      </div>

      <div className="be-grid-span-12 be-card mb-6">
        <div className="be-card-header">
          <h3 className="be-card-title">DUAL AI SYSTEM ARCHITECTURE</h3>
        </div>
        <div className="be-ai-arch-grid">
          <div className="be-arch-card active">
            <div className="be-arch-header">
              <Cpu size={20} className="text-accent" />
              <h4>1. OFFLINE AI (PRIMARY)</h4>
              <span className="be-badge safe-badge">OPERATIONAL</span>
            </div>
            <p className="be-arch-desc">
              Standalone, JS-native Explainable Weighted Risk Engine. Analyzes tilt angle velocity, cumulative mm displacement, micro-seismic strain, and crack propagation against calibrated geotechnical thresholds.
            </p>
            <ul className="be-arch-list">
              <li>✔ Zero Internet / External API Key Required</li>
              <li>✔ Lightweight & Fast (&lt; 5ms execution per station)</li>
              <li>✔ Outputs Risk Score (0-100) &amp; Classification</li>
            </ul>
          </div>

          <div className="be-arch-card">
            <div className="be-arch-header">
              <Zap size={20} className="text-warning" />
              <h4>2. ONLINE AI (NVIDIA NIM)</h4>
              <span className={`be-badge ${isOnline ? "safe-badge" : "neutral-badge"}`}>
                {isOnline ? "ACTIVE (NVIDIA NIM)" : "NOT CONFIGURED"}
              </span>
            </div>
            <p className="be-arch-desc">
              Generative LLM synthesis layer powered by NVIDIA NIM hosted inference. Reads <code>VITE_NVIDIA_API_KEY</code> from <code>.env</code> to generate executive summaries and engineering reports.
            </p>
            <ul className="be-arch-list">
              <li>{isOnline ? "✔ NVIDIA NIM API Key Configured" : "✖ No API key set in .env (Offline AI active)"}</li>
              <li>✔ Seamless fallback without breaking dashboard</li>
              <li>✔ Grounded in real-time sensor telemetry &amp; alerts</li>
            </ul>
            {isOnline && (
              <div className="mt-4 pt-3 border-t border-border">
                <button
                  className="be-btn be-btn-primary flex items-center gap-2 text-xs py-2 px-3"
                  onClick={handleGenerateReport}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" /> Generating Synthesis...
                    </>
                  ) : (
                    <>
                      <Sparkles size={13} /> Run NVIDIA NIM Analysis Pass
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {onlineReport && (
        <div className="be-card mb-6 border-accent">
          <div className="be-card-header flex justify-between items-center">
            <h3 className="be-card-title flex items-center gap-2 text-accent">
              <Sparkles size={16} /> NVIDIA NIM EXECUTIVE ANALYSIS REPORT
            </h3>
            <span className="be-badge safe-badge">{onlineReport.status}</span>
          </div>
          <div className="p-4 bg-card-bg/60 rounded text-sm leading-relaxed whitespace-pre-line font-mono">
            {onlineReport.message}
          </div>
          {onlineReport.recommendation && (
            <div className="mt-3 text-xs text-muted">
              <strong>Recommendation:</strong> {onlineReport.recommendation}
            </div>
          )}
        </div>
      )}

      <div className="be-card">
        <div className="be-card-header">
          <h3 className="be-card-title">HIGH RISK STATIONS DIAGNOSTIC SUMMARY</h3>
        </div>
        <div className="be-table-container">
          <table className="be-table">
            <thead>
              <tr>
                <th>STATION</th>
                <th>PANEL</th>
                <th>TILT</th>
                <th>DISPLACEMENT</th>
                <th>RISK SCORE</th>
                <th>OFFLINE AI DIAGNOSIS</th>
              </tr>
            </thead>
            <tbody>
              {highRisk.map(s => (
                <tr key={s.id}>
                  <td className="font-mono font-bold">{s.id}</td>
                  <td>{s.panel}</td>
                  <td>{s.tilt}°</td>
                  <td>{s.displacement} mm</td>
                  <td className="font-bold text-critical">{s.riskScore} / 100</td>
                  <td>Increasing deformation velocity exceeding baseline tolerance. Immediate structural inspection recommended.</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
