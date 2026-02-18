const fs = require("fs/promises");
const path = require("path");

const MODEL_NAME = "Xenova/all-MiniLM-L6-v2";
const KNOWLEDGE_PATH = path.join(__dirname, "..", "data", "knowledge.json");
const MAX_TEXT_LENGTH = 2000;

let extractorPromise = null;
let knowledgeEmbeddingsPromise = null;
let knowledgeEmbeddingsCache = null;

function clampText(text) {
  if (typeof text !== "string") return "";
  const trimmed = text.trim();
  return trimmed.length > MAX_TEXT_LENGTH ? trimmed.slice(0, MAX_TEXT_LENGTH) : trimmed;
}

async function getExtractor() {
  if (!extractorPromise) {
    extractorPromise = import("@xenova/transformers")
      .then(({ pipeline }) => pipeline("feature-extraction", MODEL_NAME))
      .catch((error) => {
        extractorPromise = null;
        throw error;
      });
  }
  return extractorPromise;
}

async function embedText(text) {
  const safeText = clampText(text);
  if (!safeText) return [];

  const extractor = await getExtractor();
  const output = await extractor(safeText, {
    pooling: "mean",
    normalize: true,
  });

  return Array.from(output.data);
}

async function loadKnowledgeEmbeddings() {
  if (knowledgeEmbeddingsCache) {
    return knowledgeEmbeddingsCache;
  }

  if (!knowledgeEmbeddingsPromise) {
    knowledgeEmbeddingsPromise = (async () => {
      const raw = await fs.readFile(KNOWLEDGE_PATH, "utf-8");
      const items = JSON.parse(raw);
      const normalized = Array.isArray(items) ? items : [];

      const withEmbeddings = [];
      for (const item of normalized) {
        const content = clampText(item?.content);
        if (!content) {
          continue;
        }

        const embedding = await embedText(content);
        withEmbeddings.push({
          id: item.id,
          content,
          embedding,
        });
      }

      knowledgeEmbeddingsCache = withEmbeddings;
      return withEmbeddings;
    })().catch((error) => {
      knowledgeEmbeddingsPromise = null;
      throw error;
    });
  }

  return knowledgeEmbeddingsPromise;
}

module.exports = {
  clampText,
  embedText,
  loadKnowledgeEmbeddings,
};
