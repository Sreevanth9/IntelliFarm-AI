import grokService from "./GrokService.js";

class ConversationSummarizer {
  async summarize(messages) {
    if (!Array.isArray(messages) || messages.length === 0) return "";
    try {
      const summaryInput = messages
        .slice(-10) // summarize last 10 messages for recency
        .map(m => `${m.role.toUpperCase()}: ${m.content}`)
        .join("\n");

      const prompt = [
        {
          role: "system",
          content: "Summarize this farming conversation in one single clear, direct sentence. Focus on what crop, disease, or topic is discussed."
        },
        {
          role: "user",
          content: summaryInput
        }
      ];

      const summary = await grokService.getChatCompletion(prompt);
      return (summary || "").trim();
    } catch (error) {
      console.error("Conversation summarization failed:", error.message);
      return "Farming query discussion.";
    }
  }
}

export default new ConversationSummarizer();
