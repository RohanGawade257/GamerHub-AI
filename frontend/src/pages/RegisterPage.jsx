import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function RegisterPage() {
  const navigate = useNavigate();
  const { register, token } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    age: "",
    phone: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await register({
        ...form,
        age: Number(form.age),
      });
      navigate("/dashboard", { replace: true });
    } catch (requestError) {
      setError(requestError?.response?.data?.error || "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="relative left-1/2 right-1/2 -mx-[50vw] min-h-screen w-screen overflow-hidden">
      <div className="pointer-events-none absolute left-16 top-12 select-none opacity-10 dark:opacity-20">
        <svg viewBox="0 0 24 24" className="h-20 w-20 text-slate-700 dark:text-slate-200" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="5" y="9" width="14" height="8" rx="3" />
          <path d="M12 9V7M9 9V8M15 9V8" />
          <circle cx="10" cy="13" r="0.9" fill="currentColor" />
          <circle cx="14.5" cy="13.5" r="0.9" fill="currentColor" />
        </svg>
      </div>
      <div className="pointer-events-none absolute bottom-16 right-14 select-none opacity-10 dark:opacity-20">
        <svg viewBox="0 0 24 24" className="h-24 w-24 text-slate-700 dark:text-slate-200" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M5 14a7 7 0 0 1 14 0" />
          <path d="M7 14v3a1 1 0 0 0 1 1h2v-4H8a1 1 0 0 0-1 1Zm10 0v4h-2v-4h2a1 1 0 0 1 1 1Z" />
          <path d="M12 6v5" />
        </svg>
      </div>
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 select-none rounded-full border border-slate-500/20 opacity-10 dark:opacity-20" />

      <div className="relative flex min-h-screen items-center justify-center px-4">
        <section className="mx-auto w-full max-w-md rounded-xl bg-white p-6 shadow-md transition hover:shadow-lg dark:bg-gray-800">
          <h1 className="text-2xl font-semibold">Register</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Create an account to join local matches.</p>

          <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
            <input
              className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              type="text"
              placeholder="Full name"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              required
            />

            <input
              className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              required
            />

            <input
              className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              required
              minLength={8}
            />

            <input
              className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              type="number"
              min="1"
              max="120"
              placeholder="Age"
              value={form.age}
              onChange={(event) => setForm({ ...form, age: event.target.value })}
              required
            />

            <input
              className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              type="tel"
              placeholder="Phone"
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
            />

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <button
              className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating account..." : "Register"}
            </button>
          </form>

          <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-600 hover:underline dark:text-blue-400">
              Sign in
            </Link>
          </p>
        </section>
      </div>
    </section>
  );
}

export default RegisterPage;
