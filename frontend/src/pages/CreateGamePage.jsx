import { useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../api";

function CreateGamePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    sport: "",
    dateTime: "",
    location: "",
    maxPlayers: "10",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const payload = {
        sport: form.sport,
        location: form.location,
        dateTime: new Date(`${form.dateTime}T00:00:00.000Z`).toISOString(),
        maxPlayers: Number(form.maxPlayers),
      };

      await api.post("/games/create", payload);
      navigate("/dashboard");
    } catch (requestError) {
      setError(requestError?.response?.data?.error || "Unable to create game");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mx-auto max-w-3xl rounded-xl bg-white p-6 text-gray-900 shadow-md transition hover:shadow-lg dark:bg-gray-800 dark:text-gray-100">
      <h1 className="text-2xl font-semibold">Create Match</h1>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Host a game and invite players from your community.</p>

      <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
        <input
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          type="text"
          placeholder="Sport"
          value={form.sport}
          onChange={(event) => setForm({ ...form, sport: event.target.value })}
          required
        />

        <input
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          type="text"
          placeholder="Location"
          value={form.location}
          onChange={(event) => setForm({ ...form, location: event.target.value })}
          required
        />

        <input
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          type="date"
          value={form.dateTime}
          onChange={(event) => setForm({ ...form, dateTime: event.target.value })}
          required
        />

        <input
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          type="number"
          min="2"
          max="100"
          value={form.maxPlayers}
          onChange={(event) => setForm({ ...form, maxPlayers: event.target.value })}
          required
        />

        <p className="md:col-span-2 text-sm text-gray-600 dark:text-gray-300">
          You will be added to the match automatically.
        </p>

        {error ? <p className="md:col-span-2 text-sm text-red-600">{error}</p> : null}

        <button
          className="md:col-span-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creating..." : "Create Match"}
        </button>
      </form>
    </section>
  );
}

export default CreateGamePage;
