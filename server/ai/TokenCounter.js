class TokenCounter {
  count(text) {
    if (!text || typeof text !== "string") return 0;
    
    // Quick heuristic calculations:
    // 1. By word count: words * 1.3
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const byWords = Math.ceil(words * 1.35);

    // 2. By characters: characters / 4
    const byChars = Math.ceil(text.length / 4.0);

    // Take max of both to be safe
    return Math.max(byWords, byChars);
  }

  countMessageTokens(messages) {
    if (!Array.isArray(messages)) return 0;
    return messages.reduce((acc, msg) => acc + this.count(msg.content), 0);
  }
}

export default new TokenCounter();
