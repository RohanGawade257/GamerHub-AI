import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";

import api from "../api";
import { useAuth } from "../context/AuthContext";

function JoinCommunityPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const codeFromUrl = String(params.get("code") || "").trim().toUpperCase();
    if (codeFromUrl) {
      setInviteCode(codeFromUrl);
    }
  }, [location.search]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const { data } = await api.post("/community/join-by-code", {
        inviteCode: String(inviteCode || "").trim().toUpperCase(),
      });
      const communityId = String(data?.community?._id || "");
      if (communityId) {
        navigate(`/community/${communityId}`);
        return;
      }
      navigate("/communities");
    } catch (requestError) {
      setError(requestError?.response?.data?.error || "Unable to join community");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mx-auto max-w-xl rounded-xl bg-white p-6 text-gray-900 shadow-md dark:bg-gray-800 dark:text-gray-100">
      <h1 className="text-2xl font-semibold">Join Community</h1>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
        Enter the invite code shared by the community creator.
      </p>

      <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
        <input
          type="text"
          value={inviteCode}
          onChange={(event) => setInviteCode(event.target.value.toUpperCase())}
          placeholder="Invite code"
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          minLength={6}
          maxLength={8}
          required
        />

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {isSubmitting ? "Joining..." : "Join by Code"}
          </button>
          <Link
            to="/communities"
            className="rounded-lg bg-gray-200 px-4 py-2 text-gray-900 transition hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
          >
            Back
          </Link>
        </div>
      </form>
    </section>
  );
}

export default JoinCommunityPage;
