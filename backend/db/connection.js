import mysql from "mysql2/promise";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { DEFAULT_STATIONS } from "./defaultStations.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config(); // Also load local if present

const DB_CONFIG = {
  host: process.env.DB_HOST || "127.0.0.1",
  port: parseInt(process.env.DB_PORT || "3306", 10),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : "",
  database: process.env.DB_NAME || "blackeye_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let pool = null;
let useMemoryFallback = false;

// In-memory fallback stores in case MySQL credentials are not yet set
const memoryDb = {
  stations: new Map(),
  telemetryLogs: [],
  alerts: [
    {
      id: "alt-101",
      station: "S-012",
      panel: "Goaf Area, Panel 3",
      severity: "critical",
      sensor: "Multi-Sensor Fusion",
      risk_score: 86,
      message: "Potential high deformation anomaly detected. Displacement crossed 14mm threshold.",
      acknowledged: false,
      created_at: new Date().toISOString()
    },
    {
      id: "alt-102",
      station: "S-007",
      panel: "Longwall Face, Shaft 2",
      severity: "warning",
      sensor: "Tilt Sensor",
      risk_score: 64,
      message: "Increasing tilt angle trend detected (2.8°).",
      acknowledged: false,
      created_at: new Date().toISOString()
    }
  ],
  settings: new Map([
    ["system_mode", "DEMO"],
    ["active_mine", "jharkhand"]
  ])
};

// Seed memory DB
DEFAULT_STATIONS.forEach(s => {
  const history = [
    { time: "10:00", tilt: +(s.tilt - 0.1).toFixed(1), displacement: +(s.displacement - 0.2).toFixed(1), riskScore: s.risk_score },
    { time: "11:00", tilt: s.tilt, displacement: s.displacement, riskScore: s.risk_score }
  ];
  memoryDb.stations.set(s.id, { ...s, history });
});

export async function initDatabase() {
  try {
    console.log(`🔌 Attempting MySQL connection to ${DB_CONFIG.host}:${DB_CONFIG.port} as '${DB_CONFIG.user}'...`);

    // 1. First connect without DB to ensure database exists
    const adminConn = await mysql.createConnection({
      host: DB_CONFIG.host,
      port: DB_CONFIG.port,
      user: DB_CONFIG.user,
      password: DB_CONFIG.password
    });

    await adminConn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_CONFIG.database}\`;`);
    await adminConn.end();

    // 2. Create pool with target database
    pool = mysql.createPool(DB_CONFIG);

    // Test connection
    const testConn = await pool.getConnection();
    console.log(`✅ Connected successfully to MySQL database: [${DB_CONFIG.database}]`);
    testConn.release();

    // 3. Create Tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS stations (
        id VARCHAR(32) PRIMARY KEY,
        name VARCHAR(128) NOT NULL,
        mine_id VARCHAR(64) NOT NULL DEFAULT 'jharkhand',
        lat DOUBLE NOT NULL,
        lng DOUBLE NOT NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'SAFE',
        tilt DOUBLE NOT NULL DEFAULT 0.0,
        displacement DOUBLE NOT NULL DEFAULT 0.0,
        vibration VARCHAR(64) NOT NULL DEFAULT 'Normal',
        crack_status VARCHAR(64) NOT NULL DEFAULT 'Normal',
        battery INT NOT NULL DEFAULT 100,
        signal_rssi INT NOT NULL DEFAULT -65,
        risk_score INT NOT NULL DEFAULT 0,
        panel VARCHAR(128) NOT NULL DEFAULT 'General Panel',
        last_sync VARCHAR(64) DEFAULT 'Just now',
        is_hardware BOOLEAN DEFAULT FALSE,
        history_json LONGTEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS telemetry_logs (
        log_id BIGINT AUTO_INCREMENT PRIMARY KEY,
        station_id VARCHAR(32) NOT NULL,
        tilt DOUBLE NOT NULL,
        displacement DOUBLE NOT NULL,
        vibration VARCHAR(64) DEFAULT 'Normal',
        crack_status VARCHAR(64) DEFAULT 'Normal',
        battery INT DEFAULT 100,
        signal_rssi INT DEFAULT -65,
        risk_score INT DEFAULT 0,
        status VARCHAR(32) DEFAULT 'SAFE',
        source VARCHAR(32) DEFAULT 'simulation',
        recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_station_time (station_id, recorded_at)
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS alerts (
        id VARCHAR(64) PRIMARY KEY,
        station VARCHAR(32) NOT NULL,
        panel VARCHAR(128) NOT NULL,
        severity VARCHAR(32) NOT NULL DEFAULT 'warning',
        sensor VARCHAR(128) NOT NULL,
        risk_score INT NOT NULL DEFAULT 0,
        message TEXT NOT NULL,
        acknowledged BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        setting_key VARCHAR(64) PRIMARY KEY,
        setting_value TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

    // 4. Seed initial stations if table is empty
    const [rows] = await pool.query("SELECT COUNT(*) AS cnt FROM stations");
    if (rows[0].cnt === 0) {
      console.log("🌱 Seeding default Indian coalfield stations into MySQL...");
      for (const st of DEFAULT_STATIONS) {
        const hist = [
          { time: "10:00", tilt: +(st.tilt - 0.1).toFixed(1), displacement: +(st.displacement - 0.2).toFixed(1), riskScore: st.risk_score },
          { time: "11:00", tilt: st.tilt, displacement: st.displacement, riskScore: st.risk_score }
        ];
        await pool.query(`
          INSERT INTO stations (id, name, mine_id, lat, lng, status, tilt, displacement, vibration, crack_status, battery, signal_rssi, risk_score, panel, last_sync, is_hardware, history_json)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          st.id, st.name, st.mine_id, st.lat, st.lng, st.status, st.tilt, st.displacement,
          st.vibration, st.crack_status, st.battery, st.signal_rssi, st.risk_score, st.panel,
          "Just now", st.is_hardware, JSON.stringify(hist)
        ]);
      }
      console.log("✨ Seeded 24 coalfield stations into MySQL successfully.");
    }

    // Seed default settings
    await pool.query(`
      INSERT INTO system_settings (setting_key, setting_value)
      VALUES ('system_mode', 'DEMO'), ('active_mine', 'jharkhand')
      ON DUPLICATE KEY UPDATE setting_key=setting_key;
    `);

    useMemoryFallback = false;
    return true;
  } catch (err) {
    console.warn("\n⚠️ ========================================================");
    console.warn("⚠️ MySQL Connection Notice:");
    console.warn(`⚠️ Error: ${err.message} (${err.code || 'UNKNOWN'})`);
    console.warn("⚠️ To connect to your local MySQL database, please specify your password in .env:");
    console.warn("⚠️   DB_USER=root");
    console.warn("⚠️   DB_PASSWORD=your_mysql_password_here");
    console.warn("⚠️ Switching seamlessly to high-speed Memory DB Fallback so BLACK EYE stays online!");
    console.warn("⚠️ ========================================================\n");
    useMemoryFallback = true;
    return false;
  }
}

export function isMysqlConnected() {
  return !useMemoryFallback && pool !== null;
}

// -------------------------------------------------------------
// Database Operations (Abstracted for MySQL with Memory Fallback)
// -------------------------------------------------------------

export async function getAllStations(mineId = null) {
  if (isMysqlConnected()) {
    let sql = "SELECT * FROM stations";
    const params = [];
    if (mineId) {
      sql += " WHERE mine_id = ?";
      params.push(mineId);
    }
    sql += " ORDER BY id ASC";
    const [rows] = await pool.query(sql, params);
    return rows.map(r => ({
      ...r,
      isHardware: Boolean(r.is_hardware),
      signal: r.signal_rssi,
      riskScore: r.risk_score,
      crackStatus: r.crack_status,
      lastSync: r.last_sync,
      history: r.history_json ? JSON.parse(r.history_json) : []
    }));
  } else {
    let list = Array.from(memoryDb.stations.values());
    if (mineId) {
      list = list.filter(s => s.mine_id === mineId);
    }
    return list.map(s => ({
      ...s,
      isHardware: Boolean(s.is_hardware),
      signal: s.signal_rssi || s.signal || -65,
      riskScore: s.risk_score || s.riskScore || 0,
      crackStatus: s.crack_status || s.crackStatus || "Normal",
      lastSync: s.last_sync || s.lastSync || "Just now"
    }));
  }
}

export async function upsertStation(station) {
  const historyJson = JSON.stringify(station.history || []);
  const signal = station.signal || station.signal_rssi || -65;
  const riskScore = station.riskScore !== undefined ? station.riskScore : (station.risk_score || 0);
  const crackStatus = station.crackStatus || station.crack_status || "Normal";
  const isHw = Boolean(station.isHardware || station.is_hardware);

  if (isMysqlConnected()) {
    await pool.query(`
      INSERT INTO stations (id, name, mine_id, lat, lng, status, tilt, displacement, vibration, crack_status, battery, signal_rssi, risk_score, panel, last_sync, is_hardware, history_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        status = VALUES(status),
        tilt = VALUES(tilt),
        displacement = VALUES(displacement),
        vibration = VALUES(vibration),
        crack_status = VALUES(crack_status),
        battery = VALUES(battery),
        signal_rssi = VALUES(signal_rssi),
        risk_score = VALUES(risk_score),
        last_sync = VALUES(last_sync),
        is_hardware = VALUES(is_hardware),
        history_json = VALUES(history_json),
        updated_at = CURRENT_TIMESTAMP
    `, [
      station.id, station.name || `Sensor Station ${station.id}`, station.mine_id || station.mineId || "jharkhand",
      station.lat || 23.7512, station.lng || 86.4215, station.status || "SAFE",
      station.tilt || 0.0, station.displacement || 0.0, station.vibration || "Normal",
      crackStatus, station.battery || 100, signal, riskScore, station.panel || "General Panel",
      station.lastSync || "Just now", isHw, historyJson
    ]);
  } else {
    const existing = memoryDb.stations.get(station.id) || {};
    memoryDb.stations.set(station.id, {
      ...existing,
      ...station,
      signal_rssi: signal,
      signal,
      risk_score: riskScore,
      riskScore,
      crack_status: crackStatus,
      crackStatus,
      is_hardware: isHw,
      isHardware: isHw,
      lastSync: "Just now"
    });
  }
}

export async function insertTelemetryLog(log) {
  if (isMysqlConnected()) {
    await pool.query(`
      INSERT INTO telemetry_logs (station_id, tilt, displacement, vibration, crack_status, battery, signal_rssi, risk_score, status, source)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      log.station_id, log.tilt, log.displacement, log.vibration || "Normal",
      log.crack_status || "Normal", log.battery || 100, log.signal_rssi || -65,
      log.risk_score || 0, log.status || "SAFE", log.source || "nodemcu"
    ]);
  } else {
    memoryDb.telemetryLogs.push({
      ...log,
      log_id: memoryDb.telemetryLogs.length + 1,
      recorded_at: new Date().toISOString()
    });
    // Keep max 2000 in memory
    if (memoryDb.telemetryLogs.length > 2000) memoryDb.telemetryLogs.shift();
  }
}

export async function getTelemetryHistory(stationId, limit = 50) {
  if (isMysqlConnected()) {
    const [rows] = await pool.query(`
      SELECT * FROM telemetry_logs WHERE station_id = ? ORDER BY recorded_at DESC LIMIT ?
    `, [stationId, parseInt(limit, 10)]);
    return rows.reverse();
  } else {
    return memoryDb.telemetryLogs
      .filter(l => l.station_id === stationId)
      .slice(-limit);
  }
}

export async function getAllAlerts() {
  if (isMysqlConnected()) {
    const [rows] = await pool.query("SELECT * FROM alerts ORDER BY created_at DESC LIMIT 50");
    return rows.map(r => ({
      ...r,
      riskScore: r.risk_score,
      acknowledged: Boolean(r.acknowledged)
    }));
  } else {
    return [...memoryDb.alerts].reverse();
  }
}

export async function insertAlert(alert) {
  const alertId = alert.id || `alt-${Date.now()}`;
  if (isMysqlConnected()) {
    await pool.query(`
      INSERT INTO alerts (id, station, panel, severity, sensor, risk_score, message, acknowledged)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      alertId, alert.station, alert.panel || "General Surface Panel",
      alert.severity || "warning", alert.sensor || "Multi-Sensor Fusion",
      alert.riskScore || alert.risk_score || 0, alert.message, Boolean(alert.acknowledged)
    ]);
  } else {
    memoryDb.alerts.push({
      ...alert,
      id: alertId,
      created_at: new Date().toISOString(),
      acknowledged: false
    });
  }
  return alertId;
}

export async function acknowledgeAlert(alertId) {
  if (isMysqlConnected()) {
    await pool.query("UPDATE alerts SET acknowledged = TRUE WHERE id = ?", [alertId]);
  } else {
    const a = memoryDb.alerts.find(item => item.id === alertId);
    if (a) a.acknowledged = true;
  }
}

export async function getSystemSetting(key, defaultVal = null) {
  if (isMysqlConnected()) {
    const [rows] = await pool.query("SELECT setting_value FROM system_settings WHERE setting_key = ?", [key]);
    return rows.length > 0 ? rows[0].setting_value : defaultVal;
  } else {
    return memoryDb.settings.has(key) ? memoryDb.settings.get(key) : defaultVal;
  }
}

export async function setSystemSetting(key, val) {
  if (isMysqlConnected()) {
    await pool.query(`
      INSERT INTO system_settings (setting_key, setting_value)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
    `, [key, String(val)]);
  } else {
    memoryDb.settings.set(key, String(val));
  }
}
