import React, { useState } from "react";
import { useCopilotContext } from "../../context/CopilotContext";
import {
  MessageSquare,
  Pin,
  Trash2,
  Edit2,
  Check,
  X,
  Search,
  Plus,
  Star
} from "lucide-react";

export const HistorySidebar: React.FC = () => {
  const {
    conversations,
    selectedConversation,
    isLoadingConversations,
    selectConversation,
    renameConversation,
    togglePinConversation,
    toggleFavoriteConversation,
    deleteConversation
  } = useCopilotContext();

  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedConversations = filteredConversations.filter((c) => c.pinned);
  const unpinnedConversations = filteredConversations.filter((c) => !c.pinned);

  const startEditing = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(id);
    setEditTitle(currentTitle);
  };

  const cancelEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const saveTitle = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editTitle.trim().length >= 2) {
      await renameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleNewChat = () => {
    selectConversation(null);
  };

  return (
    <aside className="copilot-sidebar">
      <div className="copilot-sidebar-header">
        <button className="copilot-new-chat-btn" onClick={handleNewChat}>
          <Plus size={18} />
          New Discussion
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
                <div className="copilot-sidebar-section-title">Pinned</div>
                {pinnedConversations.map((c) => (
                  <div
                    key={c.id}
                    className={`copilot-history-item ${selectedConversation?.id === c.id ? "active" : ""}`}
                    onClick={() => selectConversation(c.id)}
                  >
                    <div className="copilot-history-title-wrap">
                      <MessageSquare size={16} style={{ color: "var(--copilot-primary)", flexShrink: 0 }} />
                      {editingId === c.id ? (
                        <input
                          type="text"
                          className="copilot-history-title-input"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveTitle(c.id, e as any);
                            if (e.key === "Escape") cancelEditing(e as any);
                          }}
                        />
                      ) : (
                        <span className="copilot-history-title">{c.title}</span>
                      )}
                    </div>
                    
                    {editingId === c.id ? (
                      <div className="copilot-history-actions" style={{ opacity: 1 }}>
                        <button className="copilot-history-btn" onClick={(e) => saveTitle(c.id, e)}>
                          <Check size={14} />
                        </button>
                        <button className="copilot-history-btn" onClick={cancelEditing}>
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
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
                          className="copilot-history-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavoriteConversation(c.id);
                          }}
                          title="Favorite"
                        >
                          <Star size={14} style={{ fill: c.favorite ? "orange" : "none", color: c.favorite ? "orange" : "inherit" }} />
                        </button>
                        <button className="copilot-history-btn" onClick={(e) => startEditing(c.id, c.title, e)} title="Rename">
                          <Edit2 size={14} />
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
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Recent Section */}
            {unpinnedConversations.length > 0 && (
              <div className="copilot-sidebar-section">
                <div className="copilot-sidebar-section-title">History</div>
                {unpinnedConversations.map((c) => (
                  <div
                    key={c.id}
                    className={`copilot-history-item ${selectedConversation?.id === c.id ? "active" : ""}`}
                    onClick={() => selectConversation(c.id)}
                  >
                    <div className="copilot-history-title-wrap">
                      <MessageSquare size={16} style={{ flexShrink: 0 }} />
                      {editingId === c.id ? (
                        <input
                          type="text"
                          className="copilot-history-title-input"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveTitle(c.id, e as any);
                            if (e.key === "Escape") cancelEditing(e as any);
                          }}
                        />
                      ) : (
                        <span className="copilot-history-title">{c.title}</span>
                      )}
                    </div>

                    {editingId === c.id ? (
                      <div className="copilot-history-actions" style={{ opacity: 1 }}>
                        <button className="copilot-history-btn" onClick={(e) => saveTitle(c.id, e)}>
                          <Check size={14} />
                        </button>
                        <button className="copilot-history-btn" onClick={cancelEditing}>
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
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
                          className="copilot-history-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavoriteConversation(c.id);
                          }}
                          title="Favorite"
                        >
                          <Star size={14} style={{ fill: c.favorite ? "orange" : "none", color: c.favorite ? "orange" : "inherit" }} />
                        </button>
                        <button className="copilot-history-btn" onClick={(e) => startEditing(c.id, c.title, e)} title="Rename">
                          <Edit2 size={14} />
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
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
};

export default HistorySidebar;
