import React, { useState } from "react";
import { MessageSquare, Send, Bot, User, Sparkles, Loader2 } from "lucide-react";
import { queryOnlineAiAssistant, isOnlineAiConfigured } from "../engine/onlineAI.js";

function formatMarkdown(text = "") {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\n\s*-\s*/g, "<br/>• ")
    .replace(/\n/g, "<br/>");
}

export function AiAssistantWidget({ dashboardState }) {
  const isOnline = isOnlineAiConfigured();
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hello! I am **BLACK EYE AI Assistant**, specialized in Indian underground mine subsidence monitoring and early warning analytics. Ask me anything about current sensor telemetry, risk scores, or critical alerts."
    }
  ]);
  const [inputQuery, setInputQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (textToSend) => {
    const query = textToSend || inputQuery;
    if (!query.trim() || isLoading) return;

    const userMsg = { sender: "user", text: query };
    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputQuery("");
    setIsLoading(true);

    try {
      const answerText = await queryOnlineAiAssistant(query, dashboardState);
      const botMsg = { sender: "bot", text: answerText };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { sender: "bot", text: "Encountered a momentary error processing your query. Please try again." }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const samplePrompts = [
    "Which station has the highest risk?",
    "Why is S-007 in warning status?",
    "Summarize current mine condition",
    "Show active critical alerts"
  ];

  return (
    <div className="be-card be-assistant-card">
      <div className="be-card-header">
        <div className="be-header-title-icon">
          <Bot size={18} className="text-accent" />
          <h3 className="be-card-title">BLACK EYE AI ASSISTANT</h3>
        </div>
        <span className={`be-badge ${isOnline ? "ai-badge" : "neutral-badge"}`}>
          <Sparkles size={12} /> {isOnline ? "NVIDIA NIM Online" : "Offline Engine"}
        </span>
      </div>

      <div className="be-assistant-chat-window">
        {messages.map((m, idx) => (
          <div key={idx} className={`be-chat-bubble ${m.sender}`}>
            <div className="be-chat-avatar">
              {m.sender === "bot" ? <Bot size={14} /> : <User size={14} />}
            </div>
            <div
              className="be-chat-text"
              dangerouslySetInnerHTML={{ __html: formatMarkdown(m.text) }}
            />
          </div>
        ))}
        {isLoading && (
          <div className="be-chat-bubble bot">
            <div className="be-chat-avatar">
              <Bot size={14} />
            </div>
            <div className="be-chat-text flex items-center gap-2 text-muted">
              <Loader2 size={14} className="animate-spin" />
              <span>Analyzing telemetry...</span>
            </div>
          </div>
        )}
      </div>

      <div className="be-sample-prompts">
        {samplePrompts.map((prompt, idx) => (
          <button
            key={idx}
            className="be-prompt-chip"
            onClick={() => handleSend(prompt)}
            disabled={isLoading}
          >
            {prompt}
          </button>
        ))}
      </div>

      <div className="be-assistant-input-row">
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask BLACK EYE AI about mine risk..."
          className="be-chat-input"
          disabled={isLoading}
        />
        <button
          className="be-send-btn"
          onClick={() => handleSend()}
          disabled={isLoading || !inputQuery.trim()}
        >
          {isLoading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
        </button>
      </div>
    </div>
  );
}
