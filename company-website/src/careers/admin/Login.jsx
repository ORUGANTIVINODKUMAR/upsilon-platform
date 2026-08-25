import { useState } from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  LuBriefcaseBusiness,
  LuCirclePlus,
  LuLockKeyhole,
  LuMail,
  LuShieldCheck,
  LuUsers,
} from "react-icons/lu";

import "./Login.css";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errorMessage, setErrorMessage] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      setErrorMessage("");

      const response = await fetch(
        "/api/admin/auth/login",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          credentials: "include",

          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Login failed."
        );
      }

      localStorage.setItem(
        "careersAdmin",
        JSON.stringify(data.admin)
      );

      const destination =
        location.state?.from &&
        location.state.from.startsWith(
          "/admin/careers"
        )
          ? location.state.from
          : "/admin/careers/dashboard";

      navigate(destination, {
        replace: true,
      });
    } catch (error) {
      console.error(
        "Careers admin login error:",
        error
      );

      setErrorMessage(
        error.message ||
          "Unable to log in."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="careers-login-page">
      <div className="careers-login-layout">
        <section className="careers-login-welcome">
          <div className="careers-login-welcome-brand">
            <div className="careers-login-welcome-mark">
              U
            </div>

            <strong>UPSILON</strong>
          </div>

          <p className="careers-login-welcome-eyebrow">
            CAREERS MANAGEMENT
          </p>

          <h1>
            Welcome to Upsilon Careers
          </h1>

          <p className="careers-login-welcome-description">
            Create job openings, manage active
            positions, review applicants and maintain
            your complete recruitment process through
            one secure workspace.
          </p>

          <div className="careers-login-feature-grid">
            <div className="careers-login-feature">
              <LuCirclePlus
                size={21}
                aria-hidden="true"
              />

              <span>Create Job Openings</span>
            </div>

            <div className="careers-login-feature">
              <LuBriefcaseBusiness
                size={21}
                aria-hidden="true"
              />

              <span>Manage Job Listings</span>
            </div>

            <div className="careers-login-feature">
              <LuUsers
                size={21}
                aria-hidden="true"
              />

              <span>Track Applicants</span>
            </div>

            <div className="careers-login-feature">
              <LuShieldCheck
                size={21}
                aria-hidden="true"
              />

              <span>Secure Admin Access</span>
            </div>
          </div>
        </section>

        <main className="careers-login-card">
          <div className="careers-login-card-logo">
            U
          </div>

          <div className="careers-login-heading">
            <div className="careers-login-shield">
              <LuShieldCheck
                size={24}
                aria-hidden="true"
              />
            </div>

            <h1>Sign in to Upsilon</h1>

            <p>Careers Management Portal</p>
          </div>

          <form
            className="careers-login-form"
            onSubmit={handleSubmit}
          >
            <div className="careers-login-field">
              <label htmlFor="careers-admin-email">
                Email Address
              </label>

              <div>
                <LuMail
                  size={19}
                  aria-hidden="true"
                />

                <input
                  id="careers-admin-email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="admin@upsilonservices.com"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="careers-login-field">
              <label htmlFor="careers-admin-password">
                Password
              </label>

              <div>
                <LuLockKeyhole
                  size={19}
                  aria-hidden="true"
                />

                <input
                  id="careers-admin-password"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            {errorMessage && (
              <div
                className="careers-login-error"
                role="alert"
              >
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              className="careers-login-button"
              disabled={loading}
            >
              {loading
                ? "Signing In..."
                : "Sign In"}
            </button>
          </form>

          <p className="careers-login-security-note">
            Authorized Upsilon administrators only
          </p>
        </main>
      </div>
    </div>
  );
}

export default Login;
