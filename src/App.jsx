import React, { useState, useEffect, useCallback } from "react";
import { io } from "socket.io-client";
import { INDIAN_MINES, generateInitialStations } from "./engine/mineData.js";
import { analyzeOverallMineRisk } from "./engine/offlineAI.js";
import { isOnlineAiConfigured } from "./engine/onlineAI.js";
import { tickSimulatedTelemetry, triggerSimulatedRiskEvent, fetchNodesFromBackend } from "./engine/simulationEngine.js";

import { Header } from "./components/Header.jsx";
import { Sidebar } from "./components/Sidebar.jsx";
import { StationDetailModal } from "./components/StationDetailModal.jsx";

import { DashboardPage } from "./pages/DashboardPage.jsx";
import { LiveMapPage } from "./pages/LiveMapPage.jsx";
import { SensorStationsPage } from "./pages/SensorStationsPage.jsx";
import { AiAnalysisPage } from "./pages/AiAnalysisPage.jsx";
import { HistoricalDataPage } from "./pages/HistoricalDataPage.jsx";
import { AlertsHistoryPage } from "./pages/AlertsHistoryPage.jsx";
import { MeshNetworkPage } from "./pages/MeshNetworkPage.jsx";
import { MineManagementPage } from "./pages/MineManagementPage.jsx";
import { SettingsPage } from "./pages/SettingsPage.jsx";

export function App() {
  const [currentMine, setCurrentMine] = useState(INDIAN_MINES[0]);
  const [stations, setStations] = useState(() => generateInitialStations(INDIAN_MINES[0]));
  const [selectedStation, setSelectedStation] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSimulating, setIsSimulating] = useState(false);
  const [lastAnalysisTime, setLastAnalysisTime] = useState("10 seconds ago");

  // Dual Mode State (DEMO vs HARDWARE)
  const [systemMode, setSystemMode] = useState("DEMO");
  const [backendConnected, setBackendConnected] = useState(false);
  const [nodeMcuOnline, setNodeMcuOnline] = useState(false);
  const [mysqlConnected, setMysqlConnected] = useState(false);

  // Attempt backend hydration on mount & connect Socket.IO
  useEffect(() => {
    let isMounted = true;

    // 1. Fetch current stations from Node.js backend
    fetch("/api/nodes")
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (isMounted && data && data.nodes && data.nodes.length > 0) {
          setStations(data.nodes);
        }
      })
      .catch(() => {
        // Fallback to legacy fetcher if /api proxy isn't direct
        fetchNodesFromBackend().then(backendStations => {
          if (isMounted && backendStations && backendStations.length > 0) {
            setStations(backendStations);
          }
        });
      });

    // 2. Fetch system mode
    fetch("/api/mode")
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (isMounted && data) {
          if (data.mode) setSystemMode(data.mode);
          if (data.isMysqlConnected !== undefined) setMysqlConnected(data.isMysqlConnected);
        }
      })
      .catch(() => {});

    // 3. Connect Socket.IO for zero-latency NodeMCU streaming
    let socket;
    try {
      socket = io("http://localhost:5000", {
        reconnectionAttempts: 15,
        reconnectionDelay: 2000,
        timeout: 4000
      });

      socket.on("connect", () => {
        if (isMounted) setBackendConnected(true);
      });

      socket.on("disconnect", () => {
        if (isMounted) setBackendConnected(false);
      });

      socket.on("system_status", (status) => {
        if (!isMounted) return;
        if (status.mode) setSystemMode(status.mode);
        if (status.mysqlConnected !== undefined) setMysqlConnected(status.mysqlConnected);
        if (status.lastNodeMcuPacket) setNodeMcuOnline(true);
      });

      socket.on("mode_changed", (data) => {
        if (isMounted && data?.mode) setSystemMode(data.mode);
      });

      socket.on("telemetry_update", (data) => {
        if (!isMounted || !data || !data.station) return;
        const st = data.station;
        setStations(prev => {
          const idx = prev.findIndex(s => s.id === st.id);
          const historyPoint = {
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            tilt: st.tilt,
            displacement: st.displacement,
            riskScore: st.riskScore || st.risk_score || 0,
            gas_ppm: st.gas_ppm || st.gasLevel || 0
          };
          if (idx >= 0) {
            const updated = [...prev];
            const oldHistory = updated[idx].history || [];
            const newHistory = [...oldHistory.slice(-29), historyPoint];
            updated[idx] = { ...updated[idx], ...st, history: newHistory, isHardware: true };
            return updated;
          }
          return [...prev, { ...st, history: [historyPoint], isHardware: true }];
        });

        if (data.source === "nodemcu" || st.is_hardware) {
          setNodeMcuOnline(true);
          setEvents(prev => [
            {
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              message: `[NodeMCU ESP8266] Telemetry ingested for ${st.id} — Tilt: ${st.tilt}°, Disp: ${st.displacement}mm, Gas: ${st.gas_ppm || 0} PPM (Risk: ${st.risk_score || st.riskScore}/100)`,
              type: (st.status === "CRITICAL" ? "CRITICAL" : (st.status === "WARNING" ? "WARNING" : "INFO")),
              source: "nodemcu"
            },
            ...prev.slice(0, 25)
          ]);
        }
      });

      socket.on("new_alert", (newAlert) => {
        if (!isMounted) return;
        setAlerts(prev => [newAlert, ...prev.filter(a => a.id !== newAlert.id)]);
      });

      socket.on("alert_acknowledged", ({ id }) => {
        if (!isMounted) return;
        setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a));
      });
    } catch (err) {
      console.warn("Socket initialization error:", err);
    }

    return () => {
      isMounted = false;
      if (socket) socket.disconnect();
    };
  }, []);

  const [alerts, setAlerts] = useState([
    {
      id: "alt-101",
      time: "10:38",
      station: "S-012",
      panel: "Goaf Area, Panel 3",
      severity: "critical",
      sensor: "Multi-Sensor Fusion",
      riskScore: 86,
      message: "Potential high deformation anomaly detected. Displacement crossed 14mm threshold.",
      acknowledged: false
    },
    {
      id: "alt-102",
      time: "10:42",
      station: "S-007",
      panel: "Longwall Face, Shaft 2",
      severity: "warning",
      sensor: "Tilt Sensor",
      riskScore: 64,
      message: "Increasing tilt angle trend detected (2.8°).",
      acknowledged: false
    },
    {
      id: "alt-103",
      time: "10:20",
      station: "S-015",
      panel: "Surface Bowl, Sector D",
      severity: "warning",
      sensor: "Surface Seismic Strain",
      riskScore: 58,
      message: "Elevated surface vibration anomaly detected.",
      acknowledged: false
    }
  ]);

  const [events, setEvents] = useState([
    { time: "10:42", message: "AI detected anomaly at S-007 (Longwall Face)", type: "WARNING" },
    { time: "10:38", message: "Station S-012 changed to CRITICAL status", type: "CRITICAL" },
    { time: "10:31", message: "Offline AI analysis pass completed (24 stations)", type: "INFO" },
    { time: "10:25", message: "Surface mesh network synchronized (96% health)", type: "INFO" },
    { time: "10:20", message: "BLACK EYE Ready — Mode: DEMO SIMULATION", type: "INFO" }
  ]);

  // Mode-Aware Data Filters: In Hardware Mode, completely eliminate all dummy/synthetic data
  const isHardwareMode = systemMode === "HARDWARE";

  // Filter stations: In Hardware Mode, show ONLY real hardware stations (Station S-001 or marked as hardware)
  const activeStations = isHardwareMode
    ? stations.filter(s => s.id === "S-001" || s.isHardware || s.is_hardware)
    : stations;

  // Filter alerts: In Hardware Mode, exclude all dummy demo alerts (alt-101, alt-102, alt-103)
  const activeAlerts = isHardwareMode
    ? alerts.filter(a => a.station === "S-001" || a.isHardware || a.source === "nodemcu" || a.sensor?.includes("NodeMCU"))
    : alerts;

  // Filter events: In Hardware Mode, show only real hardware ingestion and system events
  const activeEvents = isHardwareMode
    ? events.filter(e => e.source === "nodemcu" || e.message?.includes("NodeMCU") || e.message?.includes("S-001") || e.message?.includes("HARDWARE"))
    : events;

  // Re-calculate overall mine risk strictly based on activeStations
  const overallRisk = analyzeOverallMineRisk(activeStations);

  // Automatically lock selectedStation onto the live hardware station S-001 in Hardware Mode
  const effectiveSelectedStation = isHardwareMode
    ? (activeStations.find(s => s.id === (selectedStation?.id || "S-001")) || activeStations[0] || null)
    : selectedStation;

  // Switch active mine
  const handleSelectMine = (mine) => {
    setCurrentMine(mine);
    const newStations = generateInitialStations(mine);
    setStations(newStations);
    setSelectedStation(null);
    setEvents(prev => [
      { time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), message: `Switched active monitor to ${mine.name}`, type: "INFO" },
      ...prev
    ]);
  };

  // Toggle Mode: DEMO <-> HARDWARE
  const handleToggleMode = () => {
    const nextMode = systemMode === "DEMO" ? "HARDWARE" : "DEMO";
    setSystemMode(nextMode);

    fetch("/api/mode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: nextMode })
    }).catch(() => {});

    setEvents(prev => [
      {
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        message: nextMode === "HARDWARE"
          ? "Switched to LIVE NODEMCU HARDWARE MODE — Listening for ESP8266/ESP32 telemetry on :5000/api/nodemcu"
          : "Switched to DEMO SIMULATION MODE — Generating synthetic micro-drift telemetry",
        type: "INFO"
      },
      ...prev
    ]);
  };

  // Micro-drift live simulation loop (runs ONLY when in DEMO mode!)
  useEffect(() => {
    if (systemMode !== "DEMO") return;

    const timer = setInterval(() => {
      setStations(prev => tickSimulatedTelemetry(prev));
      setLastAnalysisTime("Just now");
    }, 7000);
    return () => clearInterval(timer);
  }, [systemMode]);

  // Trigger explicit "SIMULATE RISK EVENT" demo action
  const handleSimulateRiskEvent = useCallback(() => {
    setIsSimulating(true);

    // Try backend simulation endpoint first to persist to MySQL
    fetch("/api/simulate/risk", { method: "POST" })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.alert) {
          setAlerts(prev => [data.alert, ...prev]);
          const target = stations.find(s => s.id === data.target_station_id);
          if (target) setSelectedStation(target);
          setIsSimulating(false);
          setLastAnalysisTime("Just now");
          return;
        }
        throw new Error("Fallback to client simulation");
      })
      .catch(() => {
        setTimeout(() => {
          const result = triggerSimulatedRiskEvent(stations, (targetId, newAlert, newEvt) => {
            setAlerts(prev => [newAlert, ...prev]);
            setEvents(prev => [newEvt, ...prev]);
          });

          setStations(result.updatedStations);
          const targetSt = result.updatedStations.find(s => s.id === result.targetStationId);
          if (targetSt) setSelectedStation(targetSt);

          setIsSimulating(false);
          setLastAnalysisTime("Just now");
        }, 900);
      });
  }, [stations]);

  // Acknowledge Alert
  const handleAcknowledgeAlert = (alertId) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, acknowledged: true } : a));
    fetch(`/api/alerts/ack/${alertId}`, { method: "POST" }).catch(() => {});
  };

  // View station analysis trigger
  const handleViewAnalysis = (station) => {
    setSelectedStation(station);
    setActiveTab("ai-analysis");
  };

  return (
    <div className="be-app-shell">
      <Header
        isOnlineAi={isOnlineAiConfigured()}
        activeAlertCount={activeAlerts.filter(a => !a.acknowledged).length}
        systemMode={systemMode}
        onToggleMode={handleToggleMode}
        backendConnected={backendConnected}
        nodeMcuOnline={nodeMcuOnline}
        mysqlConnected={mysqlConnected}
      />

      <div className="be-main-body">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} activeAlertCount={activeAlerts.filter(a => !a.acknowledged).length} />

        <main className="be-content-area">
          {activeTab === "dashboard" && (
            <DashboardPage
              currentMine={currentMine}
              onSelectMine={handleSelectMine}
              stations={activeStations}
              selectedStation={effectiveSelectedStation}
              onSelectStation={setSelectedStation}
              overallRisk={overallRisk}
              alerts={activeAlerts}
              onAcknowledgeAlert={handleAcknowledgeAlert}
              onSimulateRiskEvent={handleSimulateRiskEvent}
              isSimulating={isSimulating}
              events={activeEvents}
              onViewAllAlerts={() => setActiveTab("alerts")}
              lastAnalysisTime={lastAnalysisTime}
              isHardwareMode={isHardwareMode}
            />
          )}

          {activeTab === "live-map" && (
            <LiveMapPage
              currentMine={currentMine}
              onSelectMine={handleSelectMine}
              stations={activeStations}
              selectedStation={effectiveSelectedStation}
              onSelectStation={setSelectedStation}
              onSimulateRiskEvent={handleSimulateRiskEvent}
            />
          )}

          {activeTab === "stations" && (
            <SensorStationsPage
              stations={activeStations}
              onSelectStation={setSelectedStation}
              isHardwareMode={isHardwareMode}
            />
          )}

          {activeTab === "ai-analysis" && (
            <AiAnalysisPage
              stations={activeStations}
              overallRisk={overallRisk}
              currentMine={currentMine}
            />
          )}

          {activeTab === "historical" && (
            <HistoricalDataPage />
          )}

          {activeTab === "alerts" && (
            <AlertsHistoryPage
              alerts={activeAlerts}
              onAcknowledgeAlert={handleAcknowledgeAlert}
            />
          )}

          {activeTab === "mesh-network" && (
            <MeshNetworkPage />
          )}

          {activeTab === "mine-management" && (
            <MineManagementPage
              currentMine={currentMine}
              onSelectMine={handleSelectMine}
            />
          )}

          {activeTab === "settings" && (
            <SettingsPage />
          )}
        </main>
      </div>

      {selectedStation && (
        <StationDetailModal
          station={selectedStation}
          onClose={() => setSelectedStation(null)}
          onViewAnalysis={handleViewAnalysis}
        />
      )}
    </div>
  );
}
