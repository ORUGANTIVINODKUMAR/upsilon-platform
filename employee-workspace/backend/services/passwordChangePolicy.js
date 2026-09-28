/*
 * Accounts created or reset by an Admin get a temporary password the Admin
 * knows (mustChangePassword = true). Until the user replaces it, the API only
 * allows loading the signed-in user and changing the password.
 */
const ALLOWED_WHILE_PASSWORD_CHANGE_REQUIRED = new Set([
  "GET /api/auth/me",
  "PUT /api/auth/change-password",
  "PUT /api/profile/password",
]);

export const PASSWORD_CHANGE_REQUIRED_CODE = "PASSWORD_CHANGE_REQUIRED";

export const isAllowedDuringPasswordChange = ({ method, path }) => {
  const normalizedPath = String(path || "").replace(/\/+$/, "") || "/";
  return ALLOWED_WHILE_PASSWORD_CHANGE_REQUIRED.has(
    `${String(method || "").toUpperCase()} ${normalizedPath}`
  );
};
