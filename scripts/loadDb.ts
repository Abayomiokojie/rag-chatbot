import { DataAPIClient } from "@datastax/astra-db-ts";
import OpenAI from "openai";
import { PuppeteerWebBaseLoader } from "@langchain/community/document_loaders/web/puppeteer";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import "dotenv/config";

// lanchain v^0.1x import statements
// import { PuppeteerWebBaseLoader } from "langchain/document_loaders/web/puppeteer";
// import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

type SimilarityMetric = "cosine" | "dot_product" | "euclidean";

const {
  ASTRA_DB_API_ENDPOINT,
  ASTRA_DB_APPLICATION_TOKEN,
  ASTRA_DB_NAMESPACE,
  ASTRA_DB_COLLECTION,
  OPENAI_API_KEY_TEST,
} = process.env;

if (
  !ASTRA_DB_API_ENDPOINT ||
  !ASTRA_DB_APPLICATION_TOKEN ||
  !ASTRA_DB_NAMESPACE ||
  !ASTRA_DB_COLLECTION ||
  !OPENAI_API_KEY_TEST
) {
  throw new Error("Missing required environment variables");
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY_TEST,
});

const f1data = [
  "https://en.wikipedia.org/wiki/Formula_One",
  "https://en.wikipedia.org/wiki/Formula_One_Racing",
  "https://en.wikipedia.org/wiki/Formula_One_World_Championship",
  "https://en.wikipedia.org/wiki/Scuderia_Ferrari_in_Formula_One",
  "https://en.wikipedia.org/wiki/Mercedes-Benz_in_Formula_One",
  "https://en.wikipedia.org/wiki/Red_Bull_Racing_in_Formula_One",
  "https://en.wikipedia.org/wiki/McLaren_in_Formula_One",
  "https://en.wikipedia.org/wiki/Alpine_F1_Team",
  "https://en.wikipedia.org/wiki/Alfa_Romeo_in_Formula_One",
  "https://en.wikipedia.org/wiki/Williams_Grand_Prix_Engineering",
  "https://en.wikipedia.org/wiki/Aston_Martin_in_Formula_One",
  "https://en.wikipedia.org/wiki/Haas_F1_Team",
  "https://en.wikipedia.org/wiki/McLaren_in_Formula_One",
  "https://www.formula1.com/en/latest/article/youve-driven-insane-this-year-norris-fellow-drivers-congratulate-him-on-his.E68tNnOj8UI3Y3UPzQAi4",
  "https://www.autosport.com/f1/news/how-mclaren-disarmed-a-key-verstappen-tactic-to-help-norris-win-the-2025-f1-title/10783286/",
  "https://www.formula1.com/en/racing/2024.html",
  "https://en.wikipedia.org/wiki/List_of_Formula_One_World_Drivers%27_Champions",
];

// Initialize the client
const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN);
const db = client.db(ASTRA_DB_API_ENDPOINT, { keyspace: ASTRA_DB_NAMESPACE });

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 512,
  chunkOverlap: 100,
});

const createCollection = async (
  similarityMetric: SimilarityMetric = "dot_product"
) => {
  const res = await db.createCollection(ASTRA_DB_COLLECTION, {
    vector: {
      dimension: 1536,
      metric: similarityMetric,
    },
  });
  console.log("Collection created:", res);
};

const loadData = async () => {
  const collection = await db.collection(ASTRA_DB_COLLECTION);
  for await (const url of f1data) {
    const content = await ScrapePage(url);
    const chunks = await splitter.splitText(content);
    for await (const chunk of chunks) {
      const embedding = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: chunk,
        encoding_format: "float",
      });

      const vector = embedding.data[0].embedding;

      const res = await collection.insertOne({
        $vector: vector,
        text: chunk,
      });
      console.log("Inserted document:", res);
    }
  }
};

const ScrapePage = async (url: string) => {
  const loader = new PuppeteerWebBaseLoader(url, {
    launchOptions: {
      headless: true,
    },
    gotoOptions: {
      waitUntil: "domcontentloaded",
    },
    evaluate: async (page, browser) => {
      // const result = await page.evaluate(() => document.body.innerHTML);
      // await browser.close();
      // return result;

      try {
        // Strategy 1: Try to get main article text
        const articleText = await page.evaluate(() => {
          // Common selectors for article content
          const selectors = [
            "article",
            "main",
            '[role="main"]',
            ".post-content",
            ".entry-content",
            "#content",
          ];

          for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
              // Return text content, removing extra whitespace
              return element.textContent?.replace(/\s+/g, " ").trim() || "";
            }
          }

          // Fallback: get body text but exclude script/style elements
          return document.body.innerText.replace(/\s+/g, " ").trim();
        });

        await browser.close();
        return articleText;
      } catch (error) {
        console.error(`Error scraping ${url}:`, error);
        await browser.close();
        return "";
      }
    },
  });

  const scraped = await loader.scrape();
  // return scraped?.replace(/<[^>]*>?/gm, " ").trim() || "";
  return scraped || "";
};

createCollection().then(() => loadData());
