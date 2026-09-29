# 🛰️ BLACK EYE — Mine Subsidence Intelligence Platform
### Smart India Hackathon 2026 • Problem Statement: SIH26025

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React 19](https://img.shields.io/badge/React-19.0.0-61dafb.svg)](https://react.dev/)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9.4-199900.svg)](https://leafletjs.com/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646cff.svg)](https://vitejs.dev/)

**BLACK EYE** is an AI-enabled, low-cost mine subsidence monitoring and early warning command center designed for underground coal mining operations in India. It combines a high-performance **Leaflet 2D GIS geospatial map**, an **offline/online dual-AI anomaly detection engine**, real-time IoT sensor telemetry, and surface wireless mesh network topologies into a cohesive industrial dashboard.

---

## 🌟 Key Capabilities

1. **Lightweight & Offline-Ready Leaflet GIS Map**
   - Interactive GIS view with high-resolution satellite imagery (Esri World Imagery), topographic maps, and OpenStreetMap.
   - Smooth animated transitions for Indian coalfields (*Jharia, Talcher, Korba, Raniganj*).
   - Dynamic subsidence risk heatmaps, underground panel boundaries (North Panel, Longwall Face, Goaf Area), and surface IoT mesh link visualizations.
   - Clickable sensor markers color-coded by real-time risk level (*Safe, Anomaly, Warning, Critical*).

2. **Dual-Tier AI Anomaly Detection Engine**
   - **Offline AI (Primary)**: Zero-dependency JavaScript-native Explainable Weighted Risk Engine. Evaluates tilt velocity, displacement delta, micro-seismic vibration, and optical crack propagation in $<5\text{ ms}$ per node.
   - **Online AI (Optional)**: Remote LLM synthesis layer (OpenAI / Gemini / NVIDIA NIM) for automated natural language engineering reports when an API key is configured.

3. **Interactive Telemetry & Analytics Dashboard**
   - KPI metrics overview with real-time risk scores and node status distribution.
   - Multi-axis sensor trend charts (*Tilt Angle, Displacement, AI Risk Score*) with configurable timeframes (1h, 6h, 24h, 7d).
   - Built-in AI conversational assistant for instant natural-language mine diagnostics.
   - Interactive demo risk escalation simulation (`SIMULATE RISK EVENT`).

4. **Multi-Page Command Suite**
   - **Main Dashboard**: High-density operational overview.
   - **Live Map**: Fullscreen GIS spatial intelligence console.
   - **Sensor Stations**: Searchable, filterable telemetric grid of all 24 nodes.
   - **AI Analysis**: Dual-AI architecture breakdown & diagnostics.
   - **Historical Data**: Batch CSV runner with offline ML model evaluation.
   - **Alerts Log**: Event history, severity filtering, and acknowledgment workflow.
   - **Mesh Network**: Wireless link health, node topology diagram, and latency metrics.
   - **Mine Management**: Coalfield selector with extraction method & seam depth metadata.
   - **Settings**: System preferences, risk thresholds, and safety disclaimers.

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+ recommended)
- npm (v9+ recommended)

### 1. Installation
```bash
git clone https://github.com/your-org/black-eye.git
cd black-eye
npm install
```

### 2. Configure Environment (Optional)
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
*(Optional)* Add an LLM API key for online geotechnical synthesis:
```env
VITE_OPENAI_API_KEY=your_openai_key_here
# OR
VITE_GEMINI_API_KEY=your_gemini_key_here
```
> **Note:** Black Eye functions fully offline with its native Explainable Weighted Risk Engine if no API key is provided.

### 3. Start Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Build for Production
```bash
npm run build
```

---

## 🏗️ Architecture & Technology Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 19 + Vite 6 |
| **Geospatial Engine** | Leaflet 2D GIS + OpenStreetMap / Esri World Imagery |
| **Data Visualization** | Recharts + Lucide Icons |
| **Design System** | Vanilla CSS3 Tokens (Dark Industrial SaaS Palette) |
| **AI / ML Engine** | Offline Explainable Weighted Risk Engine + Optional Online LLM |

---

## 🤝 Acknowledgements

The 3D globe integration approach and Cesium build configuration were inspired by and adapted from the open-source project [God's Eye View](https://github.com/bilawalsidhu/gods-eye-view) by Bilawal Sidhu (MIT License).

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
