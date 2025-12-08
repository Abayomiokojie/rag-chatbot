import React from "react";

function PromptSuggestionButton({
  text,
  onClick,
}: {
  text: string;
  onClick: () => void;
}) {
  return (
    <button
      className="prompt-suggestion-button hover:bg-purple-300"
      onClick={onClick}
    >
      {text}
    </button>
  );
}

export default PromptSuggestionButton;
