-- BLACK EYE — SIH26025
-- MySQL Database Schema for IoT Mine Subsidence Monitoring System

CREATE DATABASE IF NOT EXISTS blackeye_db;
USE blackeye_db;

-- 1. Sensor Stations Master Table
CREATE TABLE IF NOT EXISTS stations (
  id VARCHAR(32) PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  mine_id VARCHAR(64) NOT NULL DEFAULT 'jharkhand',
  lat DOUBLE NOT NULL,
  lng DOUBLE NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'SAFE', -- SAFE, ANOMALY, WARNING, CRITICAL
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

-- 2. Time-Series Telemetry Logs (for historical graphs and ML training)
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
  source VARCHAR(32) DEFAULT 'simulation', -- 'nodemcu' or 'simulation'
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_station_time (station_id, recorded_at)
);

-- 3. Incident Alerts Table
CREATE TABLE IF NOT EXISTS alerts (
  id VARCHAR(64) PRIMARY KEY,
  station VARCHAR(32) NOT NULL,
  panel VARCHAR(128) NOT NULL,
  severity VARCHAR(32) NOT NULL DEFAULT 'warning', -- 'info', 'warning', 'critical'
  sensor VARCHAR(128) NOT NULL,
  risk_score INT NOT NULL DEFAULT 0,
  message TEXT NOT NULL,
  acknowledged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. System Settings (Demo vs Live Hardware mode, thresholds, active mine)
CREATE TABLE IF NOT EXISTS system_settings (
  setting_key VARCHAR(64) PRIMARY KEY,
  setting_value TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
