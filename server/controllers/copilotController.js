import chatEngine from "../ai/ChatEngine.js";
import conversationManager from "../ai/ConversationManager.js";
import memoryManager from "../ai/MemoryManager.js";

export const chatStream = async (req, res, next) => {
  await chatEngine.handleChatStream(req, res, next);
};

export const getConversations = async (req, res, next) => {
  try {
    const list = await conversationManager.listConversations(req.user.id);
    res.status(200).json({ success: true, conversations: list });
  } catch (error) {
    next(error);
  }
};

export const getConversationMessages = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Verify ownership
    const conv = await conversationManager.getConversation(req.user.id, id);
    if (!conv) {
      const error = new Error("Conversation not found or access denied");
      error.statusCode = 404;
      throw error;
    }

    const messages = await conversationManager.getMessages(id);
    res.status(200).json({ success: true, messages });
  } catch (error) {
    next(error);
  }
};

export const updateConversation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, pinned, favorite } = req.body;

    const conv = await conversationManager.getConversation(req.user.id, id);
    if (!conv) {
      const error = new Error("Conversation not found or access denied");
      error.statusCode = 404;
      throw error;
    }

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (pinned !== undefined) updates.pinned = pinned;
    if (favorite !== undefined) updates.favorite = favorite;

    const updated = await conversationManager.updateConversation(req.user.id, id, updates);
    res.status(200).json({ success: true, conversation: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteConversation = async (req, res, next) => {
  try {
    const { id } = req.params;

    const conv = await conversationManager.getConversation(req.user.id, id);
    if (!conv) {
      const error = new Error("Conversation not found or access denied");
      error.statusCode = 404;
      throw error;
    }

    const deleted = await conversationManager.deleteConversation(req.user.id, id);
    res.status(200).json({ success: true, deleted });
  } catch (error) {
    next(error);
  }
};

export const getMemories = async (req, res, next) => {
  try {
    const list = await memoryManager.getMemories(req.user.id);
    res.status(200).json({ success: true, memories: list });
  } catch (error) {
    next(error);
  }
};

export const deleteMemory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const success = await memoryManager.deleteMemory(req.user.id, id);
    res.status(200).json({ success });
  } catch (error) {
    next(error);
  }
};
