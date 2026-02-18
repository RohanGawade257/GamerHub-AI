const SPORTS_OPTIONS = ["Football", "Cricket", "Basketball", "Badminton", "Tennis", "Volleyball"];

function Filters({ filters, onChange, onReset }) {
  return (
    <section className="grid gap-3 rounded-xl bg-white p-6 text-gray-900 shadow-md transition hover:shadow-lg dark:bg-gray-800 dark:text-gray-100 md:grid-cols-4">
      <select
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
        value={filters.sport}
        onChange={(event) => onChange({ ...filters, sport: event.target.value })}
      >
        <option value="">All sports</option>
        {SPORTS_OPTIONS.map((sport) => (
          <option key={sport} value={sport}>
            {sport}
          </option>
        ))}
      </select>

      <select
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
        value={filters.skill}
        onChange={(event) => onChange({ ...filters, skill: event.target.value })}
      >
        <option value="">Any skill level</option>
        <option value="1">1 - Beginner</option>
        <option value="2">2 - Casual</option>
        <option value="3">3 - Intermediate</option>
        <option value="4">4 - Advanced</option>
        <option value="5">5 - Competitive</option>
      </select>

      <input
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
        type="text"
        value={filters.location}
        placeholder="Filter by location"
        onChange={(event) => onChange({ ...filters, location: event.target.value })}
      />

      <button
        type="button"
        onClick={onReset}
        className="rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
      >
        Clear Filters
      </button>
    </section>
  );
}

export default Filters;
