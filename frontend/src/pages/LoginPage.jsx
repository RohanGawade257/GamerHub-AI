import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, token } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectPath = location.state?.from || "/dashboard";

  if (token) {
    return <Navigate to={redirectPath} replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await login({ email, password });
      navigate(redirectPath, { replace: true });
    } catch (requestError) {
      setError(requestError?.response?.data?.error || "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="relative left-1/2 right-1/2 -mx-[50vw] min-h-screen w-screen overflow-hidden">
      <div className="pointer-events-none absolute left-20 top-10 select-none opacity-10 dark:opacity-20">
        <svg viewBox="0 0 24 24" className="h-24 w-24 text-slate-700 dark:text-slate-200" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M7 10h10a3 3 0 0 1 2.8 4l-1 2.4a2 2 0 0 1-1.8 1.2h-1.5l-1.2-1.8h-4.6L8.5 17.6H7a2 2 0 0 1-1.8-1.2l-1-2.4A3 3 0 0 1 7 10Z" />
          <circle cx="9" cy="13.5" r="0.7" fill="currentColor" />
          <circle cx="15.6" cy="13" r="0.7" fill="currentColor" />
          <circle cx="17.5" cy="14.8" r="0.7" fill="currentColor" />
        </svg>
      </div>
      <div className="pointer-events-none absolute bottom-20 right-10 select-none opacity-10 dark:opacity-20">
        <svg viewBox="0 0 24 24" className="h-20 w-20 text-slate-700 dark:text-slate-200" fill="currentColor">
          <path d="m13 2-7 11h5l-2 9 9-12h-5l2-8Z" />
        </svg>
      </div>
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 select-none rounded-full border border-slate-500/20 opacity-10 dark:opacity-20" />
      <div className="pointer-events-none absolute right-16 top-14 select-none opacity-10 dark:opacity-20">
        <svg viewBox="0 0 24 24" className="h-20 w-20 text-slate-700 dark:text-slate-200" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="5" />
          <circle cx="12" cy="12" r="9" />
          <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
        </svg>
      </div>
      <div className="pointer-events-none absolute left-8 bottom-24 select-none opacity-10 dark:opacity-20">
        <svg viewBox="0 0 24 24" className="h-16 w-16 text-slate-700 dark:text-slate-200" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M5 14a7 7 0 0 1 14 0" />
          <path d="M7 14v3a1 1 0 0 0 1 1h2v-4H8a1 1 0 0 0-1 1Zm10 0v4h-2v-4h2a1 1 0 0 1 1 1Z" />
        </svg>
      </div>
      <div className="pointer-events-none absolute right-1/3 bottom-10 select-none opacity-10 dark:opacity-20">
        <svg viewBox="0 0 24 24" className="h-14 w-14 text-slate-700 dark:text-slate-200" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M7 10h10a3 3 0 0 1 2.8 4l-1 2.4a2 2 0 0 1-1.8 1.2h-1.5l-1.2-1.8h-4.6L8.5 17.6H7a2 2 0 0 1-1.8-1.2l-1-2.4A3 3 0 0 1 7 10Z" />
        </svg>
      </div>

      <div className="relative flex min-h-screen items-center justify-center px-4">
        <div className="mx-auto flex w-full max-w-md flex-col items-center">
          <div className="mb-5 text-center">
            <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-gray-100">Gamer Hub</h1>
            <p className="max-w-md text-center text-sm text-gray-600 dark:text-gray-400">
              Gamer Hub is a community-driven gaming platform where players create matches, build squads, join communities, and connect with teammates in real time.
            </p>
            <p className="mt-2 max-w-md text-center text-sm text-gray-600 dark:text-gray-400">
              Our mission: unite gamers, organize matches, and grow gaming communities.
            </p>
          </div>

          <section className="w-full rounded-xl bg-white p-6 shadow-md transition hover:shadow-lg dark:bg-gray-800">
          <h1 className="text-2xl font-semibold">Login</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Access your sports network account.</p>

          <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
            <input
              className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />

            <input
              className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <button
              className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing in..." : "Login"}
            </button>
          </form>

          <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
            New here?{" "}
            <Link to="/register" className="text-blue-600 hover:underline dark:text-blue-400">
              Create an account
            </Link>
          </p>
          </section>
        </div>
      </div>
    </section>
  );
}

export default LoginPage;
