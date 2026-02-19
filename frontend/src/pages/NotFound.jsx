import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function NotFound() {
  const { token } = useAuth();
  const homePath = token ? "/dashboard" : "/login";

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center">
        <p className="text-3xl" aria-hidden="true">
          {"\uD83C\uDFAE"}
        </p>
        <h1 className="mt-2 text-6xl font-extrabold tracking-tight md:text-7xl">404</h1>
        <p className="mt-3 text-base text-gray-700 dark:text-gray-300 md:text-lg">
          Oops! Looks like you&apos;re lost in the game universe.
        </p>
        <Link
          to={homePath}
          className="mt-6 inline-flex rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:scale-105"
        >
          Go Back Home
        </Link>
      </div>
    </div>
  );
}

export default NotFound;
