import styles from "./ScrollChat.module.css";

import { useSelector, useDispatch } from "react-redux";
import React, { useRef, useEffect, useState, Fragment } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getChat, sendChatData } from "../../../store/chat-action";
import StreamingAssistantMessage from "./StreamingAssistantMessage";
import StaticAssistantMessage from "./StaticAssistantMessage";
import CopyBtn from "../../Ui/CopyBtn";
import "./ScrollChatModule.css";
import {
  CloudRain,
  Thermometer,
  MapPin,
  TrendingUp,
  Award,
  Bug,
  Compass,
} from "lucide-react";

// Contextual Thinking Animation
const ThinkingIndicator = ({ query }) => {
  const [stage, setStage] = useState(0);

  const getStages = () => {
    const q = query?.toLowerCase() || "";
    if (q.includes("weather") || q.includes("rain") || q.includes("temp") || q.includes("forecast") || q.includes("climate")) {
      return [
        "Thinking...",
        "☁️ Checking weather...",
        "🌦 Analyzing precipitation...",
        "Generating answer..."
      ];
    }
    if (q.includes("market") || q.includes("price") || q.includes("sell") || q.includes("rate") || q.includes("cost") || q.includes("mandi")) {
      return [
        "Thinking...",
        "📈 Reading market...",
        "📊 Fetching Mandi price index...",
        "Generating answer..."
      ];
    }
    if (q.includes("disease") || q.includes("spot") || q.includes("blight") || q.includes("pest") || q.includes("leaf") || q.includes("diagnose") || q.includes("bug")) {
      return [
        "Thinking...",
        "🌱 Reading crop data...",
        "🔍 Diagnosing pathology...",
        "Generating answer..."
      ];
    }
    return [
      "Thinking...",
      "🧠 Processing question...",
      "🚜 Analyzing agricultural context...",
      "Generating answer..."
    ];
  };

  const currentStages = getStages();

  useEffect(() => {
    const interval = setInterval(() => {
      setStage((prev) => (prev + 1) % currentStages.length);
    }, 1400);
    return () => clearInterval(interval);
  }, [currentStages]);

  return (
    <div className={styles["thinking-wrapper"]}>
      <div className={styles["thinking-dots"]}>
        <span></span>
        <span></span>
        <span></span>
      </div>
      <p className={styles["thinking-text"]}>{currentStages[stage]}</p>
    </div>
  );
};

// --- Custom Response Cards ---

const WeatherCard = ({ data }) => {
  return (
    <div className={styles["card-weather"]}>
      <div className={styles["card-weather-header"]}>
        <div className={styles["weather-header-info"]}>
          <span className={styles["weather-card-day"]}>{data.day || "Tomorrow"}</span>
          <span className={styles["weather-card-condition"]}>{data.condition}</span>
        </div>
        <CloudRain className={styles["weather-card-icon"]} size={32} />
      </div>
      <div className={styles["weather-temp-row"]}>
        <Thermometer size={20} />
        <span className={styles["weather-card-temp"]}>{data.temp}</span>
      </div>
      <div className={styles["weather-stats-grid"]}>
        <div className={styles["weather-stat"]}>
          <span>Rain Prob.</span>
          <strong>{data.humidity || "78%"}</strong>
        </div>
        <div className={styles["weather-stat"]}>
          <span>Wind Speed</span>
          <strong>{data.wind}</strong>
        </div>
        {data.advice && (
          <div className={styles["weather-advice"]}>
            <strong>Advisor:</strong> {data.advice}
          </div>
        )}
      </div>
    </div>
  );
};

const MarketCard = ({ data }) => {
  return (
    <div className={styles["card-market"]}>
      <div className={styles["market-card-top"]}>
        <div>
          <span className={styles["market-crop-name"]}>{data.crop}</span>
          <span className={styles["market-crop-sub"]}>Mandi Price Index</span>
        </div>
        <div className={styles["market-trend-badge"]}>
          <TrendingUp size={14} />
          <span>{data.change}</span>
        </div>
      </div>
      <div className={styles["market-price-val"]}>{data.price}</div>
      <div className={styles["market-location-row"]}>
        <MapPin size={13} />
        <span>Nearest Mandi: <strong>{data.market}</strong></span>
      </div>
    </div>
  );
};

const CropRecommendationCard = ({ data }) => {
  return (
    <div className={styles["card-crop"]}>
      <div className={styles["crop-card-top"]}>
        <Compass className={styles["crop-icon"]} size={28} />
        <div>
          <span className={styles["crop-rec-label"]}>Recommended Crop</span>
          <span className={styles["crop-rec-val"]}>{data.cropName}</span>
        </div>
      </div>
      <div className={styles["crop-confidence-bar"]}>
        <div className={styles["bar-label-row"]}>
          <span>Match Confidence</span>
          <span>{data.confidence}</span>
        </div>
        <div className={styles["progress-track"]}>
          <div
            className={styles["progress-fill"]}
            style={{ width: data.confidence }}
          ></div>
        </div>
      </div>
      <div className={styles["crop-details-list"]}>
        <div className={styles["crop-detail"]}>
          <span>Suitable Soil</span>
          <strong>{data.soil || "Clay"}</strong>
        </div>
        <div className={styles["crop-detail"]}>
          <span>Water Requirement</span>
          <strong>{data.water || "High"}</strong>
        </div>
      </div>
    </div>
  );
};

const DiseaseCard = ({ data }) => {
  return (
    <div className={styles["card-disease"]}>
      <div className={styles["disease-header"]}>
        <Bug size={24} className={styles["disease-icon"]} />
        <div>
          <span className={styles["disease-label"]}>Crop Disease Diagnosis</span>
          <span className={styles["disease-name"]}>{data.disease}</span>
        </div>
        <div className={styles["disease-confidence"]}>{data.confidence} Match</div>
      </div>

      <div className={styles["disease-grid"]}>
        <div className={styles["disease-section"]}>
          <strong>Symptoms:</strong>
          <p>{data.symptoms}</p>
        </div>
        <div className={styles["disease-section"]}>
          <strong>Treatment:</strong>
          <p>{data.treatment}</p>
        </div>
        <div className={styles["disease-section"]}>
          <strong>Recommended Product:</strong>
          <p className={styles["highlight-product"]}>{data.product}</p>
        </div>
        <div className={styles["disease-section"]}>
          <strong>Expected Recovery:</strong>
          <p>{data.recovery}</p>
        </div>
        <div className={styles["disease-section-full"]}>
          <strong>Safety & Preventive Tips:</strong>
          <p>{data.safety}</p>
        </div>
      </div>
    </div>
  );
};

const SchemesCard = ({ data }) => {
  return (
    <div className={styles["card-schemes"]}>
      <div className={styles["schemes-header"]}>
        <Award size={20} />
        <span>Active Government Schemes</span>
      </div>
      <div className={styles["schemes-list"]}>
        {data.map((scheme, idx) => (
          <div key={idx} className={styles["scheme-item"]}>
            <div className={styles["scheme-name"]}>{scheme.name}</div>
            <div className={styles["scheme-detail"]}>
              <strong>Benefits:</strong> {scheme.benefits}
            </div>
            <div className={styles["scheme-detail"]}>
              <strong>Eligibility:</strong> {scheme.eligibility}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ScrollChat = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { historyId } = useParams();
  const chatRef = useRef(null);
  const chat = useSelector((state) => state.chat.chats);
  const chatHistoryId = useSelector((state) => state.chat.chatHistoryId);
  const previousChat = useSelector((state) => state.chat.previousChat);
  const realTimeResponse = localStorage.getItem("realtime") || "no";
  const user = useSelector((state) => state.user.user);
  const userImage = user?.profileImg;

  useEffect(() => {
    if (historyId) {
      if (historyId !== chatHistoryId) {
        dispatch(getChat(historyId));
      }
      return;
    }

    if (chatHistoryId) {
      navigate(`/assistant/app/${chatHistoryId}`, { replace: true });
    } else {
      // Prevent race conditions between navigation and Redux store state propagation
      const redirectTimer = setTimeout(() => {
        if (chat.length === 0 && !chatHistoryId) {
          navigate("/assistant", { replace: true });
        }
      }, 200);
      return () => clearTimeout(redirectTimer);
    }
  }, [historyId, chatHistoryId, chat.length, navigate, dispatch]);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [chat]);

  const loadText = (text) => {
    if (!text) return "";

    let html = text;

    // Callout Alerts (Good/Warning/Avoid)
    html = html.replace(/🟢 (Recommended|Good)\n([\s\S]*?)(?=\n\n|\n[🔴🟡🟢]|$)/gi, (match, title, content) => {
      return `<div class="${styles["callout-good"]}"><strong>🟢 ${title}</strong><br>${content.trim().replace(/\n/g, '<br>')}</div>`;
    });
    html = html.replace(/🟡 (Warning)\n([\s\S]*?)(?=\n\n|\n[🔴🟡🟢]|$)/gi, (match, title, content) => {
      return `<div class="${styles["callout-warning"]}"><strong>🟡 ${title}</strong><br>${content.trim().replace(/\n/g, '<br>')}</div>`;
    });
    html = html.replace(/🔴 (Avoid|Important)\n([\s\S]*?)(?=\n\n|\n[🔴🟡🟢]|$)/gi, (match, title, content) => {
      return `<div class="${styles["callout-avoid"]}"><strong>🔴 ${title}</strong><br>${content.trim().replace(/\n/g, '<br>')}</div>`;
    });

    // Tables
    const tableRegex = /((?:^|\n)\|[^\n]*\|)+/g;
    html = html.replace(tableRegex, (tableBlock) => {
      const lines = tableBlock.trim().split("\n");
      let tableHtml = `<div class="${styles["table-container"]}"><table class="${styles["chat-table"]}">`;
      let isFirst = true;

      lines.forEach((line) => {
        if (line.match(/^\|?\s*:-*:\s*\|/) || line.includes("---")) return;

        const cells = line.split("|").map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
        tableHtml += "<tr>";
        cells.forEach((cell) => {
          if (isFirst) {
            tableHtml += `<th>${cell}</th>`;
          } else {
            tableHtml += `<td>${cell}</td>`;
          }
        });
        tableHtml += "</tr>";
        isFirst = false;
      });

      tableHtml += "</table></div>";
      return tableHtml;
    });

    // Headers
    html = html.replace(/### (.*?)(?=\n|$)/g, '<h3>$1</h3>');
    html = html.replace(/## (.*?)(?=\n|$)/g, '<h2>$1</h2>');

    // Bold text
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Bullet points
    html = html.replace(/(?:^|\n)\*\s+(.*?)(?=\n|$)/g, '<br><span class="bullet-item">• $1</span>');

    // Line breaks
    html = html.replace(/\n/g, "<br>");

    // Code blocks
    html = html.replace(/```([\s\S]*?)```/g, (_, codeBlock) => {
      let code = codeBlock
        .replace(/<br>/g, "\n")
        .replace(/</g, "&#60;")
        .replace(/>/g, "&#62;");
      return `<pre class="${styles["code-block"]}"><code>${code}</code></pre>`;
    });

    return html;
  };

  const followUpHandler = (promptText) => {
    dispatch(
      sendChatData({
        user: promptText,
        gemini: "",
        isLoader: "yes",
        previousChat,
        chatHistoryId,
      })
    );
  };

  const renderResponseContent = (responseText, lastMsgId, cId, isLastBubble, fromHistory) => {
    const formattedResponse = loadText(responseText);
    const trimmed = responseText?.trim();
    if (trimmed?.startsWith("{")) {
      try {
        const payload = JSON.parse(trimmed);
        if (payload.type === "weather") {
          return <WeatherCard data={payload.data} />;
        }
        if (payload.type === "market") {
          return <MarketCard data={payload.data} />;
        }
        if (payload.type === "crop") {
          return <CropRecommendationCard data={payload.data} />;
        }
        if (payload.type === "disease") {
          return <DiseaseCard data={payload.data} />;
        }
        if (payload.type === "schemes") {
          return <SchemesCard data={payload.data} />;
        }
      } catch (err) {
        // Fallback to text rendering below
      }
    }

    // Default rich text renderer
    return (
      <>
        {isLastBubble && !fromHistory && cId === lastMsgId && realTimeResponse === "no" ? (
          <StreamingAssistantMessage content={formattedResponse} />
        ) : (
          <StaticAssistantMessage content={formattedResponse} />
        )}
      </>
    );
  };

  const lastElemetId = chat[chat.length - 1]?.id;

  const chatSection = chat.map((c, index) => (
    <Fragment key={c?.id}>
      {!c.error ? (
        <div
          className={`${styles["single-chat"]} ${
            index === chat.length - 1 ? styles["last-single-chat"] : ""
          }`}
        >
          {/* User Bubble */}
          <div className={styles["user"]}>
            <div className={styles["user-bubble-wrapper"]}>
              {c.image && (
                <div className={styles["user-uploaded-img-wrapper"]}>
                  <img
                    src={c.image}
                    alt="Uploaded leaf"
                    className={styles["user-bubble-image"]}
                  />
                </div>
              )}
              <p>{c.user}</p>
            </div>
            {userImage ? (
              <img
                src={userImage}
                alt="user avatar"
                className={styles["user-avatar-bubble"]}
              />
            ) : (
              <div className={styles["user-avatar-placeholder-bubble"]}>
                {(user?.name || "S").charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* AI Bubble */}
          <div className={styles["assistant"]}>
            <div className={styles["assistant-content-wrapper"]}>
              <div className={styles["assistant-header"]}>
                <span>🌾 intelli <span style={{ color: "#22C55E", fontWeight: "700" }}>farm</span> ai</span>
              </div>
              {c?.isLoader === "yes" ? (
                <ThinkingIndicator query={c.user} />
              ) : (
                renderResponseContent(c?.gemini, lastElemetId, c?.id, index === chat.length - 1, c?.fromHistory)
              )}
            </div>
          </div>
          {c?.gemini?.length > 0 && c?.isLoader !== "yes" && !c?.gemini.startsWith("{") && (
            <CopyBtn data={c?.gemini} />
          )}
        </div>
      ) : (
        navigate("/assistant")
      )}
    </Fragment>
  ));

  const showFollowUps = chat.length > 0 && chat[chat.length - 1]?.isLoader === "no";

  return (
    <div className={styles["scroll-chat-main"]} ref={chatRef}>
      {chatSection}

      {/* Suggested Follow-up Actions */}
      {showFollowUps && (
        <div className={styles["followups-container"]}>
          <button
            onClick={() => followUpHandler("Recommend fertilizer for this diagnosis")}
            className={styles["followup-btn"]}
          >
            Recommend fertilizer
          </button>
          <button
            onClick={() => followUpHandler("Will the weather affect this crop over the next week?")}
            className={styles["followup-btn"]}
          >
            Weather forecast impact
          </button>
          <button
            onClick={() => followUpHandler("What is the current market price for this crop?")}
            className={styles["followup-btn"]}
          >
            Check market price
          </button>
        </div>
      )}
    </div>
  );
};

export default ScrollChat;
