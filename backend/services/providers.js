const { GoogleGenerativeAI } = require("@google/generative-ai");
const Groq = require("groq-sdk");

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";
const DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile";
const configuredGroqModel = process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL;
const LEGACY_GROQ_MODELS = new Set(["llama3-70b-8192", "llama3-8b-8192"]);
const GROQ_MODEL = LEGACY_GROQ_MODELS.has(configuredGroqModel)
  ? DEFAULT_GROQ_MODEL
  : configuredGroqModel;
const SYSTEM_PROMPT = "You are a helpful assistant.";
const MAX_TEXT_LENGTH = 2000;

let geminiModel = null;
let groqClient = null;

function clampText(text) {
  if (typeof text !== "string") return "";
  const trimmed = text.trim();
  return trimmed.length > MAX_TEXT_LENGTH ? trimmed.slice(0, MAX_TEXT_LENGTH) : trimmed;
}

function normalizeHistory(history) {
  if (!Array.isArray(history)) return [];

  return history
    .filter(
      (item) =>
        item &&
        (item.role === "user" || item.role === "model") &&
        typeof item.content === "string" &&
        item.content.trim().length > 0,
    )
    .slice(-6)
    .map((item) => ({
      role: item.role,
      content: clampText(item.content),
    }));
}

function getGeminiModel() {
  if (geminiModel) return geminiModel;

  if (!process.env.GEMINI_API_KEY) {
    const error = new Error("Missing GEMINI_API_KEY");
    error.statusCode = 401;
    throw error;
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  geminiModel = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
  });
  return geminiModel;
}

function getGroqClient() {
  if (groqClient) return groqClient;

  if (!process.env.GROQ_API_KEY) {
    const error = new Error("Missing GROQ_API_KEY");
    error.statusCode = 401;
    throw error;
  }

  groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return groqClient;
}

async function callGemini({ message, history }) {
  const model = getGeminiModel();
  const formatted = history.map((m) => ({
    role: m.role,
    parts: [{ text: m.content }],
  }));

  const chat = model.startChat({ history: formatted });
  const result = await chat.sendMessage(clampText(message));
  const reply = result?.response?.text?.();

  if (!reply || !reply.trim()) {
    throw new Error("Gemini returned an empty response");
  }

  return reply.trim();
}

function toGroqMessages({ message, history }) {
  return [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.map((m) => ({
      role: m.role === "model" ? "assistant" : "user",
      content: m.content,
    })),
    { role: "user", content: clampText(message) },
  ];
}

async function callGroq({ message, history }) {
  const groq = getGroqClient();
  const messages = toGroqMessages({ message, history });

  const runGroq = async (modelName) => {
    const completion = await groq.chat.completions.create({
      model: modelName,
      messages,
    });
    const reply = completion?.choices?.[0]?.message?.content;
    if (!reply || !reply.trim()) {
      throw new Error("Groq returned an empty response");
    }
    return reply.trim();
  };

  try {
    return await runGroq(GROQ_MODEL);
  } catch (error) {
    const errorText = String(error?.message || "");
    const isDecommissioned = errorText.toLowerCase().includes("model_decommissioned");
    if (isDecommissioned && GROQ_MODEL !== DEFAULT_GROQ_MODEL) {
      return runGroq(DEFAULT_GROQ_MODEL);
    }
    throw error;
  }
}

module.exports = {
  callGemini,
  callGroq,
  normalizeHistory,
};
