/*
 * Small in-memory rate limiter for public endpoints (sign-in and the
 * company website forms). The app runs as a single instance, so a
 * per-process store is enough; counts reset when the server restarts.
 */

const minutes = (value) => value * 60 * 1000;

/*
 * The client address as seen by our hosting proxy. The proxy appends the
 * connecting address to X-Forwarded-For, so the rightmost entry is the one a
 * client cannot forge. Without the header (local development) fall back to the
 * socket address. This avoids enabling Express "trust proxy", which would also
 * change how req.hostname picks the website vs workspace frontend.
 */
export const getClientIp = (req) => {
  const forwarded = String(req.headers?.["x-forwarded-for"] || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  return forwarded.at(-1) || req.socket?.remoteAddress || req.ip || "unknown";
};

export const createRateLimiter = ({
  windowMs,
  max,
  keyGenerator = getClientIp,
  message = "Too many requests. Please try again later.",
  countOnlyFailures = false,
  now = () => Date.now(),
}) => {
  const hits = new Map();

  const sweep = setInterval(() => {
    const time = now();
    for (const [key, entry] of hits) {
      if (entry.resetAt <= time) hits.delete(key);
    }
  }, windowMs);
  sweep.unref?.();

  const limiter = (req, res, next) => {
    const key = keyGenerator(req);
    const time = now();
    let entry = hits.get(key);

    if (!entry || entry.resetAt <= time) {
      entry = { count: 0, resetAt: time + windowMs };
      hits.set(key, entry);
    }

    if (entry.count >= max) {
      res.set("Retry-After", String(Math.ceil((entry.resetAt - time) / 1000)));
      return res.status(429).json({
        success: false,
        code: "RATE_LIMITED",
        message,
      });
    }

    entry.count += 1;

    if (countOnlyFailures) {
      // A successful attempt gives its slot back once the response is sent.
      res.on("finish", () => {
        if (res.statusCode < 400 && hits.get(key) === entry) {
          entry.count = Math.max(0, entry.count - 1);
        }
      });
    }

    return next();
  };

  limiter.reset = () => hits.clear();
  return limiter;
};

const normalizedEmail = (req) =>
  String(req.body?.email || "").trim().toLowerCase();

const SIGN_IN_MESSAGE =
  "Too many failed sign-in attempts. Please wait 15 minutes and try again.";

/* Sign-in: failed attempts only, per device and per device + account. */
export const signInLimiters = [
  createRateLimiter({
    windowMs: minutes(15),
    max: 50,
    countOnlyFailures: true,
    message: SIGN_IN_MESSAGE,
  }),
  createRateLimiter({
    windowMs: minutes(15),
    max: 10,
    countOnlyFailures: true,
    keyGenerator: (req) => `${getClientIp(req)}|${normalizedEmail(req)}`,
    message: SIGN_IN_MESSAGE,
  }),
];

const FORM_MESSAGE =
  "Too many requests from this device. Please try again in an hour.";

/* Company website contact form: every submission sends an email. */
export const contactFormLimiter = createRateLimiter({
  windowMs: minutes(60),
  max: 5,
  message: FORM_MESSAGE,
});

/*
 * Resource downloads email a PDF to the address typed in, so limit both the
 * sender's device and the recipient address to stop the form being used to
 * spam someone else.
 */
export const resourceDownloadLimiters = [
  createRateLimiter({
    windowMs: minutes(60),
    max: 10,
    message: FORM_MESSAGE,
  }),
  createRateLimiter({
    windowMs: minutes(60),
    max: 3,
    keyGenerator: (req) => `recipient|${normalizedEmail(req)}`,
    message: "This email address has received several resources recently. Please try again in an hour.",
  }),
];
