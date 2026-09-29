/**
 * BLACK EYE — SIH26025
 * Controlled Sensor Simulation & Risk Event Generator
 * With optional local FastAPI / SQLite backend telemetry synchronization
 */

import { analyzeStationOffline } from "./offlineAI.js";

const BACKEND_API_URL = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
  ? "http://localhost:8000"
  : "";

/**
 * Asynchronously posts station telemetry to local backend if running (non-blocking).
 */
export async function syncStationToBackend(station) {
  if (!BACKEND_API_URL) return;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1200);
    await fetch(`${BACKEND_API_URL}/telemetry`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(station),
      signal: controller.signal
    });
    clearTimeout(timeout);
  } catch {
    // Silently continue in offline mode
  }
}

/**
 * Attempts to load nodes from FastAPI backend; returns null if offline or empty.
 */
export async function fetchNodesFromBackend() {
  if (!BACKEND_API_URL) return null;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);
    const res = await fetch(`${BACKEND_API_URL}/nodes`, { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      if (data && data.nodes && data.nodes.length > 0) {
        return data.nodes;
      }
    }
  } catch {
    // Silently continue in offline mode
  }
  return null;
}

/**
 * Perform a controlled, subtle tick update on stations to simulate live telemetric drift.
 */
export function tickSimulatedTelemetry(stations) {
  return stations.map(station => {
    // Keep CRITICAL and explicit WARNING stations relatively stable during demo
    if (station.status === "CRITICAL") return station;

    // Small controlled micro-drift for realism (+-0.05° tilt, +-0.1mm disp)
    const tiltDrift = (Math.random() - 0.48) * 0.08;
    const dispDrift = (Math.random() - 0.48) * 0.12;

    let newTilt = Math.max(0.5, +(station.tilt + tiltDrift).toFixed(1));
    let newDisp = Math.max(0.8, +(station.displacement + dispDrift).toFixed(1));

    // Re-analyze offline AI for this station
    const aiResult = analyzeStationOffline({
      ...station,
      tilt: newTilt,
      displacement: newDisp
    });

    const updatedHistory = [...station.history];
    if (updatedHistory.length > 0) {
      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      updatedHistory.shift();
      updatedHistory.push({
        time: nowTime,
        tilt: newTilt,
        displacement: newDisp,
        riskScore: aiResult.riskScore
      });
    }

    const updatedStation = {
      ...station,
      tilt: newTilt,
      displacement: newDisp,
      riskScore: aiResult.riskScore,
      status: aiResult.status,
      history: updatedHistory,
      lastSync: "Just now"
    };

    // Optionally sync telemetry tick to backend
    syncStationToBackend(updatedStation);

    return updatedStation;
  });
}

/**
 * Trigger the explicit "SIMULATE RISK EVENT" demonstration flow.
 * Escalates a safe/warning station into an active anomaly / critical state step-by-step.
 */
export function triggerSimulatedRiskEvent(stations, onEventTriggered) {
  // Find candidates (prefer safe or mild warning stations)
  const candidates = stations.filter(s => s.status !== "CRITICAL");
  const target = candidates.length > 0
    ? candidates[Math.floor(Math.random() * candidates.length)]
    : stations[0];

  // Escalate values into CRITICAL threshold
  const escalatedTilt = +(4.8 + Math.random() * 1.5).toFixed(1);
  const escalatedDisp = +(12.5 + Math.random() * 4.0).toFixed(1);
  const vibration = "High";
  const crackStatus = "Detected";

  const aiResult = analyzeStationOffline({
    ...target,
    tilt: escalatedTilt,
    displacement: escalatedDisp,
    vibration,
    crackStatus
  });

  const updatedStations = stations.map(s => {
    if (s.id === target.id) {
      const updatedHistory = [...s.history];
      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      updatedHistory.shift();
      updatedHistory.push({
        time: nowTime,
        tilt: escalatedTilt,
        displacement: escalatedDisp,
        riskScore: aiResult.riskScore
      });

      const updatedTarget = {
        ...s,
        tilt: escalatedTilt,
        displacement: escalatedDisp,
        vibration,
        crackStatus,
        status: aiResult.status,
        riskScore: aiResult.riskScore,
        history: updatedHistory,
        lastSync: "Just now"
      };

      // Sync escalated anomaly to backend
      syncStationToBackend(updatedTarget);

      return updatedTarget;
    }
    return s;
  });

  const newAlert = {
    id: `alt-${Date.now()}`,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    station: target.id,
    panel: target.panel,
    severity: "critical",
    sensor: "Multi-Sensor Fusion (Tilt + Displacement)",
    riskScore: aiResult.riskScore,
    message: `High deformation anomaly detected at ${target.id} (${target.panel}). Tilt: ${escalatedTilt}°, Displacement: ${escalatedDisp}mm. Crack detected!`,
    acknowledged: false
  };

  const eventLogItem = {
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    message: `AI detected critical anomaly at ${target.id} (${target.panel}) — Risk Score ${aiResult.riskScore}/100`,
    type: "CRITICAL"
  };

  if (onEventTriggered) {
    onEventTriggered(target.id, newAlert, eventLogItem);
  }

  return {
    updatedStations,
    targetStationId: target.id,
    newAlert,
    eventLogItem
  };
}
