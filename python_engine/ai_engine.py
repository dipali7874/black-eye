"""
BLACK EYE — SIH26025
Python Geotechnical AI & Subsidence Risk Prediction Microservice
Runs on Port 8001
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
import math
import sys

if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

app = FastAPI(
    title="BLACK EYE Geotechnical AI Engine",
    description="SIH26025 AI-Powered Mine Subsidence Risk Evaluation & Velocity Forecasting",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TelemetryHistoryPoint(BaseModel):
    time: Optional[str] = None
    tilt: float
    displacement: float
    riskScore: Optional[int] = None

class PredictionRequest(BaseModel):
    station_id: str = "S-001"
    tilt: float = Field(..., description="Current tilt in degrees")
    displacement: float = Field(..., description="Current subsidence displacement in mm")
    vibration: Optional[str] = Field("Normal", description="Vibration status: Normal, Elevated, High, Critical")
    gas_ppm: Optional[int] = Field(150, description="Gas concentration raw ADC / PPM (MQ-2 / MQ-4 / MQ-135)")
    crack_status: Optional[str] = Field("Normal", description="Crack detection: Normal, Detected, Severe")
    battery: Optional[int] = 100
    signal_rssi: Optional[int] = -65
    history: Optional[List[TelemetryHistoryPoint]] = []

class PredictionResponse(BaseModel):
    station_id: str
    risk_score: int
    hazard_level: str  # SAFE, ANOMALY, WARNING, CRITICAL
    subsidence_velocity_mm_hr: float
    tilt_rate_deg_hr: float
    factors: Dict[str, float]
    recommendation: str
    evaluated_at: str

@app.get("/")
def root():
    return {
        "engine": "BLACK EYE Geotechnical AI Engine",
        "status": "ONLINE",
        "algorithm": "Explainable Weighted Geotechnical Anomaly & Subsidence Velocity Fusion",
        "port": 8001
    }

@app.get("/health")
def health():
    return {"status": "healthy", "service": "python-ai-engine", "timestamp": datetime.utcnow().isoformat()}

@app.post("/predict", response_model=PredictionResponse)
def predict_subsidence_risk(req: PredictionRequest):
    """
    Computes real-time geotechnical subsidence risk and deformation velocity
    from multi-sensor NodeMCU / simulation telemetry.
    """
    tilt = max(0.0, float(req.tilt))
    disp = max(0.0, float(req.displacement))
    vib_str = (req.vibration or "Normal").strip().lower()
    crack_str = (req.crack_status or "Normal").strip().lower()

    # 1. Tilt Factor (0 to 100): Normal threshold < 2.0°, Warning > 3.5°, Critical > 5.0°
    if tilt <= 1.5:
        tilt_score = (tilt / 1.5) * 25.0
    elif tilt <= 3.5:
        tilt_score = 25.0 + ((tilt - 1.5) / 2.0) * 40.0
    else:
        tilt_score = min(100.0, 65.0 + ((tilt - 3.5) / 2.5) * 35.0)

    # 2. Displacement Factor (0 to 100): Normal < 4.0mm, Warning > 8.0mm, Critical > 14.0mm
    if disp <= 4.0:
        disp_score = (disp / 4.0) * 25.0
    elif disp <= 10.0:
        disp_score = 25.0 + ((disp - 4.0) / 6.0) * 45.0
    else:
        disp_score = min(100.0, 70.0 + ((disp - 10.0) / 6.0) * 30.0)

    # 3. Vibration Factor (0 to 100)
    vib_map = {
        "normal": 10.0,
        "low": 15.0,
        "elevated": 55.0,
        "high": 85.0,
        "critical": 100.0
    }
    vib_score = vib_map.get(vib_str, 20.0)

    # 4. Crack Propagation Factor (0 to 100)
    crack_map = {
        "normal": 5.0,
        "minor": 30.0,
        "detected": 75.0,
        "severe": 98.0
    }
    crack_score = crack_map.get(crack_str, 10.0)

    # 4b. Mine Gas Factor (MQ-2 / MQ-4 / MQ-135, ADC 0-1023)
    gas_val = int(req.gas_ppm or 150)
    if gas_val <= 300:
        gas_score = 10.0
    elif gas_val <= 550:
        gas_score = 45.0
    elif gas_val <= 750:
        gas_score = 80.0
    else:
        gas_score = 100.0

    # 5. Subsidence Velocity & Tilt Velocity from History (if provided)
    subsidence_velocity = 0.0
    tilt_velocity = 0.0
    if req.history and len(req.history) >= 2:
        prev = req.history[-1]
        delta_d = abs(disp - prev.displacement)
        delta_t = abs(tilt - prev.tilt)
        # Assume 1-minute interval between consecutive packets for velocity estimate (scaled to mm/hr)
        subsidence_velocity = round(delta_d * 60.0, 2)
        tilt_velocity = round(delta_t * 60.0, 2)
    else:
        subsidence_velocity = round(disp * 0.15, 2)
        tilt_velocity = round(tilt * 0.1, 2)

    # Dynamic boost if velocity is alarming (> 5 mm/hr) or gas is dangerous (> 600)
    velocity_boost = min(20.0, (subsidence_velocity / 5.0) * 10.0) if subsidence_velocity > 2.0 else 0.0
    gas_boost = 25.0 if gas_val >= 650 else (12.0 if gas_val >= 450 else 0.0)

    # 6. Weighted Fusion Calculation (Weights calibrated to Indian Coal Mines DGMS Standards)
    # Tilt: 30%, Displacement: 30%, Vibration: 15%, Optical Crack: 10%, Gas: 15%
    raw_risk = (
        (tilt_score * 0.30) +
        (disp_score * 0.30) +
        (vib_score * 0.15) +
        (crack_score * 0.10) +
        (gas_score * 0.15) +
        velocity_boost +
        gas_boost
    )
    final_risk = int(min(100, max(0, round(raw_risk))))

    # 7. Hazard Classification
    if final_risk >= 80 or disp >= 14.0 or tilt >= 5.0 or crack_str == "severe" or gas_val >= 700:
        hazard = "CRITICAL"
        recommendation = "IMMEDIATE EVACUATION: Critical ground movement or hazardous mine gas detected! Stop underground operations."
    elif final_risk >= 60 or disp >= 8.0 or tilt >= 3.2 or crack_str == "detected" or gas_val >= 500:
        hazard = "WARNING"
        recommendation = "ELEVATED VIGILANCE: Elevated gas concentration or accelerated surface displacement. Dispatch inspection crew."
    elif final_risk >= 30:
        hazard = "ANOMALY"
        recommendation = "ADVISORY: Minor baseline drift or gas elevation. Increase telemetry polling frequency."
    else:
        hazard = "SAFE"
        recommendation = "STABLE: Overburden strata and surface inclination within permissible safety limits."

    return PredictionResponse(
        station_id=req.station_id,
        risk_score=final_risk,
        hazard_level=hazard,
        subsidence_velocity_mm_hr=subsidence_velocity,
        tilt_rate_deg_hr=tilt_velocity,
        factors={
            "tilt_factor": round(tilt_score, 1),
            "displacement_factor": round(disp_score, 1),
            "vibration_factor": round(vib_score, 1),
            "crack_factor": round(crack_score, 1),
            "velocity_boost": round(velocity_boost, 1)
        },
        recommendation=recommendation,
        evaluated_at=datetime.utcnow().isoformat()
    )

if __name__ == "__main__":
    import uvicorn
    print("🚀 Launching BLACK EYE Python AI Engine on http://localhost:8001 ...")
    uvicorn.run(app, host="0.0.0.0", port=8001)
