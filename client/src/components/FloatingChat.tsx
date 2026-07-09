import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { chatAction } from "../store/chat";
import { deleteChatHistory, getChat, getRecentChat, sendChatData } from "../store/chat-action";
import chatbotLogo from "../assets/chatbot-logo.png";

const formatBotReply = (reply = "") =>
  reply
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br/>");

const getChatId = (chat: any) => chat?._id || chat?.id;
const getChatDate = (chat: any) => chat?.createdAt || chat?.timestamp || chat?.updatedAt;

const FloatingChat: React.FC = () => {
  const dispatch = useDispatch();
  const [isOpen, setIsOpen] = useState(false);
  const [userInput, setUserInput] = useState("");

  const rawChats = useSelector((state: any) => state.chat.chats);
  const chats = useMemo(() => rawChats || [], [rawChats]);
  const recentChats = useSelector((state: any) => state.chat.recentChat) || [];
  const chatHistoryId = useSelector((state: any) => state.chat.chatHistoryId);
  const previousChat = useSelector((state: any) => state.chat.previousChat);
  const isLoader =
    useSelector((state: any) => state.chat.isLoader) === "yes" ||
    chats.some((c: any) => c.isLoader === "yes");

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chats, isLoader, isOpen]);

  useEffect(() => {
    if (isOpen) {
      dispatch(getRecentChat() as any);
    }
  }, [isOpen, dispatch]);

  const startNewChat = () => {
    dispatch(chatAction.replaceChat({ chats: [] }));
    dispatch(chatAction.replacePreviousChat({ previousChat: [] }));
    dispatch(chatAction.chatHistoryIdHandler({ chatHistoryId: "" }));
    dispatch(chatAction.newChatHandler());
    toast.success("Started a new conversation");
  };

  const handleRecentClick = (id: string) => {
    if (!id) return;
    dispatch(chatAction.chatHistoryIdHandler({ chatHistoryId: id }));
    dispatch(getChat(id) as any);
  };

  const handleDeleteHistory = (id: string, event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (!id) return;

    dispatch(deleteChatHistory(id) as any)
      .then(() => toast.success("Chat history deleted"))
      .catch(() => toast.error("Could not delete this chat"));
  };

  const handleSendMessage = (textToSend: string) => {
    const trimmedText = textToSend.trim();
    if (!trimmedText || isLoader) return;

    dispatch(
      sendChatData({
        user: trimmedText,
        gemini: "",
        isLoader: "yes",
        previousChat,
        chatHistoryId,
      }) as any
    );
    setUserInput("");
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(userInput);
  };

  const quickPrompts = [
    "Recommend crop for my field",
    "Will it rain tomorrow?",
    "Best organic pest control for tomato plants",
  ];

  return (
    <div style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 1000, fontFamily: "inherit" }}>
      <button
        onClick={() => setIsOpen((current) => !current)}
        style={{
          width: "64px",
          height: "64px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #f7fff8 0%, #dff8e7 100%)",
          border: "1px solid rgba(46, 125, 50, 0.22)",
          cursor: "pointer",
          boxShadow: "0 10px 34px rgba(46, 125, 50, 0.28)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.25s ease",
          padding: isOpen ? "0" : "10px",
        }}
        title="AI Assistant"
        aria-label={isOpen ? "Close AI Assistant" : "Open AI Assistant"}
      >
        {isOpen ? (
          <span style={{ color: "#1b5e20", fontSize: "28px", lineHeight: 1 }}>x</span>
        ) : (
          <img
            src={chatbotLogo}
            alt="AI Assistant"
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        )}
      </button>

      <div
        className="liquid-glass-panel ifarm-floating-chat-panel"
        style={{
          position: "fixed",
          right: isOpen ? "24px" : "-760px",
          bottom: "100px",
          width: "min(720px, calc(100vw - 32px))",
          height: "min(640px, calc(100vh - 136px))",
          borderRadius: "18px",
          boxShadow: "0 18px 50px rgba(0, 0, 0, 0.36)",
          display: "grid",
          gridTemplateColumns: "220px minmax(0, 1fr)",
          overflow: "hidden",
          transition: "all 0.35s ease",
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          padding: 0,
          background: "rgba(8, 28, 21, 0.97)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        <aside
          style={{
            borderRight: "1px solid rgba(255, 255, 255, 0.08)",
            background: "rgba(0, 0, 0, 0.16)",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          <div style={{ padding: "16px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <button
              type="button"
              onClick={startNewChat}
              style={{
                width: "100%",
                padding: "10px 12px",
                background: "rgba(82, 183, 136, 0.15)",
                color: "#d8ffe9",
                border: "1px solid rgba(82, 183, 136, 0.3)",
                borderRadius: "12px",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: "13px",
              }}
            >
              + New Chat
            </button>
          </div>

          <div style={{ padding: "14px 12px 8px", color: "#8dd7ad", fontSize: "11px", fontWeight: 800, letterSpacing: "0.02em", textTransform: "uppercase" }}>
            Chat History
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "0 10px 14px", display: "flex", flexDirection: "column", gap: "8px" }}>
            {recentChats.length === 0 ? (
              <p style={{ color: "rgba(233, 246, 232, 0.56)", fontSize: "12px", lineHeight: 1.5, margin: "6px 4px" }}>
                Your saved conversations will appear here.
              </p>
            ) : (
              recentChats.map((chat: any) => {
                const id = getChatId(chat);
                const isActive = chatHistoryId === id;
                return (
                  <div
                    key={id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleRecentClick(id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        handleRecentClick(id);
                      }
                    }}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "10px",
                      background: isActive ? "rgba(82, 183, 136, 0.18)" : "rgba(255,255,255,0.035)",
                      color: "#fff",
                      border: "1px solid",
                      borderColor: isActive ? "rgba(82, 183, 136, 0.34)" : "rgba(255,255,255,0.06)",
                      borderRadius: "12px",
                      textAlign: "left",
                      cursor: "pointer",
                      display: "flex",
                      gap: "8px",
                      alignItems: "flex-start",
                    }}
                  >
                    <img src={chatbotLogo} alt="" style={{ width: "20px", height: "20px", objectFit: "contain", flexShrink: 0 }} />
                    <span style={{ minWidth: 0, flex: 1 }}>
                      <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "12px", fontWeight: 700 }}>
                        {chat.title || "Farming chat"}
                      </span>
                      <span style={{ display: "block", marginTop: "3px", fontSize: "10px", color: "rgba(233,246,232,0.55)" }}>
                        {getChatDate(chat) ? new Date(getChatDate(chat)).toLocaleDateString() : "Recent"}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={(event) => handleDeleteHistory(id, event)}
                      title="Delete this chat"
                      aria-label="Delete this chat"
                      style={{
                        width: "24px",
                        height: "24px",
                        border: "0",
                        borderRadius: "7px",
                        background: "rgba(255,255,255,0.04)",
                        color: "rgba(233,246,232,0.62)",
                        cursor: "pointer",
                        lineHeight: 1,
                        flexShrink: 0,
                      }}
                    >
                      x
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        <section style={{ minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column" }}>
          <header
            style={{
              padding: "14px 16px",
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: "rgba(255, 255, 255, 0.02)",
            }}
          >
            <img src={chatbotLogo} alt="Crop Intelligence AI" style={{ width: "36px", height: "36px", objectFit: "contain" }} />
            <div>
              <h4 style={{ margin: 0, color: "#fff", fontSize: "15px", fontWeight: 800 }}>Crop Intelligence AI</h4>
              <span style={{ fontSize: "11px", color: "#52b788" }}>Online - Powered by IntelliFarm AI</span>
            </div>
          </header>

          <div ref={scrollRef} style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>
            {chats.length === 0 ? (
              <div style={{ margin: "auto", maxWidth: "340px", textAlign: "center", color: "rgba(233, 246, 232, 0.72)" }}>
                <img src={chatbotLogo} alt="AI Assistant" style={{ width: "78px", height: "78px", objectFit: "contain", marginBottom: "12px" }} />
                <h5 style={{ margin: "0 0 8px 0", color: "#fff", fontSize: "15px" }}>Ask your Crop Companion</h5>
                <p style={{ margin: 0, fontSize: "12px", lineHeight: 1.5 }}>
                  Ask about soil nutrients, crop diseases, weather impact, irrigation, or market prices.
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "8px", marginTop: "16px" }}>
                  {quickPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => handleSendMessage(prompt)}
                      style={{
                        border: "1px solid rgba(82, 183, 136, 0.22)",
                        background: "rgba(82, 183, 136, 0.1)",
                        color: "#d8ffe9",
                        borderRadius: "999px",
                        padding: "7px 10px",
                        fontSize: "11px",
                        cursor: "pointer",
                      }}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              chats.map((c: any, index: number) => (
                <div key={c.id || index} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {c.user && (
                    <div style={{ alignSelf: "flex-end", background: "rgba(46, 125, 50, 0.28)", color: "#fff", padding: "9px 12px", borderRadius: "14px 14px 2px 14px", maxWidth: "82%", fontSize: "13px", border: "1px solid rgba(46, 125, 50, 0.18)", lineHeight: 1.45 }}>
                      {c.user}
                    </div>
                  )}
                  {(c.gemini || c.isLoader === "yes") && (
                    <div style={{ alignSelf: "flex-start", display: "flex", gap: "8px", maxWidth: "88%" }}>
                      <img src={chatbotLogo} alt="AI Assistant" style={{ width: "26px", height: "26px", objectFit: "contain", flexShrink: 0, marginTop: "2px" }} />
                      <div style={{ background: "rgba(255, 255, 255, 0.055)", color: "#e9f6e8", padding: "10px 12px", borderRadius: "14px 14px 14px 2px", fontSize: "13px", border: "1px solid rgba(255, 255, 255, 0.06)", lineHeight: 1.45 }}>
                        {c.isLoader === "yes" ? (
                          <span style={{ display: "inline-flex", gap: "5px", alignItems: "center" }}>
                            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#52b788", animation: "ifarmBounce 1.4s infinite ease-in-out both" }} />
                            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#52b788", animation: "ifarmBounce 1.4s infinite ease-in-out both", animationDelay: "0.2s" }} />
                            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#52b788", animation: "ifarmBounce 1.4s infinite ease-in-out both", animationDelay: "0.4s" }} />
                          </span>
                        ) : (
                          <div dangerouslySetInnerHTML={{ __html: formatBotReply(c.gemini) }} />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          <form
            onSubmit={onSubmit}
            style={{
              padding: "12px 16px",
              borderTop: "1px solid rgba(255, 255, 255, 0.08)",
              background: "rgba(0, 0, 0, 0.15)",
              display: "flex",
              gap: "8px",
            }}
          >
            <input
              type="text"
              placeholder="Ask AI..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              disabled={isLoader}
              style={{
                flex: 1,
                minWidth: 0,
                padding: "10px 14px",
                background: "rgba(0,0,0,0.3)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "12px",
                color: "#ffffff",
                fontSize: "13px",
                outline: "none",
              }}
            />
            <button
              type="submit"
              disabled={isLoader || !userInput.trim()}
              style={{
                padding: "10px 16px",
                background: isLoader || !userInput.trim() ? "rgba(82, 183, 136, 0.25)" : "linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)",
                border: "none",
                borderRadius: "12px",
                color: "white",
                cursor: isLoader || !userInput.trim() ? "not-allowed" : "pointer",
                fontWeight: 700,
                fontSize: "13px",
              }}
            >
              Send
            </button>
          </form>
        </section>
      </div>

      <style>{`
        @keyframes ifarmBounce {
          0%, 80%, 100% { transform: scale(0); opacity: 0.45; }
          40% { transform: scale(1); opacity: 1; }
        }
        @media (max-width: 640px) {
          .ifarm-floating-chat-panel {
            grid-template-columns: 1fr !important;
          }
          .ifarm-floating-chat-panel aside {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default FloatingChat;
