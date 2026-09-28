import ModalFrame from "../components/ui/ModalFrame";
import { useEffect, useRef, useState } from "react";
import api, { setSessionEndedHandler } from "../api/api";
import { LoadingState } from "../components/ui/StatePanel";
import AuthContext from "./auth-context";
import {
  ACTIVITY_STORAGE_KEY,
  LOGOUT_STORAGE_KEY,
  announceSignOut,
  getIdleState,
  readSharedActivity,
  writeSharedActivity,
} from "./sessionActivity";

const ACTIVITY_EVENTS = [
  "mousemove",
  "mousedown",
  "keydown",
  "scroll",
  "touchstart",
  "click",
];
const IDLE_CHECK_INTERVAL_MS = 5000;
const SHARED_ACTIVITY_WRITE_MS = 5000;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSessionWarning, setShowSessionWarning] = useState(false);

  const lastActivityRef = useRef(0);
  const lastSharedWriteRef = useRef(0);
  const warningVisibleRef = useRef(false);
  const sessionEndingRef = useRef(false);

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

  // Clears this tab's session and returns to the sign-in page. The full page
  // load resets app state; clearing the user first would let the router
  // redirect to "/" and cancel this navigation (losing ?session=expired).
  const endSession = (destination = "/") => {
    if (sessionEndingRef.current) return;
    sessionEndingRef.current = true;
    warningVisibleRef.current = false;
    setShowSessionWarning(false);
    try {
      localStorage.removeItem("activePage");
      localStorage.removeItem("leaveBalance");
    } catch {
      // Storage unavailable; nothing cached to clear.
    }
    window.location.href = destination;
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.log("Logout error:", error.response?.data || error.message);
    } finally {
      // Other open tabs share the same cookie, so sign them out too.
      announceSignOut();
      endSession("/");
    }
  };

  const lastKnownActivity = () =>
    Math.max(lastActivityRef.current, readSharedActivity());

  const recordActivity = () => {
    const now = Date.now();

    // Waking a computer after the idle limit must not revive the session.
    if (lastActivityRef.current && getIdleState(lastKnownActivity(), now) === "expired") {
      logout();
      return;
    }

    lastActivityRef.current = now;

    if (warningVisibleRef.current) {
      warningVisibleRef.current = false;
      setShowSessionWarning(false);
    }

    if (now - lastSharedWriteRef.current >= SHARED_ACTIVITY_WRITE_MS) {
      lastSharedWriteRef.current = now;
      writeSharedActivity(now);
    }
  };

  useEffect(() => {
    if (!user) return undefined;

    // Any other API call answering 401 means the session expired or was
    // revoked on the server.
    setSessionEndedHandler(() => {
      announceSignOut();
      endSession("/?session=expired");
    });

    const checkIdle = () => {
      const state = getIdleState(lastKnownActivity());

      if (state === "expired") {
        logout();
        return;
      }

      const warn = state === "warning";
      if (warn !== warningVisibleRef.current) {
        warningVisibleRef.current = warn;
        setShowSessionWarning(warn);
      }
    };

    const handleStorage = (event) => {
      if (event.key === LOGOUT_STORAGE_KEY && event.newValue) {
        endSession("/");
      } else if (event.key === ACTIVITY_STORAGE_KEY) {
        checkIdle();
      }
    };

    // Start the idle lifecycle for this signed-in session.
    lastActivityRef.current = 0;
    recordActivity();

    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, recordActivity, { passive: true });
    });
    window.addEventListener("storage", handleStorage);
    const interval = setInterval(checkIdle, IDLE_CHECK_INTERVAL_MS);

    return () => {
      ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, recordActivity);
      });
      window.removeEventListener("storage", handleStorage);
      clearInterval(interval);
      setSessionEndedHandler(null);
    };
    // The handlers intentionally capture the current authenticated user.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", {
      email,
      password,
    });

    sessionEndingRef.current = false;
    setUser(data.user);
    return data.user;
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  const stayLoggedIn = () => {
    recordActivity();
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
          <ModalFrame
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
          </ModalFrame>
        </div>
      )}
    </AuthContext.Provider>
  );
};
