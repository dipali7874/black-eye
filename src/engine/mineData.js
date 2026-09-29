/**
 * BLACK EYE — SIH26025
 * Prototype Indian Coal Mines Data & Station Definitions
 */

export const INDIAN_MINES = [
  {
    id: "jharkhand",
    name: "Demo Mine — Jharkhand",
    location: "Jharia Coalfield, Dhanbad District",
    state: "Jharkhand",
    coords: { lat: 23.7505, lng: 86.4208 },
    zoom: 15,
    totalDepth: "240 m",
    productionCapacity: "3.2 MTPA",
    method: "Board & Pillar / Underground Longwall",
    panels: [
      { id: "p1", name: "North Panel, Shaft 1", status: "SAFE" },
      { id: "p2", name: "Longwall Face, Shaft 2", status: "WARNING" },
      { id: "p3", name: "Goaf Area, Panel 3", status: "CRITICAL" },
      { id: "p4", name: "Surface Bowl, Sector D", status: "SAFE" }
    ]
  },
  {
    id: "odisha",
    name: "Demo Mine — Odisha",
    location: "Talcher Coalfield, Angul District",
    state: "Odisha",
    coords: { lat: 20.9512, lng: 85.2234 },
    zoom: 15,
    totalDepth: "180 m",
    productionCapacity: "4.5 MTPA",
    method: "Underground Continuous Miner",
    panels: [
      { id: "p1", name: "West Wing Panel 1", status: "SAFE" },
      { id: "p2", name: "Main Slope Panel 4", status: "SAFE" },
      { id: "p3", name: "Dip Sector B", status: "WARNING" },
      { id: "p4", name: "Subsidence Zone 2", status: "SAFE" }
    ]
  },
  {
    id: "chhattisgarh",
    name: "Demo Mine — Chhattisgarh",
    location: "Korba Coalfield, Korba District",
    state: "Chhattisgarh",
    coords: { lat: 22.3589, lng: 82.6841 },
    zoom: 15,
    totalDepth: "210 m",
    productionCapacity: "5.0 MTPA",
    method: "Longwall Mining",
    panels: [
      { id: "p1", name: "South Panel 2", status: "SAFE" },
      { id: "p2", name: "Seam 3 Incline", status: "SAFE" },
      { id: "p3", name: "Pillar Extract Area", status: "WARNING" },
      { id: "p4", name: "Surface Zone C", status: "SAFE" }
    ]
  },
  {
    id: "westbengal",
    name: "Demo Mine — West Bengal",
    location: "Raniganj Coalfield, Asansol Region",
    state: "West Bengal",
    coords: { lat: 23.6833, lng: 86.9833 },
    zoom: 15,
    totalDepth: "310 m",
    productionCapacity: "2.8 MTPA",
    method: "Deep Underground Panel Extraction",
    panels: [
      { id: "p1", name: "East Shaft Panel", status: "SAFE" },
      { id: "p2", name: "Central Longwall", status: "SAFE" },
      { id: "p3", name: "Dishergarh Seam", status: "WARNING" },
      { id: "p4", name: "North Sub-surface Bowl", status: "SAFE" }
    ]
  }
];

export function generateInitialStations(mine) {
  const baseLat = mine.coords.lat;
  const baseLng = mine.coords.lng;
  const stations = [];

  for (let i = 1; i <= 24; i++) {
    const id = `S-${String(i).padStart(3, "0")}`;
    const offsetLat = (Math.sin(i * 1.3) * 0.0075) + (Math.floor((i - 1) / 6) * 0.003);
    const offsetLng = (Math.cos(i * 1.3) * 0.0075) + ((i % 6) * 0.003);
    
    // Assign specific statuses for demo initial state
    let status = "SAFE";
    let tilt = +(0.8 + (i % 3) * 0.35).toFixed(1);
    let displacement = +(1.2 + (i % 4) * 0.7).toFixed(1);
    let vibration = "Normal";
    let crackStatus = "Normal";
    let riskScore = Math.floor(12 + (i % 5) * 4);

    if (i === 7) {
      status = "WARNING";
      tilt = 2.8;
      displacement = 7.4;
      vibration = "Elevated";
      crackStatus = "Normal";
      riskScore = 64;
    } else if (i === 12) {
      status = "CRITICAL";
      tilt = 4.6;
      displacement = 14.2;
      vibration = "High";
      crackStatus = "Detected";
      riskScore = 86;
    } else if (i === 15) {
      status = "WARNING";
      tilt = 3.1;
      displacement = 8.1;
      vibration = "Elevated";
      crackStatus = "Normal";
      riskScore = 58;
    } else if (i === 3) {
      status = "WARNING";
      tilt = 2.5;
      displacement = 6.2;
      vibration = "Normal";
      crackStatus = "Normal";
      riskScore = 48;
    }

    const panelName = mine.panels[(i - 1) % mine.panels.length].name;

    // Generate history trend points
    const history = [];
    for (let h = 24; h >= 0; h--) {
      const noise = (Math.sin(h * 0.5 + i) * 0.3);
      history.push({
        time: `${String((24 - h) % 24).padStart(2, "0")}:00`,
        tilt: Math.max(0.2, +(tilt - (h * 0.04) + noise).toFixed(1)),
        displacement: Math.max(0.5, +(displacement - (h * 0.15) + noise).toFixed(1)),
        riskScore: Math.max(10, Math.min(100, Math.round(riskScore - (h * 1.2) + noise * 5)))
      });
    }

    stations.push({
      id,
      name: `Sensor Station ${id}`,
      mineId: mine.id,
      lat: +(baseLat + offsetLat).toFixed(5),
      lng: +(baseLng + offsetLng).toFixed(5),
      status,
      tilt,
      displacement,
      vibration,
      crackStatus,
      battery: 85 + (i * 7) % 15,
      signal: 90 + (i * 3) % 10,
      riskScore,
      panel: panelName,
      lastSync: "Just now",
      history
    });
  }

  return stations;
}
