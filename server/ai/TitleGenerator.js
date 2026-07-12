import grokService from "./GrokService.js";

class TitleGenerator {
  async generate(firstMessage) {
    if (!firstMessage) return "New Conversation";
    try {
      const messages = [
        {
          role: "system",
          content: "Generate a short, concise, 3-5 word title summarizing the user's farming question. Return ONLY the title text, with no quotation marks, no leading text, and no punctuation."
        },
        {
          role: "user",
          content: firstMessage
        }
      ];

      const rawTitle = await grokService.getChatCompletion(messages);
      let title = (rawTitle || "").trim();
      
      // Clean up quotation marks if any
      title = title.replace(/^["']|["']$/g, "").trim();

      // Enforce length limit
      if (title.length > 80) {
        title = title.slice(0, 77) + "...";
      }

      return title || "Farming Chat";
    } catch (error) {
      console.error("Title generation failed, falling back to message slice:", error.message);
      return firstMessage.slice(0, 40) + (firstMessage.length > 40 ? "..." : "");
    }
  }
}

export default new TitleGenerator();
