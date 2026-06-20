import { supabase } from "../config/supabase.js";
import { askAI } from "../services/aiService.js";
import { logSecurityEvent } from "../utils/securityLogger.js";

export const sendAssistantMessage = async (req, res, next) => {
  try {
    const { message, history = [], chatHistoryId } = req.body;
    const answer = await askAI({ prompt: message, history, userId: req.user?.id });

    let currentHistoryId = chatHistoryId;

    if (req.user) {
      if (!currentHistoryId) {
        const { data: newHistory, error: historyError } = await supabase
          .from("chat_histories")
          .insert({
            user_id: req.user.id,
            title: message.slice(0, 80),
          })
          .select()
          .single();

        if (historyError) throw historyError;
        currentHistoryId = newHistory.id;
      } else {
        // Enforce IDOR protection: verify ownership of the chatHistoryId
        const { data: historyExists, error: historyExistsError } = await supabase
          .from("chat_histories")
          .select("id")
          .eq("id", currentHistoryId)
          .eq("user_id", req.user.id)
          .maybeSingle();

        if (historyExistsError) throw historyExistsError;
        if (!historyExists) {
          await logSecurityEvent({
            eventType: "IDOR_ATTEMPT",
            userId: req.user.id,
            ipAddress: req.ip || "0.0.0.0",
            endpoint: "/api/assistant/message",
            details: { chatHistoryId: currentHistoryId, reason: "Attempted chat history hijack" }
          });
          const error = new Error("Access denied: You do not own this chat history.");
          error.statusCode = 403;
          throw error;
        }
      }

      const { data: chatDoc, error: selectError } = await supabase
        .from("chats")
        .select("*")
        .eq("chat_history_id", currentHistoryId)
        .maybeSingle();

      if (selectError) throw selectError;

      const newMessages = chatDoc ? [...(chatDoc.messages || [])] : [];
      newMessages.push({
        sender: req.user.id,
        message: {
          user: message,
          gemini: answer,
        },
        timestamp: new Date().toISOString()
      });

      if (chatDoc) {
        const { error: updateError } = await supabase
          .from("chats")
          .update({ messages: newMessages })
          .eq("id", chatDoc.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("chats")
          .insert({
            chat_history_id: currentHistoryId,
            messages: newMessages
          });

        if (insertError) throw insertError;
      }
    }

    res.status(200).json({
      success: true,
      answer,
      chatHistoryId: currentHistoryId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

export const getAssistantHistory = async (req, res, next) => {
  try {
    const { data: histories, error: historyError } = await supabase
      .from("chat_histories")
      .select("*")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false });

    if (historyError) throw historyError;

    const formattedHistories = await Promise.all(
      (histories || []).map(async (history) => {
        const { data: chatDoc, error: chatError } = await supabase
          .from("chats")
          .select("*")
          .eq("chat_history_id", history.id)
          .maybeSingle();

        if (chatError) throw chatError;

        return {
          _id: history.id,
          id: history.id,
          title: history.title,
          user: history.user_id,
          timestamp: history.created_at,
          chat: chatDoc ? {
            _id: chatDoc.id,
            id: chatDoc.id,
            chatHistory: chatDoc.chat_history_id,
            messages: (chatDoc.messages || []).map(m => ({
              sender: m.sender,
              message: m.message,
              timestamp: m.timestamp
            }))
          } : null
        };
      })
    );

    res.status(200).json({ success: true, histories: formattedHistories });
  } catch (error) {
    next(error);
  }
};
