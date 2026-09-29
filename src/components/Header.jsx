import React, { useState, useEffect } from "react";
import { ShieldCheck, Cpu, Clock, ShieldAlert, Radio, SlidersHorizontal, Database } from "lucide-react";

export function Header({
  isOnlineAi,
  activeAlertCount = 0,
  systemMode = "DEMO",
  onToggleMode = () => {},
  backendConnected = false,
  nodeMcuOnline = false,
  mysqlConnected = false
}) {
  const [timeStr, setTimeStr] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setTimeStr(d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }) + " | " + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <header className="be-header">
        <div className="be-header-left">
          <div className="be-logo-badge">
            <img src="/logo.svg" alt="BLACK EYE" className="be-header-logo-img" />
          </div>
          <div>
            <div className="be-title-row">
              <h1 className="be-app-title">BLACK EYE</h1>
              <span className="be-sih-tag">SIH26025</span>
              <span className="be-motto-tag">MONITOR • PREDICT • PROTECT</span>
            </div>
            <p className="be-subtitle">AI-Powered Mine Subsidence Monitoring &amp; Early Warning Command Center</p>
          </div>
        </div>

        <div className="be-header-right">
          {/* Interactive Mode Toggle */}
          <button
            className={`mode-toggle-btn ${systemMode === "HARDWARE" ? "mode-hardware" : "mode-demo"}`}
            onClick={onToggleMode}
            title={systemMode === "HARDWARE" ? "Click to switch to Synthetic Demo Mode" : "Click to switch to Live NodeMCU Hardware Mode"}
          >
            {systemMode === "HARDWARE" ? (
              <>
                <span className="dot pulse-cyan"></span>
                <Radio size={13} />
                <span>LIVE NODEMCU {nodeMcuOnline ? "ONLINE" : "READY"}</span>
              </>
            ) : (
              <>
                <span className="dot pulse-green"></span>
                <SlidersHorizontal size={13} />
                <span>DEMO SIMULATION</span>
              </>
            )}
          </button>

          <div className="be-badge ai-badge" title="Geotechnical Anomaly & Subsidence AI Engine">
            <Cpu size={14} /> AI: <span className="highlight-text">{isOnlineAi ? "ONLINE" : "OFFLINE READY"}</span>
          </div>

          <div className="be-badge status-badge" title={`Backend: ${backendConnected ? 'Connected' : 'Offline'} | Database: ${mysqlConnected ? 'MySQL' : 'Fallback'}`}>
            <Database size={13} className={mysqlConnected ? "text-safe" : "text-muted"} />
            <span>DB: {mysqlConnected ? "MySQL" : "MEM"}</span>
          </div>

          <div className="be-badge status-badge">
            <ShieldCheck size={14} /> System: <span className="safe-text">OPERATIONAL</span>
          </div>

          <div className="be-time-display">
            <Clock size={14} />
            <span>{timeStr}</span>
          </div>
        </div>
      </header>

      <div
        className="be-disclaimer-banner"
        title="BLACK EYE is a student prototype developed for SIH26025 (Mine Subsidence Monitoring & Early Warning System). Risk scores and simulated sensor data are intended for demonstration and development purposes only and are not a substitute for certified mine-safety monitoring systems."
      >
        <div className="be-disclaimer-banner-inner">
          <ShieldAlert size={14} className="text-warning shrink-0" />
          <span className="be-disclaimer-banner-text">
            <strong>⚠ Prototype — Not Certified Mine-Safety Equipment:</strong> BLACK EYE is a student prototype developed for SIH26025. Simulated data for demonstration only — not a substitute for certified mine-safety monitoring systems.
          </span>
        </div>
      </div>
    </>
  );
}
