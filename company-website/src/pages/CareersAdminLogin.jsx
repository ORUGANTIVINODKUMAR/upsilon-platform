import { useState } from "react";
import { useNavigate } from "react-router-dom";
import usePageMeta from "../hooks/usePageMeta";

import "./CareersAdmin.css";

function CareersAdminLogin() {
  usePageMeta({
    title: "Careers Admin Login",
    path: "/careers-admin/login",
    noIndex: true,
  });

  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/careers-admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const text = await response.text();
      const data = text ? JSON.parse(text) : {};

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Login failed.");
      }

      navigate("/careers-admin", { replace: true });
    } catch (submitError) {
      setError(submitError.message || "Login failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="careers-admin-auth">
      <form className="careers-admin-auth-card" onSubmit={handleSubmit}>
        <h1>Careers Admin</h1>
        <p>Sign in to manage job postings.</p>

        <label htmlFor="careers-admin-email">Email</label>
        <input
          id="careers-admin-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="username"
          required
        />

        <label htmlFor="careers-admin-password">Password</label>
        <input
          id="careers-admin-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
        />

        {error && <p className="careers-admin-error">{error}</p>}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Signing In..." : "Sign In"}
        </button>
      </form>
    </section>
  );
}

export default CareersAdminLogin;
