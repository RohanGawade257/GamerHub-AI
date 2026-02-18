import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";

import ChatBox from "../components/ChatBox";
import TeamView from "../components/TeamView";
import { useAuth } from "../context/AuthContext";
import api from "../api";

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

function toDateInputValue(dateTime) {
  const parsedDate = new Date(dateTime);
  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return parsedDate.toISOString().slice(0, 10);
}

function buildTeamDraft(game) {
  const draft = {};
  const participants = Array.isArray(game?.participants) ? game.participants : [];
  const teamA = Array.isArray(game?.teams?.teamA) ? game.teams.teamA : [];
  const teamB = Array.isArray(game?.teams?.teamB) ? game.teams.teamB : [];

  teamA.forEach((player) => {
    draft[getId(player)] = "A";
  });

  teamB.forEach((player) => {
    draft[getId(player)] = "B";
  });

  const unassigned = participants
    .filter((player) => !draft[getId(player)])
    .sort((left, right) => (Number(right.skillLevel) || 1) - (Number(left.skillLevel) || 1));

  let teamASize = Object.values(draft).filter((team) => team === "A").length;
  let teamBSize = Object.values(draft).filter((team) => team === "B").length;

  unassigned.forEach((player) => {
    const playerId = getId(player);
    if (teamASize <= teamBSize) {
      draft[playerId] = "A";
      teamASize += 1;
    } else {
      draft[playerId] = "B";
      teamBSize += 1;
    }
  });

  return draft;
}

function mapTeamPlayers(rawTeam, participantMap) {
  return (rawTeam || [])
    .map((entry) => {
      if (entry?.name) {
        return entry;
      }

      return participantMap.get(getId(entry));
    })
    .filter(Boolean);
}

function GameDetailsPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [game, setGame] = useState(null);
  const [messages, setMessages] = useState([]);
  const [teamDraft, setTeamDraft] = useState({});
  const [error, setError] = useState("");
  const [teamError, setTeamError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [isSavingTeams, setIsSavingTeams] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editForm, setEditForm] = useState({
    sport: "",
    dateTime: "",
    location: "",
    maxPlayers: "",
    skillRequirement: "1",
    description: "",
  });

  const loadGame = useCallback(async () => {
    setError("");
    setIsLoading(true);

    try {
      const { data } = await api.get(`/games/${id}`);
      setGame(data.game);

      const participantIds = (data.game?.participants || []).map((participant) => getId(participant));
      const isParticipant = participantIds.includes(String(user?._id || ""));

      if (isParticipant) {
        try {
          const messageResponse = await api.get(`/games/${id}/messages`);
          setMessages(Array.isArray(messageResponse.data.messages) ? messageResponse.data.messages : []);
        } catch (_messageError) {
          setMessages([]);
        }
      } else {
        setMessages([]);
      }
    } catch (requestError) {
      setError(requestError?.response?.data?.error || "Unable to load match");
      setGame(null);
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  }, [id, user?._id]);

  useEffect(() => {
    loadGame();
  }, [loadGame]);

  useEffect(() => {
    if (!game) {
      return;
    }

    setTeamDraft(buildTeamDraft(game));
    setEditForm({
      sport: String(game.sport || ""),
      dateTime: toDateInputValue(game.dateTime),
      location: String(game.location || ""),
      maxPlayers: String(game.maxPlayers || ""),
      skillRequirement: String(game.skillRequirement || 1),
      description: String(game.description || ""),
    });
  }, [game]);

  const participantIds = useMemo(() => {
    return (game?.participants || []).map((participant) => getId(participant));
  }, [game]);

  const isParticipant = participantIds.includes(String(user?._id || ""));
  const isCreator = getId(game?.createdBy) === String(user?._id || "");
  const isFull = Number(game?.currentPlayers || 0) >= Number(game?.maxPlayers || 0);
  const shouldOpenEdit = searchParams.get("edit") === "1";

  const participantMap = useMemo(() => {
    return new Map((game?.participants || []).map((participant) => [getId(participant), participant]));
  }, [game]);

  const teamAPlayers = useMemo(() => {
    return mapTeamPlayers(game?.teams?.teamA, participantMap);
  }, [game?.teams?.teamA, participantMap]);

  const teamBPlayers = useMemo(() => {
    return mapTeamPlayers(game?.teams?.teamB, participantMap);
  }, [game?.teams?.teamB, participantMap]);

  useEffect(() => {
    if (shouldOpenEdit && isCreator) {
      setIsEditing(true);
    }
  }, [shouldOpenEdit, isCreator]);

  const handleJoinGame = async () => {
    setIsJoining(true);
    setError("");

    try {
      await api.post(`/games/${id}/join`);
      await loadGame();
    } catch (requestError) {
      setError(requestError?.response?.data?.error || "Unable to join this game");
    } finally {
      setIsJoining(false);
    }
  };

  const handleSaveManualTeams = async () => {
    setTeamError("");
    setIsSavingTeams(true);

    try {
      const teamA = [];
      const teamB = [];

      Object.entries(teamDraft).forEach(([participantId, team]) => {
        if (team === "A") {
          teamA.push(participantId);
        } else {
          teamB.push(participantId);
        }
      });

      if (Math.abs(teamA.length - teamB.length) > 1) {
        throw new Error("Teams must be balanced with at most one player difference");
      }

      await api.put(`/games/${id}/teams/manual`, {
        teamA,
        teamB,
      });

      await loadGame();
    } catch (requestError) {
      setTeamError(requestError?.response?.data?.error || requestError.message || "Unable to save manual teams");
    } finally {
      setIsSavingTeams(false);
    }
  };

  const handleUpdateGame = async (event) => {
    event.preventDefault();
    setError("");
    setIsUpdating(true);

    try {
      const payload = {
        sport: editForm.sport,
        location: editForm.location,
        dateTime: new Date(`${editForm.dateTime}T00:00:00.000Z`).toISOString(),
        maxPlayers: Number(editForm.maxPlayers),
        skillRequirement: Number(editForm.skillRequirement),
        description: editForm.description,
      };

      await api.put(`/games/${id}`, payload);
      setIsEditing(false);
      await loadGame();
    } catch (requestError) {
      setError(requestError?.response?.data?.error || "Unable to update this match");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteGame = async () => {
    const shouldDelete = window.confirm("Delete this match permanently?");
    if (!shouldDelete) {
      return;
    }

    setError("");
    setIsDeleting(true);

    try {
      await api.delete(`/games/${id}`);
      navigate("/dashboard", { replace: true });
    } catch (requestError) {
      setError(requestError?.response?.data?.error || "Unable to delete this match");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <div className="rounded-xl bg-white p-6 text-gray-900 shadow-md dark:bg-gray-800 dark:text-gray-100">Loading match...</div>;
  }

  if (!game) {
    return (
      <div className="space-y-3 rounded-xl bg-white p-6 text-gray-900 shadow-md dark:bg-gray-800 dark:text-gray-100">
        <p className="text-red-600">{error || "Match not found"}</p>
        <Link to="/dashboard" className="inline-block rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl bg-white p-6 text-gray-900 shadow-md transition hover:shadow-lg dark:bg-gray-800 dark:text-gray-100">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">{game.sport}</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Hosted by{" "}
              {game.createdBy?._id ? (
                <Link to={`/player/${getId(game.createdBy)}`} className="hover:underline">
                  {game.createdBy?.name || "Unknown"}
                </Link>
              ) : (
                game.createdBy?.name || "Unknown"
              )}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {!isParticipant && Number(game.currentPlayers) < Number(game.maxPlayers) ? (
              <button
                type="button"
                onClick={handleJoinGame}
                disabled={isJoining}
                className="rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
              >
                {isJoining ? "Joining..." : "Join Match"}
              </button>
            ) : null}

            {isCreator ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditing((current) => !current)}
                  className="rounded-lg bg-gray-200 px-4 py-2 text-gray-900 transition hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
                >
                  {isEditing ? "Cancel Edit" : "Edit"}
                </button>
                <button
                  type="button"
                  onClick={handleDeleteGame}
                  disabled={isDeleting}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </>
            ) : null}
          </div>
        </div>

        {error ? <p className="mt-3 text-red-600">{error}</p> : null}

        <div className="mt-4 grid gap-2 text-sm md:grid-cols-2">
          <p><span className="font-medium">When:</span> {formatDate(game.dateTime)}</p>
          <p><span className="font-medium">Location:</span> {game.location}</p>
          <p><span className="font-medium">Players:</span> {game.currentPlayers}/{game.maxPlayers}</p>
          <p><span className="font-medium">Skill Requirement:</span> {game.skillRequirement}</p>
        </div>

        <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">{game.description || "No description provided."}</p>
      </section>

      {isCreator && isEditing ? (
        <section className="rounded-xl bg-white p-6 text-gray-900 shadow-md dark:bg-gray-800 dark:text-gray-100">
          <h2 className="text-xl font-semibold">Edit Match</h2>

          <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={handleUpdateGame}>
            <input
              type="text"
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              value={editForm.sport}
              onChange={(event) => setEditForm((current) => ({ ...current, sport: event.target.value }))}
              placeholder="Sport"
              required
            />

            <input
              type="text"
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              value={editForm.location}
              onChange={(event) => setEditForm((current) => ({ ...current, location: event.target.value }))}
              placeholder="Location"
              required
            />

            <input
              type="date"
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              value={editForm.dateTime}
              onChange={(event) => setEditForm((current) => ({ ...current, dateTime: event.target.value }))}
              required
            />

            <input
              type="number"
              min="2"
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              value={editForm.maxPlayers}
              onChange={(event) => setEditForm((current) => ({ ...current, maxPlayers: event.target.value }))}
              required
            />

            <select
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              value={editForm.skillRequirement}
              onChange={(event) => setEditForm((current) => ({ ...current, skillRequirement: event.target.value }))}
            >
              <option value="1">1 - Beginner</option>
              <option value="2">2 - Casual</option>
              <option value="3">3 - Intermediate</option>
              <option value="4">4 - Advanced</option>
              <option value="5">5 - Competitive</option>
            </select>

            <input
              type="text"
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              value={editForm.description}
              onChange={(event) => setEditForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="Description"
            />

            <button
              type="submit"
              disabled={isUpdating}
              className="md:col-span-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {isUpdating ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </section>
      ) : null}

      <section className="rounded-xl bg-white p-6 text-gray-900 shadow-md transition hover:shadow-lg dark:bg-gray-800 dark:text-gray-100">
        <h2 className="text-xl font-semibold">Participants</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {game.participants.map((participant) => (
            <div key={getId(participant)} className="rounded-lg border p-3">
              <p className="font-medium">
                <Link to={`/player/${getId(participant)}`} className="hover:underline">
                  {participant.name}
                </Link>
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Skill {participant.skillLevel} - {participant.location}</p>
            </div>
          ))}
        </div>
      </section>

      <TeamView teamA={teamAPlayers} teamB={teamBPlayers} isManual={Boolean(game?.teams?.isManual)} />

      {isCreator && isFull ? (
        <section className="space-y-3 rounded-xl bg-white p-6 text-gray-900 shadow-md transition hover:shadow-lg dark:bg-gray-800 dark:text-gray-100">
          <h2 className="text-xl font-semibold">Manual Team Assignment</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">Override automatic teams by assigning each participant.</p>

          <div className="space-y-2">
            {game.participants.map((participant) => {
              const participantId = getId(participant);

              return (
                <div key={participantId} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                  <div>
                    <p className="font-medium">
                      <Link to={`/player/${participantId}`} className="hover:underline">
                        {participant.name}
                      </Link>
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Skill {participant.skillLevel}</p>
                  </div>

                  <select
                    value={teamDraft[participantId] || "A"}
                    onChange={(event) => {
                      setTeamDraft((currentDraft) => {
                        return {
                          ...currentDraft,
                          [participantId]: event.target.value,
                        };
                      });
                    }}
                    className="rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  >
                    <option value="A">Team A</option>
                    <option value="B">Team B</option>
                  </select>
                </div>
              );
            })}
          </div>

          {teamError ? <p className="text-red-600">{teamError}</p> : null}

          <button
            type="button"
            onClick={handleSaveManualTeams}
            disabled={isSavingTeams}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
          >
            {isSavingTeams ? "Saving..." : "Save Manual Teams"}
          </button>
        </section>
      ) : null}

      <ChatBox matchId={id} enabled={isParticipant} initialMessages={messages} />
    </div>
  );
}

export default GameDetailsPage;
