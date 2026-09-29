/**
 * BLACK EYE — SIH26025
 * Offline AI Anomaly Detection & Risk Engine
 * Zero internet / external API dependencies required.
 */

function computeConfidence(riskScore) {
  const thresholds = [30, 45, 75];
  const nearestDistance = Math.min(...thresholds.map(t => Math.abs(riskScore - t)));
  // normalize distance to a 55-99% confidence band based on separation from decision boundaries
  return Math.round(Math.min(99, 55 + nearestDistance * 2.5));
}

/**
 * Analyzes sensor telemetry and historical trends for a station.
 * Returns classification, risk score (0-100), dynamic boundary confidence, and natural language explanation.
 */
export function analyzeStationOffline(station) {
  const { tilt, displacement, vibration, crackStatus, history = [] } = station;

  // 1. Tilt Feature Weighting (Max 35 pts)
  let tiltScore = 0;
  if (tilt > 4.0) tiltScore = 35;
  else if (tilt > 2.5) tiltScore = 22 + (tilt - 2.5) * 8.6;
  else if (tilt > 1.8) tiltScore = 10 + (tilt - 1.8) * 17;
  else tiltScore = (tilt / 1.8) * 10;

  // 2. Cumulative Displacement Weighting (Max 35 pts)
  let dispScore = 0;
  if (displacement > 10.0) dispScore = 35;
  else if (displacement > 5.0) dispScore = 20 + (displacement - 5.0) * 3;
  else if (displacement > 3.0) dispScore = 10 + (displacement - 3.0) * 5;
  else dispScore = (displacement / 3.0) * 10;

  // 3. Vibration & Dynamic Strain (Max 15 pts)
  let vibScore = 0;
  if (vibration === "High") vibScore = 15;
  else if (vibration === "Elevated") vibScore = 9;

  // 4. Crack Status (Max 15 pts)
  let crackScore = crackStatus === "Detected" ? 15 : 0;

  // 5. Trend Analysis (Velocity of Deformation)
  let trendFactor = 1.0;
  if (history.length >= 3) {
    const recentDisp = history.slice(-3).map(h => h.displacement);
    const delta = recentDisp[recentDisp.length - 1] - recentDisp[0];
    if (delta > 2.0) trendFactor = 1.25;
    else if (delta > 0.8) trendFactor = 1.12;
  }

  // Calculate raw composite risk score (0 - 100)
  const rawScore = (tiltScore + dispScore + vibScore + crackScore) * trendFactor;
  const riskScore = Math.min(100, Math.max(0, Math.round(rawScore)));

  // Classify Status
  let status = "SAFE";
  if (riskScore >= 75) status = "CRITICAL";
  else if (riskScore >= 45) status = "WARNING";
  else if (riskScore >= 30) status = "ANOMALY";

  // Generate clear natural language explanation
  let explanation = "";
  if (status === "CRITICAL") {
    explanation = `Station ${station.id} shows high risk (${riskScore}/100) with severe ground deformation (Tilt: ${tilt}°, Displacement: ${displacement}mm, Crack: ${crackStatus}). Immediate structural inspection advised.`;
  } else if (status === "WARNING") {
    explanation = `Station ${station.id} exhibits an increasing deformation pattern (${riskScore}/100) exceeding normal baseline thresholds. Recommended for active monitoring.`;
  } else if (status === "ANOMALY") {
    explanation = `Station ${station.id} registered a minor anomaly delta (${riskScore}/100). Sensor telemetry remains within operational tolerance levels.`;
  } else {
    explanation = `Station ${station.id} is operating within normal parameters (${riskScore}/100). No immediate threat detected.`;
  }

  return {
    status,
    riskScore,
    explanation,
    confidence: `${computeConfidence(riskScore)}%`,
    model: "Explainable Weighted Risk Engine (rule-based)"
  };
}

/**
 * Analyzes overall mine risk across all stations.
 */
export function analyzeOverallMineRisk(stations) {
  if (!stations || stations.length === 0) {
    return { status: "NORMAL", score: 15, summary: "All stations synchronized." };
  }

  const criticalCount = stations.filter(s => s.status === "CRITICAL").length;
  const warningCount = stations.filter(s => s.status === "WARNING").length;
  const anomalyCount = stations.filter(s => s.status === "ANOMALY").length;

  const avgScore = stations.reduce((acc, s) => acc + s.riskScore, 0) / stations.length;
  const maxScore = Math.max(...stations.map(s => s.riskScore));

  const compositeScore = Math.round((avgScore * 0.4) + (maxScore * 0.6));

  let mineStatus = "NORMAL";
  let summary = "No immediate critical threat detected across monitored surface panels.";

  if (criticalCount > 0 || compositeScore >= 75) {
    mineStatus = "CRITICAL";
    summary = `Potential high-risk deformation pattern detected! ${criticalCount} critical station(s) flagged. Immediate inspection recommended.`;
  } else if (warningCount > 0 || compositeScore >= 40) {
    mineStatus = "WARNING";
    summary = `Abnormal deformation trend detected across ${warningCount} warning station(s). Ground investigation recommended.`;
  }

  return {
    mineStatus,
    compositeScore,
    criticalCount,
    warningCount,
    anomalyCount,
    summary,
    lastAnalysisTime: new Date().toLocaleTimeString()
  };
}
