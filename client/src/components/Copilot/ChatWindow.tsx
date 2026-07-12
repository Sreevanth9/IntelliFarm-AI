import React from "react";
import { useCopilotContext } from "../../context/CopilotContext";
import { useCopilot } from "../../hooks/useCopilot";
import ChatInput from "./ChatInput";
import Suggestions from "./Suggestions";
import MessageList from "./MessageList";
import { RefreshCw } from "lucide-react";

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
      {/* Header (Only visible after discussion starts) */}
      {messages.length > 0 && (
        <header className="copilot-chat-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 24px" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "2px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: "700", color: "var(--copilot-primary)", textTransform: "uppercase", letterSpacing: "0.8px" }}>
              <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#2fb86b" }}></span>
              Spryzen AI
            </div>
            <div className="copilot-chat-header-title" style={{ fontSize: "13.5px", fontWeight: "500", color: "var(--copilot-text-muted)" }}>
              {selectedConversation
                ? selectedConversation.title
                : "New Discussion"}
            </div>
          </div>
          {isStreaming && (
            <RefreshCw size={16} className="animate-spin" style={{ color: "var(--copilot-primary)" }} />
          )}
        </header>
      )}

      {/* Main Workspace Body */}
      {isLoadingMessages ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", color: "var(--copilot-text-muted)" }}>
          <RefreshCw size={18} className="animate-spin" />
          <span>Loading messages...</span>
        </div>
      ) : messages.length === 0 ? (
        // Empty State / Suggestions
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", width: "100%", padding: "0 40px", boxSizing: "border-box", overflowY: "auto" }}>
          <div className="copilot-empty-state" style={{ marginBottom: "24px", textAlign: "center" }}>
            <h1 style={{ fontSize: "48px", fontWeight: "800", letterSpacing: "-0.5px", color: "var(--copilot-text)", marginBottom: "6px" }}>
              Spryzen AI
            </h1>
            <h2 style={{ fontSize: "22px", fontWeight: "400", color: "var(--copilot-text-muted)", margin: 0 }}>
              How can Spryzen AI help you today?
            </h2>
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
          Spryzen AI couldn't complete the request. Details: {error}
        </div>
      )}

      {/* Footer / Input Panel */}
      <ChatInput onSend={handleSend} onStop={stopGeneration} />
    </div>
  );
};

export default ChatWindow;
