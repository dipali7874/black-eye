import React, { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import { INDIAN_MINES } from "../engine/mineData.js";
import {
  Layers,
  MapPin,
  Radio,
  Flame,
  Sparkles,
  Compass,
  Activity,
  Eye,
  ZoomIn,
  ZoomOut
} from "lucide-react";

// Helper to create HTML DivIcon for Mine Pins
function createMineIcon(mineName, isCurrent = false) {
  const shortName = mineName.replace("Demo Mine — ", "");
  return L.divIcon({
    className: "be-leaflet-mine-icon",
    html: `
      <div class="be-mine-pin-pill ${isCurrent ? 'active' : ''}">
        <span class="be-mine-pin-name">${shortName}</span>
        <span class="be-mine-pin-sub">COLLIERY</span>
      </div>
    `,
    iconSize: [120, 36],
    iconAnchor: [60, 36],
    popupAnchor: [0, -36]
  });
}

// Helper to create HTML DivIcon for Sensor Stations
function createStationIcon(station, isSelected = false) {
  const isCritical = station.status === "CRITICAL";
  const isWarning = station.status === "WARNING" || station.status === "ANOMALY";
  
  let colorClass = "safe";
  if (isCritical) colorClass = "critical";
  else if (isWarning) colorClass = "warning";

  return L.divIcon({
    className: "be-leaflet-station-icon",
    html: `
      <div class="be-station-pin-container ${colorClass} ${isSelected ? 'selected' : ''}">
        ${(isSelected || isCritical) ? '<div class="be-station-pulse-ring"></div>' : ''}
        <div class="be-station-dot"></div>
        <div class="be-station-label">${station.id}<br/><span>${station.riskScore}/100</span></div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
  });
}

export function EarthGisMap({
  currentMine,
  onSelectMine,
  stations = [],
  selectedStation,
  onSelectStation,
  onSimulateRisk
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const layersGroupRef = useRef(null);

  const [mapStyle, setMapStyle] = useState("satellite"); // 'standard', 'satellite', 'terrain'
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showPanels, setShowPanels] = useState(true);
  const [showMesh, setShowMesh] = useState(true);
  const [mapViewInfo, setMapViewInfo] = useState({ zoom: 15, lat: 23.75, lng: 86.42 });

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const { lat, lng } = currentMine.coords;

    const map = L.map(mapContainerRef.current, {
      center: [lat, lng],
      zoom: 15,
      zoomControl: false,
      attributionControl: false
    });

    mapInstanceRef.current = map;

    // Track map center and zoom level for Telemetry HUD
    const updateMapInfo = () => {
      const center = map.getCenter();
      setMapViewInfo({
        zoom: map.getZoom(),
        lat: Number(center.lat.toFixed(4)),
        lng: Number(center.lng.toFixed(4))
      });
    };
    map.on("moveend", updateMapInfo);
    map.on("zoomend", updateMapInfo);

    // Create LayerGroup for dynamic overlay items
    const overlayGroup = L.layerGroup().addTo(map);
    layersGroupRef.current = overlayGroup;

    return () => {
      map.off("moveend", updateMapInfo);
      map.off("zoomend", updateMapInfo);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Layer when mapStyle changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    let tileUrl = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
    let maxZoom = 19;

    if (mapStyle === "standard") {
      tileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
    } else if (mapStyle === "terrain") {
      tileUrl = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}";
    }

    const newTileLayer = L.tileLayer(tileUrl, {
      maxZoom: maxZoom,
      subdomains: ["a", "b", "c"]
    }).addTo(map);

    tileLayerRef.current = newTileLayer;
  }, [mapStyle]);

  // Smooth FlyTo when active mine changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !currentMine) return;

    const { lat, lng } = currentMine.coords;
    map.flyTo([lat, lng], 15, {
      duration: 1.2,
      easeLinearity: 0.25
    });
  }, [currentMine]);

  // Redraw Map Overlays (Mines, Panels, Heatmap, Mesh, Station Markers)
  useEffect(() => {
    const group = layersGroupRef.current;
    const map = mapInstanceRef.current;
    if (!group || !map) return;

    group.clearLayers();

    const baseLat = currentMine.coords.lat;
    const baseLng = currentMine.coords.lng;

    // 1. Mine Markers for Indian Coalfields
    INDIAN_MINES.forEach((mine) => {
      const isCurrent = mine.id === currentMine.id;
      const marker = L.marker([mine.coords.lat, mine.coords.lng], {
        icon: createMineIcon(mine.name, isCurrent),
        zIndexOffset: isCurrent ? 500 : 100
      });
      marker.on("click", () => onSelectMine(mine));
      group.addLayer(marker);
    });

    // 2. Underground Extraction Panels
    if (showPanels) {
      // Panel 1: North Panel, Shaft 1 (Safe)
      const panel1Coords = [
        [baseLat + 0.003, baseLng - 0.009],
        [baseLat + 0.003, baseLng - 0.002],
        [baseLat + 0.008, baseLng - 0.002],
        [baseLat + 0.008, baseLng - 0.009]
      ];
      const p1 = L.polygon(panel1Coords, {
        color: "#38bdf8",
        weight: 2,
        fillColor: "#38bdf8",
        fillOpacity: 0.12,
        dashArray: "4, 4"
      }).bindTooltip("PANEL 1: North Panel, Shaft 1 [SAFE]", { sticky: true, className: "be-leaflet-tooltip" });
      group.addLayer(p1);

      // Panel 2: Longwall Face, Shaft 2 (Warning)
      const panel2Coords = [
        [baseLat + 0.003, baseLng + 0.001],
        [baseLat + 0.003, baseLng + 0.008],
        [baseLat + 0.009, baseLng + 0.008],
        [baseLat + 0.009, baseLng + 0.001]
      ];
      const p2 = L.polygon(panel2Coords, {
        color: "#f59e0b",
        weight: 2,
        fillColor: "#f59e0b",
        fillOpacity: 0.15,
        dashArray: "4, 4"
      }).bindTooltip("PANEL 2: Longwall Face, Shaft 2 [WARNING]", { sticky: true, className: "be-leaflet-tooltip" });
      group.addLayer(p2);

      // Panel 3: Goaf Area, Panel 3 (Critical)
      const panel3Coords = [
        [baseLat - 0.007, baseLng - 0.005],
        [baseLat - 0.007, baseLng + 0.006],
        [baseLat - 0.001, baseLng + 0.006],
        [baseLat - 0.001, baseLng - 0.005]
      ];
      const p3 = L.polygon(panel3Coords, {
        color: "#ef4444",
        weight: 2,
        fillColor: "#ef4444",
        fillOpacity: 0.2,
        dashArray: "4, 4"
      }).bindTooltip("PANEL 3: Goaf Area [CRITICAL SUBSIDENCE RISK]", { sticky: true, className: "be-leaflet-tooltip" });
      group.addLayer(p3);
    }

    // 3. Subsidence Risk Heatmap Circles
    if (showHeatmap) {
      stations.forEach((s) => {
        if (s.status === "CRITICAL" || s.status === "WARNING") {
          const isCrit = s.status === "CRITICAL";
          const circle = L.circle([s.lat, s.lng], {
            radius: isCrit ? 220 : 150,
            color: isCrit ? "#ef4444" : "#f59e0b",
            weight: 1,
            fillColor: isCrit ? "#ef4444" : "#f59e0b",
            fillOpacity: isCrit ? 0.35 : 0.25
          });
          group.addLayer(circle);
        }
      });
    }

    // 4. Mesh Network Topology Links
    if (showMesh && stations.length > 0) {
      for (let i = 0; i < stations.length; i++) {
        const s1 = stations[i];
        const s2 = stations[(i + 1) % stations.length];
        const line = L.polyline(
          [[s1.lat, s1.lng], [s2.lat, s2.lng]],
          {
            color: "#38bdf8",
            weight: 1.5,
            opacity: 0.45,
            dashArray: "6, 6"
          }
        );
        group.addLayer(line);
      }
    }

    // 5. Sensor Station Markers
    stations.forEach((s) => {
      const isSelected = selectedStation && selectedStation.id === s.id;
      const marker = L.marker([s.lat, s.lng], {
        icon: createStationIcon(s, isSelected),
        zIndexOffset: isSelected ? 1000 : 300
      });

      marker.on("click", () => onSelectStation(s));
      group.addLayer(marker);
    });
  }, [currentMine, stations, selectedStation, showHeatmap, showPanels, showMesh, onSelectMine, onSelectStation]);

  // Reset Camera View Helper
  const handleResetCamera = () => {
    const map = mapInstanceRef.current;
    if (!map || !currentMine) return;
    const { lat, lng } = currentMine.coords;
    map.flyTo([lat, lng], 15, { duration: 1.0 });
  };

  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();

  return (
    <div className="be-card be-map-card">
      {/* Top Map Control Bar */}
      <div className="be-map-controls-header">
        <div className="be-mine-selector-group">
          <label className="be-selector-label">
            <MapPin size={15} className="text-accent" /> SELECT MINE:
          </label>
          <select
            value={currentMine.id}
            onChange={(e) => {
              const found = INDIAN_MINES.find((m) => m.id === e.target.value);
              if (found) onSelectMine(found);
            }}
            className="be-mine-select"
          >
            {INDIAN_MINES.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.state})
              </option>
            ))}
          </select>
          <span className="be-demo-mine-tag">2D LEAFLET GIS • OFFLINE-READY</span>
        </div>

        <div className="be-map-tools">
          <div className="be-style-buttons">
            <button
              className={`be-style-btn ${mapStyle === "standard" ? "active" : ""}`}
              onClick={() => setMapStyle("standard")}
            >
              Standard (OSM)
            </button>
            <button
              className={`be-style-btn ${mapStyle === "satellite" ? "active" : ""}`}
              onClick={() => setMapStyle("satellite")}
            >
              Satellite
            </button>
            <button
              className={`be-style-btn ${mapStyle === "terrain" ? "active" : ""}`}
              onClick={() => setMapStyle("terrain")}
            >
              Topographic
            </button>
          </div>

          <div className="be-layer-toggles">
            <button
              className={`be-toggle-btn ${showHeatmap ? "active" : ""}`}
              onClick={() => setShowHeatmap(!showHeatmap)}
              title="Toggle Subsidence Risk Heatmap"
            >
              <Flame size={14} /> Heatmap
            </button>
            <button
              className={`be-toggle-btn ${showPanels ? "active" : ""}`}
              onClick={() => setShowPanels(!showPanels)}
              title="Toggle Underground Extraction Panel Boundaries"
            >
              <Layers size={14} /> Panels
            </button>
            <button
              className={`be-toggle-btn ${showMesh ? "active" : ""}`}
              onClick={() => setShowMesh(!showMesh)}
              title="Toggle Surface IoT Mesh Network Links"
            >
              <Radio size={14} /> Mesh Network
            </button>
          </div>
        </div>
      </div>

      {/* 2D Leaflet Viewport Host */}
      <div className="be-map-viewport">
        <div ref={mapContainerRef} className="be-leaflet-container" style={{ width: "100%", height: "100%" }} />

        {/* Top-left Mine & Location HUD */}
        <div className="be-map-location-hud">
          <div className="be-loc-title">{currentMine.name}</div>
          <div className="be-loc-coords">
            {currentMine.coords.lat.toFixed(4)}° N, {currentMine.coords.lng.toFixed(4)}° E | Depth:{" "}
            {currentMine.totalDepth} | {currentMine.location}
          </div>
          <div className="be-loc-method">
            Method: <span>{currentMine.method}</span> • Capacity: <span>{currentMine.productionCapacity}</span>
          </div>
        </div>

        {/* Top-right View Telemetry HUD */}
        <div className="be-map-telemetry-hud">
          <div className="be-hud-row">
            <span className="be-hud-label">ZOOM LEVEL</span>
            <span className="be-hud-val">Z{mapViewInfo.zoom}</span>
          </div>
          <div className="be-hud-row">
            <span className="be-hud-label">CENTER LAT</span>
            <span className="be-hud-val">{mapViewInfo.lat}°</span>
          </div>
          <div className="be-hud-row">
            <span className="be-hud-label">CENTER LNG</span>
            <span className="be-hud-val">{mapViewInfo.lng}°</span>
          </div>
          <div className="be-hud-btn-group">
            <button
              className="be-btn-hud-action"
              onClick={handleResetCamera}
              title="Reset view to mine center"
            >
              <Compass size={13} /> Center Mine
            </button>
            <button
              className="be-btn-hud-action icon-only"
              onClick={handleZoomIn}
              title="Zoom In"
            >
              <ZoomIn size={13} />
            </button>
            <button
              className="be-btn-hud-action icon-only"
              onClick={handleZoomOut}
              title="Zoom Out"
            >
              <ZoomOut size={13} />
            </button>
          </div>
        </div>

        {/* Bottom-left Station Status Legend */}
        <div className="be-map-legend-hud">
          <div className="be-legend-item">
            <span className="be-legend-dot safe" /> Normal (&lt;30)
          </div>
          <div className="be-legend-item">
            <span className="be-legend-dot info" /> Anomaly (30-44)
          </div>
          <div className="be-legend-item">
            <span className="be-legend-dot warning" /> Warning (45-74)
          </div>
          <div className="be-legend-item">
            <span className="be-legend-dot critical" /> Critical (≥75)
          </div>
        </div>

        {/* Bottom-right Floating Quick Action */}
        <div className="be-map-overlay-actions">
          <button className="be-btn-simulate" onClick={onSimulateRisk}>
            <Sparkles size={16} /> SIMULATE RISK EVENT
          </button>
        </div>
      </div>
    </div>
  );
}
