import React, { useRef, useEffect } from "react";
import { Image, Paperclip, Send, Square, X } from "lucide-react";
import { useCopilotContext } from "../../context/CopilotContext";

interface ChatInputProps {
  onSend: () => void;
  onStop: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, onStop }) => {
  const {
    draft,
    setDraft,
    attachments,
    setAttachments,
    isStreaming
  } = useCopilotContext();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-grow textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [draft]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setAttachments((prev) => [
          ...prev,
          {
            name: file.name,
            type: file.type.startsWith("image/") ? "image" : "document",
            data: reader.result as string
          }
        ]);
      };
      reader.readAsDataURL(file);
    });

    // Reset file input value
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="copilot-input-area">
      <div className="copilot-input-wrapper">
        {/* Attachments Preview Row */}
        {attachments.length > 0 && (
          <div className="copilot-attachments-preview">
            {attachments.map((att, idx) => (
              <div key={idx} className="copilot-attachment-pill">
                {att.type === "image" ? <Image size={12} /> : <Paperclip size={12} />}
                <span style={{ maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {att.name}
                </span>
                <button className="copilot-attachment-remove" onClick={() => removeAttachment(idx)}>
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="copilot-textarea-row">
          <textarea
            ref={textareaRef}
            rows={1}
            placeholder="Ask IntelliFarm Copilot anything about soil, weather, fertilizers..."
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
          />
        </div>

        <div className="copilot-input-actions">
          <div className="copilot-action-group">
            <button
              className="copilot-icon-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={isStreaming}
              title="Attach leaf photo or document"
            >
              <Image size={18} />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={handleFileChange}
              accept="image/*"
              multiple
            />
          </div>

          <div className="copilot-action-group">
            {isStreaming ? (
              <button className="copilot-stop-btn" onClick={onStop}>
                <Square size={14} style={{ fill: "currentColor" }} />
                Stop
              </button>
            ) : (
              <button
                className="copilot-send-btn"
                onClick={onSend}
                disabled={draft.trim().length < 2}
              >
                <Send size={14} />
                Send
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
