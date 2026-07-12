import React from "react";
import { ArrowRight } from "lucide-react";

interface SuggestionsProps {
  onSelect: (suggestion: string) => void;
}

interface SuggestionItem {
  icon: string;
  title: string;
  subtitle: string;
  prompt: string;
}

const suggestionItems: SuggestionItem[] = [
  {
    icon: "🌾",
    title: "Crop Recommendation",
    subtitle: "Find the best crops for your soil",
    prompt: "Recommend crops for clay soil"
  },
  {
    icon: "☀️",
    title: "Weather Analysis",
    subtitle: "Check today's farming conditions",
    prompt: "Weather impact on harvesting"
  },
  {
    icon: "🌱",
    title: "Fertilizer Plan",
    subtitle: "Organic and chemical guidance",
    prompt: "Organic fertilizer plan"
  },
  {
    icon: "🦠",
    title: "Disease Diagnosis",
    subtitle: "Identify crop diseases quickly",
    prompt: "Prevent early blight"
  }
];

export const Suggestions: React.FC<SuggestionsProps> = ({ onSelect }) => {
  return (
    <div className="copilot-suggestions-container">
      {suggestionItems.map((item, index) => (
        <div
          key={index}
          className="copilot-suggestion-card"
          style={{
            animation: "cardFadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both",
            animationDelay: `${index * 80}ms`
          }}
          onClick={() => onSelect(item.prompt)}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", textAlign: "left" }}>
            <span style={{ fontSize: "24px" }}>{item.icon}</span>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "14.5px", fontWeight: "600", color: "var(--copilot-text)" }}>{item.title}</span>
              <span style={{ fontSize: "12px", color: "var(--copilot-text-muted)", marginTop: "2px" }}>{item.subtitle}</span>
            </div>
          </div>
          <ArrowRight size={16} className="copilot-suggestion-arrow" />
        </div>
      ))}
    </div>
  );
};

export default Suggestions;
