const EMAIL_ACTION_PATH =
  /^\/api\/leave\/email-action\/[^/]+\/(approve|reject)\/?$/;

// These routes are top-level browser navigations protected by a one-time
// bearer token, not cookie-authenticated API calls. Some Outlook/browser
// privacy flows submit their confirmation form with the literal Origin
// value "null", so global API CORS must not run for these two routes.
export const bypassApiCors = ({ method, path }) =>
  ["GET", "POST"].includes(String(method).toUpperCase())
  && EMAIL_ACTION_PATH.test(path);
