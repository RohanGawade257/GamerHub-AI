import { useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

const THEME_KEY = "theme";

function linkClassName({ isActive }) {
  return [
    "rounded-xl border px-3 py-2 text-sm font-semibold tracking-wide transition-all duration-300",
    isActive
      ? "border-cyan-400/70 bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-[0_0_0_1px_rgba(56,189,248,.35),0_0_20px_rgba(56,189,248,.35)]"
      : "border-transparent bg-white/70 text-slate-700 hover:-translate-y-0.5 hover:scale-105 hover:bg-white hover:shadow-xl dark:bg-zinc-800/70 dark:text-zinc-200 dark:hover:bg-zinc-700",
  ].join(" ");
}

function Navbar() {
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();

  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem(THEME_KEY, "light");
    }
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const toggleTheme = () => {
    const isDark = document.documentElement.classList.contains("dark");
    if (isDark) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem(THEME_KEY, "light");
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem(THEME_KEY, "dark");
    }
  };

  const openAiAssistant = () => {
    window.dispatchEvent(new CustomEvent("open-ai-widget"));
  };

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-white/40 bg-white/70 shadow-xl shadow-indigo-100/40 backdrop-blur-xl dark:border-zinc-700/70 dark:bg-zinc-950/65 dark:shadow-cyan-950/30">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
        <Link to={token ? "/dashboard" : "/login"} className="group inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,.9)] transition-all duration-300 group-hover:scale-125" />
          <span className="bg-gradient-to-r from-indigo-600 via-blue-500 to-cyan-500 bg-clip-text text-lg font-extrabold tracking-wide text-transparent dark:from-indigo-300 dark:via-cyan-300 dark:to-blue-300">
            Gamer Community
          </span>
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          {token ? (
            <>
              <NavLink to="/dashboard" className={linkClassName}>
                Dashboard
              </NavLink>
              <NavLink to="/create-game" className={linkClassName}>
                Create Match
              </NavLink>
              <NavLink to="/profile" className={linkClassName}>
                Profile
              </NavLink>
              <NavLink to="/communities" className={linkClassName}>
                Communities
              </NavLink>
              <NavLink to="/dashboard" className={linkClassName}>
                Matches
              </NavLink>
              <NavLink to="/join-community" className={linkClassName}>
                Join Code
              </NavLink>
              <span className="rounded-xl border border-white/60 bg-white/85 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm dark:border-zinc-700 dark:bg-zinc-800/90 dark:text-zinc-200">
                {user?.name || "Player"}
              </span>
            </>
          ) : (
            <>
              <NavLink to="/login" className={linkClassName}>
                Login
              </NavLink>
              <NavLink to="/register" className={linkClassName}>
                Register
              </NavLink>
            </>
          )}

          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-xl border border-white/60 bg-white/80 px-4 py-2 text-sm font-semibold text-gray-900 transition-all duration-300 hover:-translate-y-0.5 hover:scale-105 hover:bg-white hover:shadow-xl dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-gray-100 dark:hover:bg-zinc-700"
            aria-label="Toggle theme"
          >
            Toggle Theme
          </button>

          <button
            type="button"
            onClick={openAiAssistant}
            className="rounded-xl border border-cyan-400/60 bg-gradient-to-r from-indigo-600 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_18px_rgba(56,189,248,.45)] transition-all duration-300 hover:-translate-y-0.5 hover:scale-105 hover:shadow-[0_0_24px_rgba(56,189,248,.65)]"
          >
            AI
          </button>

          {token && (
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:scale-105 hover:shadow-xl hover:shadow-indigo-500/35"
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
