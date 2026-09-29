import React from "react";
import { History, Activity, AlertTriangle, ShieldCheck, CheckCircle2 } from "lucide-react";

export function RecentEventsTimeline({ events = [], isHardwareMode = false }) {
  const defaultEvents = isHardwareMode
    ? [
        { time: "Just now", message: "Listening for live NodeMCU ESP8266 telemetry on :5000/api/nodemcu...", type: "INFO" },
        { time: "System", message: "LIVE NODEMCU HARDWARE MODE active — All dummy data excluded", type: "INFO" }
      ]
    : [
        { time: "10:42", message: "AI detected anomaly at S-007 (Longwall Face)", type: "WARNING" },
        { time: "10:38", message: "Station S-012 changed to CRITICAL status", type: "CRITICAL" },
        { time: "10:31", message: "Offline AI analysis pass completed (24 stations)", type: "INFO" },
        { time: "10:25", message: "Surface mesh network sync completed (96% health)", type: "INFO" },
        { time: "10:20", message: "BLACK EYE Demo Mode initialized — Jharia Mine", type: "INFO" }
      ];

  const displayEvents = events.length > 0 ? events : defaultEvents;

  return (
    <div className="be-card be-timeline-card">
      <div className="be-card-header">
        <div className="be-header-title-icon">
          <History size={18} className="text-accent" />
          <h3 className="be-card-title">RECENT SYSTEM EVENTS</h3>
        </div>
        <span className="be-badge neutral-badge">AUDIT STREAM</span>
      </div>

      <div className="be-timeline-list">
        {displayEvents.map((evt, idx) => {
          let dotClass = "dot-info";
          if (evt.type === "CRITICAL") dotClass = "dot-critical";
          else if (evt.type === "WARNING") dotClass = "dot-warning";

          return (
            <div key={idx} className="be-timeline-item">
              <span className={`be-timeline-dot ${dotClass}`}></span>
              <span className="be-timeline-time">{evt.time}</span>
              <span className="be-timeline-msg">{evt.message}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
