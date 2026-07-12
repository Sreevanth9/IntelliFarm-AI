import React, { useState } from "react";
import * as copilotService from "../../services/copilotService";
import MarkdownRenderer from "./MarkdownRenderer";
import { useCopilot } from "../../hooks/useCopilot";
import {
  WeatherCard,
  DiseaseCard,
  MarketCard,
  RecommendationCard
} from "./CopilotCards";
import {
  Copy,
  ThumbsUp,
  ThumbsDown,
  Edit2,
  RefreshCw,
  Check,
  X
} from "lucide-react";
import toast from "react-hot-toast";

interface MessageItemProps {
  message: copilotService.Message;
  index: number;
  onEdit: (index: number, content: string) => void;
  onRegenerate: (index: number) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  index,
  onEdit,
  onRegenerate
}) => {
  const isUser = message.role === "user";
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState<boolean | null>(null);

  const { sendMessage } = useCopilot();

  const suggestionsCard = !isUser && message.attachments && Array.isArray(message.attachments)
    ? message.attachments.find((card: any) => card.type === "suggestions")
    : null;
  const followUpSuggestions: string[] = suggestionsCard?.data || [];

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEditSubmit = () => {
    if (editText.trim().length >= 2 && editText.trim() !== message.content) {
      onEdit(index, editText.trim());
      setIsEditing(false);
    }
  };

  return (
    <div className={`copilot-message-wrapper`}>
      <div className={`copilot-message ${isUser ? "user" : "assistant"}`}>
        {isEditing ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>
            <textarea
              style={{
                width: "100%",
                background: "var(--copilot-bg)",
                color: "var(--copilot-text)",
                border: "1px solid var(--copilot-primary)",
                borderRadius: "6px",
                padding: "8px",
                fontFamily: "inherit",
                fontSize: "14px",
                outline: "none",
                resize: "vertical",
                minHeight: "60px"
              }}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
              <button
                className="copilot-send-btn"
                style={{ padding: "4px 10px", fontSize: "12px" }}
                onClick={handleEditSubmit}
              >
                <Check size={12} /> Save
              </button>
              <button
                className="copilot-stop-btn"
                style={{ padding: "4px 10px", fontSize: "12px" }}
                onClick={() => {
                  setEditText(message.content);
                  setIsEditing(false);
                }}
              >
                <X size={12} /> Cancel
              </button>
            </div>
          </div>
        ) : isUser ? (
          <div style={{ whiteSpace: "pre-wrap" }}>{message.content}</div>
        ) : (
          <MarkdownRenderer content={message.content} />
        )}

        {/* Dynamic Context Cards Attached to Assistant Message */}
        {!isUser && message.attachments && Array.isArray(message.attachments) && (
          <div className="copilot-cards-grid">
            {message.attachments.map((card: any, idx: number) => {
              if (card.type === "weather" && card.data) {
                return <WeatherCard key={idx} data={card.data} />;
              }
              if (card.type === "disease" && card.data) {
                return <DiseaseCard key={idx} data={card.data} />;
              }
              if (card.type === "market" && card.data) {
                return <MarketCard key={idx} data={card.data} />;
              }
              if (card.type === "recommendation" && card.data) {
                return <RecommendationCard key={idx} data={card.data} />;
              }
              return null;
            })}
          </div>
        )}

        {/* Dynamic Follow-up Suggestions Chips */}
        {!isUser && followUpSuggestions.length > 0 && (
          <div className="copilot-followup-chips">
            {followUpSuggestions.map((sug: string, idx: number) => (
              <button
                key={idx}
                className="copilot-followup-chip"
                onClick={() => sendMessage(sug)}
              >
                {sug}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Message Metadata & Toolbar */}
      <div className={`copilot-message-meta ${isUser ? "user" : "assistant"}`}>
        <span>{new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
        {!isEditing && (
          <div className="copilot-message-toolbar">
            <button className="copilot-toolbar-btn" onClick={handleCopy} title="Copy content">
              <Copy size={12} />
              {copied ? "Copied" : "Copy"}
            </button>

            {isUser ? (
              <button className="copilot-toolbar-btn" onClick={() => setIsEditing(true)} title="Edit message">
                <Edit2 size={12} />
                Edit
              </button>
            ) : (
              <>
                <button
                  className="copilot-toolbar-btn"
                  onClick={() => onRegenerate(index)}
                  title="Regenerate response"
                >
                  <RefreshCw size={12} />
                  Regenerate
                </button>
                <button
                  className="copilot-toolbar-btn"
                  onClick={() => setLiked(liked === true ? null : true)}
                  title="Like"
                  style={{ color: liked === true ? "var(--copilot-primary)" : "inherit" }}
                >
                  <ThumbsUp size={12} style={{ fill: liked === true ? "currentColor" : "none" }} />
                </button>
                <button
                  className="copilot-toolbar-btn"
                  onClick={() => setLiked(liked === false ? null : false)}
                  title="Dislike"
                  style={{ color: liked === false ? "#ff3b30" : "inherit" }}
                >
                  <ThumbsDown size={12} style={{ fill: liked === false ? "currentColor" : "none" }} />
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageItem;
