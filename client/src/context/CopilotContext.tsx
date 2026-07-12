import React, { createContext, useState, useEffect, useContext, ReactNode } from "react";
import * as copilotService from "../services/copilotService";

export interface CopilotContextType {
  conversations: copilotService.Conversation[];
  messages: copilotService.Message[];
  selectedConversation: copilotService.Conversation | null;
  memories: copilotService.Memory[];
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  isStreaming: boolean;
  error: string | null;
  attachments: any[];
  draft: string;
  suggestions: string[];
  
  setDraft: (draft: string) => void;
  setAttachments: React.Dispatch<React.SetStateAction<any[]>>;
  loadConversations: () => Promise<void>;
  selectConversation: (conversationId: string | null) => Promise<void>;
  loadMemories: () => Promise<void>;
  createConversation: (firstMsg: string) => Promise<string | null>;
  renameConversation: (id: string, title: string) => Promise<void>;
  togglePinConversation: (id: string) => Promise<void>;
  toggleFavoriteConversation: (id: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  deleteMemory: (id: string) => Promise<void>;
  
  // Streaming actions
  setMessages: React.Dispatch<React.SetStateAction<copilotService.Message[]>>;
  setIsStreaming: (isStreaming: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedConversation: React.Dispatch<React.SetStateAction<copilotService.Conversation | null>>;
  setConversations: React.Dispatch<React.SetStateAction<copilotService.Conversation[]>>;
}

const CopilotContext = createContext<CopilotContextType | undefined>(undefined);

export const CopilotProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [conversations, setConversations] = useState<copilotService.Conversation[]>([]);
  const [messages, setMessages] = useState<copilotService.Message[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<copilotService.Conversation | null>(null);
  const [memories, setMemories] = useState<copilotService.Memory[]>([]);
  
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [draft, setDraft] = useState("");
  
  const defaultSuggestions = [
    "Recommend suitable crops for clay soil",
    "What is the weather impact on harvesting today?",
    "Suggest a fertilizer plan for organic tomato farming",
    "How do I prevent early blight in potato plants?"
  ];
  const [suggestions, setSuggestions] = useState<string[]>(defaultSuggestions);

  const loadConversations = async () => {
    setIsLoadingConversations(true);
    setError(null);
    try {
      const data = await copilotService.getConversations();
      setConversations(data);
    } catch (err: any) {
      setError(err.message || "Failed to load conversations");
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const loadMemories = async () => {
    try {
      const data = await copilotService.getMemories();
      setMemories(data);
    } catch (err) {
      console.error("Failed to load memories", err);
    }
  };

  const selectConversation = async (conversationId: string | null) => {
    setError(null);
    if (!conversationId) {
      setSelectedConversation(null);
      setMessages([]);
      return;
    }

    setIsLoadingMessages(true);
    try {
      const active = conversations.find(c => c.id === conversationId);
      if (active) setSelectedConversation(active);
      
      const list = await copilotService.getConversationMessages(conversationId);
      setMessages(list);
    } catch (err: any) {
      setError(err.message || "Failed to load messages");
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const createConversation = async (firstMsg: string): Promise<string | null> => {
    try {
      const newConv = await copilotService.updateConversation("", { title: firstMsg.slice(0, 40) });
      if (newConv) {
        setConversations(prev => [newConv, ...prev]);
        setSelectedConversation(newConv);
        return newConv.id;
      }
      return null;
    } catch (err) {
      console.error("Failed to create conversation", err);
      return null;
    }
  };

  const renameConversation = async (id: string, title: string) => {
    try {
      const updated = await copilotService.updateConversation(id, { title });
      setConversations(prev => prev.map(c => c.id === id ? { ...c, title: updated.title } : c));
      if (selectedConversation?.id === id) {
        setSelectedConversation(prev => prev ? { ...prev, title: updated.title } : null);
      }
    } catch (err) {
      console.error("Rename failed", err);
    }
  };

  const togglePinConversation = async (id: string) => {
    const active = conversations.find(c => c.id === id);
    if (!active) return;
    try {
      const updated = await copilotService.updateConversation(id, { pinned: !active.pinned });
      setConversations(prev => {
        const mapped = prev.map(c => c.id === id ? { ...c, pinned: updated.pinned } : c);
        return [...mapped].sort((a, b) => Number(b.pinned) - Number(a.pinned));
      });
      if (selectedConversation?.id === id) {
        setSelectedConversation(prev => prev ? { ...prev, pinned: updated.pinned } : null);
      }
    } catch (err) {
      console.error("Toggle pin failed", err);
    }
  };

  const toggleFavoriteConversation = async (id: string) => {
    const active = conversations.find(c => c.id === id);
    if (!active) return;
    try {
      const updated = await copilotService.updateConversation(id, { favorite: !active.favorite });
      setConversations(prev => prev.map(c => c.id === id ? { ...c, favorite: updated.favorite } : c));
      if (selectedConversation?.id === id) {
        setSelectedConversation(prev => prev ? { ...prev, favorite: updated.favorite } : null);
      }
    } catch (err) {
      console.error("Toggle favorite failed", err);
    }
  };

  const deleteConversation = async (id: string) => {
    try {
      const success = await copilotService.deleteConversation(id);
      if (success) {
        setConversations(prev => prev.filter(c => c.id !== id));
        if (selectedConversation?.id === id) {
          setSelectedConversation(null);
          setMessages([]);
        }
      }
    } catch (err) {
      console.error("Delete conversation failed", err);
    }
  };

  const deleteMemory = async (id: string) => {
    try {
      const success = await copilotService.deleteMemory(id);
      if (success) {
        setMemories(prev => prev.filter(m => m.id !== id));
      }
    } catch (err) {
      console.error("Delete memory failed", err);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      loadConversations();
      loadMemories();
    }
  }, []);

  return (
    <CopilotContext.Provider value={{
      conversations,
      messages,
      selectedConversation,
      memories,
      isLoadingConversations,
      isLoadingMessages,
      isStreaming,
      error,
      attachments,
      draft,
      suggestions,
      setDraft,
      setAttachments,
      loadConversations,
      selectConversation,
      loadMemories,
      createConversation,
      renameConversation,
      togglePinConversation,
      toggleFavoriteConversation,
      deleteConversation,
      deleteMemory,
      setMessages,
      setIsStreaming,
      setError,
      setSelectedConversation,
      setConversations
    }}>
      {children}
    </CopilotContext.Provider>
  );
};

export const useCopilotContext = () => {
  const context = useContext(CopilotContext);
  if (!context) {
    throw new Error("useCopilotContext must be used within a CopilotProvider");
  }
  return context;
};
