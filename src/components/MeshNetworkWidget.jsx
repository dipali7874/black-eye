import React from "react";
import { Network, Wifi, Radio, Server } from "lucide-react";

export function MeshNetworkWidget({ networkHealth = 96, connectedCount = 23, offlineCount = 1, isHardwareMode = false }) {
  return (
    <div className="be-card be-network-card">
      <div className="be-card-header">
        <div className="be-header-title-icon">
          <Network size={18} className="text-accent" />
          <h3 className="be-card-title">{isHardwareMode ? "HARDWARE WI-FI LINK" : "SURFACE MESH NETWORK"}</h3>
        </div>
        <span className="be-badge safe-badge">
          <Wifi size={12} /> {isHardwareMode ? "100" : networkHealth}% HEALTH
        </span>
      </div>

      <div className="be-network-body">
        <div className="be-net-stats-row">
          <div className="be-net-stat">
            <span className="lbl">{isHardwareMode ? "Hardware Nodes" : "Total Nodes"}</span>
            <span className="val">{isHardwareMode ? "1" : "24"}</span>
          </div>
          <div className="be-net-stat">
            <span className="lbl">Connected</span>
            <span className="val text-safe">{isHardwareMode ? "1 (S-001)" : connectedCount}</span>
          </div>
          <div className="be-net-stat">
            <span className="lbl">Offline</span>
            <span className="val text-safe">{isHardwareMode ? "0" : offlineCount}</span>
          </div>
          <div className="be-net-stat">
            <span className="lbl">Gateway IP</span>
            <span className="val text-safe">{isHardwareMode ? "192.168.137.1" : "Connected"}</span>
          </div>
        </div>

        {/* Mesh Topology Visualizer */}
        <div className="be-mesh-diagram-container">
          <svg viewBox="0 0 400 160" className="be-mesh-svg">
            {/* Grid Mesh Node Circles & Links */}
            <line x1="60" y1="40" x2="160" y2="40" stroke="#3b82f6" strokeWidth="2" />
            <line x1="160" y1="40" x2="260" y2="40" stroke="#3b82f6" strokeWidth="2" />
            <line x1="260" y1="40" x2="340" y2="40" stroke="#3b82f6" strokeWidth="2" />

            <line x1="60" y1="40" x2="60" y2="100" stroke="#3b82f6" strokeWidth="2" />
            <line x1="160" y1="40" x2="160" y2="100" stroke="#3b82f6" strokeWidth="2" />
            <line x1="260" y1="40" x2="260" y2="100" stroke="#f59e0b" strokeWidth="2" strokeDasharray="3 3" />
            <line x1="340" y1="40" x2="340" y2="100" stroke="#3b82f6" strokeWidth="2" />

            <line x1="60" y1="100" x2="160" y2="100" stroke="#3b82f6" strokeWidth="2" />
            <line x1="160" y1="100" x2="260" y2="100" stroke="#3b82f6" strokeWidth="2" />
            <line x1="260" y1="100" x2="340" y2="100" stroke="#3b82f6" strokeWidth="2" />

            {/* Gateway Link */}
            <line x1="160" y1="100" x2="200" y2="145" stroke="#10b981" strokeWidth="2.5" />

            {/* Nodes */}
            <circle cx="60" cy="40" r="10" fill="#10b981" />
            <text x="60" y="44" fill="#0f172a" fontSize="9" fontWeight="bold" textAnchor="middle">S01</text>

            <circle cx="160" cy="40" r="10" fill="#10b981" />
            <text x="160" y="44" fill="#0f172a" fontSize="9" fontWeight="bold" textAnchor="middle">S02</text>

            <circle cx="260" cy="40" r="10" fill="#10b981" />
            <text x="260" y="44" fill="#0f172a" fontSize="9" fontWeight="bold" textAnchor="middle">S03</text>

            <circle cx="340" cy="40" r="10" fill="#10b981" />
            <text x="340" y="44" fill="#0f172a" fontSize="9" fontWeight="bold" textAnchor="middle">S04</text>

            <circle cx="60" cy="100" r="10" fill="#10b981" />
            <text x="60" y="104" fill="#0f172a" fontSize="9" fontWeight="bold" textAnchor="middle">S05</text>

            <circle cx="160" cy="100" r="10" fill="#10b981" />
            <text x="160" y="104" fill="#0f172a" fontSize="9" fontWeight="bold" textAnchor="middle">S06</text>

            <circle cx="260" cy="100" r="10" fill="#f59e0b" />
            <text x="260" y="104" fill="#0f172a" fontSize="9" fontWeight="bold" textAnchor="middle">S07</text>

            <circle cx="340" cy="100" r="10" fill="#10b981" />
            <text x="340" y="104" fill="#0f172a" fontSize="9" fontWeight="bold" textAnchor="middle">S08</text>

            {/* Gateway */}
            <rect x="170" y="132" width="60" height="24" rx="4" fill="#3b82f6" />
            <text x="200" y="148" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">GATEWAY</text>
          </svg>
        </div>
      </div>
    </div>
  );
}
