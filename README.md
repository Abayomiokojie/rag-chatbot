# F1 Expert: RAG-Powered Chatbot 🏎️

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-black?style=flat&logo=next.js&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=flat&logo=openai&logoColor=white)
![Astra DB](https://img.shields.io/badge/Astra%20DB-Vector%20Search-orange)

An intelligent, context-aware chatbot designed to answer complex questions about Formula 1 racing. This project demonstrates the implementation of a **Retrieval Augmented Generation (RAG)** pipeline using **Next.js**, **DataStax Astra DB**, and **OpenAI**.

---

## 🚀 Project Overview

The **F1 Expert Chatbot** goes beyond standard LLM capabilities by grounding its responses in specific, up-to-date data scraped from trusted sources (Wikipedia, F1.com). By leveraging vector similarity search, the bot retrieves relevant context before generating an answer, significantly reducing hallucinations and providing accurate, domain-specific information.

### Key Features

- **🏎️ Domain-Specific Knowledge:** Specialized in Formula 1 history, teams, drivers, and technical regulations.
- **🧠 RAG Architecture:** Combines the generative power of GPT-4 with precise retrieval from a vector database.
- **⚡ Real-Time Streaming:** Utilizes Vercel AI SDK to stream responses for a responsive user experience.
- **🕸️ Automated Data Ingestion:** Includes a robust scraping pipeline (Puppeteer) to populate the knowledge base.
- **🔍 Semantic Search:** Uses vector embeddings to understand the _intent_ behind user queries, not just keyword matching.

---

## 🛠️ Tech Stack

- **Frontend:** [Next.js 15+](https://nextjs.org/) (App Router), [React](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/)
- **AI & ML:** [OpenAI API](https://openai.com/) (GPT-4 Turbo, text-embedding-3-small), [Vercel AI SDK](https://sdk.vercel.ai/docs)
- **Database:** [DataStax Astra DB](https://www.datastax.com/products/datastax-astra) (Serverless Vector Database)
- **Data Pipeline:** [Puppeteer](https://pptr.dev/) (Web Scraping), [LangChain](https://js.langchain.com/) (Text Splitting & Processing)
- **Language:** TypeScript

---

## 🏗️ Architecture

The application follows a modern RAG architecture:

1.  **Ingestion Phase (`scripts/loadDb.ts`):**

    - Curated F1 URLs are scraped using **Puppeteer**.
    - Content is cleaned and split into manageable chunks via **LangChain**.
    - **OpenAI** generates vector embeddings for each chunk.
    - Embeddings and text are stored in **Astra DB**.

2.  **Inference Phase (`app/api/chat/route.ts`):**
    - User asks a question via the **Next.js** frontend.
    - The question is converted into an embedding.
    - **Astra DB** performs a vector similarity search to find the top relevant chunks.
    - Retrieved context is injected into the system prompt.
    - **GPT-4** generates the final response, streamed back to the user.

---

## 🏁 Getting Started

Follow these steps to run the project locally.

### Prerequisites

- Node.js 18+ installed.
- An [OpenAI API Key](https://platform.openai.com/).
- A [DataStax Astra DB](https://astra.datastax.com/) database (Serverless Vector DB).

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/your-username/rag-chatbot.git
    cd rag-chatbot
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Configure Environment:**
    Create a `.env` file in the root directory and add your credentials:

    ```env
    ASTRA_DB_API_ENDPOINT="your_astra_db_endpoint"
    ASTRA_DB_APPLICATION_TOKEN="your_astra_db_token"
    ASTRA_DB_NAMESPACE="default_keyspace"
    ASTRA_DB_COLLECTION="f1_data"
    OPENAI_API_KEY="your_openai_api_key"
    ```

4.  **Seed the Database:**
    Run the ingestion script to scrape data and populate your vector store:

    ```bash
    npm run seed
    ```

5.  **Run the App:**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) to start chatting!

---

## 🔮 Future Improvements

- **Multi-modal capabilities:** Support for image inputs (e.g., "What circuit is this?").
- **Conversation History:** Implement memory to handle follow-up questions more effectively.
- **Live Data Integration:** Hook into live F1 APIs for real-time race results and telemetry.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the project
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request
