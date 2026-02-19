import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";

import api from "../api";
import CommunityChat from "../components/CommunityChat";
import MemberList from "../components/MemberList";
import { useAuth } from "../context/AuthContext";

function getId(entity) {
  if (!entity) {
    return "";
  }
  if (typeof entity === "string") {
    return entity;
  }
  return String(entity._id || entity.id || "");
}

function CommunityDetailsPage() {
  const { id } = useParams();
  const { token, user } = useAuth();
  const [community, setCommunity] = useState(null);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingCommunity, setIsEditingCommunity] = useState(false);
  const [isSavingCommunity, setIsSavingCommunity] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    regenerateInviteCode: false,
  });

  const loadCommunity = useCallback(async () => {
    setError("");
    setIsLoading(true);
    try {
      const { data } = await api.get(`/community/${id}`);
      setCommunity(data.community || null);
      setMessages(Array.isArray(data.messages) ? data.messages : []);
    } catch (requestError) {
      setError(requestError?.response?.data?.error || "Unable to load community");
      setCommunity(null);
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadCommunity();
  }, [loadCommunity]);

  useEffect(() => {
    setEditForm({
      name: String(community?.name || ""),
      description: String(community?.description || ""),
      regenerateInviteCode: false,
    });
  }, [community]);

  const isMember = useMemo(() => {
    if (!community || !user?._id) {
      return false;
    }
    return (community.members || []).some((member) => getId(member) === String(user._id));
  }, [community, user?._id]);
  const isCreator = useMemo(() => {
    return getId(community?.createdBy) === String(user?._id || "");
  }, [community?.createdBy, user?._id]);

  const inviteCode = String(community?.inviteCode || "");
  const inviteLink = inviteCode
    ? `https://gamer-hub-ai.vercel.app/join-community?code=${encodeURIComponent(inviteCode)}`
    : "";

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const handleSaveCommunity = async (event) => {
    event.preventDefault();
    setError("");
    setIsSavingCommunity(true);

    try {
      const { data } = await api.put(`/community/${id}`, {
        name: editForm.name,
        description: editForm.description,
        regenerateInviteCode: editForm.regenerateInviteCode,
      });
      setCommunity(data.community || null);
      setIsEditingCommunity(false);
    } catch (requestError) {
      setError(requestError?.response?.data?.error || "Unable to update community");
    } finally {
      setIsSavingCommunity(false);
    }
  };

  const copyText = async (textToCopy) => {
    try {
      await navigator.clipboard.writeText(textToCopy);
    } catch {
      setError("Unable to copy to clipboard");
    }
  };

  const handlePresenceUpdate = useCallback((payload) => {
    const userId = String(payload?.userId || "");
    const isOnline = Boolean(payload?.isOnline);
    if (!userId) {
      return;
    }

    setCommunity((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        members: (current.members || []).map((member) => {
          if (getId(member) !== userId) {
            return member;
          }
          if (!member || typeof member !== "object") {
            return member;
          }
          return { ...member, isOnline };
        }),
      };
    });
  }, []);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-white/60 bg-white/85 p-4 shadow-xl dark:border-zinc-700 dark:bg-zinc-900/85">
        Loading community...
      </div>
    );
  }

  if (!community) {
    return (
      <div className="rounded-2xl border border-white/60 bg-white/85 p-4 shadow-xl dark:border-zinc-700 dark:bg-zinc-900/85">
        <p className="text-red-600">{error || "Community not found"}</p>
        <Link
          to="/communities"
          className="mt-3 inline-block rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 px-4 py-2 font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:scale-105"
        >
          Back to Communities
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-white/60 bg-gradient-to-br from-white/90 via-blue-50/70 to-cyan-100/70 p-4 shadow-xl dark:border-zinc-700 dark:bg-gradient-to-br dark:from-zinc-900/95 dark:via-zinc-900 dark:to-indigo-950/50">
        <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-cyan-300/30 blur-3xl dark:bg-cyan-500/20" />
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="relative z-10">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-600 dark:text-cyan-300">Community Hub</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight">{community.name}</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              {community.description || "No description provided."}
            </p>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              Members: {(community.members || []).length}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {!isMember ? (
              <Link
                to="/join-community"
                className="rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 px-4 py-2 font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:scale-105"
              >
                Join with Code
              </Link>
            ) : null}
            {isCreator ? (
              <button
                type="button"
                onClick={() => setIsEditingCommunity(true)}
                className="rounded-xl border border-white/60 bg-white/85 px-4 py-2 font-semibold text-gray-900 transition-all duration-300 hover:-translate-y-0.5 hover:scale-105 hover:bg-white hover:shadow-lg dark:border-zinc-700 dark:bg-zinc-800/85 dark:text-gray-100 dark:hover:bg-zinc-700"
              >
                Edit Community
              </button>
            ) : null}
          </div>
        </div>

        {isCreator && inviteCode ? (
          <div className="mt-4 space-y-3 rounded-xl border border-cyan-200/60 bg-white/70 p-3 shadow-lg shadow-cyan-100/40 dark:border-cyan-500/30 dark:bg-zinc-900/70 dark:shadow-cyan-900/20">
            <p className="text-sm font-medium">Invite Code</p>
            <div className="flex flex-wrap items-center gap-2">
              <div className="rounded-lg border border-cyan-200 bg-white px-3 py-2 text-sm font-semibold tracking-[0.2em] text-gray-900 dark:border-cyan-500/30 dark:bg-zinc-800 dark:text-gray-100">
                {inviteCode}
              </div>
              <button
                type="button"
                onClick={() => copyText(inviteCode)}
                className="rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-500 px-3 py-2 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:scale-105"
              >
                Copy Code
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                readOnly
                value={inviteLink}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none dark:border-gray-700 dark:bg-zinc-800 dark:text-gray-100 md:max-w-xl"
              />
              <button
                type="button"
                onClick={() => copyText(inviteLink)}
                className="rounded-lg border border-zinc-200 bg-zinc-800 px-3 py-2 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:scale-105 dark:border-zinc-700 dark:bg-zinc-700"
              >
                Copy Link
              </button>
            </div>
          </div>
        ) : null}

        {error ? <p className="mt-3 text-red-600">{error}</p> : null}
      </section>

      <div className="grid gap-4 xl:grid-cols-[260px_minmax(0,1fr)_320px]">
        <section className="rounded-2xl border border-white/60 bg-white/85 p-4 shadow-xl dark:border-zinc-700 dark:bg-zinc-900/85">
          <h2 className="text-lg font-bold">Channels</h2>
          <div className="mt-3 space-y-2">
            {["general-chat", "match-planning", "teammates", "highlights", "announcements"].map((channel, index) => (
              <button
                key={channel}
                type="button"
                className={`w-full rounded-xl px-3 py-2 text-left text-sm font-semibold transition-all duration-300 ${
                  index === 0
                    ? "border border-cyan-400/60 bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-[0_0_16px_rgba(56,189,248,.45)]"
                    : "border border-transparent bg-slate-100/80 text-slate-700 hover:scale-[1.02] hover:bg-slate-200 dark:bg-zinc-800/80 dark:text-zinc-200 dark:hover:bg-zinc-700"
                }`}
              >
                # {channel}
              </button>
            ))}
          </div>
        </section>

        <CommunityChat
          communityId={id}
          canChat={isMember}
          initialMessages={messages}
          onPresenceUpdate={handlePresenceUpdate}
        />
        <MemberList members={community.members || []} />
      </div>

      {isEditingCommunity ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/55 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/60 bg-white/90 p-4 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900/90">
            <h2 className="text-lg font-semibold">Edit Community</h2>
            <form className="mt-3 space-y-3" onSubmit={handleSaveCommunity}>
              <input
                type="text"
                required
                value={editForm.name}
                onChange={(event) => {
                  setEditForm((current) => ({ ...current, name: event.target.value }));
                }}
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none transition-all duration-300 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50 dark:border-gray-700 dark:bg-zinc-900 dark:text-gray-100"
                placeholder="Community name"
              />
              <textarea
                value={editForm.description}
                onChange={(event) => {
                  setEditForm((current) => ({ ...current, description: event.target.value }));
                }}
                className="min-h-24 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none transition-all duration-300 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50 dark:border-gray-700 dark:bg-zinc-900 dark:text-gray-100"
                placeholder="Description"
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={editForm.regenerateInviteCode}
                  onChange={(event) => {
                    setEditForm((current) => ({ ...current, regenerateInviteCode: event.target.checked }));
                  }}
                />
                Regenerate invite code
              </label>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingCommunity(false)}
                  className="rounded-xl border border-white/60 bg-white/85 px-3 py-2 text-sm font-semibold text-gray-900 transition-all duration-300 hover:-translate-y-0.5 hover:scale-105 hover:bg-white dark:border-zinc-700 dark:bg-zinc-800 dark:text-gray-100 dark:hover:bg-zinc-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingCommunity}
                  className="rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 px-3 py-2 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:scale-105 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500"
                >
                  {isSavingCommunity ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default CommunityDetailsPage;
