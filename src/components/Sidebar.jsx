import React from "react";
import {
  LayoutDashboard,
  MapPin,
  Radio,
  Cpu,
  Database,
  Bell,
  Network,
  Pickaxe,
  Settings
} from "lucide-react";

export function Sidebar({ activeTab, setActiveTab, activeAlertCount = 0 }) {
  const navItems = [
    { id: "dashboard", label: "Main Dashboard", icon: LayoutDashboard },
    { id: "live-map", label: "Live Map", icon: MapPin },
    { id: "stations", label: "Sensor Stations", icon: Radio },
    { id: "ai-analysis", label: "AI Analysis", icon: Cpu },
    { id: "historical", label: "Historical Data", icon: Database },
    { id: "alerts", label: "Alerts", icon: Bell, badge: activeAlertCount },
    { id: "mesh-network", label: "Mesh Network", icon: Network },
    { id: "mine-management", label: "Mine Management", icon: Pickaxe },
    { id: "settings", label: "Settings", icon: Settings }
  ];

  return (
    <aside className="be-sidebar">
      <nav className="be-nav-list">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`be-nav-item ${isActive ? "active" : ""}`}
            >
              <Icon size={18} className="be-nav-icon" />
              <span className="be-nav-label">{item.label}</span>
              {item.badge > 0 && (
                <span className="be-nav-badge">{item.badge}</span>
              )}
            </button>
          );
        })}
      </nav>
      
      <div className="be-sidebar-footer">
        <div className="be-source-indicator">
          <span className="source-dot"></span> DATA SOURCE: <strong>DEMO SIMULATION</strong>
        </div>
      </div>
    </aside>
  );
}
