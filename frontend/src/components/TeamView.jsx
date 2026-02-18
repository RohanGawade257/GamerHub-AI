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

function TeamColumn({ title, players }) {
  return (
    <div className="rounded-xl border p-4">
      <h3 className="text-lg font-semibold">{title}</h3>
      {players.length === 0 ? (
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">No players assigned yet.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {players.map((player) => (
            <li
              key={getId(player)}
              className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm dark:bg-gray-700"
            >
              <Link to={`/player/${getId(player)}`} className="hover:underline">
                {player.name || "Unknown"}
              </Link>
              <span className="text-gray-600 dark:text-gray-300">Skill {player.skillLevel || 1}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TeamView({ teamA, teamB, isManual }) {
  const hasTeams = teamA.length > 0 || teamB.length > 0;

  return (
    <section className="rounded-xl bg-white p-6 shadow-md transition hover:shadow-lg dark:bg-gray-800">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Teams</h2>
        <span className="rounded-md bg-gray-100 px-2 py-1 text-sm dark:bg-gray-700">
          {hasTeams ? (isManual ? "Manual" : "Auto") : "Pending"}
        </span>
      </div>

      {!hasTeams ? (
        <div className="mt-3 rounded-lg border p-4 text-sm text-gray-600 dark:text-gray-300">
          Teams will be generated automatically when the match fills up.
        </div>
      ) : (
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <TeamColumn title="Team A" players={teamA} />
          <TeamColumn title="Team B" players={teamB} />
        </div>
      )}
    </section>
  );
}

export default TeamView;

