import { Link } from "react-router-dom";

function getId(entity) {
  if (!entity) {
    return "";
  }

  if (typeof entity === "string") {
    return entity;
  }

  return String(entity._id || entity);
}

function formatDate(dateTime) {
  const parsedDate = new Date(dateTime);
  if (Number.isNaN(parsedDate.getTime())) {
    return "Invalid date";
  }

  return parsedDate.toLocaleString();
}

function copyToClipboard(value) {
  if (!value || !navigator?.clipboard?.writeText) {
    return;
  }

  void navigator.clipboard.writeText(value);
}

function MatchCard({ game, currentUserId, onJoin }) {
  const participantIds = Array.isArray(game.participants) ? game.participants.map((participant) => getId(participant)) : [];
  const communityCode = String(game.communityCode || "").trim();
  const thumbnail = String(game.thumbnail || "").trim();

  const hasJoined = participantIds.includes(String(currentUserId || ""));
  const isFull = Number(game.currentPlayers) >= Number(game.maxPlayers);
  const isCreator = getId(game.createdBy) === String(currentUserId || "");

  return (
    <article className="group rounded-2xl border border-white/70 bg-white/90 p-6 text-gray-900 shadow-lg shadow-slate-200/40 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01] hover:border-cyan-300 hover:shadow-2xl hover:shadow-cyan-200/30 dark:border-zinc-700 dark:bg-zinc-900/90 dark:text-gray-100 dark:shadow-black/20 dark:hover:border-cyan-500/60 dark:hover:shadow-cyan-900/30">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-black tracking-wide">{game.sport}</h3>
        <span className="rounded-lg border border-cyan-200 bg-cyan-100/70 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-700 dark:border-cyan-600/40 dark:bg-cyan-500/20 dark:text-cyan-300">
          Skill {game.skillRequirement}
        </span>
      </div>

      {thumbnail ? (
        <div className="mt-3 aspect-video overflow-hidden rounded-xl">
          <img
            src={thumbnail}
            alt={`${game.sport} thumbnail`}
            className="h-full w-full object-cover"
          />
        </div>
      ) : null}

      <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">{game.description || "No description provided."}</p>
      <div className="mt-3 h-1 w-16 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-300 group-hover:w-28" />

      <div className="mt-3 space-y-1 text-sm">
        <p>
          <span className="font-semibold text-indigo-700 dark:text-indigo-300">When:</span> {formatDate(game.dateTime)}
        </p>
        <p>
          <span className="font-semibold text-indigo-700 dark:text-indigo-300">Location:</span> {game.location}
        </p>
        <p>
          <span className="font-semibold text-indigo-700 dark:text-indigo-300">Players:</span> {game.currentPlayers}/{game.maxPlayers}
        </p>
        <p>
          <span className="font-semibold text-indigo-700 dark:text-indigo-300">Host:</span>{" "}
          {game.createdBy?._id ? (
            <Link to={`/player/${getId(game.createdBy)}`} className="transition-colors hover:text-cyan-600 hover:underline dark:hover:text-cyan-300">
              {game.createdBy?.name || "Unknown"}
            </Link>
          ) : (
            game.createdBy?.name || "Unknown"
          )}
        </p>
        {communityCode ? (
          <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
            <span>Community Code: {communityCode}</span>
            <button
              type="button"
              onClick={() => copyToClipboard(communityCode)}
              className="rounded bg-white px-2 py-0.5 text-[11px] font-bold text-blue-700 dark:bg-gray-800 dark:text-blue-300"
            >
              Copy
            </button>
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          className="rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:scale-105 hover:shadow-xl hover:shadow-cyan-500/30 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500"
          onClick={() => onJoin(game._id)}
          disabled={hasJoined || isFull}
        >
          {hasJoined ? "Joined" : isFull ? "Full" : "Join Match"}
        </button>

        <Link
          to={`/game/${game._id}`}
          className="rounded-xl border border-white/70 bg-white/80 px-4 py-2 text-sm font-semibold text-gray-900 transition-all duration-300 hover:-translate-y-0.5 hover:scale-105 hover:bg-white hover:shadow-lg dark:border-zinc-700 dark:bg-zinc-800 dark:text-gray-100 dark:hover:bg-zinc-700"
        >
          View
        </Link>

        {isCreator ? (
          <Link
            to={`/game/${game._id}?edit=1`}
            className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 transition-all duration-300 hover:-translate-y-0.5 hover:scale-105 hover:bg-indigo-100 hover:shadow-lg dark:border-indigo-500/40 dark:bg-indigo-500/20 dark:text-indigo-200 dark:hover:bg-indigo-500/30"
          >
            Edit
          </Link>
        ) : null}
      </div>
    </article>
  );
}

export default MatchCard;
