import {
  useEffect,
  useState,
} from "react";

import {
  Navigate,
  useLocation,
} from "react-router-dom";

function CareersProtectedRoute({ children }) {
  const location = useLocation();

  const [loading, setLoading] =
    useState(true);

  const [authenticated, setAuthenticated] =
    useState(false);

  useEffect(() => {
    const verifyCareersAdmin = async () => {
      try {
        setLoading(true);

        const response = await fetch(
          "/api/admin/auth/me",
          {
            method: "GET",
            credentials: "include",
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            "Careers admin is not authenticated."
          );
        }

        if (data.admin) {
          localStorage.setItem(
            "careersAdmin",
            JSON.stringify(data.admin)
          );
        }

        setAuthenticated(true);
      } catch (error) {
        console.error(
          "Careers authentication check:",
          error
        );

        localStorage.removeItem(
          "careersAdmin"
        );

        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    verifyCareersAdmin();
  }, []);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "30px",
          color: "#1f2937",
          background: "#f7f7f5",
          fontSize: "18px",
          fontWeight: "700",
        }}
      >
        Checking Careers admin access...
      </div>
    );
  }

  if (!authenticated) {
    return (
      <Navigate
        to="/admin/careers/login"
        state={{
          from: location.pathname,
        }}
        replace
      />
    );
  }

  return children;
}

export default CareersProtectedRoute;