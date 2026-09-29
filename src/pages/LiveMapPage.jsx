import React from "react";
import { EarthGisMap } from "../components/EarthGisMap.jsx";

export function LiveMapPage({ currentMine, onSelectMine, stations, selectedStation, onSelectStation, onSimulateRiskEvent }) {
  return (
    <div className="be-page-container">
      <div className="be-page-header">
        <h2>LIVE EARTH GIS MAP — MINE SUBSIDENCE MONITORING</h2>
        <p>Interactive spatial intelligence view centered on Indian underground coalfields.</p>
      </div>

      <EarthGisMap
        currentMine={currentMine}
        onSelectMine={onSelectMine}
        stations={stations}
        selectedStation={selectedStation}
        onSelectStation={onSelectStation}
        onSimulateRisk={onSimulateRiskEvent}
      />
    </div>
  );
}
