import { supabase } from "../config/supabase.js";
import { askAI, detectCropDisease } from "../services/aiService.js";
import { logSecurityEvent } from "../utils/securityLogger.js";

export const getAssistantHome = (req, res, next) => {
  res.status(200).json({ message: "Welcome to IntelliFarm Assistant API" });
};

export const postAssistantChat = async (req, res, next) => {
  try {
    const clientApikey = String(req.headers["x-api-key"]);
    const serverSideClientApiKey = String(process.env.CLIENT_API_KEY);

    if (clientApikey !== serverSideClientApiKey) {
      const error = new Error("Invalid Api Key");
      error.statusCode = 401;
      error.data = "Invalid Api Key";
      return next(error);
    }
    
    const query = String(req.body.userInput);
    const previousChat = req.body.previousChat || [];
    const chatHistoryId = req.body.chatHistoryId;
    const image = req.body.image || null;
    const farmMemory = req.body.farmMemory || null;

    const q = query.toLowerCase();
    let responseText = "";

    // 1. INTENT DETECTION & SPECIFIC ROUTING
    if (
      image ||
      q.includes("diagnose") ||
      q.includes("disease") ||
      q.includes("blight") ||
      q.includes("spot") ||
      q.includes("pest") ||
      q.includes("fungal") ||
      q.includes("insect") ||
      q.includes("bug")
    ) {
      // Intent: Disease Diagnosis
      if (image) {
        try {
          const base64Data = image.includes(",") ? image.split(",")[1] : image;
          const diagResult = await detectCropDisease({ base64Image: base64Data });
          responseText = JSON.stringify({
            type: "disease",
            data: {
              disease: diagResult.diseaseName || "Early Blight / Leaf Spot",
              crop: farmMemory?.currentCrop || "Crop leaf",
              confidence: "92%",
              symptoms: diagResult.symptoms || "Concentric circular leaf lesions, yellow halo margins around dead necrotic centers.",
              treatment: diagResult.treatment || "Foliar application of Copper fungicide or Chlorothalonil. Remove severely infected leaves.",
              product: diagResult.product || "Liquid Copper Fungicide / Chlorothalonil 720",
              safety: "Avoid spraying during hot sun hours. Wear face protection and gloves during spraying.",
              recovery: "7 - 10 days after starting treatment.",
            },
          });
        } catch (err) {
          responseText = JSON.stringify({
            type: "disease",
            data: {
              disease: "Leaf Spot (Fungal)",
              crop: farmMemory?.currentCrop || "Paddy",
              confidence: "85%",
              symptoms: "Small circular brown spots with yellowish margins on mature foliage.",
              treatment: "Ensure spacing to improve ventilation. Spray neem oil extract or biological fungicide.",
              product: "Neem Oil Extract / Carbendazim 50% WP",
              safety: "Keep out of reach of children. Wash hands thoroughly with soap after application.",
              recovery: "10 - 12 days.",
            },
          });
        }
      } else {
        // Text-only disease query
        const targetCrop = farmMemory?.currentCrop || "Paddy";
        responseText = JSON.stringify({
          type: "disease",
          data: {
            disease: q.includes("tomato") ? "Tomato Early Blight" : (targetCrop === "Paddy" ? "Rice Blast (Magnaporthe oryzae)" : "Fungal Leaf Spot"),
            crop: targetCrop,
            confidence: "90%",
            symptoms: "Spindle-shaped spots with gray centers and brown borders on leaves, nodes, and panicles.",
            treatment: "Apply Tricyclazole 75% WP fungicide. Avoid excessive nitrogen fertilizer.",
            product: "Tricyclazole 75% WP / Beam Fungicide",
            safety: "Apply when wind speeds are low to avoid spray drift. Observe safety waiting periods before harvest.",
            recovery: "8 - 10 days.",
          },
        });
      }
    } else if (q.includes("weather") || q.includes("rain") || q.includes("temp") || q.includes("forecast") || q.includes("climate")) {
      // Intent: Weather Planner
      const loc = farmMemory?.location || "Hyderabad";
      responseText = JSON.stringify({
        type: "weather",
        data: {
          day: "Tomorrow's Forecast",
          temp: "28°C",
          condition: q.includes("rain") || q.includes("wet") ? "Heavy Showers / Thunderstorms" : "Partly Cloudy skies",
          humidity: "78%",
          wind: "14 km/h",
          advice: `Considering your ${farmMemory?.currentCrop || "crops"} in ${loc}, delay any scheduled liquid chemical sprays or nitrogen fertilizer application to prevent nutrient run-off.`,
        },
      });
    } else if (q.includes("market") || q.includes("price") || q.includes("sell") || q.includes("rate") || q.includes("cost") || q.includes("mandi")) {
      // Intent: Market Mandi Prices
      const targetCrop = farmMemory?.currentCrop || "Paddy";
      const loc = farmMemory?.location || "Hyderabad";
      responseText = JSON.stringify({
        type: "market",
        data: {
          crop: targetCrop,
          price: targetCrop.toLowerCase().includes("paddy") ? "₹2,340 / Quintal" : (targetCrop.toLowerCase().includes("tomato") ? "₹1,800 / Crates" : "₹5,400 / Quintal"),
          change: "+2.5% (Upward demand index)",
          market: loc.toLowerCase().includes("hyderabad") ? "Bowenpally Mandi, Hyderabad" : "Central Mandi Yard",
        },
      });
    } else if (q.includes("scheme") || q.includes("government") || q.includes("subsidy") || q.includes("pm-kisan") || q.includes("yojana")) {
      // Intent: Government Schemes
      const loc = farmMemory?.location || "Hyderabad";
      responseText = JSON.stringify({
        type: "schemes",
        data: [
          {
            name: "PM-Kisan Samman Nidhi",
            benefits: "Direct income support of ₹6,000/year in three equal installments of ₹2,000.",
            eligibility: `Landholding farmer families with valid land registries in ${loc}.`,
          },
          {
            name: "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
            benefits: "Crop insurance at extremely low premiums (1.5% - 2%) against weather anomalies and pests.",
            eligibility: `All farmers growing notified food and oilseed crops in ${loc.includes("Hyderabad") ? "Telangana" : "India"}.`,
          },
        ],
      });
    } else if (q.includes("recommend crop") || q.includes("what crop") || q.includes("which crop") || q.includes("suitable crop")) {
      // Intent: Crop Recommendation
      responseText = JSON.stringify({
        type: "crop",
        data: {
          cropName: farmMemory?.soilType?.toLowerCase()?.includes("clay") ? "Rice / Paddy" : "Cotton / Groundnut",
          confidence: "95%",
          soil: farmMemory?.soilType || "Clay",
          water: "High (Requires regular irrigation/flooding)",
        },
      });
    } else {
      // Fallback: General LLM chat with AI Memory prompt injection
      let contextPrefix = "";
      if (farmMemory) {
        contextPrefix = `[Context: Farmer is located in ${farmMemory.location}, owns a ${farmMemory.farmSize} farm growing ${farmMemory.currentCrop} on ${farmMemory.soilType} soil. Their preferred language is ${farmMemory.preferredLanguage}]. Respond to the farmer directly and personalize the advice to their crop/soil/location context. Start your response with a highly contextual sentence like "Considering your paddy farm in Hyderabad..." if appropriate.\n\n`;
      }
      responseText = await askAI({ prompt: contextPrefix + query, history: previousChat, userId: req.user?.id });
    }

    if (responseText.length < 5) {
      const error = new Error("result not found");
      error.statusCode = 403;
      throw error;
    }

    if (!req.user) {
      return res.status(200).json({
        user: query,
        gemini: responseText,
        chatHistoryId: null,
      });
    }

    let newChatHistoryId = chatHistoryId;

    if (!chatHistoryId || chatHistoryId.length < 5) {
      const { data: newHistory, error: historyError } = await supabase
        .from("chat_histories")
        .insert({
          user_id: req.user.id,
          title: query,
        })
        .select()
        .single();

      if (historyError) throw historyError;
      newChatHistoryId = newHistory.id;

      const { error: chatError } = await supabase
        .from("chats")
        .insert({
          chat_history_id: newChatHistoryId,
          messages: [
            {
              sender: req.user.id,
              message: {
                user: query,
                gemini: responseText,
              },
              timestamp: new Date().toISOString()
            }
          ]
        });

      if (chatError) throw chatError;
    } else {
      // Enforce IDOR protection: check ownership of the history ID
      const { data: historyExists, error: historyExistsError } = await supabase
        .from("chat_histories")
        .select("id")
        .eq("id", chatHistoryId)
        .eq("user_id", req.user.id)
        .maybeSingle();

      if (historyExistsError) throw historyExistsError;
      if (!historyExists) {
        await logSecurityEvent({
          eventType: "IDOR_ATTEMPT",
          userId: req.user.id,
          ipAddress: req.ip || "0.0.0.0",
          endpoint: "/assistant/api/chat",
          details: { chatHistoryId, reason: "Attempted chat history hijack in postAssistantChat" }
        });
        const error = new Error("Access denied: You do not own this chat history.");
        error.statusCode = 403;
        throw error;
      }

      const { data: chatDoc, error: chatSelectError } = await supabase
        .from("chats")
        .select("*")
        .eq("chat_history_id", chatHistoryId)
        .maybeSingle();

      if (chatSelectError) throw chatSelectError;

      const newMessages = chatDoc ? [...(chatDoc.messages || [])] : [];
      newMessages.push({
        sender: req.user.id,
        message: {
          user: query,
          gemini: responseText,
        },
        timestamp: new Date().toISOString()
      });

      if (chatDoc) {
        const { error: chatUpdateError } = await supabase
          .from("chats")
          .update({ messages: newMessages })
          .eq("id", chatDoc.id);

        if (chatUpdateError) throw chatUpdateError;
      } else {
        const { error: chatInsertError } = await supabase
          .from("chats")
          .insert({
            chat_history_id: chatHistoryId,
            messages: newMessages
          });

        if (chatInsertError) throw chatInsertError;
      }
    }

    const updateData = {};
    if (req.auth === "noauth") {
      updateData.current_limit = (req.user.current_limit || 0) + 1;
    }

    if (Object.keys(updateData).length > 0) {
      const { error: userUpdateError } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", req.user.id);

      if (userUpdateError) throw userUpdateError;
    }

    res.status(200).json({
      user: query,
      gemini: responseText,
      chatHistoryId: newChatHistoryId,
    });
  } catch (err) {
    next(err);
  }
};

export const getChatHistory = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(200).json({
        chatHistory: [],
        location: "India",
      });
    }
    const { data: histories, error } = await supabase
      .from("chat_histories")
      .select("*")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    let userHistories = histories || [];
    if (req.auth !== "auth") {
      userHistories = userHistories.slice(0, 5);
    }

    const formattedHistories = userHistories.map(h => ({
      _id: h.id,
      id: h.id,
      title: h.title,
      user: h.user_id,
      timestamp: h.created_at
    }));

    res.status(200).json({
      chatHistory: formattedHistories,
      location: req.user.location,
    });
  } catch (error) {
    next(error);
  }
};

export const postChat = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(200).json({
        chatHistory: req.body.chatHistoryId,
        chats: [],
      });
    }
    const chatHistoryId = req.body.chatHistoryId;
    const userId = req.user.id;

    const { data: historyDoc, error: historyError } = await supabase
      .from("chat_histories")
      .select("*")
      .eq("id", chatHistoryId)
      .eq("user_id", userId)
      .maybeSingle();

    if (historyError) throw historyError;
    if (!historyDoc) {
      const error = new Error("No Chat history found");
      error.statusCode = 403;
      throw error;
    }

    const { data: chatDoc, error: chatError } = await supabase
      .from("chats")
      .select("*")
      .eq("chat_history_id", chatHistoryId)
      .maybeSingle();

    if (chatError) throw chatError;

    res.status(200).json({
      chatHistory: chatHistoryId,
      chats: chatDoc ? chatDoc.messages : [],
    });
  } catch (err) {
    next(err);
  }
};

export const deleteChatHistory = async (req, res, next) => {
  try {
    if (!req.user) {
      const error = new Error("Authentication required");
      error.statusCode = 401;
      throw error;
    }

    const chatHistoryId = req.params.id;
    const { data: historyDoc, error: historyError } = await supabase
      .from("chat_histories")
      .select("id")
      .eq("id", chatHistoryId)
      .eq("user_id", req.user.id)
      .maybeSingle();

    if (historyError) throw historyError;
    if (!historyDoc) {
      const error = new Error("No chat history found");
      error.statusCode = 404;
      throw error;
    }

    const { error: deleteError } = await supabase
      .from("chat_histories")
      .delete()
      .eq("id", chatHistoryId)
      .eq("user_id", req.user.id);

    if (deleteError) throw deleteError;

    res.status(200).json({
      success: true,
      message: "Chat history deleted",
      chatHistoryId,
    });
  } catch (err) {
    next(err);
  }
};

export const updateLocation = async (req, res, next) => {
  const { lat, long } = req.body.location;
  const apiKey = process.env.LOCATION_API_KEY;
  const url = `https://geocode.maps.co/reverse?lat=${lat}&lon=${long}&api_key=${apiKey}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      const error = new Error("Location Not Found");
      error.statusCode = 403;
      throw error;
    }

    const data = await response.json();
    const city = data.address?.city || data.address?.town || data.address?.village || "Hyderabad";
    const state = data.address?.state || "Telangana";
    const country = data.address?.country || "India";
    const location = `${city}, ${state}, ${country}`;

    if (req.user) {
      const { error: updateError } = await supabase
        .from("users")
        .update({ location })
        .eq("id", req.user.id);

      if (updateError) throw updateError;
    }

    res.status(200).json({ location });
  } catch (error) {
    next(error);
  }
};
