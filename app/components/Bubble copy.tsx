import React from "react";

type Message = {
  role: "user" | "assistant" | "system" | string;
  content: React.ReactNode;
};

function Bubble({ message }: { message: Message }) {
  const { role, content } = message;
  return <div className={`${role}bubble`}>{content}</div>;
}

export default Bubble;
