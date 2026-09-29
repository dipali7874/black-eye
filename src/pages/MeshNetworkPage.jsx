import React from "react";
import { MeshNetworkWidget } from "../components/MeshNetworkWidget.jsx";

export function MeshNetworkPage() {
  return (
    <div className="be-page-container">
      <div className="be-page-header">
        <h2>SURFACE WIRELESS MESH NETWORK TOPOLOGY</h2>
        <p>Surface mesh nodes telemetry, signal propagation, and gateway link statistics.</p>
      </div>

      <MeshNetworkWidget />
    </div>
  );
}
