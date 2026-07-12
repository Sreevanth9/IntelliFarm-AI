import api, { API_BASE_URL } from "./api.js";
export { API_BASE_URL };

export interface Conversation {
  id: string;
  title: string;
  summary?: string;
  pinned: boolean;
  favorite: boolean;
  last_message?: string;
  created_at: string;
  updated_at: string;
}

export interface Attachment {
  type: string;
  data: any;
}

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  tokens: number;
  attachments: Attachment[];
  createdAt: string;
}

export interface Memory {
  id: string;
  type: string;
  content: string;
  importance: number;
  createdAt: string;
}

export const getConversations = async (): Promise<Conversation[]> => {
  const response = await api.get("/api/copilot/conversations");
  return response.data.conversations;
};

export const getConversationMessages = async (id: string): Promise<Message[]> => {
  const response = await api.get(`/api/copilot/conversations/${id}`);
  return response.data.messages;
};

export const updateConversation = async (
  id: string,
  data: { title?: string; pinned?: boolean; favorite?: boolean }
): Promise<Conversation> => {
  const response = await api.put(`/api/copilot/conversations/${id}`, data);
  return response.data.conversation;
};

export const deleteConversation = async (id: string): Promise<boolean> => {
  const response = await api.delete(`/api/copilot/conversations/${id}`);
  return response.data.deleted;
};

export const getMemories = async (): Promise<Memory[]> => {
  const response = await api.get("/api/copilot/memories");
  return response.data.memories;
};

export const deleteMemory = async (id: string): Promise<boolean> => {
  const response = await api.delete(`/api/copilot/memories/${id}`);
  return response.data.success;
};

export const fetchChatStream = async (
  message: string,
  conversationId: string | null,
  attachments: any[] = []
): Promise<Response> => {
  const token = localStorage.getItem("accessToken");
  const response = await fetch(`${API_BASE_URL}/api/copilot/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ message, conversationId, attachments })
  });
  return response;
};
