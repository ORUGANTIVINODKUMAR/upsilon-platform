import test from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import fs from "node:fs";
import path from "node:path";
import { createRateLimiter, getClientIp } from "../middleware/rateLimit.js";
import { isAllowedDuringPasswordChange } from "../services/passwordChangePolicy.js";

const fakeResponse = () => {
  const res = new EventEmitter();
  res.statusCode = 200;
  res.headers = {};
  res.set = (name, value) => { res.headers[name] = value; return res; };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (body) => { res.body = body; return res; };
  return res;
};

const hit = (limiter, req = { headers: {}, socket: { remoteAddress: "10.0.0.1" } }) => {
  const res = fakeResponse();
  let continued = false;
  limiter(req, res, () => { continued = true; });
  return { res, continued };
};

test("rate limiter blocks requests over the limit with 429 and Retry-After", () => {
  let now = 0;
  const limiter = createRateLimiter({ windowMs: 60_000, max: 2, now: () => now });
  assert.equal(hit(limiter).continued, true);
  assert.equal(hit(limiter).continued, true);
  const blocked = hit(limiter);
  assert.equal(blocked.continued, false);
  assert.equal(blocked.res.statusCode, 429);
  assert.equal(blocked.res.body.code, "RATE_LIMITED");
  assert.equal(blocked.res.headers["Retry-After"], "60");
  now = 60_000;
  assert.equal(hit(limiter).continued, true, "a new window starts after windowMs");
});

test("failure-only limiter gives successful attempts their slot back", () => {
  const limiter = createRateLimiter({ windowMs: 60_000, max: 2, countOnlyFailures: true });
  for (let i = 0; i < 5; i++) {
    const { res, continued } = hit(limiter);
    assert.equal(continued, true);
    res.statusCode = 200;
    res.emit("finish");
  }
  for (let i = 0; i < 2; i++) {
    const { res } = hit(limiter);
    res.statusCode = 401;
    res.emit("finish");
  }
  assert.equal(hit(limiter).res.statusCode, 429);
});

test("rate limiter keeps separate counts per key", () => {
  const limiter = createRateLimiter({ windowMs: 60_000, max: 1, keyGenerator: (req) => req.body.email });
  assert.equal(hit(limiter, { headers: {}, body: { email: "a@x.com" } }).continued, true);
  assert.equal(hit(limiter, { headers: {}, body: { email: "b@x.com" } }).continued, true);
  assert.equal(hit(limiter, { headers: {}, body: { email: "a@x.com" } }).continued, false);
});

test("client IP uses the proxy-appended (rightmost) forwarded address", () => {
  assert.equal(getClientIp({ headers: { "x-forwarded-for": "6.6.6.6, 203.0.113.9" } }), "203.0.113.9");
  assert.equal(getClientIp({ headers: {}, socket: { remoteAddress: "127.0.0.1" } }), "127.0.0.1");
});

test("temporary password allows only the password change and session check", () => {
  assert.equal(isAllowedDuringPasswordChange({ method: "GET", path: "/api/auth/me" }), true);
  assert.equal(isAllowedDuringPasswordChange({ method: "put", path: "/api/auth/change-password/" }), true);
  assert.equal(isAllowedDuringPasswordChange({ method: "PUT", path: "/api/profile/password" }), true);
  assert.equal(isAllowedDuringPasswordChange({ method: "GET", path: "/api/dashboard/stats" }), false);
  assert.equal(isAllowedDuringPasswordChange({ method: "POST", path: "/api/leave/apply" }), false);
  assert.equal(isAllowedDuringPasswordChange({ method: "GET", path: "/api/auth/change-password" }), false);
});

test("applicant resumes are never served from the public uploads path", async () => {
  const { default: app } = await import("../app.js");
  const resumeDir = path.resolve("uploads", "resumes");
  fs.mkdirSync(resumeDir, { recursive: true });
  const fileName = `security-test-${process.pid}.pdf`;
  const filePath = path.join(resumeDir, fileName);
  fs.writeFileSync(filePath, "PRIVATE-RESUME-CONTENT");

  const server = app.listen(0);
  try {
    const { port } = server.address();
    for (const route of [
      `/uploads/resumes/${fileName}`,
      `/uploads/%72esumes/${fileName}`,
      `/uploads//resumes/${fileName}`,
      `/uploads/Resumes/${fileName}`,
    ]) {
      const response = await fetch(`http://127.0.0.1:${port}${route}`);
      const body = await response.text();
      assert.notEqual(response.status, 200, route);
      assert.equal(body.includes("PRIVATE-RESUME-CONTENT"), false, route);
    }
  } finally {
    server.close();
    fs.rmSync(filePath, { force: true });
  }
});

test("website contact form is rate limited per device", async () => {
  const { default: app } = await import("../app.js");
  const server = app.listen(0);
  try {
    const { port } = server.address();
    const statuses = [];
    for (let i = 0; i < 6; i++) {
      const response = await fetch(`http://127.0.0.1:${port}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Forwarded-For": "198.51.100.77" },
        body: JSON.stringify({}),
      });
      statuses.push(response.status);
    }
    assert.equal(statuses.slice(0, 5).includes(429), false);
    assert.equal(statuses[5], 429);
  } finally {
    server.close();
  }
});

test("sign-in routes run the sign-in rate limiters before the controllers", async () => {
  const { signInLimiters } = await import("../middleware/rateLimit.js");
  const routers = [
    (await import("../routes/authRoutes.js")).default,
    (await import("../routes/careersAdminRoutes.js")).default,
    (await import("../routes/careerAdminAuthAliasRoutes.js")).default,
  ];
  for (const router of routers) {
    const login = router.stack.find((layer) => layer.route?.path === "/login");
    const handlers = login.route.stack.map((layer) => layer.handle);
    for (const limiter of signInLimiters) assert.ok(handlers.includes(limiter));
  }
});
