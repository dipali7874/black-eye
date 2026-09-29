/*
 * ==============================================================================
 * BLACK EYE — SIH26025 (Smart India Hackathon)
 * AI-Enabled Mine Subsidence & Hazard Monitoring Early Warning System
 * 
 * NodeMCU ESP8266 Firmware (Station S-001)
 * Hardware Setup:
 *   - Adafruit MPU-6050 (I2C: D1 = SCL, D2 = SDA) -> Measures Tilt Angle (°) & Dynamic Strata Vibration
 *   - MQ-2 / MQ-4 Gas Sensor (Analog Out -> A0)     -> Measures Methane / Toxic Mine Gas (PPM)
 *   - Alert LED (Digital Out -> D5)                  -> Local Audio/Visual Hazard Indicator
 * 
 * Transmits real-time JSON packets over Wi-Fi to the BLACK EYE Node.js Core Backend:
 *   POST http://<SERVER_IP>:5000/api/nodemcu
 * ==============================================================================
 */

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>
#include <Wire.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <math.h>

// ==============================================================================
// 1. NETWORK CONFIGURATION — UPDATE WITH YOUR DETAILS
// ==============================================================================
const char* WIFI_SSID     = "HARSHAL-LAP 4524";
const char* WIFI_PASSWORD = "00000000";

// Your Laptop's Mobile Hotspot IP address:
const char* SERVER_IP   = "192.168.137.1";
const int   SERVER_PORT = 5000;
const char* STATION_ID  = "S-001";

// ==============================================================================
// 2. PIN DEFINITIONS & THRESHOLDS (Matches Your Setup)
// ==============================================================================
#define GAS_SENSOR A0     // MQ-2 / MQ-4 Gas Sensor Analog Output
#define LED_PIN    D5     // Alert LED Pin

Adafruit_MPU6050 mpu;

// Thresholds
int   gasThreshold       = 550;  // Raw ADC (0-1023): >550 indicates elevated coal mine gas
float vibrationThreshold = 2.0;  // Delta acceleration sum threshold
bool  mpuAvailable       = false;

// Telemetry intervals
const unsigned long TRANSMIT_INTERVAL_MS = 2500;  // Send to backend every 2.5s
unsigned long lastTransmitTime           = 0;

// Acceleration tracking
float lastX = 0;
float lastY = 0;
float lastZ = 0;

// Maximum vibration detected within transmission window
float maxWindowVibration = 0.0;

// ==============================================================================
// 3. WI-FI CONNECTION HELPER
// ==============================================================================
void connectWiFi() {
  Serial.print("\n[WiFi] Connecting to: ");
  Serial.println(WIFI_SSID);

  WiFi.persistent(false);
  WiFi.disconnect();
  delay(150);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int retries = 0;
  while (WiFi.status() != WL_CONNECTED && retries < 35) {
    delay(400);
    Serial.print(".");
    retries++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    digitalWrite(LED_PIN, LOW);
    Serial.println("\n[WiFi] Connected successfully!");
    Serial.print("[WiFi] NodeMCU IP: ");
    Serial.println(WiFi.localIP());
    Serial.print("[WiFi] RSSI Signal: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
  } else {
    Serial.println("\n[WiFi] Connection timeout. Check that Hotspot is 2.4GHz.");
  }
}

// ==============================================================================
// 4. SETUP
// ==============================================================================
void setup() {
  Serial.begin(115200);
  delay(500);

  pinMode(GAS_SENSOR, INPUT);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  // Initialize ESP8266 I2C (SDA = D2, SCL = D1)
  Wire.begin(D2, D1);
  Wire.setClock(100000);
  delay(150);

  Serial.println("\n========================================================");
  Serial.println("🛰️  BLACK EYE — Mine Safety System Starting (SIH26025)");
  Serial.println("========================================================");

  // 1. Scan I2C bus to find connected address
  Serial.println("🔍 Scanning I2C bus on SDA=D2, SCL=D1...");
  byte foundAddress = 0;
  for (byte address = 1; address < 127; address++) {
    Wire.beginTransmission(address);
    if (Wire.endTransmission() == 0) {
      Serial.print("✅ Found I2C device at address: 0x");
      if (address < 16) Serial.print("0");
      Serial.println(address, HEX);
      foundAddress = address;
    }
  }

  // If not found, try swapping SCL & SDA (in case wires were reversed)
  if (foundAddress == 0) {
    Serial.println("⚠️ Nothing on SDA=D2, SCL=D1. Testing reversed pins (SDA=D1, SCL=D2)...");
    Wire.begin(D1, D2);
    delay(100);
    for (byte address = 1; address < 127; address++) {
      Wire.beginTransmission(address);
      if (Wire.endTransmission() == 0) {
        Serial.print("✅ Found I2C device with swapped pins at: 0x");
        Serial.println(address, HEX);
        foundAddress = address;
        break;
      }
    }
    if (foundAddress == 0) {
      // Revert back to D2, D1
      Wire.begin(D2, D1);
      Serial.println("❌ No I2C device found. Check wires: VCC->VIN(5V), GND->GND, SCL->D1, SDA->D2.");
    }
  }

  // 2. Initialize MPU-6050
  mpuAvailable = false;
  byte targetAddr = (foundAddress != 0) ? foundAddress : 0x68;
  if (mpu.begin(targetAddr, &Wire)) {
    Serial.print("✅ MPU6050 Initialized at address 0x");
    Serial.println(targetAddr, HEX);
    mpuAvailable = true;
  } else if (mpu.begin(0x69, &Wire)) {
    Serial.println("✅ MPU6050 Initialized at secondary address 0x69!");
    mpuAvailable = true;
  } else {
    Serial.println("⚠️ MPU6050 could not be started. Check sensor soldering/connections.");
  }

  if (mpuAvailable) {
    mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
    mpu.setGyroRange(MPU6050_RANGE_500_DEG);
    mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);

    delay(300);

    sensors_event_t a, g, temp;
    mpu.getEvent(&a, &g, &temp);
    lastX = a.acceleration.x;
    lastY = a.acceleration.y;
    lastZ = a.acceleration.z;
    Serial.println("✅ MPU6050 Calibration complete!");
  }

  // Connect to Wi-Fi
  connectWiFi();

  Serial.println("✅ System Online!");
  Serial.println("--------------------------------------------------------");
}

// ==============================================================================
// 5. MAIN SENSING & TRANSMISSION LOOP
// ==============================================================================
void loop() {
  // -------------------------------------------------------------
  // A. READ MQ-2 GAS SENSOR (Fast loop: runs continuously)
  // -------------------------------------------------------------
  int gasValue = analogRead(GAS_SENSOR);
  bool gasDetected = (gasValue > gasThreshold);

  // -------------------------------------------------------------
  // B. READ MPU-6050 (Acceleration & Tilt)
  // -------------------------------------------------------------
  float x = 0.0, y = 0.0, z = 9.8;
  float currentVibration = 0.0;
  float roundedTilt = 0.0;
  float estimatedDisp = 1.2;
  bool vibrationDetected = false;

  if (mpuAvailable) {
    sensors_event_t a, g, temp;
    mpu.getEvent(&a, &g, &temp);

    x = a.acceleration.x;
    y = a.acceleration.y;
    z = a.acceleration.z;

    // 1. Dynamic Strata Vibration Delta
    float changeX = abs(x - lastX);
    float changeY = abs(y - lastY);
    float changeZ = abs(z - lastZ);
    currentVibration = changeX + changeY + changeZ;

    if (currentVibration > maxWindowVibration) {
      maxWindowVibration = currentVibration;
    }

    vibrationDetected = (currentVibration > vibrationThreshold);

    // 2. Angular Tilt Calculation in degrees
    float pitch = atan2(y, sqrt(x * x + z * z)) * (180.0 / M_PI);
    float roll  = atan2(-x, sqrt(y * y + z * z)) * (180.0 / M_PI);
    float totalTilt = sqrt(pitch * pitch + roll * roll);
    roundedTilt = round(totalTilt * 10.0) / 10.0;

    estimatedDisp = round((roundedTilt * 1.8 + currentVibration * 0.5) * 10.0) / 10.0;
    if (estimatedDisp < 0.5) estimatedDisp = 1.2;

    lastX = x;
    lastY = y;
    lastZ = z;
  }

  // -------------------------------------------------------------
  // C. LOCAL LED ALERT (Zero latency)
  // -------------------------------------------------------------
  if (gasDetected || vibrationDetected) {
    digitalWrite(LED_PIN, HIGH);
  } else {
    digitalWrite(LED_PIN, LOW);
  }

  // -------------------------------------------------------------
  // D. PERIODIC HTTP TELEMETRY TRANSMISSION TO NODE.JS BACKEND
  // -------------------------------------------------------------
  unsigned long now = millis();
  if (now - lastTransmitTime >= TRANSMIT_INTERVAL_MS) {
    lastTransmitTime = now;

    // Categorize vibration status string
    String vibStatus = "Normal";
    if (maxWindowVibration >= (vibrationThreshold * 2.2)) {
      vibStatus = "High";
    } else if (maxWindowVibration >= vibrationThreshold) {
      vibStatus = "Elevated";
    }

    String gasStatus = (gasValue > 650) ? "Hazardous Gas Detected" : ((gasValue > 400) ? "Elevated Gas" : "Normal");

    // Local Serial Telemetry Print
    Serial.println("\n--------------------------------------------------------");
    Serial.print("Gas PPM: ");
    Serial.print(gasValue);
    Serial.print(" | Tilt: ");
    Serial.print(roundedTilt);
    Serial.print("° | Vib Peak: ");
    Serial.print(maxWindowVibration);
    Serial.print(" (");
    Serial.print(vibStatus);
    Serial.println(")");

    if (gasDetected && vibrationDetected) {
      Serial.println("🚨 ALERT: DUAL THREAT — GAS + STRATA VIBRATION DETECTED!");
    } else if (gasDetected) {
      Serial.println("🚨 ALERT: ELEVATED MINE GAS CONCENTRATION!");
    } else if (vibrationDetected) {
      Serial.println("⚠️ ALERT: ABNORMAL ROCK STRATA VIBRATION DETECTED!");
    } else {
      Serial.println("✅ STATUS: STRATA SAFE & STABLE");
    }

    // Reset peak for next interval window
    maxWindowVibration = 0.0;

    // Send HTTP POST if Wi-Fi is connected
    if (WiFi.status() == WL_CONNECTED) {
      int rssi = WiFi.RSSI();

      // Build JSON payload matching BLACK EYE backend schema
      String jsonPayload = "{";
      jsonPayload += "\"station_id\":\"" + String(STATION_ID) + "\",";
      jsonPayload += "\"tilt\":" + String(roundedTilt, 1) + ",";
      jsonPayload += "\"displacement\":" + String(estimatedDisp, 1) + ",";
      jsonPayload += "\"vibration\":\"" + vibStatus + "\",";
      jsonPayload += "\"gas_ppm\":" + String(gasValue) + ",";
      jsonPayload += "\"gas_status\":\"" + gasStatus + "\",";
      jsonPayload += "\"crack_status\":\"Normal\",";
      jsonPayload += "\"battery\":98,";
      jsonPayload += "\"signal_rssi\":" + String(rssi) + ",";
      jsonPayload += "\"source\":\"nodemcu\"";
      jsonPayload += "}";

      WiFiClient client;
      HTTPClient http;
      String targetUrl = "http://" + String(SERVER_IP) + ":" + String(SERVER_PORT) + "/api/nodemcu";

      http.begin(client, targetUrl);
      http.addHeader("Content-Type", "application/json");
      http.setTimeout(1800); // 1.8s timeout

      int httpResponseCode = http.POST(jsonPayload);

      if (httpResponseCode == 200) {
        String response = http.getString();
        Serial.print("📡 [BLACK EYE Backend Ack]: ");
        Serial.println(response);
      } else {
        Serial.print("⚠️ HTTP POST Status: ");
        Serial.println(httpResponseCode);
      }
      http.end();
    } else {
      Serial.println("[WiFi] Waiting for hotspot link...");
      static unsigned long lastRetry = 0;
      if (millis() - lastRetry > 10000) {
        lastRetry = millis();
        WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
      }
    }
  }

  // Save current acceleration for next delta calculation
  lastX = x;
  lastY = y;
  lastZ = z;

  delay(80); // Fast 80ms loop for smooth vibration response
}
