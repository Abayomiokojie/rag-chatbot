import OpenAI from "openai";
import { openai as aiSdkOpenAI } from "@ai-sdk/openai";
import { streamText, convertToModelMessages } from "ai"; // V5 import
import { DataAPIClient } from "@datastax/astra-db-ts";

const {
  ASTRA_DB_API_ENDPOINT,
  ASTRA_DB_APPLICATION_TOKEN,
  ASTRA_DB_NAMESPACE,
  ASTRA_DB_COLLECTION,
  OPENAI_API_KEY_TEST,
} = process.env;

// Validate all required environment variables
if (
  !ASTRA_DB_API_ENDPOINT ||
  !ASTRA_DB_APPLICATION_TOKEN ||
  !ASTRA_DB_NAMESPACE ||
  !ASTRA_DB_COLLECTION ||
  !OPENAI_API_KEY_TEST
) {
  throw new Error(
    "Missing required environment variables. Check your .env file."
  );
}

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY_TEST,
});

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN);
const db = client.db(ASTRA_DB_API_ENDPOINT, {
  namespace: ASTRA_DB_NAMESPACE,
});

export async function POST(req: Request) {
  try {
    // Add this log to see the incoming request body
    const requestBody = await req.json();
    console.log(
      "🔍 Incoming request body:",
      JSON.stringify(requestBody, null, 2)
    );

    const { messages } = requestBody;
    // const latestMessage = messages[messages.length - 1]?.content;

    const modelMessages = convertToModelMessages(messages);

    type TextPart = {
      type: "text";
      text: string;
    };

    // Get the latest message
    const latestMessageObj = messages[messages.length - 1];
    // Safely extract text from the v5 'parts' array structure
    let latestMessage = "";
    if (latestMessageObj?.parts) {
      // Find the first 'text' part and get its text
      const textPart = latestMessageObj.parts.find(
        (part: TextPart) => part.type === "text"
      );
      latestMessage = textPart?.text || "";
    }

    if (
      !latestMessage ||
      typeof latestMessage !== "string" ||
      latestMessage.trim() === ""
    ) {
      return new Response(
        JSON.stringify({
          error: "A valid text input is required to create an embedding.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    let docContext = "";

    // Generate embedding for the query
    const embedding = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: latestMessage.trim(),
      encoding_format: "float",
    });

    try {
      // VALIDATE ONCE MORE AT FUNCTION START
      if (!ASTRA_DB_COLLECTION) {
        throw new Error("ASTRA_DB_COLLECTION is not defined");
      }
      const collection = await db.collection(ASTRA_DB_COLLECTION);

      // FIXED: Use empty object {} instead of null
      const cursor = collection.find(
        {},
        {
          sort: {
            $vector: embedding.data[0].embedding,
          },
          limit: 10,
        }
      );

      const documents = await cursor.toArray();
      const docsMap = documents?.map((doc) => doc.text) || [];
      console.log("🔍 Number of documents found:", documents.length);
      console.log("📄 Retrieved document texts:", docsMap); // This is already your docContext
      docContext = docsMap.join("\n\n"); // Better than JSON.stringify for context
    } catch (err) {
      console.error("Error querying collection:", err);
      docContext = "";
    }

    // Add your system message to the beginning
    const allMessages = [
      {
        role: "system" as const,
        content: `You are a knowledgeable Formula 1 assistant. Use the following context to augment what you know about Formula One racing. 
        The context will provide you with the most recent page data from Wikipedia, the official F1 website and others.
        If the context does not contain information relevant to the user's question, rely on your own knowledge, and don't mention the source of your information or what the context does or does not include.
        Format responses using markdown where applicable and don't return images.
        ----------------
        START CONTEXT
        ${docContext}
        END CONTEXT
        ----------------
        QUESTION: ${latestMessage}
        ----------------`,
      },
      ...modelMessages,
    ];

    // V5: Use streamText instead of OpenAIStream
    const result = await streamText({
      model: aiSdkOpenAI("gpt-4-turbo"), // V5 syntax
      // system: `You are a knowledgeable Formula 1 assistant. Use the following context to augment what you know about Formula One racing.
      // The context will provide you with the most recent page data from Wikipedia, the official F1 website and others.
      // If the context does not contain information relevant to the user's question, rely on your own knowledge, and don't mention the source of your information or what the context does or does not include.
      // Format responses using markdown where applicable and don't return images.
      // ----------------
      // START CONTEXT
      // ${docContext}
      // END CONTEXT
      // ----------------
      // QUESTION: ${latestMessage}
      // ----------------`,
      // messages: messages, // Pass the conversation history
      messages: allMessages,
    });

    // Return the stream directly
    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Error in POST handler:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
