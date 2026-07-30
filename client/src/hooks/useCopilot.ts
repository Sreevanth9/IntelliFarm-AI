import { useRef } from "react";
import { useCopilotContext } from "../context/CopilotContext";
import * as copilotService from "../services/copilotService";
import { ensureCsrfToken, getCsrfToken } from "../services/api";

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
    setSelectedConversation,
    setConversations,
    selectedLanguage
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
    let text = textToSend !== undefined ? textToSend : draft;
    const currentAttachments = [...attachments];

    if ((!text || text.trim().length < 2) && currentAttachments.length > 0) {
      text = "Please analyze this attached crop photo/document for farming guidance.";
    }

    if (!text || text.trim().length < 2) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setError(null);
    setDraft("");
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
      status: "streaming"
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
      await ensureCsrfToken();
      let response = await fetch(`${copilotService.API_BASE_URL}/api/copilot/chat`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": getCsrfToken() || ""
        },
        body: JSON.stringify({
          message: text,
          conversationId: conversationId || undefined,
          attachments: currentAttachments,
          language: selectedLanguage
        }),
        signal: controller.signal
      });

      // Secure one-time retry for 401 Unauthorized session expiration
      if (response.status === 401) {
        try {
          await ensureCsrfToken();
          const refreshRes = await fetch(`${copilotService.API_BASE_URL}/api/auth/refresh`, {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              "X-CSRF-Token": getCsrfToken() || ""
            }
          });

          if (refreshRes.ok) {
            await ensureCsrfToken();
            response = await fetch(`${copilotService.API_BASE_URL}/api/copilot/chat`, {
              method: "POST",
              credentials: "include",
              headers: {
                "Content-Type": "application/json",
                "X-CSRF-Token": getCsrfToken() || ""
              },
              body: JSON.stringify({
                message: text,
                conversationId: conversationId || undefined,
                attachments: currentAttachments,
                language: selectedLanguage
              }),
              signal: controller.signal
            });
          }
        } catch (refreshErr) {
          // If refresh fails, fall through to 401 error handler below
        }
      }

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("isLogin");
          window.dispatchEvent(new Event("intellifarm:session-expired"));
          setTimeout(() => {
            window.location.href = "/login";
          }, 1500);
          throw new Error("Your session expired—please sign in again.");
        }

        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
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
                const nextAssistantText = assistantText;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: nextAssistantText }
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
            ? { ...msg, content: assistantText, attachments: uiCards, status: "complete" }
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
        console.log("Stream reading aborted by user.");
        if (!assistantText.trim()) {
          // If no token has arrived yet, remove the temporary assistant message entirely
          setMessages((prev) => prev.filter((msg) => msg.id !== assistantMessageId));
        } else {
          // If partial text has arrived, retain that text and set status: "stopped"
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? {
                    ...msg,
                    content: assistantText,
                    attachments: uiCards,
                    status: "stopped"
                  }
                : msg
            )
          );
        }
        if (finalConversationId) {
          loadConversations();
        }
      } else {
        setError(err.message || "Failed to process chat response");
        // Replace temp assistant message with error state
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  content: `Error: ${err.message || "Something went wrong. Please try again."}`,
                  status: "error"
                }
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
    if (isStreaming) {
      stopGeneration();
    }
    
    let userMsg = messages[messageIndex];
    let truncateIndex = messageIndex;

    if (userMsg?.role === "assistant") {
      userMsg = messages[messageIndex - 1];
      truncateIndex = messageIndex - 1;
    }

    if (!userMsg || userMsg.role !== "user") return;

    // Truncate message history from this user query onwards
    const truncatedHistory = messages.slice(0, truncateIndex);
    setMessages(truncatedHistory);

    // Re-send user query
    await sendMessage(userMsg.content);
  };

  const editMessage = async (messageIndex: number, newContent: string) => {
    if (!newContent || !newContent.trim()) return;

    if (isStreaming) {
      stopGeneration();
    }
    
    const targetMsg = messages[messageIndex];
    if (!targetMsg || targetMsg.role !== "user") return;

    // Truncate message history from this user message index onwards
    const truncatedHistory = messages.slice(0, messageIndex);
    setMessages(truncatedHistory);

    // Resend edited query
    await sendMessage(newContent.trim());
  };

  return {
    sendMessage,
    regenerateResponse,
    editMessage,
    stopGeneration,
    isStreaming
  };
};
