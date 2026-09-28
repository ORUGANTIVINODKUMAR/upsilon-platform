import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
});

// 401s from these calls are expected (not signed in yet, wrong password, or
// already signing out) and are handled where they are made.
const EXPECTED_UNAUTHORIZED = ["/auth/me", "/auth/login", "/auth/logout"];

let handleSessionEnded = null;

// AuthProvider registers this so any other 401 (expired or revoked session)
// sends the user back to sign-in instead of leaving pages full of errors.
export const setSessionEndedHandler = (handler) => {
  handleSessionEnded = handler;
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || "";
    if (
      error.response?.status === 401 &&
      handleSessionEnded &&
      !EXPECTED_UNAUTHORIZED.some((path) => url.startsWith(path))
    ) {
      handleSessionEnded();
    }
    return Promise.reject(error);
  }
);

export default api;
