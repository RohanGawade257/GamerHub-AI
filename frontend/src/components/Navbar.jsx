import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

const THEME_KEY = "theme";

function linkClassName({ isActive }) {
  return [
    "rounded-xl border px-3 py-1.5 text-sm font-semibold tracking-wide transition-all duration-300 lg:px-2 lg:py-0.5 lg:text-xs lg:whitespace-nowrap",
    isActive
      ? "border-cyan-400/70 bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-[0_0_0_1px_rgba(56,189,248,.35),0_0_20px_rgba(56,189,248,.35)]"
      : "border-transparent bg-white/70 text-slate-700 hover:-translate-y-0.5 hover:scale-105 hover:bg-white hover:shadow-xl dark:bg-zinc-800/70 dark:text-zinc-200 dark:hover:bg-zinc-700",
  ].join(" ");
}

function Navbar() {
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const displayName = user?.name || "Player";
  const profileImage = String(user?.profileImage || "").trim();
  const avatarFallback = String(displayName).trim().charAt(0).toUpperCase() || "P";

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
    setOpen(false);
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
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 lg:flex-nowrap lg:items-center lg:gap-2 lg:px-3 lg:py-1">
        <Link to={token ? "/dashboard" : "/login"} className="group inline-flex items-center gap-2 lg:gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,.9)] transition-all duration-300 group-hover:scale-125 lg:h-2 lg:w-2" />
          <span className="bg-gradient-to-r from-indigo-600 via-blue-500 to-cyan-500 bg-clip-text text-lg font-extrabold tracking-wide text-transparent dark:from-indigo-300 dark:via-cyan-300 dark:to-blue-300 lg:text-base">
            Gamer-Hub
          </span>
        </Link>

        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="inline-flex items-center justify-center rounded-xl border border-white/60 bg-white/80 p-2 text-slate-800 shadow-sm transition-all duration-300 hover:bg-white dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-100 md:hidden"
          aria-label="Toggle navigation menu"
          aria-expanded={open}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 6h16" />
            <path d="M4 12h16" />
            <path d="M4 18h16" />
          </svg>
        </button>

        <div className="hidden flex-wrap items-center gap-2 md:flex lg:ml-3 lg:flex-1 lg:flex-nowrap lg:items-center lg:gap-2 lg:min-w-0">
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
            className="rounded-xl border border-white/60 bg-white/80 px-4 py-1.5 text-sm font-semibold text-gray-900 transition-all duration-300 hover:-translate-y-0.5 hover:scale-105 hover:bg-white hover:shadow-xl dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-gray-100 dark:hover:bg-zinc-700 lg:ml-auto lg:px-3 lg:py-1 lg:text-xs lg:whitespace-nowrap"
            aria-label="Toggle theme"
          >
            Toggle Theme
          </button>

          <button
            type="button"
            onClick={openAiAssistant}
            className="rounded-xl border border-cyan-400/60 bg-gradient-to-r from-indigo-600 to-cyan-500 px-4 py-1.5 text-sm font-semibold text-white shadow-[0_0_18px_rgba(56,189,248,.45)] transition-all duration-300 hover:-translate-y-0.5 hover:scale-105 hover:shadow-[0_0_24px_rgba(56,189,248,.65)] lg:px-3 lg:py-1 lg:text-xs lg:whitespace-nowrap"
          >
            AI
          </button>

          {token && (
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-1.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:scale-105 hover:shadow-xl hover:shadow-indigo-500/35 lg:px-3 lg:py-1 lg:text-xs lg:whitespace-nowrap"
            >
              Logout
            </button>
          )}

          {token ? (
            <div className="ml-2 flex items-center gap-3 rounded-xl border border-white/60 bg-white px-4 py-1.5 shadow-md dark:border-zinc-700 dark:bg-zinc-800 lg:ml-1 lg:flex-none lg:gap-2 lg:px-3 lg:py-1 lg:whitespace-nowrap">
              <div className="relative">
                <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-indigo-100 text-sm font-bold text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-200 lg:h-7 lg:w-7 lg:text-xs">
                  {profileImage ? (
                    <img src={profileImage} alt={`${displayName} avatar`} className="h-full w-full object-cover" />
                  ) : (
                    avatarFallback
                  )}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-zinc-800" />
              </div>
              <span className="text-lg font-semibold text-slate-800 dark:text-zinc-100 lg:text-sm">{displayName}</span>
            </div>
          ) : null}
        </div>
      </div>

      {open ? (
        <div className="border-t border-white/40 bg-white/95 p-4 shadow-xl dark:border-zinc-700/70 dark:bg-zinc-900/95 md:hidden">
          <div className="flex flex-col gap-4">
            {token ? (
              <>
                <NavLink to="/dashboard" className={linkClassName} onClick={() => setOpen(false)}>
                  Dashboard
                </NavLink>
                <NavLink to="/create-game" className={linkClassName} onClick={() => setOpen(false)}>
                  Create Match
                </NavLink>
                <NavLink to="/profile" className={linkClassName} onClick={() => setOpen(false)}>
                  Profile
                </NavLink>
                <NavLink to="/communities" className={linkClassName} onClick={() => setOpen(false)}>
                  Communities
                </NavLink>
                <NavLink to="/dashboard" className={linkClassName} onClick={() => setOpen(false)}>
                  Matches
                </NavLink>
                <NavLink to="/join-community" className={linkClassName} onClick={() => setOpen(false)}>
                  Join Code
                </NavLink>
              </>
            ) : (
              <>
                <NavLink to="/login" className={linkClassName} onClick={() => setOpen(false)}>
                  Login
                </NavLink>
                <NavLink to="/register" className={linkClassName} onClick={() => setOpen(false)}>
                  Register
                </NavLink>
              </>
            )}

            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-xl border border-white/60 bg-white/80 px-4 py-1.5 text-sm font-semibold text-gray-900 transition-all duration-300 hover:-translate-y-0.5 hover:scale-105 hover:bg-white hover:shadow-xl dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-gray-100 dark:hover:bg-zinc-700"
              aria-label="Toggle theme"
            >
              Toggle Theme
            </button>

            <button
              type="button"
              onClick={openAiAssistant}
              className="rounded-xl border border-cyan-400/60 bg-gradient-to-r from-indigo-600 to-cyan-500 px-4 py-1.5 text-sm font-semibold text-white shadow-[0_0_18px_rgba(56,189,248,.45)] transition-all duration-300 hover:-translate-y-0.5 hover:scale-105 hover:shadow-[0_0_24px_rgba(56,189,248,.65)]"
            >
              AI
            </button>

            {token ? (
              <>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-1.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:scale-105 hover:shadow-xl hover:shadow-indigo-500/35"
                >
                  Logout
                </button>
                <div className="flex items-center gap-3 rounded-xl border border-white/60 bg-white px-4 py-1.5 shadow-md dark:border-zinc-700 dark:bg-zinc-800">
                  <div className="relative">
                    <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-indigo-100 text-sm font-bold text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-200">
                      {profileImage ? (
                        <img src={profileImage} alt={`${displayName} avatar`} className="h-full w-full object-cover" />
                      ) : (
                        avatarFallback
                      )}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-zinc-800" />
                  </div>
                  <span className="text-lg font-semibold text-slate-800 dark:text-zinc-100">{displayName}</span>
                </div>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </header>
  );
}

export default Navbar;
