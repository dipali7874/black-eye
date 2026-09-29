/**
 * BLACK EYE — SIH26025
 * AI Assistant Engine focused on Mine Monitoring Analytics
 */

export function queryAiAssistant(question, dashboardState = {}) {
  const q = (question || "").toLowerCase().trim();
  const { stations = [], activeAlerts = [], currentMine = {}, overallRisk = {} } = dashboardState;

  // 0. Off-topic and Prompt Extraction Refusal Guard (Offline Safety Net)
  const isOffTopic = [
    "capital of", "weather in", "write a poem", "write code", "python code", "javascript code",
    "tell me a joke", "who is ", "who was ", "recipe", "french", "france", "paris", "translate",
    "system prompt", "system instructions", "your instructions", "repeat your prompt", "api key", "nvidia key"
  ].some(kw => q.includes(kw));

  if (isOffTopic) {
    return "I am the **BLACK EYE AI Assistant** (SIH26025). I can only answer questions regarding this mine subsidence monitoring project, sensor telemetry, risk scores, alerts, and dashboard features. I cannot assist with general knowledge, external topics, or reveal system parameters.";
  }

  // 1. Highest Risk Station
  if (q.includes("highest risk") || q.includes("most dangerous") || q.includes("worst station")) {
    const sorted = [...stations].sort((a, b) => b.riskScore - a.riskScore);
    const top = sorted[0];
    if (!top) return "No station data currently available.";
    return `Station **${top.id}** (${top.panel}) has the highest risk score of **${top.riskScore}/100** [Status: ${top.status}]. Current readings — Tilt: ${top.tilt}°, Displacement: ${top.displacement}mm, Vibration: ${top.vibration}, Crack: ${top.crackStatus}.`;
  }

  // 2. Specific station inquiry (e.g. S-007, S-012)
  const stationMatch = q.match(/s-\d{3}/i);
  if (stationMatch) {
    const sId = stationMatch[0].toUpperCase();
    const st = stations.find(s => s.id === sId);
    if (st) {
      return `**Station ${st.id} Diagnostics**:
- **Panel Location**: ${st.panel}
- **Status**: ${st.status} (AI Risk: ${st.riskScore}/100)
- **Tilt**: ${st.tilt}°
- **Displacement**: ${st.displacement} mm
- **Vibration**: ${st.vibration}
- **Crack Status**: ${st.crackStatus}
- **Battery**: ${st.battery}% | Signal: ${st.signal}%`;
    }
  }

  // 3. Summarize current mine condition
  if (q.includes("summary") || q.includes("summarize") || q.includes("condition") || q.includes("overall status")) {
    const criticals = stations.filter(s => s.status === "CRITICAL");
    const warnings = stations.filter(s => s.status === "WARNING");
    const safes = stations.filter(s => s.status === "SAFE");
    return `**${currentMine.name || "Mine"} Condition Summary**:
- **Overall Mine Status**: ${overallRisk.mineStatus || "NORMAL"} (Risk Score: ${overallRisk.compositeScore || 27}/100)
- **Station Breakdown**: ${safes.length} Safe | ${warnings.length} Warning | ${criticals.length} Critical (Total 24)
- **Active Alerts**: ${activeAlerts.length} unacknowledged
- **AI Assessment**: ${overallRisk.summary || "All panels operating within baseline tolerance."}`;
  }

  // 4. Show critical alerts / active alerts
  if (q.includes("alert") || q.includes("critical alerts") || q.includes("warnings")) {
    if (activeAlerts.length === 0) return "There are currently no active unacknowledged alerts. All sensor nodes reporting normal telemetry.";
    const alertsList = activeAlerts.slice(0, 4).map(a => `- [${a.time}] **${a.station}** (${a.severity.toUpperCase()}): ${a.message}`).join("\n");
    return `Currently displaying **${activeAlerts.length} active alert(s)**:\n${alertsList}`;
  }

  // 5. Why warning/critical
  if (q.includes("why") || q.includes("reason") || q.includes("cause")) {
    const nonSafe = stations.filter(s => s.status === "WARNING" || s.status === "CRITICAL");
    if (nonSafe.length === 0) return "All stations are currently in Safe status with low displacement and tilt readings.";
    const reasons = nonSafe.map(s => `- **${s.id}** (${s.status}): Tilt at ${s.tilt}°, displacement at ${s.displacement}mm due to goaf area stress relaxation.`).join("\n");
    return `Primary causes for current warning/critical states:\n${reasons}`;
  }

  // Fallback mine-monitoring response
  return `BLACK EYE AI Assistant ready. You can ask about:
- *"Which station has the highest risk?"*
- *"Why is S-007 in warning status?"*
- *"Summarize the current mine condition."*
- *"Show active critical alerts."*`;
}
