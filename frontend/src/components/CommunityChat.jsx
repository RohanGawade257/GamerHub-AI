import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

import { useAuth } from "../context/AuthContext";
import { SPORTS_API_URL } from "../lib/api";

function getSenderId(sender) {
  if (!sender) {
    return "";
  }
  if (typeof sender === "string") {
    return sender;
  }
  return String(sender._id || sender.id || "");
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

function getMessageId(message) {
  return String(message?._id || `${message?.senderId}-${message?.timestamp}`);
}

function resolveSocketOrigin(rawUrl) {
  const fallbackOrigin = window.location.origin;
  try {
    const parsedUrl = new URL(String(rawUrl || "").trim(), fallbackOrigin);
    return parsedUrl.origin;
  } catch {
    return fallbackOrigin;
  }
}

function CommunityChat({ communityId, canChat, initialMessages, onPresenceUpdate }) {
  const { token, user } = useAuth();
  const [messages, setMessages] = useState(() => initialMessages || []);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("offline");
  const [error, setError] = useState("");
  const socketRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    setMessages(initialMessages || []);
  }, [initialMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!communityId || !token || !canChat) {
      setStatus("offline");
      setError("");
      return undefined;
    }

    const socketBaseUrl = resolveSocketOrigin(SPORTS_API_URL);
    console.log("Socket token:", token);
    const socket = io(socketBaseUrl, {
      path: "/socket.io",
      transports: ["websocket"],
      withCredentials: true,
      auth: { token },
    });

    socketRef.current = socket;
    setStatus("connecting");
    setError("");

    socket.on("connect", () => {
      const joinPayload = { communityId };
      socket.timeout(10000).emit("join-community", joinPayload, (joinError, joinAck) => {
        if (!joinError && joinAck?.ok) {
          setStatus("online");
          return;
        }

        socket.timeout(10000).emit("joinCommunity", joinPayload, (fallbackError, fallbackAck) => {
          if (fallbackError || !fallbackAck?.ok) {
            setStatus("error");
            setError(
              fallbackError?.message
                || joinError?.message
                || fallbackAck?.error
                || joinAck?.error
                || "Unable to join community room",
            );
            return;
          }

          setStatus("online");
        });
      });
    });

    const handleIncomingMessage = (message) => {
      setMessages((current) => {
        const exists = current.some((entry) => getMessageId(entry) === getMessageId(message));
        if (exists) {
          return current;
        }
        return [...current, message];
      });
    };

    socket.on("receive-message", handleIncomingMessage);
    socket.on("communityMessage", handleIncomingMessage);

    socket.on("presence-update", (payload) => {
      if (typeof onPresenceUpdate === "function") {
        onPresenceUpdate(payload);
      }
    });

    socket.on("disconnect", () => {
      setStatus("offline");
    });

    socket.on("connect_error", (socketError) => {
      setStatus("error");
      setError(socketError?.message || "Connection failed");
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [communityId, token, canChat, onPresenceUpdate]);

  const sendMessage = () => {
    const message = input.trim();
    if (!message || !socketRef.current || status !== "online") {
      return;
    }

    const payload = { communityId, message };
    socketRef.current.timeout(10000).emit("send-message", payload, (sendError, sendAck) => {
      if (!sendError && sendAck?.ok) {
        return;
      }

      socketRef.current.timeout(10000).emit("sendCommunityMessage", payload, (fallbackError, fallbackAck) => {
        if (fallbackError || !fallbackAck?.ok) {
          setError(
            fallbackError?.message
              || sendError?.message
              || fallbackAck?.error
              || sendAck?.error
              || "Unable to send message",
          );
        }
      });
    });

    setInput("");
  };

  if (!canChat) {
    return (
      <section className="rounded-2xl border border-white/60 bg-white/85 p-4 shadow-xl dark:border-zinc-700 dark:bg-zinc-900/85">
        <h2 className="text-lg font-bold">Community Chat</h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          Join this community to access chat.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-white/60 bg-white/85 p-4 shadow-xl dark:border-zinc-700 dark:bg-zinc-900/85">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold">Community Chat</h2>
        <span className="rounded-xl border border-cyan-200 bg-cyan-50 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-700 dark:border-cyan-500/30 dark:bg-cyan-500/20 dark:text-cyan-300">
          Status: {status}
        </span>
      </div>

      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}

      <div className="mt-3 max-h-96 space-y-2 overflow-y-auto rounded-xl border border-gray-200 bg-white/70 p-3 dark:border-zinc-700 dark:bg-zinc-900/60">
        {messages.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-300">No messages yet.</p>
        ) : (
          messages.map((message) => {
            const mine = String(user?._id || "") === getSenderId(message.senderId);
            return (
              <div
                key={getMessageId(message)}
                className={`max-w-[85%] rounded-xl px-3 py-2 text-sm shadow-sm transition-all duration-300 ${
                  mine
                    ? "ml-auto bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-cyan-500/20"
                    : "border border-gray-200 bg-white text-gray-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-gray-100"
                }`}
              >
                <div className={`text-xs ${mine ? "text-blue-100" : "text-gray-500 dark:text-gray-300"}`}>
                  {getSenderName(message.senderId)}
                </div>
                <div>{message.message}</div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="mt-3 flex items-center gap-2">
        <input
          type="text"
          className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none transition-all duration-300 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50 dark:border-gray-700 dark:bg-zinc-800 dark:text-gray-100"
          value={input}
          placeholder="Type a message"
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
          className="rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 px-4 py-2 font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:scale-105"
        >
          Send
        </button>
      </div>
    </section>
  );
}

export default CommunityChat;
