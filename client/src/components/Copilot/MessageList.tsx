import React, { useRef, useEffect } from "react";
import { useCopilotContext } from "../../context/CopilotContext";
import { useCopilot } from "../../hooks/useCopilot";
import MessageItem from "./MessageItem";
import TypingIndicator from "./TypingIndicator";

export const MessageList: React.FC = () => {
  const { messages, isStreaming } = useCopilotContext();
  const { editMessage, regenerateResponse } = useCopilot();
  
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll anchor
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isStreaming]);

  return (
    <div className="copilot-messages-container">
      {messages.map((msg, index) => {
        const isEmptyAssistant = msg.role === "assistant" && msg.content === "";

        return (
          <div key={msg.id} style={{ display: "flex", flexDirection: "column", width: "100%" }}>
            {isEmptyAssistant ? (
              <div className="copilot-message assistant" style={{ alignSelf: "flex-start" }}>
                <TypingIndicator />
              </div>
            ) : (
              <MessageItem
                message={msg}
                index={index}
                onEdit={editMessage}
                onRegenerate={regenerateResponse}
              />
            )}
          </div>
        );
      })}
      
      {/* Scroll anchor */}
      <div ref={bottomRef} style={{ height: "1px" }} />
    </div>
  );
};

export default MessageList;
