import React from "react";
import { useCopilotContext } from "../../context/CopilotContext";
import { useCopilot } from "../../hooks/useCopilot";
import ChatInput from "./ChatInput";
import Suggestions from "./Suggestions";
import MessageList from "./MessageList";
import { Bot, RefreshCw } from "lucide-react";

export const ChatWindow: React.FC = () => {
  const {
    selectedConversation,
    messages,
    isLoadingMessages,
    isStreaming,
    error,
    setDraft
  } = useCopilotContext();

  const { sendMessage, stopGeneration } = useCopilot();

  const handleSuggestionSelect = (suggestion: string) => {
    setDraft(suggestion);
    // Asynchronously send query after filling draft
    setTimeout(() => {
      sendMessage(suggestion);
    }, 50);
  };

  const handleSend = () => {
    sendMessage();
  };

  return (
    <div className="copilot-chat-window">
      {/* Header */}
      <header className="copilot-chat-header">
        <div className="copilot-chat-header-title">
          {selectedConversation
            ? selectedConversation.title
            : "IntelliFarm Copilot v2"}
        </div>
        {isStreaming && (
          <RefreshCw size={16} className="animate-spin" style={{ color: "var(--copilot-primary)" }} />
        )}
      </header>

      {/* Main Workspace Body */}
      {isLoadingMessages ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", color: "var(--copilot-text-muted)" }}>
          <RefreshCw size={18} className="animate-spin" />
          <span>Loading messages...</span>
        </div>
      ) : messages.length === 0 ? (
        // Empty State / Suggestions
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto" }}>
          <div className="copilot-empty-state">
            <div className="copilot-empty-icon">
              <Bot size={40} />
            </div>
            <h2 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "8px", color: "var(--copilot-text)" }}>
              Welcome, Farmer!
            </h2>
            <p style={{ maxWidth: "500px", margin: "0 auto", fontSize: "14px", lineHeight: "1.5" }}>
              I am your intelligent farm copilot. Ask me questions about crops, soil nutrition, disease detection, weather impacts, or local wholesale mandi rates.
            </p>
          </div>
          <Suggestions onSelect={handleSuggestionSelect} />
        </div>
      ) : (
        // Active Messages List
        <MessageList />
      )}

      {/* Error Message banner */}
      {error && (
        <div style={{ padding: "8px 24px", color: "#ff3b30", backgroundColor: "rgba(255, 59, 48, 0.08)", fontSize: "13px", borderTop: "1px solid rgba(255, 59, 48, 0.1)" }}>
          Error: {error}
        </div>
      )}

      {/* Footer / Input Panel */}
      <ChatInput onSend={handleSend} onStop={stopGeneration} />
    </div>
  );
};

export default ChatWindow;
