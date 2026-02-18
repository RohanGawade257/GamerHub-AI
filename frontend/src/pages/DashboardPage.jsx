import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Filters from "../components/Filters";
import MatchCard from "../components/MatchCard";
import { useAuth } from "../context/AuthContext";
import api from "../api";

const DEFAULT_FILTERS = {
  sport: "",
  skill: "",
  location: "",
};

function formatDate(dateTime) {
  const parsedDate = new Date(dateTime);
  if (Number.isNaN(parsedDate.getTime())) {
    return "Invalid date";
  }

  return parsedDate.toLocaleString();
}

function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [games, setGames] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadGames = useCallback(async () => {
    setError("");
    setIsLoading(true);

    try {
      const params = {};
      if (filters.sport) {
        params.sport = filters.sport;
      }
      if (filters.skill) {
        params.skill = Number(filters.skill);
      }
      if (filters.location) {
        params.location = filters.location;
      }

      const { data } = await api.get("/games", { params });
      setGames(Array.isArray(data.games) ? data.games : []);
    } catch (requestError) {
      setError(requestError?.response?.data?.error || "Unable to fetch matches");
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    console.log("[DashboardPage] mounted");
  }, []);

  useEffect(() => {
    loadGames();
  }, [loadGames]);

  const upcomingMatches = useMemo(() => {
    return [...games]
      .filter((game) => new Date(game.dateTime).getTime() > Date.now())
      .sort((left, right) => new Date(left.dateTime).getTime() - new Date(right.dateTime).getTime())
      .slice(0, 3);
  }, [games]);

  const handleJoinGame = (gameId) => {
    setError("");
    navigate(`/game/${gameId}?join=1`);
  };

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-white/60 bg-gradient-to-br from-white/90 via-blue-50/80 to-cyan-100/70 p-6 text-gray-900 shadow-xl shadow-blue-100/30 transition-all duration-300 hover:shadow-2xl dark:border-zinc-700/70 dark:bg-gradient-to-br dark:from-zinc-900/95 dark:via-zinc-900 dark:to-indigo-950/60 dark:text-gray-100 dark:shadow-cyan-950/20">
        <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-cyan-300/30 blur-3xl dark:bg-cyan-500/20" />
        <div className="pointer-events-none absolute -bottom-28 -left-20 h-52 w-52 rounded-full bg-indigo-400/20 blur-3xl dark:bg-indigo-500/20" />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative z-10">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-600 dark:text-cyan-300">Esports Lobby</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight">Upcoming Matches</h1>
            <p className="mt-2 max-w-2xl text-gray-600 dark:text-gray-300">
              Find nearby games and connect with players by sport and skill.
            </p>
          </div>

          <Link
            to="/create-game"
            className="relative z-10 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 px-5 py-2.5 font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:scale-105 hover:shadow-xl hover:shadow-cyan-500/35"
          >
            Create Match
          </Link>
        </div>
      </section>

      <Filters filters={filters} onChange={setFilters} onReset={() => setFilters(DEFAULT_FILTERS)} />

      <section className="space-y-3">
        <h2 className="text-xl font-bold tracking-tight">Featured Queue</h2>

        {upcomingMatches.length === 0 ? (
          <div className="rounded-2xl border border-white/60 bg-white/85 p-6 text-gray-900 shadow-lg dark:border-zinc-700 dark:bg-zinc-900/85 dark:text-gray-100">
            No upcoming matches match your filters.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {upcomingMatches.map((game) => (
              <article
                key={game._id}
                className="group rounded-2xl border border-white/70 bg-white/90 p-6 text-gray-900 shadow-lg shadow-slate-200/40 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:border-cyan-300 hover:shadow-xl hover:shadow-cyan-200/30 dark:border-zinc-700 dark:bg-zinc-900/90 dark:text-gray-100 dark:shadow-black/20 dark:hover:border-cyan-500/60 dark:hover:shadow-cyan-900/30"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold tracking-wide">{game.sport}</p>
                  <span className="rounded-lg bg-cyan-100 px-2 py-1 text-xs font-semibold text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300">
                    Queue
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{formatDate(game.dateTime)}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">{game.location}</p>
                <div className="mt-3 h-1 w-16 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-300 group-hover:w-28" />
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold tracking-tight">All Matches</h2>

        {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-red-600 dark:bg-red-900/20 dark:text-red-300">{error}</p> : null}

        {isLoading ? (
          <div className="rounded-2xl border border-white/60 bg-white/85 p-6 text-gray-900 shadow-lg dark:border-zinc-700 dark:bg-zinc-900/85 dark:text-gray-100">
            Loading matches...
          </div>
        ) : games.length === 0 ? (
          <div className="rounded-2xl border border-white/60 bg-white/85 p-6 text-gray-900 shadow-lg dark:border-zinc-700 dark:bg-zinc-900/85 dark:text-gray-100">
            No matches available.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {games.map((game) => (
              <MatchCard
                key={game._id}
                game={game}
                currentUserId={user?._id}
                onJoin={handleJoinGame}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default DashboardPage;
