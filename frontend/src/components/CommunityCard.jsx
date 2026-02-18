import { Link } from "react-router-dom";

function CommunityCard({ community }) {
  return (
    <article className="rounded-xl bg-white p-4 shadow-md transition hover:shadow-lg dark:bg-gray-800">
      <h3 className="text-lg font-semibold">{community.name}</h3>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
        {community.description || "No description yet."}
      </p>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
        Members: {community.memberCount || 0}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          to={`/community/${community._id}`}
          className="rounded-lg bg-gray-200 px-4 py-2 text-gray-900 transition hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
        >
          Open
        </Link>
      </div>
    </article>
  );
}

export default CommunityCard;
