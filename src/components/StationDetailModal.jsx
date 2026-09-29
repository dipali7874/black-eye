import React, { useEffect } from "react";
import {
  X,
  Radio,
  Battery,
  Signal,
  Cpu,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Compass,
  Zap
} from "lucide-react";

export function StationDetailModal({ station, onClose, onViewAnalysis }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!station) return null;

  let statusColor = "var(--color-safe)";
  let StatusIcon = CheckCircle2;
  let statusBadgeClass = "badge-safe";

  if (station.status === "CRITICAL") {
    statusColor = "var(--color-critical)";
    StatusIcon = ShieldAlert;
    statusBadgeClass = "badge-critical";
  } else if (station.status === "WARNING" || station.status === "ANOMALY") {
    statusColor = "var(--color-warning)";
    StatusIcon = AlertTriangle;
    statusBadgeClass = "badge-warning";
  }

  return (
    <div className="be-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="be-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="be-modal-header">
          <div className="be-modal-title-group">
            <Radio size={20} className="text-accent" />
            <h2>STATION {station.id}</h2>
            <span className="be-panel-tag">{station.panel}</span>
          </div>
          <button className="be-close-btn" onClick={onClose} aria-label="Close station modal">
            <X size={18} />
          </button>
        </div>

        <div className="be-modal-body">
          <div
            className="be-detail-status-banner"
            style={{
              borderColor: statusColor,
              backgroundColor: "rgba(15, 20, 31, 0.85)",
            }}
          >
            <div className="be-status-left">
              <StatusIcon size={24} style={{ color: statusColor }} />
              <div>
                <span className="be-sub-label">CURRENT STATUS</span>
                <div className="be-status-text" style={{ color: statusColor }}>
                  {station.status}
                </div>
              </div>
            </div>
            <div className="be-status-right">
              <span className="be-sub-label">AI RISK SCORE</span>
              <div className="be-risk-value-text" style={{ color: statusColor }}>
                {station.riskScore} / 100
              </div>
            </div>
          </div>

          <div className="be-metrics-grid">
            <div className="be-metric-card">
              <div className="be-metric-top">
                <Compass size={14} className="text-accent" />
                <span className="be-m-label">Tilt Angle</span>
              </div>
              <span className="be-m-val">{station.tilt}°</span>
              <span className="be-m-sub">Baseline: 0.8–1.8°</span>
            </div>

            <div className="be-metric-card">
              <div className="be-metric-top">
                <Activity size={14} className="text-accent" />
                <span className="be-m-label">Displacement</span>
              </div>
              <span className="be-m-val">{station.displacement} mm</span>
              <span className="be-m-sub">Baseline: 1.0–4.0 mm</span>
            </div>

            <div className="be-metric-card">
              <div className="be-metric-top">
                <Zap size={14} className="text-accent" />
                <span className="be-m-label">Vibration</span>
              </div>
              <span className="be-m-val">{station.vibration}</span>
              <span className="be-m-sub">Surface Seismic Strain</span>
            </div>

            <div className="be-metric-card">
              <div className="be-metric-top">
                <ShieldAlert size={14} className="text-accent" />
                <span className="be-m-label">Crack Status</span>
              </div>
              <span className="be-m-val">{station.crackStatus}</span>
              <span className="be-m-sub">Optical Surface Gauge</span>
            </div>

            <div className="be-metric-card">
              <div className="be-metric-top">
                <Battery size={14} className="text-accent" />
                <span className="be-m-label">Battery</span>
              </div>
              <span className="be-m-val">{station.battery}%</span>
              <span className="be-m-sub">Solar + Lithium Bank</span>
            </div>

            <div className="be-metric-card">
              <div className="be-metric-top">
                <Signal size={14} className="text-accent" />
                <span className="be-m-label">Mesh Signal</span>
              </div>
              <span className="be-m-val">{station.signal}%</span>
              <span className="be-m-sub">LoRa Sub-GHz Link</span>
            </div>
          </div>
        </div>

        <div className="be-modal-footer">
          <button className="be-btn-primary" onClick={() => onViewAnalysis(station)}>
            <Cpu size={16} /> View AI Diagnostics
          </button>
          <button className="be-btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
