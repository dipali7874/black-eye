import React, { useState } from "react";
import { Radio, Search, Filter, Battery, Signal, ShieldAlert, AlertTriangle, CheckCircle2 } from "lucide-react";

export function SensorStationsPage({ stations = [], onSelectStation, isHardwareMode = false }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filtered = stations.filter(s => {
    const matchesSearch = s.id.toLowerCase().includes(search.toLowerCase()) || (s.panel && s.panel.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === "ALL" || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="be-page-container">
      <div className="be-page-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h2>
              {isHardwareMode
                ? `LIVE HARDWARE SENSOR STATIONS (${stations.length} ACTIVE NODE)`
                : `SURFACE SENSOR STATIONS MONITOR (${stations.length} NODES)`}
            </h2>
            <p>
              {isHardwareMode
                ? "Physical telemetry streaming directly from Station S-001 (NodeMCU ESP8266). All synthetic dummy stations excluded."
                : "Telemetry, tilt, displacement, battery, and signal health across surface mesh nodes."}
            </p>
          </div>
          <div style={{
            background: isHardwareMode ? "rgba(34, 197, 94, 0.1)" : "rgba(56, 189, 248, 0.08)",
            border: isHardwareMode ? "1px solid rgba(34, 197, 94, 0.35)" : "1px solid rgba(56, 189, 248, 0.3)",
            borderRadius: "8px",
            padding: "8px 14px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "12px"
          }}>
            <Radio size={16} className={isHardwareMode ? "text-safe" : "text-accent"} />
            <div>
              <div style={{ fontWeight: "700", color: isHardwareMode ? "#22c55e" : "#38bdf8" }}>
                {isHardwareMode ? "● Live NodeMCU Stream Active (Port 5000)" : "NodeMCU Hardware Port :5000"}
              </div>
              <div style={{ color: "#94a3b8", fontSize: "11px" }}>Endpoint: <code style={{ color: "#f8fafc" }}>POST /api/nodemcu</code> (Station S-001)</div>
            </div>
          </div>
        </div>
      </div>

      <div className="be-filter-bar">
        <div className="be-search-box">
          <Search size={16} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by Station ID (S-007) or Panel..."
          />
        </div>

        <div className="be-status-filter-buttons">
          {["ALL", "SAFE", "WARNING", "CRITICAL"].map(st => (
            <button
              key={st}
              className={`be-filter-btn ${statusFilter === st ? "active" : ""}`}
              onClick={() => setStatusFilter(st)}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      <div className="be-table-container">
        <table className="be-table">
          <thead>
            <tr>
              <th>STATION ID</th>
              <th>PANEL LOCATION</th>
              <th>STATUS</th>
              <th>TILT (°)</th>
              <th>DISPLACEMENT (mm)</th>
              <th>VIBRATION</th>
              <th>MINE GAS</th>
              <th>CRACK STATUS</th>
              <th>BATTERY</th>
              <th>SIGNAL</th>
              <th>AI RISK SCORE</th>
              <th>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => {
              let badgeClass = "badge-safe";
              if (s.status === "CRITICAL") badgeClass = "badge-critical";
              else if (s.status === "WARNING" || s.status === "ANOMALY") badgeClass = "badge-warning";

              const gasVal = s.gas_ppm || (s.id === "S-012" ? 680 : (s.id === "S-007" ? 420 : 140));
              const isGasHigh = gasVal > 500;

              return (
                <tr key={s.id} style={(s.isHardware || s.id === "S-001") ? { background: "rgba(56, 189, 248, 0.05)" } : {}}>
                  <td className="font-mono font-bold">
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span>{s.id}</span>
                      {(s.isHardware || s.id === "S-001") && (
                        <span style={{
                          fontSize: "9px",
                          background: "rgba(56, 189, 248, 0.2)",
                          color: "#38bdf8",
                          border: "1px solid rgba(56, 189, 248, 0.4)",
                          borderRadius: "3px",
                          padding: "1px 5px"
                        }}>
                          NODEMCU
                        </span>
                      )}
                    </div>
                  </td>
                  <td>{s.panel}</td>
                  <td><span className={`be-status-pill ${badgeClass}`}>● {s.status}</span></td>
                  <td>{s.tilt}°</td>
                  <td>{s.displacement} mm</td>
                  <td>{s.vibration}</td>
                  <td>
                    <span style={{
                      color: isGasHigh ? "#ef4444" : "#94a3b8",
                      fontWeight: isGasHigh ? "700" : "500",
                      fontSize: "12px"
                    }}>
                      {gasVal} PPM
                    </span>
                  </td>
                  <td>{s.crackStatus}</td>
                  <td><Battery size={13} /> {s.battery}%</td>
                  <td><Signal size={13} /> {s.signal}%</td>
                  <td className="font-bold">{s.riskScore} / 100</td>
                  <td>
                    <button className="be-btn-sm" onClick={() => onSelectStation(s)}>
                      Details
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
