// import type { Message } from "@ai-sdk/react";

// interface BubbleProps {
//   message: Message;
// }

// function Bubble({ message }) {
//   const { role, content } = message;
//   return <div className={`${role}bubble`}>{content}</div>;
// }

// export default Bubble;

// components/Bubble.tsx
import type { UIMessage } from "@ai-sdk/react";

interface BubbleProps {
  message: UIMessage;
}

export default function Bubble({ message }: BubbleProps) {
  const { role } = message;

  // Function to extract text from the v5 'parts' array
  const getMessageText = () => {
    if (!message.parts || message.parts.length === 0) return "";

    // Filter for text parts and join their content
    return message.parts
      .filter((part) => part.type === "text")
      .map((part) => part.text)
      .join("");
  };

  const textContent = getMessageText();

  return <div className={`bubble ${role}-bubble`}>{textContent}</div>;
}
