import { supabase } from "../config/supabase.js";
import grokService from "./GrokService.js";

class MemoryManager {
  async getMemories(userId) {
    if (!userId) return [];
    try {
      const { data, error } = await supabase
        .from("copilot_memories")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data.map(m => ({
        id: m.id,
        type: m.type,
        content: m.content,
        importance: m.importance,
        createdAt: m.created_at
      }));
    } catch (error) {
      console.error("MemoryManager.getMemories failed:", error.message);
      return [];
    }
  }

  async addMemory(userId, type, content, importance = 1) {
    if (!userId) return null;
    try {
      const { data, error } = await supabase
        .from("copilot_memories")
        .insert({
          user_id: userId,
          type,
          content,
          importance
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("MemoryManager.addMemory failed:", error.message);
      return null;
    }
  }

  async deleteMemory(userId, id) {
    if (!userId) return false;
    try {
      const { error } = await supabase
        .from("copilot_memories")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("MemoryManager.deleteMemory failed:", error.message);
      return false;
    }
  }

  // Attempts to extract key agricultural details from conversations and saves them.
  async extractAndSaveMemory(userId, userMessage, assistantMessage) {
    if (!userId || !userMessage || !assistantMessage) return;

    // Run this in the background asynchronously to avoid blocking chat stream
    setTimeout(async () => {
      try {
        const extractionPrompt = [
          {
            role: "system",
            content: `You are an information extraction service. Analyze the conversation turn and extract any specific facts about the farmer's farm (such as soil type, location, farm size, crops grown, and active pest issues).
If no new agricultural facts are present, output "NONE".
If facts are found, output them in JSON format: {"type": "crop" | "soil" | "location" | "general", "content": "Brief, simple statement of fact", "importance": 1-5}`
          },
          {
            role: "user",
            content: `User: ${userMessage}\nAssistant: ${assistantMessage}`
          }
        ];

        const rawResponse = await grokService.getChatCompletion(extractionPrompt);
        if (rawResponse && !rawResponse.includes("NONE")) {
          const cleaned = rawResponse.trim().replace(/^```json/, "").replace(/```$/, "").trim();
          try {
            const parsed = JSON.parse(cleaned);
            if (parsed.type && parsed.content) {
              await this.addMemory(userId, parsed.type, parsed.content, parsed.importance || 2);
              console.log(`MemoryManager: Extracted and saved memory: ${parsed.content}`);
            }
          } catch (e) {
            // Ignore parse errors from unstructured extractions
          }
        }
      } catch (err) {
        console.error("Memory extraction failed:", err.message);
      }
    }, 100);
  }
}

export default new MemoryManager();
