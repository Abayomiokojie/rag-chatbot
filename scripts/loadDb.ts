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
  "https://formula1.fandom.com/wiki/Formula_1_World_Championship",
  "https://formula1.com/en/latest/all",
  "https://www.autosport.com/f1/",
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
  const loader = new PuppeteerWebBaseLoader("https:exampleurl.com", {
    launchOptions: {
      headless: true,
    },
    gotoOptions: {
      waitUntil: "domcontentloaded",
    },
    evaluate: async (page, browser) => {
      const result = await page.evaluate(() => document.body.innerHTML);
      await browser.close();
      return result;
    },
  });

  const scraped = await loader.scrape();
  return scraped?.replace(/<[^>]*>?/gm, " ").trim() || "";
};

createCollection().then(() => loadData());
