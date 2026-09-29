# 🔌 BLACK EYE — NodeMCU ESP8266 / ESP32 Hardware Wiring & Setup Guide
### Smart India Hackathon 2026 • Problem Statement: SIH26025

This document details the exact hardware connections, sensor pin mappings, Arduino IDE configuration, and test steps to connect a physical **NodeMCU** sensor node to the **BLACK EYE Command Center**.

---

## 🛠️ Required Hardware Components

| Component | Purpose in Subsidence Monitoring | Communication Interface |
|---|---|---|
| **NodeMCU (ESP8266)** or **ESP32** | Main Microcontroller & Wi-Fi Gateway | Wi-Fi 802.11 b/g/n |
| **MPU-6050** | 3-Axis Accelerometer + Gyroscope (Ground Tilt in °) | I2C (`SCL`, `SDA`) |
| **HC-SR04** | Ultrasonic Distance Sensor (Ground Displacement in mm) | Digital I/O (`Trig`, `Echo`) |
| **SW-420 / 801S** | Micro-seismic vibration / rock fracture detection | Digital I/O (`DO`) |
| **MQ-2 / MQ-4 / MQ-135** | Mine Gas Sensor (Methane CH4, CO, Smoke toxic gas) | Analog (`AO`) / Digital (`DO`) |
| **Breadboard & Jumpers** | Prototyping rig wiring | Male-to-Female / Male-to-Male |
| **Micro-USB Cable** | Flashing & Powering the NodeMCU | 5V 1A DC |

---

## 📌 Pinout & Wiring Connections

### 1. NodeMCU ESP8266 Pin Connections (Matches Your Code)

```
                         +---------------------+
                         |   NodeMCU ESP8266   |
                         +----------+----------+
                                    |
  +--------------+------------------+-----------------+
  |              |                                    |
[MPU-6050]   [LED Indicator]                      [MQ-2 Gas]
(Tilt & Vib) (Pin D5)                             (Pin A0)
VCC -> 3V3   (+) Long Leg -> D5 (via 220Ω)        VCC -> VIN (5V)
GND -> GND   (-) Short Leg -> GND                 GND -> GND
SCL -> D1 (GPIO 5)                                AO  -> A0 (ADC0)
SDA -> D2 (GPIO 4)
```

### Detailed Wiring Table

| Component / Sensor | Sensor Pin | NodeMCU Pin | Function in Code |
|---|---|---|---|
| **MPU-6050 (Adafruit)** | `VCC` | `3V3` | Power (3.3V) |
| | `GND` | `GND` | Common Ground |
| | `SCL` | **`D1` (GPIO 5)** | I2C Clock (`Wire.begin(D2, D1)`) |
| | `SDA` | **`D2` (GPIO 4)** | I2C Data (`Wire.begin(D2, D1)`) |
| **MQ-2 Gas Sensor** | `VCC` | **`VIN` (5V)** | Needs 5V for heating coil |
| | `GND` | `GND` | Common Ground |
| | `AO` (Analog Out) | **`A0`** | Gas Concentration (`analogRead(A0)`) |
| **Alert LED** | Anode (+) | **`D5` (GPIO 14)** | Active HIGH alert LED |
| | Cathode (-) | `GND` | Ground (via 220Ω resistor) |

### Required Arduino IDE Libraries:
In Arduino IDE, go to **Sketch > Include Library > Manage Libraries...** and install:
1. **Adafruit MPU6050** by Adafruit
2. **Adafruit Unified Sensor** by Adafruit

> [!IMPORTANT]
> **Gas Sensor Power Requirement**:
> MQ-series gas sensors (MQ-2, MQ-4, MQ-135) contain an internal heating coil that requires **5V** to operate accurately. Always wire the Gas Sensor `VCC` to the NodeMCU **`VIN`** pin (which supplies 5V from USB), NOT the 3V3 pin.
> Give the gas sensor ~20-30 seconds to pre-heat when powered on for the first time.

> [!TIP]
> **Vibration Sensor Sensitivity Tuning**:
> The SW-420 module has a small onboard blue potentiometer. Use a small screwdriver to adjust the sensitivity so that the onboard LED flickers when you tap the surface, but stays off when idle.

---

## ⚡ Arduino IDE Setup Instructions

### Step 1: Install ESP8266 Board Support
1. Open **Arduino IDE**.
2. Go to **File > Preferences**.
3. In **Additional Boards Manager URLs**, paste:
   ```
   http://arduino.esp8266.com/stable/package_esp8266com_index.json
   ```
4. Go to **Tools > Board > Boards Manager...**, search for `esp8266` by *ESP8266 Community*, and click **Install**.

### Step 2: Configure Board Settings
- **Board**: `NodeMCU 1.0 (ESP-12E Module)` (or `DOIT ESP32 DEVKIT V1` if using ESP32)
- **Upload Speed**: `115200`
- **CPU Frequency**: `80 MHz` (or `160 MHz`)
- **Port**: Select the COM port corresponding to your connected USB cable (e.g. `COM3` or `COM5`).

### Step 3: Configure Wi-Fi & Backend IP in Code
Open `nodemcu/nodemcu_blackeye.ino`:
```cpp
const char* WIFI_SSID     = "YOUR_WIFI_NAME";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Replace with your PC's IP address (Run 'ipconfig' in Windows Command Prompt)
const char* SERVER_IP   = "192.168.1.10"; 
const int   SERVER_PORT = 5000;
```

### Step 4: Flash & Verify
1. Click **Upload** (Ctrl + U) in Arduino IDE.
2. After flashing finishes, open the **Serial Monitor** at **115200 baud**.
3. You will see:
   ```
   [WiFi] Connected successfully!
   [WiFi] NodeMCU IP: 192.168.1.45
   [Calibration] Baseline distance set to: 152.4 mm
   📡 Transmitting Sensor Telemetry to Backend: {"station_id":"S-001","tilt":1.20,"displacement":2.40,...}
   ✅ Backend Response [200]: {"status":"success","risk_score":18,...}
   ```
4. Look at your **BLACK EYE Dashboard** in your browser — the **NodeMCU Station S-001** and real-time live graphs will reflect the hardware's data instantly!

---

## 🧪 Testing Without Physical Hardware: Python Emulator

If your NodeMCU is not yet wired or plugged in, you can run the included Python hardware emulator to simulate real NodeMCU packets:
```bash
py python_engine/nodemcu_emulator.py
```
To test an emergency subsidence alert trigger:
```bash
py python_engine/nodemcu_emulator.py --anomaly
```
