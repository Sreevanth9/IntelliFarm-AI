import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { chatAction } from "../store/chat";
import { sendChatData, getChat, getRecentChat } from "../store/chat-action";
import toast from "react-hot-toast";

const FloatingChat: React.FC = () => {
  const dispatch = useDispatch();
  
  // UI states
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "recent" | "pins">("chat");
  const [userInput, setUserInput] = useState("");
  
  // Redux selectors
  const rawChats = useSelector((state: any) => state.chat.chats);
  const chats = React.useMemo(() => rawChats || [], [rawChats]);
  const recentChats = useSelector((state: any) => state.chat.recentChat) || [];
  const chatHistoryId = useSelector((state: any) => state.chat.chatHistoryId);
  const previousChat = useSelector((state: any) => state.chat.previousChat);
  const isLoader = useSelector((state: any) => state.chat.isLoader) === "yes" || chats.some((c: any) => c.isLoader === "yes");
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chats, isLoader]);

  // Fetch recent chats on drawer open
  useEffect(() => {
    if (isOpen) {
      dispatch(getRecentChat() as any);
    }
  }, [isOpen, dispatch]);

  const startNewChat = () => {
    dispatch(chatAction.replaceChat({ chats: [] }));
    dispatch(chatAction.newChatHandler());
    dispatch(chatAction.chatHistoryIdHandler({ chatHistoryId: "" }));
    setActiveTab("chat");
    toast.success("Started a new conversation");
  };

  const handleRecentClick = (id: string) => {
    dispatch(chatAction.chatHistoryIdHandler({ chatHistoryId: id }));
    dispatch(getChat(id) as any);
    setActiveTab("chat");
  };

  const handleSendMessage = (textToSend: string) => {
    if (!textToSend.trim()) return;
    dispatch(
      sendChatData({
        user: textToSend,
        gemini: "",
        isLoader: "yes",
        previousChat,
        chatHistoryId,
      }) as any
    );
    setUserInput("");
    setActiveTab("chat");
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(userInput);
  };

  const pinnedRecommendations = [
    {
      title: "🌾 Paddy Disease Prevention",
      prompt: "What are the organic prevention techniques for Paddy blast disease?",
    },
    {
      title: "🍅 Tomato Blight Action Plan",
      prompt: "What is the best immediate spray action for early tomato blight?",
    },
    {
      title: "💧 Drip Irrigation Schedule",
      prompt: "Suggest a weekly drip irrigation watering schedule for medium clay soil.",
    },
    {
      title: "📈 Best Crop to Sell Now",
      prompt: "Based on current market trends, which crops are showing the highest gain margins?",
    }
  ];

  return (
    <div style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 1000, fontFamily: "inherit" }}>
      
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: "60px",
          height: "60px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)",
          color: "white",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          cursor: "pointer",
          boxShadow: "0 8px 32px rgba(46, 125, 50, 0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "24px",
          transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
          transform: isOpen ? "rotate(90deg)" : "none",
        }}
        title="AI Assistant"
      >
        {isOpen ? "✕" : "💬"}
      </button>

      {/* Sliding Drawer Container */}
      <div
        className="liquid-glass-panel"
        style={{
          position: "fixed",
          right: isOpen ? "24px" : "-450px",
          bottom: "96px",
          width: "380px",
          height: "calc(100vh - 160px)",
          maxHeight: "600px",
          borderRadius: "20px",
          boxShadow: "0 12px 40px rgba(0, 0, 0, 0.4)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          transition: "all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)",
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          padding: 0,
          background: "rgba(8, 28, 21, 0.95)",
          border: "1px solid rgba(255, 255, 255, 0.08)"
        }}
      >
        {/* Header Section */}
        <div
          style={{
            padding: "16px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(255, 255, 255, 0.02)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "20px" }}>🤖</span>
            <div>
              <h4 style={{ margin: 0, color: "#fff", fontSize: "15px", fontWeight: 700 }}>Crop Intelligence AI</h4>
              <span style={{ fontSize: "11px", color: "#52b788" }}>Online • Powered by Gemini</span>
            </div>
          </div>
          <button
            onClick={startNewChat}
            style={{
              padding: "6px 12px",
              background: "rgba(82, 183, 136, 0.15)",
              color: "#52b788",
              border: "1px solid rgba(82, 183, 136, 0.3)",
              borderRadius: "12px",
              fontSize: "12px",
              cursor: "pointer",
              fontWeight: 600,
              transition: "all 0.2s"
            }}
          >
            + New Chat
          </button>
        </div>

        {/* Navigation Tabs */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
            background: "rgba(0, 0, 0, 0.1)"
          }}
        >
          <button
            onClick={() => setActiveTab("chat")}
            style={{
              flex: 1,
              padding: "10px",
              background: "transparent",
              color: activeTab === "chat" ? "#52b788" : "#8e918f",
              border: "none",
              borderBottom: activeTab === "chat" ? "2px solid #52b788" : "2px solid transparent",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 600
            }}
          >
            New Chat
          </button>
          <button
            onClick={() => setActiveTab("recent")}
            style={{
              flex: 1,
              padding: "10px",
              background: "transparent",
              color: activeTab === "recent" ? "#52b788" : "#8e918f",
              border: "none",
              borderBottom: activeTab === "recent" ? "2px solid #52b788" : "2px solid transparent",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 600
            }}
          >
            Recent Chats
          </button>
          <button
            onClick={() => setActiveTab("pins")}
            style={{
              flex: 1,
              padding: "10px",
              background: "transparent",
              color: activeTab === "pins" ? "#52b788" : "#8e918f",
              border: "none",
              borderBottom: activeTab === "pins" ? "2px solid #52b788" : "2px solid transparent",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 600
            }}
          >
            Recommendations
          </button>
        </div>

        {/* Tab Contents */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px" }} ref={scrollRef}>
          
          {activeTab === "chat" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px", minHeight: "100%" }}>
              {chats.length === 0 ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, textAlign: "center", opacity: 0.6, padding: "20px" }}>
                  <span style={{ fontSize: "36px", marginBottom: "12px" }}>🌾</span>
                  <h5 style={{ margin: "0 0 8px 0", color: "#fff", fontSize: "14px" }}>Ask your Crop Companion</h5>
                  <p style={{ margin: 0, fontSize: "12px", lineHeight: "1.4" }}>
                    Inquire about soil nutrients, crop diseases, dynamic weather impact, or mandi commodity prices.
                  </p>
                </div>
              ) : (
                chats.map((c: any, index: number) => (
                  <div key={c.id || index} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    {/* User message */}
                    {c.user && (
                      <div style={{ alignSelf: "flex-end", background: "rgba(46, 125, 50, 0.25)", color: "#fff", padding: "8px 12px", borderRadius: "14px 14px 2px 14px", maxWidth: "85%", fontSize: "13px", border: "1px solid rgba(46, 125, 50, 0.15)" }}>
                        {c.user}
                      </div>
                    )}
                    {/* Gemini response */}
                    {c.gemini && (
                      <div style={{ alignSelf: "flex-start", background: "rgba(255, 255, 255, 0.05)", color: "#e9f6e8", padding: "10px 12px", borderRadius: "14px 14px 14px 2px", maxWidth: "85%", fontSize: "13px", border: "1px solid rgba(255, 255, 255, 0.05)", lineHeight: "1.4" }}>
                        <div dangerouslySetInnerHTML={{ __html: c.gemini
                          .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                          .replace(/\n/g, "<br/>") }} 
                        />
                      </div>
                    )}
                  </div>
                ))
              )}

              {/* Loader inside message list */}
              {isLoader && (
                <div style={{ alignSelf: "flex-start", background: "rgba(255, 255, 255, 0.05)", padding: "10px 12px", borderRadius: "14px 14px 14px 2px", border: "1px solid rgba(255, 255, 255, 0.05)", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", background: "#52b788", animation: "bounce 1.4s infinite ease-in-out both" }}></span>
                  <span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", background: "#52b788", animation: "bounce 1.4s infinite ease-in-out both", animationDelay: "0.2s" }}></span>
                  <span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", background: "#52b788", animation: "bounce 1.4s infinite ease-in-out both", animationDelay: "0.4s" }}></span>
                </div>
              )}
            </div>
          )}

          {activeTab === "recent" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {recentChats.length === 0 ? (
                <p style={{ textAlign: "center", opacity: 0.5, fontSize: "13px", padding: "20px" }}>No recent chats found.</p>
              ) : (
                recentChats.map((chat: any) => (
                  <button
                    key={chat._id}
                    onClick={() => handleRecentClick(chat._id)}
                    style={{
                      width: "100%",
                      padding: "12px",
                      background: chatHistoryId === chat._id ? "rgba(46, 125, 50, 0.15)" : "rgba(255,255,255,0.02)",
                      color: "#fff",
                      border: "1px solid",
                      borderColor: chatHistoryId === chat._id ? "rgba(46, 125, 50, 0.3)" : "rgba(255,255,255,0.06)",
                      borderRadius: "12px",
                      textAlign: "left",
                      cursor: "pointer",
                      fontSize: "13px",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      transition: "all 0.2s"
                    }}
                  >
                    <span>💬</span>
                    <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {chat.title}
                    </span>
                    <span style={{ fontSize: "10px", opacity: 0.5 }}>
                      {new Date(chat.createdAt || Date.now()).toLocaleDateString()}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}

          {activeTab === "pins" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <h5 style={{ margin: "0 0 4px 0", color: "#fff", fontSize: "13px" }}>Pinned Recommendations</h5>
              {pinnedRecommendations.map((pin, index) => (
                <button
                  key={index}
                  onClick={() => handleSendMessage(pin.prompt)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: "rgba(255,255,255,0.02)",
                    color: "#e9f6e8",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                    borderRadius: "12px",
                    textAlign: "left",
                    cursor: "pointer",
                    fontSize: "13px",
                    transition: "all 0.2s",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(46, 125, 50, 0.08)";
                    e.currentTarget.style.borderColor = "rgba(46, 125, 50, 0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.06)";
                  }}
                >
                  <span style={{ fontWeight: 600, color: "#fff" }}>{pin.title}</span>
                  <span style={{ fontSize: "11px", opacity: 0.7 }}>{pin.prompt}</span>
                </button>
              ))}
            </div>
          )}

        </div>

        {/* Input Bar Footer */}
        {activeTab === "chat" && (
          <form
            onSubmit={onSubmit}
            style={{
              padding: "12px 16px",
              borderTop: "1px solid rgba(255, 255, 255, 0.08)",
              background: "rgba(0, 0, 0, 0.15)",
              display: "flex",
              gap: "8px"
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
                padding: "10px 14px",
                background: "rgba(0,0,0,0.3)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "12px",
                color: "#white",
                fontSize: "13px",
                outline: "none"
              }}
            />
            <button
              type="submit"
              disabled={isLoader}
              style={{
                padding: "10px 16px",
                background: "linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)",
                border: "none",
                borderRadius: "12px",
                color: "white",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "13px"
              }}
            >
              Send
            </button>
          </form>
        )}

      </div>
      
      {/* Styles for loading animation */}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1.0); }
        }
      `}</style>
    </div>
  );
};

export default FloatingChat;
