import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  CalendarCheck,
  Receipt,
  Clock,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.png";

const Login = () => {
  const { login } = useAuth();
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

      localStorage.removeItem("activePage");
      localStorage.setItem(
        "activePage",
        "dashboard"
      );

      navigate("/dashboard");
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Login failed"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

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
      <section className="login-brand-panel">
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

      <section className="login-form-panel">
        <div className="auth-card login-card">
          <div className="auth-logo login-card-header">
            <img
              src={logo}
              alt="Upsilon"
              className="login-card-logo"
            />

            <h1>Sign in to Upsilon</h1>

            <p>Employee Management Portal</p>
          </div>

          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          <form
            className="auth-form"
            onSubmit={handleSubmit}
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
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary login-submit-button"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Signing in..."
                : "Sign In"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
};

export default Login;