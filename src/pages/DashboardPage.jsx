import React from "react";
import { KpiCards } from "../components/KpiCards.jsx";
import { OverallMineStatus } from "../components/OverallMineStatus.jsx";
import { EarthGisMap } from "../components/EarthGisMap.jsx";
import { SimulateRiskEventButton } from "../components/SimulateRiskEventButton.jsx";
import { AiMonitorPanel } from "../components/AiMonitorPanel.jsx";
import { AiAssistantWidget } from "../components/AiAssistantWidget.jsx";
import { ActiveAlertsPanel } from "../components/ActiveAlertsPanel.jsx";
import { SensorTrendCharts } from "../components/SensorTrendCharts.jsx";
import { MeshNetworkWidget } from "../components/MeshNetworkWidget.jsx";
import { RecentEventsTimeline } from "../components/RecentEventsTimeline.jsx";

export function DashboardPage({
  currentMine,
  onSelectMine,
  stations,
  selectedStation,
  onSelectStation,
  overallRisk,
  alerts,
  onAcknowledgeAlert,
  onSimulateRiskEvent,
  isSimulating,
  events,
  onViewAllAlerts,
  lastAnalysisTime,
  isHardwareMode = false
}) {
  return (
    <div className="be-dashboard-grid">
      {/* 1. Top KPI Row */}
      <div className="be-grid-span-12">
        <KpiCards stations={stations} overallRisk={overallRisk} isHardwareMode={isHardwareMode} />
      </div>

      {/* 2. Main GIS Map (Largest Component) */}
      <div className="be-grid-span-8">
        <EarthGisMap
          currentMine={currentMine}
          onSelectMine={onSelectMine}
          stations={stations}
          selectedStation={selectedStation}
          onSelectStation={onSelectStation}
          onSimulateRisk={onSimulateRiskEvent}
        />
      </div>

      {/* 3. Overall Status & Quick Risk Action Side */}
      <div className="be-grid-span-4 be-flex-col-gap">
        <OverallMineStatus overallRisk={overallRisk} lastAnalysisTime={lastAnalysisTime} isHardwareMode={isHardwareMode} />
        <SimulateRiskEventButton onClick={onSimulateRiskEvent} isSimulating={isSimulating} isHardwareMode={isHardwareMode} />
        <ActiveAlertsPanel alerts={alerts} onAcknowledgeAlert={onAcknowledgeAlert} onViewAllAlerts={onViewAllAlerts} />
      </div>

      {/* 4. AI Monitor & AI Assistant Row */}
      <div className="be-grid-span-7">
        <AiMonitorPanel stations={stations} overallRisk={overallRisk} lastAnalysisTime={lastAnalysisTime} />
      </div>

      <div className="be-grid-span-5">
        <AiAssistantWidget dashboardState={{ stations, activeAlerts: alerts.filter(a => !a.acknowledged), currentMine, overallRisk }} />
      </div>

      {/* 5. Sensor Trend Charts Row */}
      <div className="be-grid-span-12">
        <SensorTrendCharts selectedStation={selectedStation} />
      </div>

      {/* 6. Mesh Network & Recent Events Row */}
      <div className="be-grid-span-6">
        <MeshNetworkWidget isHardwareMode={isHardwareMode} />
      </div>

      <div className="be-grid-span-6">
        <RecentEventsTimeline events={events} isHardwareMode={isHardwareMode} />
      </div>
    </div>
  );
}
