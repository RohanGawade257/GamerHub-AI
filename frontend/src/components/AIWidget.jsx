import { useEffect, useRef, useState } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function AIWidget({ apiUrl }) {
  const apiEndpoint = apiUrl || "https://gamerhub-ai.onrender.com/api/chat";
  const SEND_DEBOUNCE_MS = 300;
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesRef = useRef([]);
  const isSendingRef = useRef(false);
  const lastSendAtRef = useRef(0);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
    };

    window.addEventListener("open-ai-widget", handleOpen);
    return () => {
      window.removeEventListener("open-ai-widget", handleOpen);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading || isSendingRef.current) {
      return;
    }

    const now = Date.now();
    if (now - lastSendAtRef.current < SEND_DEBOUNCE_MS) {
      return;
    }
    lastSendAtRef.current = now;

    console.log("SEND CLICK");

    const history = messagesRef.current
      .filter((message) => message.role === "user" || message.role === "model")
      .slice(-6)
      .map((message) => ({
        role: message.role,
        content: message.content,
      }));

    isSendingRef.current = true;
    setIsLoading(true);
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);

    try {
      console.log("AXIOS CALL");
      const response = await axios.post(apiEndpoint, {
        message: trimmed,
        history,
      });

      const reply = response?.data?.reply;
      if (typeof reply === "string" && reply.trim()) {
        setMessages((prev) => [...prev, { role: "model", content: reply }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "error", content: "The model returned an empty response." },
        ]);
      }
    } catch (error) {
      const retryAfterSeconds = error?.response?.data?.retryAfterSeconds;
      const serverMessage =
        typeof error?.response?.data?.error === "string"
          ? error.response.data.error
          : null;
      const fallbackMessage =
        retryAfterSeconds && Number.isFinite(Number(retryAfterSeconds))
          ? `Gemini is rate-limited. Try again in ${retryAfterSeconds}s.`
          : "Request failed. Please check the backend server and try again.";

      setMessages((prev) => [
        ...prev,
        {
          role: "error",
          content: serverMessage || fallbackMessage,
        },
      ]);
    } finally {
      isSendingRef.current = false;
      setIsLoading(false);
    }
  };

  const onKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  };

  return (
    <>
      <button
        id="ai-assistant"
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-gradient-to-br from-indigo-600 to-cyan-500 text-sm font-black tracking-wide text-white shadow-[0_0_24px_rgba(56,189,248,.5)] transition-all duration-300 hover:-translate-y-1 hover:scale-110 hover:shadow-[0_0_34px_rgba(56,189,248,.75)]"
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Toggle AI chat"
      >
        <span className="absolute inset-0 animate-ping rounded-full bg-cyan-400/25" />
        <span className="relative">AI</span>
      </button>

      <aside
        className={`fixed bottom-0 right-0 z-50 flex h-full w-full flex-col overflow-hidden rounded-none border border-white/60 bg-white text-gray-900 shadow-xl transition-all duration-300 md:bottom-4 md:right-4 md:h-[520px] md:w-[380px] md:rounded-xl dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100 ${
          isOpen ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
        }`}
      >
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          aria-label="Close chat"
          className="absolute right-3 top-3 rounded-lg px-2 py-1 text-sm font-bold text-white/90 transition-all duration-300 hover:bg-white/20 md:hidden"
        >
          X
        </button>

        <header className="flex items-center justify-between border-b border-gray-200/70 bg-gradient-to-r from-indigo-600 to-cyan-500 px-4 py-3 text-white dark:border-zinc-700 md:rounded-t-xl">
          <h2 className="text-base font-black tracking-wide">GameBot</h2>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Close chat"
            className="hidden rounded-lg px-2 py-1 text-sm font-bold text-white/90 transition-all duration-300 hover:scale-105 hover:bg-white/20 md:inline-flex"
          >
            X
          </button>
        </header>

        <div className="flex-1 space-y-2 overflow-y-auto overscroll-contain bg-white/40 px-4 py-3 dark:bg-zinc-900/45">
          {messages.length === 0 && (
            <div className="rounded-xl border border-cyan-200 bg-white/85 p-3 text-sm text-gray-600 shadow-sm dark:border-cyan-500/30 dark:bg-zinc-800/85 dark:text-gray-300">
              Ask anything. Your squad AI is online.
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`rounded-lg px-3 py-2 text-sm ${
                message.role === "user"
                  ? "ml-auto max-w-[85%] break-words rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-lg shadow-cyan-500/25"
                  : message.role === "error"
                    ? "max-w-[90%] break-words rounded-xl border border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-900/30 dark:text-red-200"
                    : "max-w-[90%] break-words rounded-xl border border-gray-200 bg-white/85 text-gray-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-gray-100"
              }`}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
            </div>
          ))}

          {isLoading && (
            <div className="inline-block rounded-xl border border-cyan-200 bg-white/85 px-3 py-2 text-sm text-gray-600 dark:border-cyan-500/30 dark:bg-zinc-800 dark:text-gray-300">
              Thinking...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="sticky bottom-0 flex gap-2 border-t border-gray-200/70 bg-inherit p-3 dark:border-zinc-700">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Type your message..."
            rows={2}
            disabled={isLoading}
            className="w-full resize-none rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-all duration-300 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50 dark:border-gray-700 dark:bg-zinc-800 dark:text-gray-100"
          />
          <button
            type="button"
            onClick={() => {
              void sendMessage();
            }}
            disabled={isLoading || input.trim().length === 0}
            className="rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:scale-105 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500"
          >
            Send
          </button>
        </div>
      </aside>
    </>
  );
}

export default AIWidget;
