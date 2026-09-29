import React, { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from "recharts";
import { TrendingUp, Clock } from "lucide-react";

export function SensorTrendCharts({ selectedStation, defaultHistory = [] }) {
  const [timeFilter, setTimeFilter] = useState("24h"); // '1h', '6h', '24h', '7d'

  const historyData = selectedStation && selectedStation.history ? selectedStation.history : defaultHistory;

  let sliceCount = 24;
  if (timeFilter === "1h") sliceCount = 4;
  else if (timeFilter === "6h") sliceCount = 8;
  else if (timeFilter === "24h") sliceCount = 24;
  else if (timeFilter === "7d") sliceCount = 25;

  const filteredData = historyData.slice(-sliceCount);

  return (
    <div className="be-card be-charts-card">
      <div className="be-card-header">
        <div className="be-header-title-icon">
          <TrendingUp size={18} className="text-accent" />
          <h3 className="be-card-title">
            SENSOR & RISK TREND MONITOR — {selectedStation ? selectedStation.id : "MINE BASELINE"}
          </h3>
        </div>

        <div className="be-time-filter-group">
          <Clock size={13} className="text-muted" />
          {["1h", "6h", "24h", "7d"].map(tf => (
            <button
              key={tf}
              className={`be-tf-btn ${timeFilter === tf ? "active" : ""}`}
              onClick={() => setTimeFilter(tf)}
            >
              {tf.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="be-charts-grid">
        {/* Tilt Trend Plot */}
        <div className="be-chart-box">
          <div className="be-chart-subhead">
            <span>Tilt Angle Trend (°)</span>
            <span className="be-chart-curr">{selectedStation ? `${selectedStation.tilt}°` : "1.8°"}</span>
          </div>
          <div style={{ width: "100%", height: 160 }}>
            <ResponsiveContainer>
              <LineChart data={filteredData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} domain={[0, 6]} />
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", color: "#f8fafc" }} />
                <ReferenceLine y={2.5} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Warning 2.5°', fill: '#f59e0b', fontSize: 9 }} />
                <Line type="monotone" dataKey="tilt" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Displacement Trend Plot */}
        <div className="be-chart-box">
          <div className="be-chart-subhead">
            <span>Displacement Trend (mm)</span>
            <span className="be-chart-curr">{selectedStation ? `${selectedStation.displacement} mm` : "3.4 mm"}</span>
          </div>
          <div style={{ width: "100%", height: 160 }}>
            <ResponsiveContainer>
              <LineChart data={filteredData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} domain={[0, 20]} />
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", color: "#f8fafc" }} />
                <ReferenceLine y={10.0} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Critical 10mm', fill: '#ef4444', fontSize: 9 }} />
                <Line type="monotone" dataKey="displacement" stroke="#10b981" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Risk Score Trend */}
        <div className="be-chart-box">
          <div className="be-chart-subhead">
            <span>AI Risk Score History</span>
            <span className="be-chart-curr">{selectedStation ? `${selectedStation.riskScore}/100` : "27/100"}</span>
          </div>
          <div style={{ width: "100%", height: 160 }}>
            <ResponsiveContainer>
              <LineChart data={filteredData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", color: "#f8fafc" }} />
                <ReferenceLine y={45} stroke="#f59e0b" strokeDasharray="3 3" />
                <ReferenceLine y={75} stroke="#ef4444" strokeDasharray="3 3" />
                <Line type="monotone" dataKey="riskScore" stroke="#f59e0b" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
