import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

import { useAuth } from "../context/AuthContext";
import { SPORTS_API_URL } from "../lib/api";

function getMessageId(message) {
  return String(message?._id || `${message?.senderId}-${message?.timestamp}`);
}

function getSenderId(sender) {
  if (!sender) {
    return "";
  }

  if (typeof sender === "string") {
    return sender;
  }

  return String(sender._id || sender);
}

function getSenderName(sender) {
  if (!sender) {
    return "Unknown";
  }

  if (typeof sender === "string") {
    return "Player";
  }

  return sender.name || "Player";
}

function ChatBox({ matchId, enabled, initialMessages }) {
  const { token, user } = useAuth();
  const [messages, setMessages] = useState(() => initialMessages || []);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("offline");
  const [error, setError] = useState("");
  const socketRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    setMessages(initialMessages || []);
  }, [initialMessages]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!enabled || !token || !matchId) {
      setStatus("offline");
      setError("");
      return undefined;
    }

    const socket = io(SPORTS_API_URL, {
      transports: ["websocket"],
      auth: {
        token,
      },
    });

    socketRef.current = socket;
    setStatus("connecting");
    setError("");

    socket.on("connect", () => {
      socket.emit("joinMatch", { matchId }, (acknowledgement) => {
        if (!acknowledgement?.ok) {
          setStatus("error");
          setError(acknowledgement?.error || "Unable to join chat room");
          return;
        }

        setStatus("online");
      });
    });

    socket.on("newMessage", (message) => {
      setMessages((currentMessages) => {
        const exists = currentMessages.some((entry) => getMessageId(entry) === getMessageId(message));
        if (exists) {
          return currentMessages;
        }

        return [...currentMessages, message];
      });
    });

    socket.on("connect_error", (socketError) => {
      setStatus("error");
      setError(socketError?.message || "Connection failed");
    });

    socket.on("disconnect", () => {
      setStatus("offline");
    });

    socket.on("chatError", (payload) => {
      setError(payload?.error || "A chat error occurred");
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [enabled, token, matchId]);

  const sendMessage = () => {
    const message = input.trim();
    if (!message || !socketRef.current || status !== "online") {
      return;
    }

    socketRef.current.emit("sendMessage", { matchId, message }, (acknowledgement) => {
      if (!acknowledgement?.ok) {
        setError(acknowledgement?.error || "Unable to send message");
      }
    });

    setInput("");
  };

  if (!enabled) {
    return (
      <section className="rounded-2xl border border-white/60 bg-white/85 p-6 shadow-xl transition-all duration-300 hover:shadow-2xl dark:border-zinc-700 dark:bg-zinc-900/85">
        <h2 className="text-xl font-bold">Match Chat</h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Join this match to access live chat.</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-white/60 bg-white/85 p-6 shadow-xl transition-all duration-300 hover:shadow-2xl dark:border-zinc-700 dark:bg-zinc-900/85">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold">Match Chat</h2>
        <span className="rounded-xl border border-cyan-200 bg-cyan-50 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-700 dark:border-cyan-500/30 dark:bg-cyan-500/20 dark:text-cyan-300">
          Status: {status}
        </span>
      </div>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      <div className="mt-4 max-h-72 space-y-2 overflow-y-auto rounded-xl border border-gray-200 bg-white/70 p-3 dark:border-zinc-700 dark:bg-zinc-900/60">
        {messages.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-300">No messages yet. Start the conversation.</p>
        ) : (
          messages.map((message) => {
            const mine = String(user?._id || "") === getSenderId(message.senderId);
            return (
              <div
                key={getMessageId(message)}
                className={`max-w-[85%] rounded-xl px-3 py-2 text-sm shadow-sm ${
                  mine
                    ? "ml-auto bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-cyan-500/20"
                    : "border border-gray-200 bg-white text-gray-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-gray-100"
                }`}
              >
                <div className={`text-xs ${mine ? "text-blue-100" : "text-gray-500 dark:text-gray-300"}`}>{getSenderName(message.senderId)}</div>
                <div>{message.message}</div>
              </div>
            );
          })
        )}
        <div ref={scrollRef} />
      </div>

      <div className="mt-3 flex items-center gap-2">
        <input
          type="text"
          className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none transition-all duration-300 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50 dark:border-gray-700 dark:bg-zinc-800 dark:text-gray-100"
          value={input}
          placeholder="Type your message"
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              sendMessage();
            }
          }}
        />
        <button
          type="button"
          onClick={sendMessage}
          className="rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 px-4 py-2 font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:scale-105"
        >
          Send
        </button>
      </div>
    </section>
  );
}

export default ChatBox;

