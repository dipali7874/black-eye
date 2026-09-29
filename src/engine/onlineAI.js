/**
 * BLACK EYE — SIH26025
 * Online AI LLM Engine (OpenAI / Gemini / NVIDIA NIM Inference)
 * 
 * NOTE: These are client-side fetch() calls using VITE_-prefixed keys, which means
 * the key is exposed in the browser bundle. This is a known architectural limitation
 * acceptable for a hackathon demo/prototype, but should be proxied through a secure
 * backend in production.
 * 
 * Seamlessly falls back to the offline Explainable Weighted Risk Engine when unavailable or unconfigured.
 */

import { queryAiAssistant } from "./aiAssistantEngine.js";

const getEnv = (key) => {
  if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env[key] !== undefined) {
    return import.meta.env[key];
  }
  if (typeof process !== "undefined" && process.env && process.env[key] !== undefined) {
    return process.env[key];
  }
  return "";
};

const SYSTEM_PROMPT = `You are the geotechnical AI assistant embedded in the BLACK EYE mine subsidence monitoring dashboard (SIH26025). You only answer questions about this mine's sensor data, subsidence risk, alerts, stations, and how to use this dashboard, using the context data provided. If the user asks anything unrelated to this mine monitoring project, politely decline. Keep responses concise, actionable, and grounded in the provided sensor telemetry.`;

/**
 * Returns the active provider configuration based on available API keys.
 * Priority: OpenAI > Gemini > NVIDIA NIM
 */
export function getActiveAiProvider() {
  const openAiKey = getEnv("VITE_OPENAI_API_KEY");
  if (openAiKey && openAiKey.trim()) {
    return {
      provider: "OpenAI",
      apiKey: openAiKey.trim(),
      model: getEnv("VITE_OPENAI_MODEL") || "gpt-4o-mini"
    };
  }

  const geminiKey = getEnv("VITE_GEMINI_API_KEY");
  if (geminiKey && geminiKey.trim()) {
    return {
      provider: "Gemini",
      apiKey: geminiKey.trim(),
      model: getEnv("VITE_GEMINI_MODEL") || "gemini-1.5-flash"
    };
  }

  const nvidiaKey = getEnv("VITE_NVIDIA_API_KEY");
  if (nvidiaKey && nvidiaKey.trim()) {
    return {
      provider: "NVIDIA NIM",
      apiKey: nvidiaKey.trim(),
      model: getEnv("VITE_NVIDIA_MODEL") || "openai/gpt-oss-20b"
    };
  }

  return null;
}

/**
 * Checks whether an online AI API key is configured.
 */
export function isOnlineAiConfigured() {
  return Boolean(getActiveAiProvider());
}

/**
 * Formats live dashboard telemetry and alerts into a compact, grounded context string.
 */
export function buildDashboardContext(dashboardState = {}) {
  const {
    stations = [],
    activeAlerts = [],
    currentMine = {},
    overallRisk = {}
  } = dashboardState;

  const safeCount = stations.filter(s => s.status === "SAFE").length;
  const warnCount = stations.filter(s => s.status === "WARNING").length;
  const critCount = stations.filter(s => s.status === "CRITICAL").length;

  const highRiskStations = [...stations]
    .filter(s => s.status === "CRITICAL" || s.status === "WARNING" || s.riskScore >= 40)
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 6)
    .map(s => `• Station ${s.id} (${s.panel}): Status=${s.status}, Risk=${s.riskScore}/100, Tilt=${s.tilt}°, Displacement=${s.displacement}mm, Vibration=${s.vibration}, Crack=${s.crackStatus}`)
    .join("\n");

  const alertSummary = activeAlerts.length > 0
    ? activeAlerts.slice(0, 4).map(a => `• [${a.time}] Station ${a.station} (${a.severity.toUpperCase()}): ${a.message}`).join("\n")
    : "No unacknowledged alerts.";

  return `
[CURRENT MINE]
Name: ${currentMine.name || "Jharia Coalfield"} (${currentMine.state || "Jharkhand"})
Mining Method: ${currentMine.miningMethod || "Bord and Pillar / Longwall"}
Average Seam Depth: ${currentMine.depth || "280m"}

[OVERALL RISK ASSESSMENT]
Mine Status: ${overallRisk.mineStatus || "NORMAL"}
Composite Risk Score: ${overallRisk.compositeScore ?? 27}/100
Assessment Summary: ${overallRisk.summary || "All sensor nodes operating within baseline tolerance."}

[STATION OVERVIEW]
Total Stations: ${stations.length} | Safe: ${safeCount} | Warning: ${warnCount} | Critical: ${critCount}

[PRIMARY HIGH RISK & ELEVATED STATIONS]
${highRiskStations || "All stations currently reporting SAFE readings."}

[ACTIVE CRITICAL ALERTS]
${alertSummary}
`.trim();
}

/**
 * Executes a real LLM inference call to the active configured provider.
 */
async function callLlmInference(systemPrompt, userPrompt, maxTokens = 350) {
  const providerConfig = getActiveAiProvider();
  if (!providerConfig) {
    throw new Error("No online AI API key configured (set VITE_OPENAI_API_KEY, VITE_GEMINI_API_KEY, or VITE_NVIDIA_API_KEY in .env)");
  }

  const { provider, apiKey, model } = providerConfig;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    if (provider === "OpenAI") {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          max_tokens: maxTokens,
          temperature: 0.3
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        const errBody = await response.text().catch(() => "");
        throw new Error(`OpenAI API error (${response.status}): ${errBody || response.statusText}`);
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;
      if (!content) throw new Error("Empty completion returned by OpenAI API");
      return { content: content.trim(), model: model, provider };
    }

    if (provider === "Gemini") {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: `${systemPrompt}\n\nUser Request: ${userPrompt}` }]
            }
          ],
          generationConfig: {
            maxOutputTokens: maxTokens,
            temperature: 0.3
          }
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        const errBody = await response.text().catch(() => "");
        throw new Error(`Gemini API error (${response.status}): ${errBody || response.statusText}`);
      }

      const data = await response.json();
      const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!content) throw new Error("Empty response returned by Gemini API");
      return { content: content.trim(), model: model, provider };
    }

    if (provider === "NVIDIA NIM") {
      const endpoints = typeof window !== "undefined"
        ? ["/api/nvidia/v1/chat/completions", "https://integrate.api.nvidia.com/v1/chat/completions"]
        : ["https://integrate.api.nvidia.com/v1/chat/completions"];

      let lastError = null;
      for (const ep of endpoints) {
        try {
          const response = await fetch(ep, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              model: model,
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
              ],
              max_tokens: maxTokens,
              temperature: 0.2
            }),
            signal: controller.signal
          });

          if (!response.ok) {
            const errText = await response.text().catch(() => "");
            throw new Error(`NVIDIA NIM API error (${response.status}): ${errText || response.statusText}`);
          }

          const data = await response.json();
          const choice = data?.choices?.[0];
          const content = choice?.message?.content || choice?.message?.reasoning_content;
          if (!content) throw new Error("Empty response returned by NVIDIA NIM model");
          return { content: content.trim(), model: model, provider };
        } catch (err) {
          lastError = err;
        }
      }
      throw lastError || new Error("Failed to connect to NVIDIA NIM endpoint");
    }

    throw new Error(`Unsupported AI provider: ${provider}`);
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Queries the AI Assistant for interactive chat responses.
 * Uses online LLM if configured; gracefully falls back to offline rule-based assistant on failure.
 */
export async function queryOnlineAiAssistant(question, dashboardState = {}) {
  if (!isOnlineAiConfigured()) {
    return queryAiAssistant(question, dashboardState);
  }

  try {
    const context = buildDashboardContext(dashboardState);
    const systemPromptWithContext = `${SYSTEM_PROMPT}\n\n=== LIVE DASHBOARD CONTEXT ===\n${context}`;
    const result = await callLlmInference(systemPromptWithContext, question, 350);
    return result.content;
  } catch (err) {
    console.warn("[BLACK EYE] Online AI inference failed, falling back to Offline Assistant:", err.message);
    return queryAiAssistant(question, dashboardState);
  }
}

/**
 * Runs real geotechnical synthesis analysis for the AI Analysis page.
 */
export async function runOnlineAiAnalysis(mineName, stationData = [], overallRisk = {}) {
  if (!isOnlineAiConfigured()) {
    return {
      configured: false,
      status: "Not Configured",
      message: "Online AI key not configured in .env. Offline Explainable Weighted Risk Engine is active as primary.",
      recommendation: "Add VITE_OPENAI_API_KEY, VITE_GEMINI_API_KEY, or VITE_NVIDIA_API_KEY to .env to enable online LLM synthesis."
    };
  }

  try {
    const context = buildDashboardContext({
      stations: stationData,
      currentMine: { name: mineName },
      overallRisk: overallRisk
    });

    const userPrompt = "Generate a concise 3-bullet executive geotechnical analysis and actionable recommendation for this mine based on the current telemetry.";
    const result = await callLlmInference(
      `${SYSTEM_PROMPT}\n\n=== LIVE DASHBOARD CONTEXT ===\n${context}`,
      userPrompt,
      350
    );

    return {
      configured: true,
      status: `ACTIVE (${result.provider})`,
      model: result.model,
      message: result.content,
      recommendation: "Continuous monitoring of goaf extraction area and sensor telemetry trends recommended."
    };
  } catch (err) {
    console.warn("[BLACK EYE] Online AI analysis failed:", err.message);
    return {
      configured: false,
      status: "Error",
      message: `Online AI request failed: ${err.message}. Offline Explainable Weighted Risk Engine remains fully operational.`,
      error: err.message,
      recommendation: "Verify your API key, network connection, or quota."
    };
  }
}
