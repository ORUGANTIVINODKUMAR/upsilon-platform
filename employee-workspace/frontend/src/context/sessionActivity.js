// Idle sign-out shared by every open workspace tab. Each tab records user
// activity in localStorage, so a tab left idle does not sign out someone who
// is working in another tab.
export const IDLE_WARNING_MS = 14 * 60 * 1000;
export const IDLE_LOGOUT_MS = 15 * 60 * 1000;
export const ACTIVITY_STORAGE_KEY = "workspace-last-activity";
export const LOGOUT_STORAGE_KEY = "workspace-signed-out";

export const getIdleState = (lastActivity, now = Date.now()) => {
  const idle = now - lastActivity;
  if (idle >= IDLE_LOGOUT_MS) return "expired";
  if (idle >= IDLE_WARNING_MS) return "warning";
  return "active";
};

const safeStorage = () => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

export const readSharedActivity = (storage = safeStorage()) => {
  try {
    return Number(storage?.getItem(ACTIVITY_STORAGE_KEY)) || 0;
  } catch {
    return 0;
  }
};

export const writeSharedActivity = (time, storage = safeStorage()) => {
  try {
    storage?.setItem(ACTIVITY_STORAGE_KEY, String(time));
  } catch {
    // Storage unavailable (private mode): idle tracking stays per tab.
  }
};

export const announceSignOut = (storage = safeStorage()) => {
  try {
    storage?.setItem(LOGOUT_STORAGE_KEY, String(Date.now()));
  } catch {
    // Other tabs will notice on their next API call instead.
  }
};
