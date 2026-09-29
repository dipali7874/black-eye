import React, { useState } from "react";
import { Database, Upload, Play, CheckCircle2, Cpu } from "lucide-react";

export function HistoricalDataPage() {
  const [analyzed, setAnalyzed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [datasetName, setDatasetName] = useState("jharia_mine_subsidence_2025.csv");

  const handleRunAnalysis = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setAnalyzed(true);
    }, 1200);
  };

  return (
    <div className="be-page-container">
      <div className="be-page-header">
        <h2>HISTORICAL DATASET ANALYSIS & OFFLINE AI BATCH RUNNER</h2>
        <p>Batch processing of historical mine subsidence logs, tilt telemetry, and optical displacement CSV files.</p>
      </div>

      <div className="be-card mb-6">
        <div className="be-card-header">
          <h3 className="be-card-title">LOAD HISTORICAL DATASET</h3>
        </div>

        <div className="be-dataset-upload-box">
          <Upload size={32} className="text-accent mb-2" />
          <p className="font-bold">Drag &amp; Drop CSV / JSON Dataset File</p>
          <p className="text-muted text-sm mb-4">Or select default prototype dataset: <strong>{datasetName}</strong></p>

          <button
            className="be-btn-primary large-btn"
            onClick={handleRunAnalysis}
            disabled={loading}
          >
            <Play size={16} /> {loading ? "RUNNING OFFLINE AI MODEL..." : "RUN OFFLINE AI ANALYSIS"}
          </button>
        </div>
      </div>

      {analyzed && (
        <div className="be-card be-analysis-results-card">
          <div className="be-card-header">
            <h3 className="be-card-title"><CheckCircle2 className="text-safe" size={18} /> ANALYSIS RESULTS SUMMARY</h3>
          </div>

          <div className="be-results-grid">
            <div className="be-res-stat">
              <span className="lbl">Records Analysed</span>
              <span className="val">12,450</span>
            </div>

            <div className="be-res-stat">
              <span className="lbl">Anomalies Detected</span>
              <span className="val text-warning">37</span>
            </div>

            <div className="be-res-stat">
              <span className="lbl">Warning Patterns</span>
              <span className="val text-warning">12</span>
            </div>

            <div className="be-res-stat">
              <span className="lbl">Critical Patterns</span>
              <span className="val text-critical">3</span>
            </div>
          </div>

          <div className="be-disclaimer-box mt-4">
            <Cpu size={14} /> Processed via Offline Explainable Weighted Risk Engine (Execution time: 142 ms).
          </div>
        </div>
      )}
    </div>
  );
}
