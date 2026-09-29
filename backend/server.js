import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import {
  initDatabase,
  isMysqlConnected,
  getAllStations,
  upsertStation,
  insertTelemetryLog,
  getTelemetryHistory,
  getAllAlerts,
  insertAlert,
  acknowledgeAlert,
  getSystemSetting,
  setSystemSetting
} from "./db/connection.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config();

const PORT = parseInt(process.env.BACKEND_PORT || "5000", 10);
const PYTHON_AI_URL = process.env.PYTHON_AI_URL || "http://localhost:8001";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Track connected socket clients
let connectedClientsCount = 0;
let lastNodeMcuPacketTime = null;
let lastNodeMcuStation = null;

// Initialize DB on launch
await initDatabase();

// -------------------------------------------------------------
// AI Prediction Helper (Calls Python AI or fast internal fallback)
// -------------------------------------------------------------
async function evaluateRiskWithAi(telemetry) {
  try {
    const res = await axios.post(`${PYTHON_AI_URL}/predict`, {
      station_id: telemetry.station_id || telemetry.id || "S-001",
      tilt: parseFloat(telemetry.tilt) || 0.0,
      displacement: parseFloat(telemetry.displacement) || 0.0,
      vibration: telemetry.vibration || "Normal",
      gas_ppm: parseInt(telemetry.gas_ppm || telemetry.gasLevel || 150, 10),
      crack_status: telemetry.crack_status || telemetry.crackStatus || "Normal",
      battery: telemetry.battery || 100,
      signal_rssi: telemetry.signal_rssi || telemetry.signal || -65
    }, { timeout: 1200 });

    if (res.data && res.data.risk_score !== undefined) {
      return {
        riskScore: res.data.risk_score,
        hazardLevel: res.data.hazard_level,
        subsidenceVelocity: res.data.subsidence_velocity_mm_hr,
        factors: res.data.factors,
        recommendation: res.data.recommendation,
        engine: "Python Geotechnical AI (Port 8001)"
      };
    }
  } catch (err) {
    // Python service offline; fallback to native calculation
  }

  // Built-in Explainable Weighted Fallback Engine
  const tilt = parseFloat(telemetry.tilt) || 0.0;
  const disp = parseFloat(telemetry.displacement) || 0.0;
  const vib = (telemetry.vibration || "Normal").toLowerCase();
  const crack = (telemetry.crack_status || telemetry.crackStatus || "Normal").toLowerCase();

  const tiltScore = Math.min(100, (tilt / 4.5) * 100);
  const dispScore = Math.min(100, (disp / 12.0) * 100);
  const vibScore = vib === "high" ? 90 : (vib === "elevated" ? 60 : 15);
  const crackScore = crack === "severe" ? 95 : (crack === "detected" ? 75 : 10);

  const rawRisk = Math.round((tiltScore * 0.35) + (dispScore * 0.35) + (vibScore * 0.15) + (crackScore * 0.15));
  const riskScore = Math.min(100, Math.max(0, rawRisk));

  let hazard = "SAFE";
  if (riskScore >= 80 || disp >= 14.0 || tilt >= 5.0) hazard = "CRITICAL";
  else if (riskScore >= 60 || disp >= 8.0 || tilt >= 3.2) hazard = "WARNING";
  else if (riskScore >= 30) hazard = "ANOMALY";

  return {
    riskScore,
    hazardLevel: hazard,
    subsidenceVelocity: +(disp * 0.12).toFixed(2),
    engine: "Built-in Node.js Weighted Fallback"
  };
}

// -------------------------------------------------------------
// REST API Endpoints
// -------------------------------------------------------------

// System Health & Status
app.get("/api/health", async (req, res) => {
  let pyStatus = "OFFLINE";
  try {
    const pCheck = await axios.get(`${PYTHON_AI_URL}/health`, { timeout: 800 });
    if (pCheck.status === 200) pyStatus = "ONLINE";
  } catch {}

  const currentMode = await getSystemSetting("system_mode", "DEMO");

  res.json({
    status: "HEALTHY",
    service: "BLACK EYE Node.js Core Backend",
    port: PORT,
    database: {
      type: "MySQL",
      connected: isMysqlConnected(),
      name: process.env.DB_NAME || "blackeye_db"
    },
    pythonAi: {
      status: pyStatus,
      url: PYTHON_AI_URL
    },
    systemMode: currentMode,
    nodeMcuLastSync: lastNodeMcuPacketTime,
    nodeMcuLastStation: lastNodeMcuStation,
    connectedWebClients: connectedClientsCount
  });
});

// System Mode Management (DEMO vs HARDWARE)
app.get("/api/mode", async (req, res) => {
  const mode = await getSystemSetting("system_mode", "DEMO");
  res.json({
    mode,
    isMysqlConnected: isMysqlConnected(),
    lastNodeMcuPacket: lastNodeMcuPacketTime
  });
});

app.post("/api/mode", async (req, res) => {
  const { mode } = req.body;
  if (mode !== "DEMO" && mode !== "HARDWARE") {
    return res.status(400).json({ error: "Invalid mode. Use 'DEMO' or 'HARDWARE'." });
  }

  await setSystemSetting("system_mode", mode);
  console.log(`🔄 System mode changed to: [${mode}]`);

  // Broadcast to all frontend clients
  io.emit("mode_changed", { mode });

  res.json({ status: "success", mode });
});

// Fetch Stations
app.get("/api/nodes", async (req, res) => {
  try {
    const mineId = req.query.mine_id || null;
    const currentMode = req.query.mode || await getSystemSetting("system_mode", "DEMO");
    let stations = await getAllStations(mineId);

    // If HARDWARE mode requested, only return genuine physical hardware nodes
    if (currentMode === "HARDWARE") {
      stations = stations.filter(s => s.id === "S-001" || s.isHardware || s.is_hardware);
    }

    res.json({ count: stations.length, nodes: stations });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch Telemetry History for a Station
app.get("/api/telemetry/history/:stationId", async (req, res) => {
  try {
    const { stationId } = req.params;
    const limit = req.query.limit || 50;
    const history = await getTelemetryHistory(stationId, limit);
    res.json({ station_id: stationId, count: history.length, history });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch Alerts
app.get("/api/alerts", async (req, res) => {
  try {
    const currentMode = req.query.mode || await getSystemSetting("system_mode", "DEMO");
    let alerts = await getAllAlerts();

    // If HARDWARE mode, only return alerts from real hardware stations
    if (currentMode === "HARDWARE") {
      alerts = alerts.filter(a => a.station === "S-001" || a.isHardware || a.source === "nodemcu");
    }

    res.json({ count: alerts.length, alerts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Acknowledge Alert
app.post("/api/alerts/ack/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await acknowledgeAlert(id);
    io.emit("alert_acknowledged", { id });
    res.json({ status: "success", acknowledged_id: id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Core Ingestion Endpoint for NodeMCU ESP8266/ESP32 & General Telemetry
app.post(["/api/nodemcu", "/api/telemetry"], async (req, res) => {
  try {
    const raw = req.body;
    const stationId = raw.station_id || raw.id || "S-001";
    const tilt = parseFloat(raw.tilt) || 0.0;
    const displacement = parseFloat(raw.displacement) || 0.0;
    const vibration = raw.vibration || "Normal";
    const gasPpm = parseInt(raw.gas_ppm || raw.gasLevel || 150, 10);
    const gasStatus = raw.gas_status || (gasPpm > 650 ? "Hazardous Gas Detected" : (gasPpm > 400 ? "Elevated Gas" : "Normal"));
    const crackStatus = raw.crack_status || raw.crackStatus || "Normal";
    const battery = raw.battery !== undefined ? parseInt(raw.battery, 10) : 98;
    const signalRssi = raw.signal_rssi !== undefined ? parseInt(raw.signal_rssi, 10) : (raw.signal || -62);
    const source = raw.source || "nodemcu";

    // 1. Evaluate Risk through AI Engine
    const aiResult = await evaluateRiskWithAi({
      station_id: stationId,
      tilt,
      displacement,
      vibration,
      gas_ppm: gasPpm,
      crack_status: crackStatus,
      battery,
      signal_rssi: signalRssi
    });

    const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // 2. Fetch existing station data to append history
    const allStations = await getAllStations();
    let currentStation = allStations.find(s => s.id === stationId);

    const historyPoint = {
      time: nowTime,
      tilt,
      displacement,
      riskScore: aiResult.riskScore
    };

    let updatedHistory = currentStation?.history ? [...currentStation.history] : [];
    updatedHistory.push(historyPoint);
    if (updatedHistory.length > 25) updatedHistory.shift();

    const stationPayload = {
      id: stationId,
      name: currentStation?.name || `NodeMCU Station ${stationId}`,
      mine_id: currentStation?.mine_id || "jharkhand",
      lat: currentStation?.lat || 23.7512,
      lng: currentStation?.lng || 86.4215,
      status: aiResult.hazardLevel,
      tilt,
      displacement,
      vibration,
      gas_ppm: gasPpm,
      gas_status: gasStatus,
      crack_status: crackStatus,
      battery,
      signal_rssi: signalRssi,
      risk_score: aiResult.riskScore,
      panel: currentStation?.panel || "Primary Sensor Rig",
      lastSync: "Just now",
      is_hardware: true,
      history: updatedHistory
    };

    // 3. Upsert to MySQL & Log Telemetry
    await upsertStation(stationPayload);
    await insertTelemetryLog({
      station_id: stationId,
      tilt,
      displacement,
      vibration,
      crack_status: crackStatus,
      battery,
      signal_rssi: signalRssi,
      risk_score: aiResult.riskScore,
      status: aiResult.hazardLevel,
      source
    });

    // 4. Update NodeMCU stats
    lastNodeMcuPacketTime = new Date().toISOString();
    lastNodeMcuStation = stationId;

    // 5. If Critical or Warning anomaly, generate alert
    let createdAlert = null;
    if (aiResult.hazardLevel === "CRITICAL" || aiResult.hazardLevel === "WARNING") {
      createdAlert = {
        id: `alt-${Date.now()}`,
        station: stationId,
        panel: stationPayload.panel,
        severity: aiResult.hazardLevel.toLowerCase(),
        sensor: "Multi-Sensor Fusion (NodeMCU ESP8266)",
        riskScore: aiResult.riskScore,
        message: `${aiResult.hazardLevel} deformation event recorded at ${stationId}. Tilt: ${tilt}°, Disp: ${displacement}mm, Vib: ${vibration}. AI Advice: ${aiResult.recommendation || 'Evacuate hazard zone.'}`,
        acknowledged: false,
        created_at: new Date().toISOString()
      };
      await insertAlert(createdAlert);
      io.emit("new_alert", createdAlert);
    }

    // 6. Push real-time telemetry update to all connected React dashboards
    io.emit("telemetry_update", {
      station: stationPayload,
      alert: createdAlert,
      source
    });

    res.json({
      status: "success",
      station_id: stationId,
      risk_score: aiResult.riskScore,
      hazard_level: aiResult.hazardLevel,
      engine: aiResult.engine,
      recorded_at: new Date().toISOString()
    });
  } catch (err) {
    console.error("❌ Error processing NodeMCU packet:", err);
    res.status(500).json({ error: err.message });
  }
});

// Demo Event Simulator Endpoint
app.post("/api/simulate/risk", async (req, res) => {
  try {
    const stations = await getAllStations();
    const candidate = stations.find(s => s.status !== "CRITICAL") || stations[0];
    if (!candidate) return res.status(404).json({ error: "No stations available." });

    const escalatedTilt = +(4.8 + Math.random() * 1.5).toFixed(1);
    const escalatedDisp = +(12.8 + Math.random() * 4.0).toFixed(1);

    const aiResult = await evaluateRiskWithAi({
      station_id: candidate.id,
      tilt: escalatedTilt,
      displacement: escalatedDisp,
      vibration: "High",
      crack_status: "Detected"
    });

    const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const updatedHistory = [...(candidate.history || [])];
    updatedHistory.push({ time: nowTime, tilt: escalatedTilt, displacement: escalatedDisp, riskScore: aiResult.riskScore });
    if (updatedHistory.length > 25) updatedHistory.shift();

    const updatedCandidate = {
      ...candidate,
      tilt: escalatedTilt,
      displacement: escalatedDisp,
      vibration: "High",
      crack_status: "Detected",
      status: aiResult.hazardLevel,
      risk_score: aiResult.riskScore,
      lastSync: "Just now",
      history: updatedHistory
    };

    await upsertStation(updatedCandidate);
    await insertTelemetryLog({
      station_id: candidate.id,
      tilt: escalatedTilt,
      displacement: escalatedDisp,
      vibration: "High",
      crack_status: "Detected",
      battery: candidate.battery,
      signal_rssi: candidate.signal || -65,
      risk_score: aiResult.riskScore,
      status: aiResult.hazardLevel,
      source: "simulation"
    });

    const newAlert = {
      id: `alt-${Date.now()}`,
      station: candidate.id,
      panel: candidate.panel,
      severity: "critical",
      sensor: "Multi-Sensor Fusion (Simulation)",
      riskScore: aiResult.riskScore,
      message: `Critical simulated ground movement at ${candidate.id} (${candidate.panel}). Displacement crossed 12mm threshold!`,
      acknowledged: false,
      created_at: new Date().toISOString()
    };

    await insertAlert(newAlert);
    io.emit("new_alert", newAlert);
    io.emit("telemetry_update", { station: updatedCandidate, alert: newAlert, source: "simulation" });

    res.json({
      status: "success",
      target_station_id: candidate.id,
      risk_score: aiResult.riskScore,
      alert: newAlert
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// WebSockets (Socket.IO) Setup
// -------------------------------------------------------------
io.on("connection", (socket) => {
  connectedClientsCount++;
  console.log(`⚡ Client connected via WebSocket [id=${socket.id}]. Total active clients: ${connectedClientsCount}`);

  // Send current state to newly connected client
  getSystemSetting("system_mode", "DEMO").then(mode => {
    socket.emit("system_status", {
      mode,
      mysqlConnected: isMysqlConnected(),
      lastNodeMcuPacket: lastNodeMcuPacketTime,
      lastNodeMcuStation
    });
  });

  socket.on("disconnect", () => {
    connectedClientsCount = Math.max(0, connectedClientsCount - 1);
    console.log(`🔌 Client disconnected [id=${socket.id}]. Remaining clients: ${connectedClientsCount}`);
  });
});

// Start Server
server.listen(PORT, () => {
  console.log("=================================================");
  console.log(`🛰️  BLACK EYE Core Node.js Backend is RUNNING!`);
  console.log(`📡  HTTP & REST API:   http://localhost:${PORT}`);
  console.log(`⚡  Socket.IO:         ws://localhost:${PORT}`);
  console.log(`🗄️  Database:          MySQL (Port 3306)`);
  console.log(`🐍  Python AI Service: ${PYTHON_AI_URL}`);
  console.log("=================================================");
});
