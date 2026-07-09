import { Link, NavLink, Route, Routes, useNavigate } from "react-router-dom";
import InputSection from "../InputSection/InputSection";
import NewChat from "../NewChat/NewChat";
import styles from "./ChatSection.module.css";
import { useDispatch, useSelector } from "react-redux";
import ScrollChat from "../NewChat/ScrollChat/ScrollChat";
import Loader from "../Ui/Loader";
import { chatAction } from "../../store/chat";
import { deleteChatHistory } from "../../store/chat-action";
import { commonIcon } from "../../assets";
import { useState } from "react";
import {
  CloudSun,
  Leaf,
  MessageSquareText,
  Plus,
  TrendingUp,
  Award,
  Compass,
  ChevronRight,
  ChevronLeft,
  X,
  Search,
  LayoutDashboard,
  Sprout,
  Droplets,
  ScanSearch,
  Trash2,
  FlaskConical,
} from "lucide-react";
import toast from "react-hot-toast";

const assistantSections = [
  { label: "Dashboard", route: "/dashboard", icon: LayoutDashboard },
  { label: "My Farms", route: "/farms", icon: Sprout },
  { label: "Weather", route: "/weather", icon: CloudSun },
  { label: "Disease Scan", route: "/disease-detection", icon: ScanSearch },
  { label: "Fertilizer", route: "/fertilizer", icon: FlaskConical },
  { label: "Irrigation", route: "/irrigation", icon: Droplets },
  { label: "Schemes", route: "/schemes", icon: Award },
];

const ChatSection = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isLoader = useSelector((state) => state.chat.isLoader);
  const recentChat = useSelector((state) => state.chat.recentChat);
  const chatHistoryId = useSelector((state) => state.chat.chatHistoryId);
  const user = useSelector((state) => state.user.user);

  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const newChatHandler = () => {
    dispatch(chatAction.replaceChat({ chats: [] }));
    dispatch(chatAction.replacePreviousChat({ previousChat: [] }));
    dispatch(chatAction.chatHistoryIdHandler({ chatHistoryId: "" }));
    dispatch(chatAction.newChatHandler());
    navigate("/assistant");
  };

  const deleteHistoryHandler = (chat, event) => {
    event.preventDefault();
    event.stopPropagation();

    const id = chat._id || chat.id;
    if (!id) return;

    dispatch(deleteChatHistory(id))
      .then(() => {
        toast.success("Chat history deleted");
        if (chatHistoryId === id) {
          navigate("/assistant");
        }
      })
      .catch(() => toast.error("Could not delete this chat"));
  };

  const quickActionHandler = (promptText) => {
    dispatch(chatAction.replaceChat({ chats: [] }));
    dispatch(chatAction.replacePreviousChat({ previousChat: [] }));
    dispatch(chatAction.chatHistoryIdHandler({ chatHistoryId: "" }));
    dispatch(chatAction.newChatHandler());
    dispatch(chatAction.suggestPromptHandler({ prompt: promptText }));
    navigate("/assistant");
  };

  // Group chats by date
  const groupRecentChats = (chatsList) => {
    const today = [];
    const yesterday = [];
    const lastWeek = [];

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    const startOfLastWeek = new Date(startOfToday);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

    chatsList.forEach((chat) => {
      const chatDate = new Date(chat.timestamp || chat.createdAt || new Date());
      if (chatDate >= startOfToday) {
        today.push(chat);
      } else if (chatDate >= startOfYesterday) {
        yesterday.push(chat);
      } else {
        lastWeek.push(chat);
      }
    });

    return { today, yesterday, lastWeek };
  };

  const filteredRecentChats = (recentChat || []).filter((chat) =>
    (chat.title || "Farming chat").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const { today, yesterday, lastWeek } = groupRecentChats(filteredRecentChats);

  const renderChatLink = (chat) => {
    const id = chat._id || chat.id;
    return (
      <div
        key={id}
        className={`${styles["recent-row"]} ${
          chatHistoryId === id ? styles["recent-link-active"] : ""
        }`}
      >
        <Link to={`/assistant/app/${id}`} className={styles["recent-link"]}>
          <MessageSquareText size={15} />
          <span>{chat.title || "Farming chat"}</span>
        </Link>
        <button
          type="button"
          className={styles["history-delete-btn"]}
          onClick={(event) => deleteHistoryHandler(chat, event)}
          title="Delete this chat"
          aria-label="Delete this chat"
        >
          <Trash2 size={13} />
        </button>
      </div>
    );
  };

  const userLogo = user?.profileImg || commonIcon.avatarIcon;

  return (
    <div className={styles["chat-section-main"]}>
      <aside className={`${styles["assistant-sidebar"]} ${!isLeftPanelOpen ? styles["sidebar-hidden"] : ""}`}>
        {/* Sidebar Header: Dropdown Title, New Chat & Collapse */}
        <div className={styles["sidebar-header-row"]}>
          <span className={styles["sidebar-copilot-title"]}>IntelliFarm Copilot</span>
          <div style={{ display: "flex", gap: "6px" }}>
            <button
              type="button"
              className={styles["sidebar-new-chat-icon-btn"]}
              onClick={newChatHandler}
              title="New Chat"
            >
              <Plus size={16} />
            </button>
            <button
              type="button"
              className={styles["sidebar-new-chat-icon-btn"]}
              onClick={() => setIsLeftPanelOpen(false)}
              title="Hide Sidebar"
            >
              <ChevronLeft size={16} />
            </button>
          </div>
        </div>

        <nav className={styles["assistant-section-nav"]} aria-label="Assistant sections">
          <div className={styles["section-nav-title"]}>Workspace</div>
          {assistantSections.map((section) => {
            const Icon = section.icon;
            return (
              <NavLink
                key={section.route}
                to={section.route}
                className={({ isActive }) =>
                  `${styles["section-nav-link"]} ${isActive ? styles["section-nav-link-active"] : ""}`
                }
              >
                <Icon size={15} />
                <span>{section.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Local Chat Search */}
        <div className={styles["sidebar-search-container"]}>
          <Search size={14} className={styles["search-icon"]} />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles["sidebar-search-input"]}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className={styles["search-clear-btn"]}
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Dynamic Conversation History grouped like ChatGPT */}
        <div className={styles["recent-panel"]}>
          <div className={styles["recent-list"]}>
            {filteredRecentChats?.length ? (
              <>
                {today.length > 0 && (
                  <div className={styles["history-group"]}>
                    <div className={styles["history-heading"]}>Today</div>
                    {today.map(renderChatLink)}
                  </div>
                )}
                {yesterday.length > 0 && (
                  <div className={styles["history-group"]}>
                    <div className={styles["history-heading"]}>Yesterday</div>
                    {yesterday.map(renderChatLink)}
                  </div>
                )}
                {lastWeek.length > 0 && (
                  <div className={styles["history-group"]}>
                    <div className={styles["history-heading"]}>Last Week</div>
                    {lastWeek.map(renderChatLink)}
                  </div>
                )}
              </>
            ) : (
              <p className={styles["recent-empty"]}>
                {searchQuery ? "No matches found." : "Your saved conversations will appear here."}
              </p>
            )}
          </div>
        </div>

        {/* Sidebar GPTs / Quick Actions */}
        <div className={styles["assistant-tools-section"]}>
          <div className={styles["tools-title"]}>Farming Tools</div>
          <div className={styles["assistant-tools"]}>
            <button
              onClick={() => quickActionHandler("Recommend crop for my field")}
              className={styles["tool-chip-btn"]}
            >
              <Leaf size={13} /> Crop Diagnosis
            </button>
            <button
              onClick={() => quickActionHandler("Will it rain tomorrow?")}
              className={styles["tool-chip-btn"]}
            >
              <CloudSun size={13} /> Weather
            </button>
            <button
              onClick={() => quickActionHandler("What is the best market to sell paddy?")}
              className={styles["tool-chip-btn"]}
            >
              <TrendingUp size={13} /> Market Prices
            </button>
            <button
              onClick={() => quickActionHandler("Active government schemes for small farmers")}
              className={styles["tool-chip-btn"]}
            >
              <Award size={13} /> Gov Schemes
            </button>
          </div>
        </div>

        {/* User Block at bottom */}
        <div className={styles["sidebar-user-block"]}>
          {user?.profileImg ? (
            <img src={userLogo} alt="user avatar" className={styles["sidebar-user-avatar"]} />
          ) : (
            <div className={styles["sidebar-user-avatar-placeholder"]}>
              {(user?.name || "Sreevanth Vadlamudi").charAt(0).toUpperCase()}
            </div>
          )}
          <div className={styles["sidebar-user-info"]}>
            <span className={styles["sidebar-user-name"]}>{user?.name || "Sreevanth Vadlamudi"}</span>
            <span className={styles["sidebar-user-sub"]}>IntelliFarm Account</span>
          </div>
          <div className={styles["sidebar-user-actions"]}>
            <button
              onClick={() => navigate("/dashboard")}
              className={styles["exit-btn"]}
              title="Return to Dashboard"
            >
              <Compass size={16} />
            </button>
          </div>
        </div>
      </aside>

      <section className={styles["assistant-workspace"]}>
        <div className={styles["chat-content"]}>
          {!isLeftPanelOpen && (
            <button
              className={styles["floating-expand-btn"]}
              onClick={() => setIsLeftPanelOpen(true)}
              title="Show Sidebar"
            >
              <ChevronRight size={18} />
            </button>
          )}

          {isLoader && <Loader />}
          <Routes>
            <Route index element={<NewChat />}></Route>
            <Route path="app" element={<ScrollChat />}></Route>
            <Route path="app/:historyId" element={<ScrollChat />}></Route>
          </Routes>
        </div>

        <InputSection />

        <div className={styles["warning-text"]}>
          <p>
            IntelliFarm AI can make mistakes. Verify critical farming, chemical,
            weather, and market decisions with local experts.
          </p>
        </div>
      </section>
    </div>
  );
};

export default ChatSection;
