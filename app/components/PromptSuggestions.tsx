import React from "react";
import PromptSuggestionButton from "./PromptSuggestionButton";

function PromptSuggestions({
  onPromptClick,
}: {
  onPromptClick: (prompt: string) => void;
}) {
  const prompts = [
    "Who is the current Formula 1 World Champion?",
    "What are the rules for overtaking in F1?",
    "Can you explain the points system in Formula 1?",
    "Who would be the newest driver to join F1 in 2025?",
    "Who has the most Grand Prix wins in F1 history?",
  ];
  return (
    <div className="prompt-suggestions">
      {prompts.map((prompt, index) => (
        <PromptSuggestionButton
          key={`suggestion-${index}`}
          text={prompt}
          onClick={() => {
            onPromptClick(prompt);
          }}
        />
      ))}
    </div>
  );
}

export default PromptSuggestions;
