"use client";

import Image from "next/image";
import F1logo from "./assets/f1logo.png";
import { useChat } from "@ai-sdk/react";
import { useState } from "react"; // Import useState
import Bubble from "./components/Bubble";
import LoadingBubble from "./components/LoadingBubble";
import PromptSuggestions from "./components/PromptSuggestions";
// import { DefaultChatTransport } from "ai"; // Add this import

export default function Home() {
  const [input, setInput] = useState("");

  const { messages, sendMessage, status } = useChat();

  // const { messages, sendMessage, status } = useChat({
  //   transport: new DefaultChatTransport({
  //     api: "/api/chat",
  //   }),
  // });

  const isLoading = status === "submitted" || status === "streaming";
  const noMessages = !messages || messages.length === 0;

  const handlePrompt = (promptText: string) => {
    // Used sendMessage instead of append
    sendMessage({ text: promptText });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage({ text: input });
      setInput("");
    }
  };

  return (
    <main className="items-center justify-between bg-white ">
      <Image
        className="dark:invert"
        src={F1logo}
        alt="Next.js logo"
        width={250}
        height={50}
        priority
      />
      <section className={noMessages ? "" : "populated"}>
        {noMessages ? (
          <div className="starter-text">
            <p>
              The Ultimate AI-powered Formula 1 chatbot. Ask me anything about
              F1!
            </p>
            <br />
            <PromptSuggestions onPromptClick={handlePrompt} />
          </div>
        ) : (
          <div>
            {messages.map((message, index: number) => (
              <Bubble key={`message-${index}`} message={message} />
            ))}
            {isLoading && <LoadingBubble />}
          </div>
        )}

        {/* <LoadingBubble /> */}
      </section>
      {/* Updated the form handler and input change */}
      <form onSubmit={handleSubmit}>
        <input
          className="question-box"
          type="text"
          placeholder="Ask me anything about F1..."
          value={input}
          onChange={(e) => setInput(e.target.value)} // Use setInput
          disabled={isLoading}
        ></input>
        <input type="submit" value="Send" disabled={isLoading} />
      </form>
    </main>
  );
}
