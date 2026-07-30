import React, { useState } from "react";
import { useCopilotContext } from "../../context/CopilotContext";
import {
  MessageSquare,
  Pin,
  Trash2,
  X,
  Search,
  Plus
} from "lucide-react";

export const HistorySidebar: React.FC = () => {
  const {
    conversations,
    selectedConversation,
    isLoadingConversations,
    selectConversation,
    togglePinConversation,
    deleteConversation,
    historyOpen,
    setHistoryOpen
  } = useCopilotContext();

  const [searchQuery, setSearchQuery] = useState("");

  // Helper to group conversations by date
  const groupConversationsByDate = (convs: typeof conversations) => {
    const today: typeof conversations = [];
    const yesterday: typeof conversations = [];
    const last7Days: typeof conversations = [];
    const older: typeof conversations = [];

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;
    const sevenDaysAgoStart = todayStart - 7 * 24 * 60 * 60 * 1000;

    convs.forEach((c) => {
      const time = new Date(
        c.updated_at ??
        c.created_at ??
        (c as any).updatedAt ??
        (c as any).createdAt ??
        Date.now()
      ).getTime();
      if (time >= todayStart) {
        today.push(c);
      } else if (time >= yesterdayStart) {
        yesterday.push(c);
      } else if (time >= sevenDaysAgoStart) {
        last7Days.push(c);
      } else {
        older.push(c);
      }
    });

    return { today, yesterday, last7Days, older };
  };

  const getTitleWithEmoji = (title: string) => {
    const t = title.toLowerCase();
    if (t.startsWith("🌾") || t.startsWith("☀️") || t.startsWith("🦠") || t.startsWith("📈") || t.startsWith("💬")) {
      return title;
    }
    if (t.includes("crop") || t.includes("soil") || t.includes("plant") || t.includes("fertilizer") || t.includes("seed") || t.includes("rice") || t.includes("clay")) {
      return `🌾 ${title}`;
    }
    if (t.includes("weather") || t.includes("rain") || t.includes("irrigation") || t.includes("temp") || t.includes("forecast")) {
      return `☀️ ${title}`;
    }
    if (t.includes("disease") || t.includes("leaf") || t.includes("pest") || t.includes("infection")) {
      return `🦠 ${title}`;
    }
    if (t.includes("price") || t.includes("market") || t.includes("mandi") || t.includes("commodity")) {
      return `📈 ${title}`;
    }
    return `💬 ${title}`;
  };

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedConversations = filteredConversations.filter((c) => c.pinned);
  const unpinnedConversations = filteredConversations.filter((c) => !c.pinned);

  const handleNewChat = () => {
    selectConversation(null);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className={`copilot-sidebar-backdrop${historyOpen ? " visible" : ""}`}
        onClick={() => setHistoryOpen(false)}
      />
      <aside className={`copilot-sidebar${historyOpen ? " copilot-sidebar-open" : ""}`}>
        <button
          className="copilot-sidebar-close-btn"
          onClick={() => setHistoryOpen(false)}
          type="button"
          aria-label="Close history"
        >
          <X size={18} />
        </button>
        <div className="copilot-sidebar-header">
        <button className="copilot-new-chat-btn" onClick={handleNewChat}>
          <Plus size={18} />
          New Chat
        </button>
        <div className="copilot-sidebar-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="copilot-sidebar-scroll">
        {isLoadingConversations && conversations.length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px", color: "var(--copilot-text-muted)", fontSize: "13px" }}>
            Loading history...
          </div>
        ) : filteredConversations.length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px", color: "var(--copilot-text-muted)", fontSize: "13px" }}>
            No conversations found
          </div>
        ) : (
          <>
            {/* Pinned Section */}
            {pinnedConversations.length > 0 && (
              <div className="copilot-sidebar-section">
                <div className="copilot-sidebar-section-title">Pinned ({pinnedConversations.length}/5)</div>
                {pinnedConversations.map((c) => (
                  <div
                    key={c.id}
                    className={`copilot-history-item ${selectedConversation?.id === c.id ? "active" : ""}`}
                    onClick={() => selectConversation(c.id)}
                  >
                    <div className="copilot-history-title-wrap">
                      <MessageSquare size={16} style={{ color: "var(--copilot-primary)", flexShrink: 0 }} />
                      <span className="copilot-history-title">{getTitleWithEmoji(c.title)}</span>
                    </div>
                    
                    <div className="copilot-history-actions">
                      <button
                        className="copilot-history-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePinConversation(c.id);
                        }}
                        title="Unpin"
                      >
                        <Pin size={14} style={{ fill: "var(--copilot-primary)" }} />
                      </button>
                      <button
                        className="copilot-history-btn delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation(c.id);
                        }}
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Grouped Recent Conversations */}
            {(() => {
              const { today, yesterday, last7Days, older } = groupConversationsByDate(unpinnedConversations);
              
              const renderSection = (sectionTitle: string, list: typeof unpinnedConversations) => {
                if (list.length === 0) return null;
                return (
                  <div className="copilot-sidebar-section">
                    <div className="copilot-sidebar-section-title">{sectionTitle}</div>
                    {list.map((c) => (
                      <div
                        key={c.id}
                        className={`copilot-history-item ${selectedConversation?.id === c.id ? "active" : ""}`}
                        onClick={() => selectConversation(c.id)}
                      >
                        <div className="copilot-history-title-wrap">
                          <MessageSquare size={16} style={{ flexShrink: 0 }} />
                          <span className="copilot-history-title">{getTitleWithEmoji(c.title)}</span>
                        </div>

                        <div className="copilot-history-actions">
                          <button
                            className="copilot-history-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePinConversation(c.id);
                            }}
                            title="Pin"
                          >
                            <Pin size={14} />
                          </button>
                          <button
                            className="copilot-history-btn delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteConversation(c.id);
                            }}
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              };

              return (
                <>
                  {renderSection("Today", today)}
                  {renderSection("Yesterday", yesterday)}
                  {renderSection("Last 7 Days", last7Days)}
                  {renderSection("Older", older)}
                </>
              );
            })()}
          </>
        )}
      </div>
    </aside>
    </>
  );
};

export default HistorySidebar;
