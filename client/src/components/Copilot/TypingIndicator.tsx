import React from "react";

export const TypingIndicator: React.FC = () => {
  return (
    <div className="copilot-typing-bubble">
      <span className="copilot-typing-dot"></span>
      <span className="copilot-typing-dot"></span>
      <span className="copilot-typing-dot"></span>
    </div>
  );
};

export default TypingIndicator;
