"use client";

import Image from "next/image";
import F1logo from "./assets/f1logo.png";
import { useChat } from "@ai-sdk/react";
import { useEffect, useState } from "react";
import Bubble from "./components/Bubble";
import LoadingBubble from "./components/LoadingBubble";
import PromptSuggestions from "./components/PromptSuggestions";
// import { DefaultChatTransport } from "ai"; // Add this import

export default function Home() {
  const [input, setInput] = useState("");

  const { messages, sendMessage, status } = useChat();

  useEffect(() => {
    console.log("Messages updated:", messages);
  }, [messages]);

  // Log status changes
  useEffect(() => {
    console.log(" Status changed:", status);
  }, [status]);

  const isLoading = status === "submitted" || status === "streaming";
  const noMessages = !messages || messages.length === 0;

  const handlePrompt = (promptText: string) => {
    console.log(" Sending prompt:", promptText);
    // Used sendMessage instead of append
    sendMessage({ text: promptText });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (input.trim()) {
      console.log(" Sending message:", input);
      sendMessage({ text: input });
      setInput("");
    }
  };

  return (
    <main className=" ">
      <div className=" h-20">
        <Image
          className="dark:invert -mt-20"
          src={F1logo}
          alt="F1GPT Logo"
          width={250}
          height={50}
          priority
        />
      </div>
      <section className={noMessages ? "" : "populated px-4"}>
        {noMessages ? (
          <div className="starter-text ">
            <p className="font-bold">
              The Ultimate AI-powered Formula 1 chatbot. Ask me anything about
              F1!
            </p>
            <br />
            <PromptSuggestions onPromptClick={handlePrompt} />
          </div>
        ) : (
          <div className="grid gap-y-2">
            {messages.map((message, index: number) => (
              <Bubble key={`message-${index}`} message={message} />
            ))}

            {isLoading && <LoadingBubble />}
          </div>
        )}
      </section>
      {/* Updated the form handler and input change */}
      <form onSubmit={handleSubmit}>
        <input
          className="question-box "
          type="text"
          placeholder="Ask me anything about F1..."
          value={input}
          onChange={(e) => setInput(e.target.value)} // Used setInput
          disabled={isLoading}
        ></input>
        <input type="submit" value="Send" disabled={isLoading} />
      </form>
    </main>
  );
}
