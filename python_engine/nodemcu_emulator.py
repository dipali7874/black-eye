"""
BLACK EYE — SIH26025
NodeMCU Hardware Simulator / Emulator in Python
Simulates an ESP8266 / ESP32 NodeMCU transmitting real sensor telemetry to the Node.js backend.
"""

import time
import json
import random
import sys

if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

try:
    import requests
except ImportError:
    print("❌ 'requests' package not found. Run: pip install requests")
    sys.exit(1)

BACKEND_URL = "http://localhost:5000/api/nodemcu"

def send_telemetry_packet(station_id="S-001", tilt=1.2, displacement=2.4, vibration="Normal", gas_ppm=165, crack_status="Normal", battery=98, rssi=-60):
    payload = {
        "station_id": station_id,
        "tilt": round(tilt, 2),
        "displacement": round(displacement, 2),
        "vibration": vibration,
        "gas_ppm": gas_ppm,
        "gas_status": "Hazardous Gas Detected" if gas_ppm > 650 else ("Elevated Gas" if gas_ppm > 400 else "Normal"),
        "crack_status": crack_status,
        "battery": battery,
        "signal_rssi": rssi,
        "timestamp": int(time.time())
    }
    
    try:
        print(f"\n📡 [NodeMCU {station_id}] Sending HTTP POST -> {BACKEND_URL}")
        print(f"📦 Payload: Tilt={payload['tilt']}°, Disp={payload['displacement']}mm, Vib={payload['vibration']}, RSSI={payload['signal_rssi']}dBm")
        
        res = requests.post(BACKEND_URL, json=payload, timeout=3)
        if res.status_code == 200:
            data = res.json()
            print(f"✅ [NodeMCU {station_id}] Ack: Status={data.get('status')}, Risk Score={data.get('risk_score')}, Hazard={data.get('hazard_level')}")
            return data
        else:
            print(f"⚠️ [NodeMCU {station_id}] Backend responded with status {res.status_code}: {res.text}")
    except requests.exceptions.ConnectionError:
        print(f"❌ [NodeMCU {station_id}] Could not connect to Node.js backend at {BACKEND_URL}. Ensure 'npm run server' is running!")
    except Exception as e:
        print(f"❌ [NodeMCU {station_id}] Error sending packet: {e}")
    return None

def run_continuous_simulation(station_id="S-001", interval_sec=3):
    print("=" * 65)
    print(f"🛰️  BLACK EYE — NodeMCU ESP8266 Hardware Simulator Active")
    print(f"📍 Simulating Station: {station_id}")
    print(f"⏱️  Transmitting every {interval_sec} seconds. Press Ctrl+C to stop.")
    print("=" * 65)

    base_tilt = 1.2
    base_disp = 2.4
    battery = 98

    step = 0
    try:
        while True:
            step += 1
            # Realistic small sensor noise
            noise_tilt = random.uniform(-0.08, 0.08)
            noise_disp = random.uniform(-0.12, 0.12)
            rssi = random.randint(-68, -55)
            
            cur_tilt = max(0.2, base_tilt + noise_tilt)
            cur_disp = max(0.5, base_disp + noise_disp)

            # Every 15 steps, simulate a small vibration blip
            vib = "Elevated" if (step % 12 == 0) else "Normal"

            send_telemetry_packet(
                station_id=station_id,
                tilt=cur_tilt,
                displacement=cur_disp,
                vibration=vib,
                crack_status="Normal",
                battery=battery,
                rssi=rssi
            )
            time.sleep(interval_sec)
    except KeyboardInterrupt:
        print("\n⏹️ Simulator stopped by user.")

def trigger_subsidence_anomaly(station_id="S-001"):
    print("\n🚨 Simulating CRITICAL Subsidence Fault on NodeMCU sensor rig...")
    send_telemetry_packet(
        station_id=station_id,
        tilt=5.4,
        displacement=16.8,
        vibration="High",
        gas_ppm=780,
        crack_status="Severe",
        battery=88,
        rssi=-78
    )

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--anomaly":
        trigger_subsidence_anomaly()
    else:
        run_continuous_simulation()
