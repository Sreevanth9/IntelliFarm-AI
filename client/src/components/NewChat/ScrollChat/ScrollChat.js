import styles from "./ScrollChat.module.css";
import { commonIcon } from "../../../assets";
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
    if (q.includes("weather") || q.includes("rain") || q.includes("temp") || q.includes("forecast")) {
      return [
        "Thinking...",
        "Querying Weather API...",
        "Analyzing meteorological trends...",
        "Formatting weather planner..."
      ];
    }
    if (q.includes("market") || q.includes("price") || q.includes("sell") || q.includes("rate") || q.includes("cost")) {
      return [
        "Thinking...",
        "Accessing market databases...",
        "Comparing regional mandi prices...",
        "Calculating price volatility index..."
      ];
    }
    if (q.includes("disease") || q.includes("spot") || q.includes("blight") || q.includes("pest") || q.includes("leaf") || q.includes("diagnose")) {
      return [
        "Thinking...",
        "Initializing leaf image analyzer...",
        "Scanning agricultural pathology catalogs...",
        "Synthesizing chemical & organic cures..."
      ];
    }
    return [
      "Thinking...",
      "Analyzing agricultural databases...",
      "Generating farming suggestions...",
      "Formatting responsive panels..."
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
  const userImage = useSelector((state) => state.user.user.profileImg);

  const userLogo = userImage || commonIcon.avatarIcon;

  useEffect(() => {
    if (historyId) {
      if (historyId !== chatHistoryId) {
        dispatch(getChat(historyId));
      }
      return;
    }

    if (chat.length > 0 && chatHistoryId) {
      navigate(`/assistant/app/${chatHistoryId}`, { replace: true });
    } else {
      navigate("/assistant", { replace: true });
    }
  }, [dispatch, historyId, chatHistoryId, navigate, chat.length]);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [chat]);

  const loadText = (text) => {
    return text
      ?.replace(/\n/g, "<br>")
      ?.replace(/\*\*(.*?)\*\*/g, '<span class="h1-bold">$1</span>')
      ?.replace(/<br>\*/g, "<br><span class='list'>&#9898;</span>")
      ?.replace(/```([\s\S]*?)```/g, (_, codeBlock) => {
        let code = codeBlock
          .replace(/<br>/g, "\n")
          .replace(/</g, "&#60;")
          .replace(/>/g, "&#62;");
        let highlighted = `\`\`\`` + code + `\`\`\``;
        return `<br><pre><code>${highlighted}</code></pre>`;
      })
      ?.replace(/```([\s\S]*?)```/g, "<br><div class='email-div'>$1</div>");
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
            <img
              src={userLogo}
              alt="user avatar"
              className={styles["user-avatar-bubble"]}
            ></img>
          </div>

          {/* AI Bubble */}
          <div className={styles["assistant"]}>
            <img
              src={commonIcon.chatAssistantIcon}
              alt="copilot avatar"
              className={styles["copilot-avatar-bubble"]}
            ></img>
            <div className={styles["assistant-content-wrapper"]}>
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
