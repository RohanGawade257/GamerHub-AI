const { GoogleGenerativeAI } = require("@google/generative-ai");

const SYSTEM_PROMPT = `
You are a helpful AI assistant.
Remain professional, accurate, and structured.
`;

const HISTORY_LIMIT = 6;
const MAX_TEXT_LENGTH = 2000;

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";
const GROQ_MODEL = process.env.GROQ_MODEL || "llama3-8b-8192";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-3.5-turbo";

let geminiModel = null;

function clampText(text) {
  if (typeof text !== "string") return "";
  const trimmed = text.trim();
  return trimmed.length > MAX_TEXT_LENGTH
    ? trimmed.slice(0, MAX_TEXT_LENGTH)
    : trimmed;
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
    .slice(-HISTORY_LIMIT)
    .map((item) => ({
      role: item.role,
      content: clampText(item.content),
    }));
}

function parseGeminiRetryAfterSeconds(error) {
  const details = Array.isArray(error?.errorDetails) ? error.errorDetails : [];
  const retryInfo = details.find(
    (entry) => entry && typeof entry.retryDelay === "string",
  );
  const rawDelay = retryInfo?.retryDelay;
  if (!rawDelay) return null;

  const secondsMatch = rawDelay.match(/^(\d+)s$/);
  if (!secondsMatch) return null;

  const seconds = Number(secondsMatch[1]);
  return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
}

function parseHeaderRetryAfterSeconds(response) {
  const retryAfter = response.headers.get("retry-after");
  if (!retryAfter) return null;
  const seconds = Number(retryAfter);
  return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
}

function createProviderError({
  provider,
  statusCode,
  message,
  retryAfterSeconds,
  cause,
}) {
  const error = new Error(message);
  error.provider = provider;
  error.statusCode = statusCode;
  error.retryAfterSeconds = retryAfterSeconds || null;
  error.cause = cause;
  return error;
}

function getGeminiModel() {
  if (geminiModel) return geminiModel;

  if (!process.env.GEMINI_API_KEY) {
    throw createProviderError({
      provider: "gemini",
      statusCode: 401,
      message: "Missing GEMINI_API_KEY",
    });
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  geminiModel = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: SYSTEM_PROMPT,
  });
  return geminiModel;
}

async function geminiProvider({ message, history }) {
  try {
    const model = getGeminiModel();
    const formattedHistory = history.map((item) => ({
      role: item.role,
      parts: [{ text: item.content }],
    }));
    const chat = model.startChat({ history: formattedHistory });
    const result = await chat.sendMessage(message);
    const reply = result?.response?.text?.();

    if (!reply || !reply.trim()) {
      throw createProviderError({
        provider: "gemini",
        statusCode: 502,
        message: "Gemini returned an empty response",
      });
    }

    return {
      provider: "gemini",
      reply: reply.trim(),
    };
  } catch (error) {
    if (error.provider) {
      throw error;
    }

    const errorText = String(error?.message || "");
    const statusCode = errorText.includes("[429")
      ? 429
      : errorText.includes("[401") || errorText.includes("[403")
        ? 401
        : errorText.includes("[404")
          ? 404
          : 500;

    throw createProviderError({
      provider: "gemini",
      statusCode,
      retryAfterSeconds: statusCode === 429 ? parseGeminiRetryAfterSeconds(error) : null,
      message: errorText || "Gemini request failed",
      cause: error,
    });
  }
}

function buildOpenAIStyleMessages({ message, history }) {
  return [
    { role: "system", content: SYSTEM_PROMPT.trim() },
    ...history.map((item) => ({
      role: item.role === "model" ? "assistant" : "user",
      content: item.content,
    })),
    { role: "user", content: message },
  ];
}

async function groqProvider({ message, history }) {
  if (!process.env.GROQ_API_KEY) {
    throw createProviderError({
      provider: "groq",
      statusCode: 401,
      message: "Missing GROQ_API_KEY",
    });
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: buildOpenAIStyleMessages({ message, history }),
      temperature: 0.4,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw createProviderError({
      provider: "groq",
      statusCode: response.status,
      retryAfterSeconds: parseHeaderRetryAfterSeconds(response),
      message: `Groq error ${response.status}: ${errorBody}`,
    });
  }

  const data = await response.json();
  const reply = data?.choices?.[0]?.message?.content;
  if (!reply || !reply.trim()) {
    throw createProviderError({
      provider: "groq",
      statusCode: 502,
      message: "Groq returned an empty response",
    });
  }

  return {
    provider: "groq",
    reply: reply.trim(),
  };
}

async function openAIProvider({ message, history }) {
  if (!process.env.OPENAI_API_KEY) {
    throw createProviderError({
      provider: "openai",
      statusCode: 401,
      message: "Missing OPENAI_API_KEY",
    });
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: buildOpenAIStyleMessages({ message, history }),
      temperature: 0.4,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw createProviderError({
      provider: "openai",
      statusCode: response.status,
      retryAfterSeconds: parseHeaderRetryAfterSeconds(response),
      message: `OpenAI error ${response.status}: ${errorBody}`,
    });
  }

  const data = await response.json();
  const reply = data?.choices?.[0]?.message?.content;
  if (!reply || !reply.trim()) {
    throw createProviderError({
      provider: "openai",
      statusCode: 502,
      message: "OpenAI returned an empty response",
    });
  }

  return {
    provider: "openai",
    reply: reply.trim(),
  };
}

async function generateWithFallback({ message, history }) {
  const safeMessage = clampText(message);
  const safeHistory = normalizeHistory(history);

  const providers = [geminiProvider, groqProvider, openAIProvider];
  const providerErrors = [];

  for (const provider of providers) {
    try {
      const result = await provider({
        message: safeMessage,
        history: safeHistory,
      });
      return result;
    } catch (error) {
      providerErrors.push(error);
      if (error.provider === "gemini" && error.statusCode === 429) {
        console.warn("Gemini quota exhausted");
      }
    }
  }

  const retryAfterSeconds = providerErrors
    .map((error) => error.retryAfterSeconds)
    .filter((seconds) => Number.isFinite(seconds) && seconds > 0)
    .reduce((max, seconds) => Math.max(max, seconds), 0);

  throw createProviderError({
    provider: "none",
    statusCode: 503,
    retryAfterSeconds: retryAfterSeconds || null,
    message: "AI temporarily unavailable",
    cause: providerErrors,
  });
}

module.exports = {
  HISTORY_LIMIT,
  normalizeHistory,
  generateWithFallback,
};
