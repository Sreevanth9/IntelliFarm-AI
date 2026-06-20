import { supabase } from "../config/supabase.js";
import { askAI } from "../services/aiService.js";
import { logSecurityEvent } from "../utils/securityLogger.js";

export const getGeminiHome = (req, res, next) => {
  res.status(200).json({ message: "Welcome to Gemini Ai Api" });
};

export const postGemini = async (req, res, next) => {
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

    const responseText = await askAI({ prompt: query, history: previousChat, userId: req.user?.id });

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
          endpoint: "/gemini/api/chat",
          details: { chatHistoryId, reason: "Attempted chat history hijack in postGemini" }
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
