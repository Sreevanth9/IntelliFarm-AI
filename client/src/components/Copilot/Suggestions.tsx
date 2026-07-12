import React from "react";
import { ArrowUpRight } from "lucide-react";
import { useCopilotContext } from "../../context/CopilotContext";

interface SuggestionsProps {
  onSelect: (suggestion: string) => void;
}

export const Suggestions: React.FC<SuggestionsProps> = ({ onSelect }) => {
  const { suggestions } = useCopilotContext();

  return (
    <div className="copilot-suggestions-container">
      {suggestions.map((suggestion, index) => (
        <div
          key={index}
          className="copilot-suggestion-card"
          onClick={() => onSelect(suggestion)}
        >
          <span className="copilot-suggestion-text">{suggestion}</span>
          <ArrowUpRight size={16} className="copilot-suggestion-arrow" />
        </div>
      ))}
    </div>
  );
};

export default Suggestions;
