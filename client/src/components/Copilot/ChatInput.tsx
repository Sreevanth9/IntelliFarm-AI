import React, { useRef, useEffect, useState } from "react";
import { Image, Paperclip, Send, Square, X, Mic } from "lucide-react";
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

  const [voiceState, setVoiceState] = useState<'idle' | 'listening' | 'processing'>('idle');
  const [voiceLang, setVoiceLang] = useState<string>('en-IN');
  const [micError, setMicError] = useState<string | null>(null);

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

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMicError("Speech recognition is not supported in this browser. Please use Chrome or Safari.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = voiceLang;

      recognition.onstart = () => {
        setVoiceState('listening');
        setMicError(null);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        if (event.error === 'not-allowed') {
          setMicError("Microphone access denied. Please enable microphone permissions in your browser settings.");
        } else {
          setMicError(`Voice error: ${event.error}`);
        }
        setVoiceState('idle');
      };

      recognition.onend = () => {
        setVoiceState('idle');
      };

      recognition.onresult = (event: any) => {
        setVoiceState('processing');
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          const space = draft ? " " : "";
          setDraft(draft + space + transcript);
        }
      };

      recognition.start();
    } catch (e: any) {
      console.error(e);
      setVoiceState('idle');
    }
  };

  return (
    <div className="copilot-input-area">
      <div className="copilot-input-wrapper">
        {/* Voice Status Indicator Banner */}
        {voiceState !== 'idle' && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", background: "rgba(46, 125, 50, 0.08)", borderRadius: "8px", marginBottom: "8px", fontSize: "13px", color: "var(--copilot-primary)" }}>
            {voiceState === 'listening' ? (
              <>
                <span className="animate-pulse" style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#ff3b30" }}></span>
                <span>Listening... Speak now in your selected language.</span>
              </>
            ) : (
              <>
                <span className="animate-spin" style={{ display: "inline-block", width: "8px", height: "8px", border: "2px solid var(--copilot-primary)", borderTopColor: "transparent", borderRadius: "50%" }}></span>
                <span>Converting speech to text...</span>
              </>
            )}
          </div>
        )}
        {micError && (
          <div style={{ padding: "8px 12px", background: "rgba(255, 59, 48, 0.08)", borderRadius: "8px", marginBottom: "8px", fontSize: "13px", color: "#ff3b30" }}>
            ⚠️ {micError}
          </div>
        )}

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
            placeholder="Ask Spryzen AI anything about soil, weather, fertilizers..."
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming || voiceState !== 'idle'}
          />
        </div>

        <div className="copilot-input-actions">
          <div className="copilot-action-group">
            <button
              className="copilot-icon-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={isStreaming || voiceState !== 'idle'}
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

          <div className="copilot-action-group" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* Language Selector */}
            <select
              value={voiceLang}
              onChange={(e) => setVoiceLang(e.target.value)}
              disabled={isStreaming || voiceState !== 'idle'}
              style={{
                fontSize: "12px",
                padding: "4px 8px",
                borderRadius: "8px",
                background: "var(--copilot-sidebar-bg)",
                border: "1px solid var(--copilot-border)",
                color: "var(--copilot-text-muted)",
                cursor: "pointer",
                outline: "none"
              }}
              title="Language for speech recognition"
            >
              <option value="en-IN">English (India)</option>
              <option value="te-IN">Telugu (తెలుగు)</option>
              <option value="hi-IN">Hindi (हिन्दी)</option>
              <option value="ta-IN">Tamil (தமிழ்)</option>
              <option value="kn-IN">Kannada (ಕನ್ನಡ)</option>
            </select>

            {/* Mic Button */}
            <button
              className={`copilot-icon-btn ${voiceState === 'listening' ? 'active-pulse' : ''}`}
              onClick={startListening}
              disabled={isStreaming || voiceState === 'processing'}
              style={{
                color: voiceState === 'listening' ? '#ff3b30' : 'inherit',
                backgroundColor: voiceState === 'listening' ? 'rgba(255, 59, 48, 0.08)' : 'transparent',
                borderRadius: "50%",
                padding: "6px"
              }}
              title="Speak (Voice to Text)"
            >
              <Mic size={18} />
            </button>

            {isStreaming ? (
              <button className="copilot-stop-btn" onClick={onStop}>
                <Square size={14} style={{ fill: "currentColor" }} />
                Stop
              </button>
            ) : (
              <button
                className="copilot-send-btn"
                onClick={onSend}
                disabled={draft.trim().length < 2 || voiceState !== 'idle'}
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
