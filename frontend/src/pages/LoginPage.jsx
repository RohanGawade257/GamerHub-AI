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
    <section className="mx-auto max-w-md rounded-xl bg-white p-6 shadow-md transition hover:shadow-lg dark:bg-gray-800">
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
  );
}

export default LoginPage;
