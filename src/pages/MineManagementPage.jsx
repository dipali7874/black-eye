import React from "react";
import { INDIAN_MINES } from "../engine/mineData.js";
import { Pickaxe, MapPin, Layers, Info } from "lucide-react";

export function MineManagementPage({ currentMine, onSelectMine }) {
  return (
    <div className="be-page-container">
      <div className="be-page-header">
        <h2>INDIAN COAL MINES MANAGEMENT</h2>
        <p>Overview of monitored underground coalfields, extraction method, and panel layouts.</p>
      </div>

      <div className="be-mines-grid">
        {INDIAN_MINES.map(mine => {
          const isCurrent = mine.id === currentMine.id;

          return (
            <div key={mine.id} className={`be-card be-mine-info-card ${isCurrent ? "active-mine" : ""}`}>
              <div className="be-card-header">
                <div className="be-header-title-icon">
                  <Pickaxe size={18} className="text-accent" />
                  <h3 className="be-card-title">{mine.name}</h3>
                </div>
                {isCurrent && <span className="be-badge safe-badge">ACTIVE MONITOR</span>}
              </div>

              <div className="be-mine-details">
                <p><strong>State:</strong> {mine.state}</p>
                <p><strong>District:</strong> {mine.location}</p>
                <p><strong>Coordinates:</strong> {mine.coords.lat}° N, {mine.coords.lng}° E</p>
                <p><strong>Seam Depth:</strong> {mine.totalDepth}</p>
                <p><strong>Capacity:</strong> {mine.productionCapacity}</p>
                <p><strong>Mining Method:</strong> {mine.method}</p>

                <h4 className="mt-3 font-bold text-xs text-muted">PANELS & SEAMS:</h4>
                <ul className="be-panel-list">
                  {mine.panels.map(p => (
                    <li key={p.id} className="text-xs">
                      • {p.name} [<span className={p.status === "CRITICAL" ? "text-critical" : p.status === "WARNING" ? "text-warning" : "text-safe"}>{p.status}</span>]
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-4">
                <button
                  className={`be-btn-primary full-width ${isCurrent ? "disabled" : ""}`}
                  onClick={() => onSelectMine(mine)}
                  disabled={isCurrent}
                >
                  {isCurrent ? "Currently Selected" : "Select Mine for Monitoring"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
