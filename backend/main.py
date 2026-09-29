"""
BLACK EYE — SIH26025
FastAPI + SQLite Real Telemetry Backend
Persists sensor node readings and provides query endpoints for telemetry feeds.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Any
import sqlite3
import json
import os
from datetime import datetime

app = FastAPI(title="BLACK EYE IoT Telemetry API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = os.path.join(os.path.dirname(__file__), "telemetry.db")

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS stations (
            id TEXT PRIMARY KEY,
            name TEXT,
            mine_id TEXT,
            lat REAL,
            lng REAL,
            status TEXT,
            tilt REAL,
            displacement REAL,
            vibration TEXT,
            crack_status TEXT,
            battery INTEGER,
            signal INTEGER,
            risk_score INTEGER,
            panel TEXT,
            last_sync TEXT,
            history_json TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS telemetry_logs (
            log_id INTEGER PRIMARY KEY AUTOINCREMENT,
            station_id TEXT,
            tilt REAL,
            displacement REAL,
            vibration TEXT,
            crack_status TEXT,
            risk_score INTEGER,
            status TEXT,
            recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()

init_db()

class HistoryPoint(BaseModel):
    time: str
    tilt: float
    displacement: float
    riskScore: Optional[int] = None

class StationTelemetry(BaseModel):
    id: str
    name: Optional[str] = None
    mineId: Optional[str] = "jharkhand"
    lat: Optional[float] = None
    lng: Optional[float] = None
    status: Optional[str] = "SAFE"
    tilt: float
    displacement: float
    vibration: Optional[str] = "Normal"
    crackStatus: Optional[str] = "Normal"
    battery: Optional[int] = 95
    signal: Optional[int] = 98
    riskScore: Optional[int] = 0
    panel: Optional[str] = "General Surface Panel"
    lastSync: Optional[str] = "Just now"
    history: Optional[List[HistoryPoint]] = []

@app.get("/")
def root():
    return {
        "system": "BLACK EYE IoT Telemetry Gateway",
        "status": "ONLINE",
        "version": "1.0.0",
        "endpoints": ["/nodes", "/telemetry", "/health"]
    }

@app.get("/health")
def health():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

@app.post("/telemetry")
def record_telemetry(data: StationTelemetry):
    conn = get_db()
    cursor = conn.cursor()
    
    history_json = json.dumps([h.dict() if hasattr(h, 'dict') else h.model_dump() for h in (data.history or [])])
    
    cursor.execute("""
        INSERT INTO stations (
            id, name, mine_id, lat, lng, status, tilt, displacement,
            vibration, crack_status, battery, signal, risk_score, panel, last_sync, history_json, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET
            name=COALESCE(excluded.name, stations.name),
            mine_id=COALESCE(excluded.mine_id, stations.mine_id),
            lat=COALESCE(excluded.lat, stations.lat),
            lng=COALESCE(excluded.lng, stations.lng),
            status=excluded.status,
            tilt=excluded.tilt,
            displacement=excluded.displacement,
            vibration=excluded.vibration,
            crack_status=excluded.crack_status,
            battery=excluded.battery,
            signal=excluded.signal,
            risk_score=excluded.risk_score,
            panel=COALESCE(excluded.panel, stations.panel),
            last_sync=excluded.last_sync,
            history_json=excluded.history_json,
            updated_at=CURRENT_TIMESTAMP
    """, (
        data.id,
        data.name or f"Sensor Station {data.id}",
        data.mineId,
        data.lat,
        data.lng,
        data.status,
        data.tilt,
        data.displacement,
        data.vibration,
        data.crackStatus,
        data.battery,
        data.signal,
        data.riskScore,
        data.panel,
        data.lastSync,
        history_json
    ))

    cursor.execute("""
        INSERT INTO telemetry_logs (station_id, tilt, displacement, vibration, crack_status, risk_score, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        data.id,
        data.tilt,
        data.displacement,
        data.vibration,
        data.crackStatus,
        data.riskScore,
        data.status
    ))

    conn.commit()
    conn.close()
    
    return {"status": "success", "station_id": data.id, "risk_score": data.riskScore}

@app.get("/nodes")
def get_nodes():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM stations ORDER BY id ASC")
    rows = cursor.fetchall()
    conn.close()

    nodes = []
    for r in rows:
        history = []
        if r["history_json"]:
            try:
                history = json.loads(r["history_json"])
            except Exception:
                history = []
        nodes.append({
            "id": r["id"],
            "name": r["name"],
            "mineId": r["mine_id"],
            "lat": r["lat"],
            "lng": r["lng"],
            "status": r["status"],
            "tilt": r["tilt"],
            "displacement": r["displacement"],
            "vibration": r["vibration"],
            "crackStatus": r["crack_status"],
            "battery": r["battery"],
            "signal": r["signal"],
            "riskScore": r["risk_score"],
            "panel": r["panel"],
            "lastSync": r["last_sync"],
            "history": history
        })
    return {"count": len(nodes), "nodes": nodes}
