import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";

import api from "../api";
import { useAuth } from "../context/AuthContext";

function PlayerProfilePage() {
  const { id } = useParams();
  const { token } = useAuth();
  const [player, setPlayer] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setError("");
    setIsLoading(true);

    api.get(`/users/${id}`)
      .then(({ data }) => {
        if (!mounted) {
          return;
        }
        setPlayer(data.user || null);
      })
      .catch((requestError) => {
        if (!mounted) {
          return;
        }
        setError(requestError?.response?.data?.error || "Unable to load profile");
        setPlayer(null);
      })
      .finally(() => {
        if (mounted) {
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [id]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (isLoading) {
    return <div className="rounded-xl bg-white p-4 shadow-md dark:bg-gray-800">Loading profile...</div>;
  }

  if (!player) {
    return (
      <div className="rounded-xl bg-white p-4 shadow-md dark:bg-gray-800">
        <p className="text-red-600">{error || "Player not found"}</p>
        <Link to="/dashboard" className="mt-3 inline-block rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700">
          Back
        </Link>
      </div>
    );
  }

  return (
    <section className="rounded-xl bg-white p-6 shadow-md dark:bg-gray-800">
      <div className="flex flex-wrap items-start gap-4">
        {player.profileImage ? (
          <img
            src={player.profileImage}
            alt={`${player.name} avatar`}
            className="h-20 w-20 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-200 text-lg font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-100">
            {String(player.name || "P").slice(0, 1).toUpperCase()}
          </div>
        )}

        <div>
          <h1 className="text-2xl font-semibold">{player.name}</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Skill {player.skillLevel || 1} - {player.location || "Unknown location"}
          </p>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            Status: {player.isOnline ? "Online" : "Offline"}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <p className="text-sm text-gray-700 dark:text-gray-200">{player.bio || "No bio provided."}</p>

        {(player.preferredSports || []).length ? (
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Preferred Sports: {player.preferredSports.join(", ")}
          </p>
        ) : null}

        {(player.socialLinks || []).length ? (
          <div className="flex flex-wrap gap-2">
            {player.socialLinks.map((link, index) => (
              <a
                key={`${link.url}-${index}`}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
              >
                {link.platform}: {link.label}
              </a>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-600 dark:text-gray-300">No social links shared.</p>
        )}
      </div>
    </section>
  );
}

export default PlayerProfilePage;
