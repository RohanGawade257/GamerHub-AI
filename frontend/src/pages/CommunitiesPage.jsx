import { useCallback, useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";

import api from "../api";
import CommunityCard from "../components/CommunityCard";
import { useAuth } from "../context/AuthContext";

function CommunitiesPage() {
  const { token } = useAuth();
  const [communities, setCommunities] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name: "", description: "" });
  const [createdCommunity, setCreatedCommunity] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const loadCommunities = useCallback(async () => {
    setError("");
    setIsLoading(true);
    try {
      const { data } = await api.get("/community", {
        params: search.trim() ? { search: search.trim() } : undefined,
      });
      setCommunities(Array.isArray(data.communities) ? data.communities : []);
    } catch (requestError) {
      setError(requestError?.response?.data?.error || "Unable to fetch communities");
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadCommunities();
  }, [loadCommunities]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const handleCreate = async (event) => {
    event.preventDefault();
    setError("");
    setIsCreating(true);

    try {
      const { data } = await api.post("/community/create", form);
      setCreatedCommunity(data?.community || null);
      setForm({ name: "", description: "" });
      await loadCommunities();
    } catch (requestError) {
      setError(requestError?.response?.data?.error || "Unable to create community");
    } finally {
      setIsCreating(false);
    }
  };

  const inviteCode = String(createdCommunity?.inviteCode || "");
  const shareLink = inviteCode ? `http://localhost:5173/join-community?code=${encodeURIComponent(inviteCode)}` : "";

  const copyText = async (textToCopy) => {
    try {
      await navigator.clipboard.writeText(textToCopy);
    } catch (_error) {
      setError("Unable to copy to clipboard");
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-xl bg-white p-4 shadow-md dark:bg-gray-800">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-semibold">Communities</h1>
          <Link
            to="/join-community"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white transition hover:bg-blue-700"
          >
            Join with Code
          </Link>
        </div>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
          Discover local sports groups and chat with members.
        </p>

        <form className="mt-4 grid gap-3 md:grid-cols-3" onSubmit={handleCreate}>
          <input
            type="text"
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            placeholder="Community name"
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            required
          />
          <input
            type="text"
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            placeholder="Description"
            value={form.description}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
          />
          <button
            type="submit"
            disabled={isCreating}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {isCreating ? "Creating..." : "Create Community"}
          </button>
        </form>

        {inviteCode ? (
          <div className="mt-4 space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/40">
            <p className="text-sm font-medium">Community Invite</p>
            <div className="flex flex-wrap items-center gap-2">
              <div className="rounded-md bg-white px-3 py-2 text-sm font-semibold tracking-widest text-gray-900 dark:bg-gray-800 dark:text-gray-100">
                {inviteCode}
              </div>
              <button
                type="button"
                onClick={() => copyText(inviteCode)}
                className="rounded-md bg-blue-600 px-3 py-2 text-sm text-white transition hover:bg-blue-700"
              >
                Copy Code
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareLink}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 md:max-w-xl"
              />
              <button
                type="button"
                onClick={() => copyText(shareLink)}
                className="rounded-md bg-gray-700 px-3 py-2 text-sm text-white transition hover:bg-gray-800"
              >
                Copy Link
              </button>
            </div>
          </div>
        ) : null}
      </section>

      <section className="rounded-xl bg-white p-4 shadow-md dark:bg-gray-800">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 md:max-w-sm"
            placeholder="Search communities"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <button
            type="button"
            className="rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
            onClick={loadCommunities}
          >
            Search
          </button>
        </div>
      </section>

      {error ? <p className="text-red-600">{error}</p> : null}

      {isLoading ? (
        <div className="rounded-xl bg-white p-4 shadow-md dark:bg-gray-800">Loading communities...</div>
      ) : communities.length === 0 ? (
        <div className="rounded-xl bg-white p-4 shadow-md dark:bg-gray-800">No communities found.</div>
      ) : (
        <section className="grid gap-4 md:grid-cols-2">
          {communities.map((community) => (
            <CommunityCard key={community._id} community={community} />
          ))}
        </section>
      )}
    </div>
  );
}

export default CommunitiesPage;
