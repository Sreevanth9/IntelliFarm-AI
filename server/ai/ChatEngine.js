import { supabase } from "../config/supabase.js";
import conversationManager from "./ConversationManager.js";
import memoryManager from "./MemoryManager.js";
import promptBuilder from "./PromptBuilder.js";
import grokService from "./GrokService.js";
import responseFormatter from "./ResponseFormatter.js";
import streamService from "./StreamService.js";
import tokenCounter from "./TokenCounter.js";
import toolExecutor from "./ToolExecutor.js";
import titleGenerator from "./TitleGenerator.js";
import conversationSummarizer from "./ConversationSummarizer.js";

class ChatEngine {
  async handleChatStream(req, res, next) {
    let streamInitialized = false;
    try {
      const { message, conversationId, attachments = [] } = req.body;
      const userId = req.user?.id;

      console.log("[ChatEngine] STEP 1: Incoming request received. Message length:", message?.length);

      if (!message || message.trim().length < 2) {
        console.warn("[ChatEngine] Validation failed: message too short");
        return res.status(400).json({ success: false, error: "Message is required" });
      }

      // 1. Prompt Injection Security Check
      console.log("[ChatEngine] STEP 2: Running prompt injection security audit...");
      if (grokService.securityCheck(message)) {
        console.warn("[ChatEngine] Prompt injection signature matched! Blocking input.");
        // Log safety block
        try {
          await supabase.from("ai_audit_logs").insert({
            user_id: userId,
            prompt: message,
            response: "[REJECTED: Jailbreak attempt detected]",
            is_flagged: true,
            flagged_reason: "Jailbreak attempt signature matched"
          });
        } catch (e) {
          console.error("[ChatEngine] AI Audit Log save failed:", e.message);
        }
        return res.status(400).json({
          success: false,
          error: "Safety Block: Input contains unauthorized instructions."
        });
      }

      // 2. Fetch or Create Conversation
      console.log("[ChatEngine] STEP 3: Resolving conversation session...");
      let activeConversationId = conversationId;
      let isNewConversation = false;

      if (!activeConversationId) {
        console.log("[ChatEngine] No conversationId provided. Creating new conversation...");
        const newConv = await conversationManager.createConversation(userId, message.slice(0, 40));
        if (!newConv) {
          throw new Error("Failed to create conversation in database. Please verify that your Supabase tables are set up using 'server/supabase_copilot_v2_schema.sql' in your Supabase SQL editor.");
        }
        activeConversationId = newConv.id;
        isNewConversation = true;
        console.log("[ChatEngine] New conversation created successfully. ID:", activeConversationId);
      } else {
        console.log("[ChatEngine] Existing conversationId provided:", activeConversationId);
        // Security check: ensure active conversation belongs to user
        const existingConv = await conversationManager.getConversation(userId, activeConversationId);
        if (!existingConv) {
          console.warn("[ChatEngine] Security hijacking check failed. Access denied.");
          return res.status(403).json({ success: false, error: "Access denied to conversation" });
        }
        console.log("[ChatEngine] Conversation ownership verified");
      }

      // Save user message to database
      console.log("[ChatEngine] STEP 4: Saving user message to database...");
      try {
        const userTokens = tokenCounter.count(message);
        await conversationManager.saveMessage(activeConversationId, "user", message, userTokens, attachments);
        console.log("[ChatEngine] User message saved successfully");
      } catch (dbErr) {
        console.warn("[ChatEngine] Database WARNING: Failed to save user message:", dbErr.message);
      }

      // 3. Fetch Farm & User Profile Context
      console.log("[ChatEngine] STEP 5: Loading user & farm profile context...");
      let activeFarm = null;
      let userProfile = null;
      try {
        if (req.user) {
          userProfile = {
            name: req.user.name,
            pincode: req.user.pincode,
            location: req.user.location,
            cropsInterested: req.user.crops_interested || []
          };
        }

        const { data: farms } = await supabase
          .from("farms")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });
        
        if (farms && farms.length > 0) {
          const farm = farms[0];
          activeFarm = {
            id: farm.id,
            name: farm.farm_name,
            location: farm.location || userProfile?.location,
            crop: farm.crop,
            cropVariety: farm.crop_variety,
            soilType: farm.soil_type,
            area: farm.area,
            sowingDate: farm.sowing_date
          };
          console.log("[ChatEngine] Farm profile context loaded successfully for:", activeFarm.name);
        } else {
          console.log("[ChatEngine] No farm profile found for user");
        }
      } catch (err) {
        console.warn("[ChatEngine] Database WARNING: Could not load farm profile context:", err.message);
      }

      // 4. Fetch User Memories
      console.log("[ChatEngine] STEP 6: Loading memory facts...");
      let memories = [];
      try {
        memories = await memoryManager.getMemories(userId);
        console.log(`[ChatEngine] Memories loaded: ${memories.length} facts`);
      } catch (err) {
        console.warn("[ChatEngine] Database WARNING: Failed to load user memories:", err.message);
      }

      // 5. Load Past Conversation History (limit to last 20 messages to fit context limits)
      console.log("[ChatEngine] STEP 7: Loading past conversation history...");
      let messagesHistory = [];
      try {
        messagesHistory = await conversationManager.getMessages(activeConversationId);
        console.log(`[ChatEngine] History loaded: ${messagesHistory.length} messages`);
      } catch (err) {
        console.warn("[ChatEngine] Database WARNING: Failed to load conversation history:", err.message);
      }
      // Remove current message from history since we append it separately
      const historyForPrompt = messagesHistory.length > 1 ? messagesHistory.slice(0, -1) : [];

      // 6. Execute Context Tools
      console.log("[ChatEngine] STEP 8: Running agricultural context tools...");
      let toolOutputs = { weather: null, disease: null, market: null };
      try {
        toolOutputs = await toolExecutor.executeAll(message, {
          id: userId,
          location: activeFarm?.location || userProfile?.location || (userProfile?.pincode ? `Pincode ${userProfile.pincode}` : "Hyderabad"),
          crops_interested: activeFarm?.crop ? [activeFarm.crop] : (userProfile?.cropsInterested || [])
        });
        console.log("[ChatEngine] Context tools completed");
      } catch (err) {
        console.warn("[ChatEngine] Tool WARNING: Failed to execute context tools:", err.message);
      }

      // 7. Compile Prompt Messages
      console.log("[ChatEngine] STEP 9: Building prompt message inputs...");
      const promptMessages = promptBuilder.build({
        userProfile,
        farmProfile: activeFarm,
        weatherContext: toolOutputs.weather,
        diseaseContext: toolOutputs.disease,
        memories,
        history: historyForPrompt,
        currentMessage: message
      });

      // 8. Stream Response via SSE
      console.log("[ChatEngine] STEP 10: Initializing SSE stream client headers...");
      streamService.initStream(res);
      streamInitialized = true;
      // Send conversation ID first so the client can map it immediately
      streamService.sendChunk(res, { conversationId: activeConversationId });

      console.log("[ChatEngine] STEP 11: Invoking Groq Chat stream completions...");
      const stream = await grokService.getChatStream(promptMessages);
      console.log("[ChatEngine] Groq stream established. Streaming tokens to client...");
      let assistantResponse = "";

      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || "";
        assistantResponse += text;
        
        // Redact secrets on the fly if any leakage occurs
        const safeText = grokService.redact(text);
        if (safeText) {
          streamService.sendChunk(res, { content: safeText });
        }
      }
      console.log("[ChatEngine] STEP 12: Groq streaming finalized. Content size:", assistantResponse.length);

      // 9. Format response and extract rich cards
      console.log("[ChatEngine] STEP 13: Formatting response text layout...");
      const formattedData = responseFormatter.format(assistantResponse, toolOutputs);
      const assistantTokens = tokenCounter.count(formattedData.formattedText);

      // Save assistant message to database (including structured UI cards metadata in attachments)
      console.log("[ChatEngine] STEP 14: Saving assistant response to database...");
      try {
        await conversationManager.saveMessage(
          activeConversationId,
          "assistant",
          formattedData.formattedText,
          assistantTokens,
          formattedData.uiCards
        );
        console.log("[ChatEngine] Assistant response saved successfully");

        // Update conversation metadata
        console.log("[ChatEngine] Updating conversation last message details...");
        await conversationManager.updateConversation(userId, activeConversationId, {
          last_message: message.slice(0, 100),
        });
        console.log("[ChatEngine] Conversation details updated");
      } catch (dbErr) {
        console.warn("[ChatEngine] Database WARNING: Failed to save assistant message:", dbErr.message);
      }

      // 10. Background Processing (Non-blocking)
      // A. Title generation for new chats
      if (isNewConversation) {
        console.log("[ChatEngine] STEP 15a: Triggering Title Generation background worker...");
        setTimeout(async () => {
          try {
            const title = await titleGenerator.generate(message);
            await conversationManager.updateConversation(userId, activeConversationId, { title });
            // Push title update event to stream before ending it
            streamService.sendChunk(res, { titleUpdate: title });
            console.log("[ChatEngine] Title generated successfully:", title);
          } catch (e) {
            console.error("[ChatEngine] Title generation background job failed:", e.message);
          }
        }, 10);
      }

      // B. Memory Extraction
      console.log("[ChatEngine] STEP 15b: Triggering Memory Extraction background worker...");
      memoryManager.extractAndSaveMemory(userId, message, formattedData.formattedText);

      // C. Summarization (if thread size grows past 8 messages)
      if (messagesHistory.length >= 8) {
        console.log("[ChatEngine] STEP 15c: Triggering Summarization background worker...");
        setTimeout(async () => {
          try {
            const summary = await conversationSummarizer.summarize(messagesHistory);
            await conversationManager.updateConversation(userId, activeConversationId, { summary });
            console.log("[ChatEngine] Conversation summarized successfully");
          } catch (e) {
            console.error("[ChatEngine] Summarization background job failed:", e.message);
          }
        }, 50);
      }

      // Log AI Audit logs
      console.log("[ChatEngine] STEP 16: Saving AI Audit log...");
      try {
        await supabase.from("ai_audit_logs").insert({
          user_id: userId,
          prompt: message,
          response: formattedData.formattedText,
          is_flagged: false
        });
        console.log("[ChatEngine] AI Audit log saved successfully");
      } catch (err) {
        console.error("[ChatEngine] AI Audit Log save failed:", err.message);
      }

      // End SSE Stream
      console.log("[ChatEngine] STEP 17: Finalizing and closing SSE connection...");
      streamService.endStream(res, { uiCards: formattedData.uiCards });
      console.log("[ChatEngine] Stream completed successfully");

    } catch (error) {
      console.error("[ChatEngine] ChatEngine stream execution failed:", error);
      if (streamInitialized) {
        streamService.sendError(res, error.message || "Engine completion failure");
        res.end();
      } else {
        res.status(500).json({ success: false, error: error.message || "Engine completion failure" });
      }
    }
  }
}

export default new ChatEngine();
