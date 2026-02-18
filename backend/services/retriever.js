const { clampText, embedText, loadKnowledgeEmbeddings } = require("./embedder");

const DEFAULT_TOP_K = 2;
const DEFAULT_MIN_SIMILARITY = 0.42;

function toFiniteNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const TOP_K = Math.max(1, Math.floor(toFiniteNumber(process.env.RAG_TOP_K, DEFAULT_TOP_K)));
const MIN_SIMILARITY = toFiniteNumber(
  process.env.RAG_MIN_SIMILARITY,
  DEFAULT_MIN_SIMILARITY,
);

function cosineSimilarity(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length === 0 || b.length === 0) {
    return -1;
  }

  const len = Math.min(a.length, b.length);
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < len; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) {
    return -1;
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function rankKnowledge(queryEmbedding, knowledgeItems) {
  return knowledgeItems
    .map((item) => ({
      id: item.id,
      content: item.content,
      score: cosineSimilarity(queryEmbedding, item.embedding),
    }))
    .sort((a, b) => b.score - a.score);
}

async function retrieveRelevantContext(query) {
  const safeQuery = clampText(query);
  if (!safeQuery) {
    return {
      isRelevant: false,
      context: "",
      matches: [],
      bestScore: -1,
    };
  }

  const queryEmbedding = await embedText(safeQuery);
  if (!queryEmbedding.length) {
    return {
      isRelevant: false,
      context: "",
      matches: [],
      bestScore: -1,
    };
  }

  const knowledge = await loadKnowledgeEmbeddings();
  if (!knowledge.length) {
    return {
      isRelevant: false,
      context: "",
      matches: [],
      bestScore: -1,
    };
  }

  const ranked = rankKnowledge(queryEmbedding, knowledge);
  const topMatches = ranked.slice(0, TOP_K);
  const relevantMatches = topMatches.filter((item) => item.score >= MIN_SIMILARITY);
  const isRelevant = relevantMatches.length > 0;
  const context = isRelevant ? relevantMatches.map((item) => item.content).join("\n") : "";

  return {
    isRelevant,
    context,
    matches: topMatches,
    bestScore: topMatches[0]?.score ?? -1,
  };
}

async function retrieveContext(query) {
  const result = await retrieveRelevantContext(query);
  return result.context;
}

module.exports = {
  cosineSimilarity,
  retrieveContext,
  retrieveRelevantContext,
};
