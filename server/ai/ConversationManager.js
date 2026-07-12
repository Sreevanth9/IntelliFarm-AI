import { supabase } from "../config/supabase.js";

const isValidUUID = (id) => {
  if (!id || typeof id !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
};

class ConversationManager {
  async listConversations(userId) {
    if (!userId) return [];
    try {
      const { data, error } = await supabase
        .from("copilot_conversations")
        .select("*")
        .eq("user_id", userId)
        .order("pinned", { ascending: false })
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("ConversationManager.listConversations failed:", error.message);
      return [];
    }
  }

  async getConversation(userId, conversationId) {
    if (!userId || !isValidUUID(conversationId)) return null;
    try {
      const { data, error } = await supabase
        .from("copilot_conversations")
        .select("*")
        .eq("id", conversationId)
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("ConversationManager.getConversation failed:", error.message);
      return null;
    }
  }

  async createConversation(userId, title = "New Farming Chat") {
    if (!userId) return null;
    try {
      const { data, error } = await supabase
        .from("copilot_conversations")
        .insert({
          user_id: userId,
          title
        })
        .select()
        .single();

      console.log("Conversation insert details:", { data, error });

      if (error) {
        console.error("ConversationManager.createConversation error object:", error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error("ConversationManager.createConversation failed:", error);
      return null;
    }
  }

  async updateConversation(userId, conversationId, updates) {
    if (!userId || !isValidUUID(conversationId)) return null;
    try {
      const { data, error } = await supabase
        .from("copilot_conversations")
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq("id", conversationId)
        .eq("user_id", userId)
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("ConversationManager.updateConversation failed:", error.message);
      return null;
    }
  }

  async deleteConversation(userId, conversationId) {
    if (!userId || !isValidUUID(conversationId)) return false;
    try {
      const { error } = await supabase
        .from("copilot_conversations")
        .delete()
        .eq("id", conversationId)
        .eq("user_id", userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("ConversationManager.deleteConversation failed:", error.message);
      return false;
    }
  }

  async getMessages(conversationId) {
    if (!isValidUUID(conversationId)) return [];
    try {
      const { data, error } = await supabase
        .from("copilot_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data.map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        tokens: m.tokens,
        attachments: m.attachments,
        createdAt: m.created_at
      }));
    } catch (error) {
      console.error("ConversationManager.getMessages failed:", error.message);
      return [];
    }
  }

  async saveMessage(conversationId, role, content, tokens = 0, attachments = []) {
    if (!isValidUUID(conversationId)) return null;
    try {
      const { data, error } = await supabase
        .from("copilot_messages")
        .insert({
          conversation_id: conversationId,
          role,
          content,
          tokens,
          attachments: JSON.stringify(attachments)
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("ConversationManager.saveMessage failed:", error.message);
      return null;
    }
  }
}

export default new ConversationManager();
