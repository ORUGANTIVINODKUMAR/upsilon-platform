import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

function CareersAdminRoute({ children }) {
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    let isMounted = true;

    fetch("/api/careers-admin/me", { credentials: "include" })
      .then((response) => {
        if (isMounted) {
          setStatus(response.ok ? "authorized" : "unauthorized");
        }
      })
      .catch(() => {
        if (isMounted) {
          setStatus("unauthorized");
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (status === "checking") {
    return null;
  }

  if (status === "unauthorized") {
    return <Navigate to="/careers-admin/login" replace />;
  }

  return children;
}

export default CareersAdminRoute;
