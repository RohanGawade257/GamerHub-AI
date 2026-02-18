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
      await register(form);
      navigate("/dashboard", { replace: true });
    } catch (requestError) {
      setError(requestError?.response?.data?.error || "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mx-auto max-w-md rounded-xl bg-white p-6 shadow-md transition hover:shadow-lg dark:bg-gray-800">
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
  );
}

export default RegisterPage;
