import { useRef } from "react";
import { useCopilotContext } from "../context/CopilotContext";
import * as copilotService from "../services/copilotService";

export const useCopilot = () => {
  const {
    selectedConversation,
    messages,
    isStreaming,
    attachments,
    draft,
    setMessages,
    setIsStreaming,
    setError,
    setDraft,
    setAttachments,
    loadConversations,
    selectConversation,
    createConversation,
    setSelectedConversation,
    setConversations,
  } = useCopilotContext();

  const abortControllerRef = useRef<AbortController | null>(null);

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
      console.log("Copilot: Generation stopped by user.");
    }
  };

  const sendMessage = async (textToSend?: string) => {
    const text = textToSend !== undefined ? textToSend : draft;
    if (!text || text.trim().length < 2 || isStreaming) return;

    setError(null);
    setDraft("");
    const currentAttachments = [...attachments];
    setAttachments([]);

    // 1. Create temporary User Message
    const userMessageId = Math.random().toString(36).substring(7);
    const tempUserMsg: copilotService.Message = {
      id: userMessageId,
      role: "user",
      content: text,
      tokens: 0,
      attachments: currentAttachments,
      createdAt: new Date().toISOString(),
    };

    // 2. Create temporary Assistant Message (initially empty)
    const assistantMessageId = Math.random().toString(36).substring(7);
    const tempAssistantMsg: copilotService.Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      tokens: 0,
      attachments: [],
      createdAt: new Date().toISOString(),
    };

    // Append to messages list
    setMessages((prev) => [...prev, tempUserMsg, tempAssistantMsg]);
    setIsStreaming(true);

    // Setup Abort Controller
    const controller = new AbortController();
    abortControllerRef.current = controller;

    let conversationId = selectedConversation?.id || null;
    let assistantText = "";
    let finalConversationId = conversationId;
    let uiCards: copilotService.Attachment[] = [];

    try {
      const response = await fetch(`${copilotService.API_BASE_URL}/api/copilot/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`
        },
        body: JSON.stringify({
          message: text,
          conversationId,
          attachments: currentAttachments
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error("ReadableStream is not supported by backend response.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        // Parse Server Sent Events format
        const lines = buffer.split("\n\n");
        // Keep the last partial line in the buffer
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;
          if (line.startsWith("data: ")) {
            const dataStr = line.replace(/^data:\s*/, "").trim();
            
            try {
              const data = JSON.parse(dataStr);

              if (data.error) {
                throw new Error(data.error);
              }

              // Capture conversationId mapping (especially if starting a new thread)
              if (data.conversationId) {
                finalConversationId = data.conversationId;
                if (!conversationId) {
                  conversationId = finalConversationId;
                }
              }

              // Stream word tokens
              if (data.content) {
                assistantText += data.content;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: assistantText }
                      : msg
                  )
                );
              }

              // Capture visual cards/data outputs
              if (data.uiCards) {
                uiCards = data.uiCards;
              }

              // Capture dynamic title generated
              if (data.titleUpdate) {
                loadConversations();
              }

              if (data.done) {
                break;
              }
            } catch (err) {
              // Ignore partial chunk parse issues
            }
          }
        }
      }

      // Finish streaming, update message in state with final values
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? { ...msg, content: assistantText, attachments: uiCards }
            : msg
        )
      );

      // If it was a new chat, update local selectedConversation and conversations list without reloading messages!
      if (finalConversationId && finalConversationId !== selectedConversation?.id) {
        const newConv: copilotService.Conversation = {
          id: finalConversationId,
          title: text.slice(0, 40),
          pinned: false,
          favorite: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setConversations(prev => {
          if (prev.some(c => c.id === finalConversationId)) return prev;
          return [newConv, ...prev];
        });
        setSelectedConversation(newConv);
      } else {
        // Just reload list of conversations to update last message preview and title in the sidebar
        loadConversations();
      }

    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("Stream reading aborted.");
      } else {
        setError(err.message || "Failed to process chat response");
        // Replace temp assistant message with error state
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, content: `Error: ${err.message || "Something went wrong. Please try again."}` }
              : msg
          )
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const regenerateResponse = async (messageIndex: number) => {
    if (isStreaming || messageIndex < 1) return;
    
    // Find the user query message right before the assistant response
    const userMsg = messages[messageIndex - 1];
    if (!userMsg || userMsg.role !== "user") return;

    // Truncate message history from this point
    const truncatedHistory = messages.slice(0, messageIndex - 1);
    setMessages(truncatedHistory);

    // Call sendMessage again
    await sendMessage(userMsg.content);
  };

  const editMessage = async (messageIndex: number, newContent: string) => {
    if (isStreaming) return;
    
    const targetMsg = messages[messageIndex];
    if (!targetMsg || targetMsg.role !== "user") return;

    // Truncate message history from this user message onwards
    const truncatedHistory = messages.slice(0, messageIndex);
    setMessages(truncatedHistory);

    // Resend edited query
    await sendMessage(newContent);
  };

  return {
    sendMessage,
    regenerateResponse,
    editMessage,
    stopGeneration,
    isStreaming
  };
};
