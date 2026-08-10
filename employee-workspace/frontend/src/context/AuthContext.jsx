import { useEffect, useRef, useState } from "react";
import api from "../api/api";
import { LoadingState } from "../components/ui/StatePanel";
import AuthContext from "./auth-context";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSessionWarning, setShowSessionWarning] = useState(false);

  const logoutTimerRef = useRef(null);
  const warningTimerRef = useRef(null);

  const IDLE_LOGOUT_TIME = 15 * 60 * 1000;
  const WARNING_TIME = 14 * 60 * 1000;

  const checkAuth = async () => {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data.user);
    } catch (error) {
      if (error.response?.status !== 401) {
        console.error(error);
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Synchronize the initial client session with the server.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkAuth();
  }, []);

  const clearIdleTimers = () => {
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
    }

    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.log("Logout error:", error.response?.data || error.message);
    } finally {
      clearIdleTimers();
      setShowSessionWarning(false);
      setUser(null);
      localStorage.removeItem("activePage");
      localStorage.removeItem("leaveBalance");
      window.location.href = "/";
    }
  };

  const resetIdleTimer = () => {
    if (!user) return;

    clearIdleTimers();
    setShowSessionWarning(false);

    warningTimerRef.current = setTimeout(() => {
      setShowSessionWarning(true);
    }, WARNING_TIME);

    logoutTimerRef.current = setTimeout(() => {
      logout();
    }, IDLE_LOGOUT_TIME);
  };

  useEffect(() => {
    if (!user) {
      clearIdleTimers();
      return;
    }

    const events = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ];

    events.forEach((event) => {
      window.addEventListener(event, resetIdleTimer);
    });

    // Start the idle lifecycle after listeners are attached.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    resetIdleTimer();

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, resetIdleTimer);
      });

      clearIdleTimers();
    };
    // The timer callback intentionally captures the current authenticated user.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", {
      email,
      password,
    });

    setUser(data.user);
    return data.user;
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  const stayLoggedIn = () => {
    resetIdleTimer();
  };

  if (loading) {
    return (
      <main className="auth-loading-screen">
        <LoadingState label="Preparing your workspace…" />
      </main>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        updateUser,
        loading,
      }}
    >
      {children}

      {showSessionWarning && user && (
        <div className="modal-overlay">
          <div
            className="modal-box"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="session-expiring-title"
            aria-describedby="session-expiring-description"
          >
            <h2 id="session-expiring-title">Session expiring</h2>

            <p id="session-expiring-description">
              Your session will expire in 1 minute due to inactivity.
            </p>

            <div className="form-actions session-actions">
              <button type="button" className="btn" onClick={logout}>
                Sign out
              </button>

              <button type="button" className="btn btn-primary" onClick={stayLoggedIn} autoFocus>
                Stay signed in
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};
