import { chatAction } from "./chat";
import { userAction } from "./user";

const SERVER_ENDPOINT = process.env.REACT_APP_SERVER_ENDPOINT;

export const getRecentChat = () => {
  return (dispatch) => {
    const url = `${SERVER_ENDPOINT}/assistant/api/getchathistory`;

    fetch(url, {
      method: "GET",
      credentials: "include",
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("server error");
        }

        return response.json();
      })
      .then((data) => {
        dispatch(
          chatAction.recentChatHandler({ recentChat: data.chatHistory })
        );
        dispatch(userAction.setLocation({ location: data.location }));
      })
      .catch((err) => {
        console.log(err);
      });
  };
};

export const sendChatData = (useInput) => {
  return (dispatch) => {
    dispatch(chatAction.chatStart({ useInput: useInput }));

    const apiKey = process.env.REACT_APP_GEMINI_KEY;

    const url = `${SERVER_ENDPOINT}/assistant/api/chat`;

    fetch(url, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": apiKey,
      },
      body: JSON.stringify({
        userInput: useInput.user,
        previousChat: useInput.previousChat,
        chatHistoryId: useInput.chatHistoryId,
        image: useInput.image || null,
        farmMemory: useInput.farmMemory || null,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          const statusCode = response.status;
          const error = new Error(`Server Error: ${statusCode}`);
          error.statusCode = statusCode;
          throw error;
        }

        return response.json();
      })
      .then((data) => {
        dispatch(
          chatAction.previousChatHandler({
            previousChat: [
              { role: "user", parts: data.user },
              { role: "model", parts: data.gemini },
            ],
          })
        );
        dispatch(chatAction.popChat());
        dispatch(
          chatAction.chatStart({
            useInput: {
              user: data.user,
              gemini: data.gemini,
              isLoader: "no",
            },
          })
        );
        if (useInput.chatHistoryId.length < 2) {
          dispatch(getRecentChat());
        }
        dispatch(chatAction.newChatHandler());
        dispatch(
          chatAction.chatHistoryIdHandler({ chatHistoryId: data.chatHistoryId })
        );
      })
      .catch((err) => {
        const statusCode = err.statusCode || 500;

        dispatch(chatAction.popChat());
        if (statusCode === 429) {
          dispatch(
            chatAction.chatStart({
              useInput: {
                user: useInput.user,
                gemini:
                  "<span>Rate Limit Exceeded. Please wait for one hour before trying again. Thank you for your patience.</span>",
                isLoader: "no",
              },
            })
          );
        } else {
          dispatch(
            chatAction.chatStart({
              useInput: {
                user: useInput.user,
                gemini:
                  "<span>⚠️ Unable to get a response right now. Please check your connection and try again. If the issue persists, contact support.</span>",
                isLoader: "no",
              },
            })
          );
        }
        dispatch(chatAction.newChatHandler());
      });
  };
};

const MOCK_CONVERSATIONS = {
  "mock-1": {
    title: "Leaf spot diagnosis advice",
    chats: [
      {
        message: {
          user: "How do I diagnose leaf spots on my tomato plant?",
          gemini: "🌾 Tomato Leaf Spot Diagnosis\n\nBased on typical symptoms, leaf spots are often caused by Early Blight or Septoria Leaf Spot.\n\nRecommended actions:\n\n🟢 Recommended\nApply copper-based fungicide.\n\n🟡 Warning\nPrune lower diseased leaves to stop soil splash.\n\n🔴 Avoid\nDo not irrigate overhead late in the evening."
        },
        timestamp: new Date().toISOString()
      }
    ]
  },
  "mock-2": {
    title: "Weather planning checklist",
    chats: [
      {
        message: {
          user: "Should I delay spray because of rain tomorrow?",
          gemini: "## 🌦 Weather Tomorrow\nRain Probability: **85%** in South Karnataka area.\n\n### Recommendation\n\n✅ Delay chemical sprays\n✅ Avoid applying fertilizers\n✅ Irrigation not required today"
        },
        timestamp: new Date().toISOString()
      }
    ]
  },
  "mock-3": {
    title: "Market price analysis paddy",
    chats: [
      {
        message: {
          user: "What is the market price of paddy?",
          gemini: "📈 Paddy Market Prices (Karnataka Mandi)\n\nPrices are stable with a minor increase this morning.\n\n| Crop | Price/Quintal | Trend | Location |\n| :--- | :--- | :--- | :--- |\n| 🌾 Paddy (Grade A) | ₹2,350 | 🟢 +1.2% | Davanagere |\n| 🌾 Paddy (Common) | ₹2,200 | 🟡 Stable | Shimoga |"
        },
        timestamp: new Date().toISOString()
      }
    ]
  },
  "mock-4": {
    title: "Cotton yield optimization",
    chats: [
      {
        message: {
          user: "Best crop for black soil",
          gemini: "🌾 Cotton has high suitability for black soil due to its moisture retention capacity."
        },
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  },
  "mock-5": {
    title: "Government subsidies check",
    chats: [
      {
        message: {
          user: "Are there subsidies active for solar water pumps?",
          gemini: "Yes, under the PM-KUSUM scheme, farmers receive up to 60% subsidy for solar water installations."
        },
        timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  },
  "mock-6": {
    title: "Soil pH correction guide",
    chats: [
      {
        message: {
          user: "My soil pH is 5.5, what should I do?",
          gemini: "A soil pH of 5.5 is acidic. Add agricultural lime (calcium carbonate) to raise it to the optimal range of 6.0 - 6.8."
        },
        timestamp: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  }
};

export const getChat = (chatHistoryId) => {
  return (dispatch) => {
    dispatch(chatAction.loaderHandler());

    if (String(chatHistoryId).startsWith("mock-")) {
      setTimeout(() => {
        dispatch(chatAction.loaderHandler());
        const mockData = MOCK_CONVERSATIONS[chatHistoryId] || { title: "Farming chat", chats: [] };
        
        const previousChat = mockData.chats.flatMap((c) => [
          { role: "user", parts: c.message.user },
          { role: "model", parts: c.message.gemini },
        ]);

        const chats = mockData.chats.map((c, index) => {
          return {
            user: c.message.user,
            gemini: c.message.gemini,
            id: `${chatHistoryId}-${index}`,
            isLoader: "no",
            fromHistory: true,
            image: null,
            timestamp: c.timestamp,
          };
        });

        dispatch(chatAction.replacePreviousChat({ previousChat }));
        dispatch(chatAction.replaceChat({ chats }));
        dispatch(chatAction.chatHistoryIdHandler({ chatHistoryId }));
        dispatch(chatAction.newChatHandler());
      }, 300);
      return;
    }

    const url = `${SERVER_ENDPOINT}/assistant/api/chatdata`;

    fetch(url, {
      method: "POST",
      body: JSON.stringify({ chatHistoryId }),
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("server error");
        }
        return response.json();
      })
      .then((data) => {
        dispatch(chatAction.loaderHandler());
        const previousChat = data.chats.flatMap((c) => [
          { role: "user", parts: c.message.user },
          { role: "model", parts: c.message.gemini },
        ]);

        const chats = data.chats.map((c, index) => {
          return {
            user: c.message.user,
            gemini: c.message.gemini,
            id: c._id || `${data.chatHistory}-${index}`,
            isLoader: "no",
            fromHistory: true,
            image: c.message.image || null,
            timestamp: c.timestamp,
          };
        });

        const chatHistoryId = data.chatHistory;

        dispatch(chatAction.replacePreviousChat({ previousChat }));
        dispatch(chatAction.replaceChat({ chats }));
        dispatch(chatAction.chatHistoryIdHandler({ chatHistoryId }));
        dispatch(chatAction.newChatHandler());
      })
      .catch((err) => {
        console.log(err);
        dispatch(
          chatAction.replaceChat({
            chats: [
              {
                error: true,
                user: "Hi, is there any issue ? ",
                gemini: "",
                id: 34356556565,
                isLoader: "Oops! I cound't find you chat history",
              },
            ],
          })
        );
        dispatch(chatAction.loaderHandler());
        dispatch(chatAction.chatHistoryIdHandler({ chatHistoryId }));
      });
  };
};

export const deleteChatHistory = (chatHistoryId) => {
  return (dispatch, getState) => {
    const url = `${SERVER_ENDPOINT}/assistant/api/chathistory/${chatHistoryId}`;
    const activeChatHistoryId = getState().chat.chatHistoryId;

    return fetch(url, {
      method: "DELETE",
      credentials: "include",
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Unable to delete chat history");
        }
        return response.json();
      })
      .then(() => {
        if (activeChatHistoryId === chatHistoryId) {
          dispatch(chatAction.replaceChat({ chats: [] }));
          dispatch(chatAction.replacePreviousChat({ previousChat: [] }));
          dispatch(chatAction.chatHistoryIdHandler({ chatHistoryId: "" }));
          dispatch(chatAction.newChatHandler());
        }
        dispatch(getRecentChat());
      });
  };
};
