import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  CalendarCheck,
  Receipt,
  Clock,
  LoaderCircle,
} from "lucide-react";

import { useAuth } from "../context/useAuth";
import logo from "../assets/logo.png";
import { ErrorState } from "../components/ui/StatePanel";

const Login = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));

    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setError("");

      await login(
        formData.email.trim(),
        formData.password
      );

      navigate("/dashboard", { replace: true });
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Login failed"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const features = [
    {
      icon: CalendarCheck,
      label: "Leave Management",
    },
    {
      icon: Receipt,
      label: "Reimbursements",
    },
    {
      icon: Clock,
      label: "Attendance Tracking",
    },
    {
      icon: ShieldCheck,
      label: "Role Based Access",
    },
  ];

  return (
    <main className="login-page">
      <section className="login-brand-panel" aria-label="Upsilon Employee Workspace">
        <div className="login-brand-content">
          <img
            src={logo}
            alt="Upsilon"
            className="login-brand-logo"
          />

          <h1 className="login-brand-title">
            Welcome to Upsilon Services
          </h1>

          <p className="login-brand-description">
            Manage employees, attendance,
            leaves, reimbursements and
            approvals through one secure HRMS
            workspace.
          </p>

          <div className="login-feature-grid">
            {features.map(
              ({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="login-feature-box"
                >
                  <Icon
                    size={21}
                    aria-hidden="true"
                  />

                  <span>{label}</span>
                </div>
              )
            )}
          </div>
        </div>
      </section>

      <section className="login-form-panel" aria-labelledby="login-title">
        <div className="auth-card login-card">
          <div className="auth-logo login-card-header">
            <img
              src={logo}
              alt="Upsilon"
              className="login-card-logo"
            />

            <h1 id="login-title">Sign in to Upsilon</h1>

            <p>Employee Management Portal</p>
          </div>

          {error && (
            <div id="login-error">
              <ErrorState
                compact
                title="Unable to sign in"
                description={error}
              />
            </div>
          )}

          <form
            className="auth-form"
            onSubmit={handleSubmit}
            aria-busy={isSubmitting}
          >
            <div className="input-group">
              <label htmlFor="login-email">
                Email Address
              </label>

              <input
                id="login-email"
                type="email"
                name="email"
                placeholder="Enter email"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
                disabled={isSubmitting}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "login-error" : undefined}
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="login-password">
                Password
              </label>

              <input
                id="login-password"
                type="password"
                name="password"
                placeholder="Enter password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
                disabled={isSubmitting}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "login-error" : undefined}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary login-submit-button"
              disabled={isSubmitting}
            >
              {isSubmitting && (
                <LoaderCircle className="ui-spin" size={17} aria-hidden="true" />
              )}
              <span aria-live="polite">
                {isSubmitting ? "Signing in…" : "Sign In"}
              </span>
            </button>
          </form>
        </div>
      </section>
    </main>
  );
};

export default Login;
