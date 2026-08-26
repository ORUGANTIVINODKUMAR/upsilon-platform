import test from "node:test";
import assert from "node:assert/strict";

import {
  claimLeaveEmailActionToken,
  createLeaveEmailActionUrls,
  getBackendPublicUrl,
  hashLeaveEmailToken,
  inspectLeaveEmailActionToken,
} from "../services/leaveEmailActionService.js";
import { assertLeaveDecisionAuthorized } from "../services/leaveDecisionService.js";
import { getEmailActionRejectionReason } from "../controllers/leaveEmailActionController.js";
import { bypassApiCors } from "../services/corsPolicy.js";

const createTokenModel = () => {
  const records = [];
  return {
    records,
    async updateMany(filter, update) {
      for (const record of records) {
        if (
          record.leaveRequestId === filter.leaveRequestId
          && record.approverId === filter.approverId
          && !record.usedAt
          && !record.invalidatedAt
        ) Object.assign(record, update.$set);
      }
    },
    async create(input) {
      const record = { _id: `token-${records.length + 1}`, usedAt: null, invalidatedAt: null, ...input };
      records.push(record);
      return record;
    },
    findOne({ tokenHash }) {
      return { select: async () => records.find((record) => record.tokenHash === tokenHash) || null };
    },
    async findOneAndUpdate(filter, update) {
      const record = records.find((item) =>
        item._id === filter._id
        && !item.usedAt
        && !item.invalidatedAt
        && item.expiresAt > filter.expiresAt.$gt
      );
      if (!record) return null;
      Object.assign(record, update.$set);
      return record;
    },
  };
};

test("approval submission accepts an empty form body", () => {
  assert.equal(getEmailActionRejectionReason(undefined), "");
  assert.equal(getEmailActionRejectionReason({}), "");
  assert.equal(getEmailActionRejectionReason({ rejectionReason: "Not feasible" }), "Not feasible");
});

test("only email action page navigations bypass global API CORS", () => {
  const path = "/api/leave/email-action/opaque-token/approve";
  assert.equal(bypassApiCors({ method: "GET", path }), true);
  assert.equal(bypassApiCors({ method: "POST", path }), true);
  assert.equal(bypassApiCors({ method: "DELETE", path }), false);
  assert.equal(bypassApiCors({ method: "POST", path: "/api/leave/manager-approve/123" }), false);
  assert.equal(bypassApiCors({ method: "POST", path: "/api/auth/login" }), false);
});

test("action URLs are issued only for the assigned Manager and contain no leave ID", async () => {
  const TokenModel = createTokenModel();
  const leaveRequest = {
    _id: "leave-123",
    managerId: "manager-1",
    finalStatus: "Pending Final Approval",
  };
  const urls = await createLeaveEmailActionUrls({
    leaveRequest,
    recipient: { _id: "manager-1", role: "Manager" },
    env: { BACKEND_PUBLIC_URL: "https://api.example.com", LEAVE_EMAIL_ACTION_TTL_HOURS: "2" },
    TokenModel,
  });
  assert.match(urls.approveUrl, /\/email-action\/[^/]+\/approve$/);
  assert.match(urls.rejectUrl, /\/email-action\/[^/]+\/reject$/);
  assert.doesNotMatch(urls.approveUrl, /leave-123|manager-1/);
  assert.deepEqual(await createLeaveEmailActionUrls({
    leaveRequest,
    recipient: { _id: "hr-1", role: "HR" },
    env: { BACKEND_PUBLIC_URL: "https://api.example.com" },
    TokenModel,
  }), {});
});

test("production action links require a public HTTPS backend URL", async () => {
  await assert.rejects(createLeaveEmailActionUrls({
    leaveRequest: { _id: "leave-1", managerId: "manager-1", finalStatus: "Pending Final Approval" },
    recipient: { _id: "manager-1", role: "Manager" },
    env: { BACKEND_PUBLIC_URL: "http://api.example.com", NODE_ENV: "production" },
    TokenModel: createTokenModel(),
  }), (error) => error.code === "INVALID_CONFIGURATION");
});

test("Render's automatic public URL is used when no explicit override exists", async () => {
  assert.equal(getBackendPublicUrl({
    RENDER_EXTERNAL_URL: "https://upsilon-platform1.onrender.com",
    NODE_ENV: "production",
  }), "https://upsilon-platform1.onrender.com");

  const TokenModel = createTokenModel();
  const urls = await createLeaveEmailActionUrls({
    leaveRequest: { _id: "leave-1", managerId: "manager-1", finalStatus: "Pending Final Approval" },
    recipient: { _id: "manager-1", role: "Manager" },
    env: {
      RENDER_EXTERNAL_URL: "https://upsilon-platform1.onrender.com",
      NODE_ENV: "production",
    },
    TokenModel,
  });
  assert.match(urls.approveUrl, /^https:\/\/upsilon-platform1\.onrender\.com\/api\/leave\/email-action\//);
});

test("an assigned Manager fails loudly when no public URL is available", async () => {
  await assert.rejects(createLeaveEmailActionUrls({
    leaveRequest: { _id: "leave-1", managerId: "manager-1", finalStatus: "Pending Final Approval" },
    recipient: { _id: "manager-1", role: "Manager" },
    env: {},
    TokenModel: createTokenModel(),
  }), (error) => error.code === "MISSING_PUBLIC_URL");
});

test("tampered and expired email action tokens are rejected", async () => {
  const TokenModel = createTokenModel();
  TokenModel.records.push({
    _id: "expired",
    tokenHash: hashLeaveEmailToken("expired-token"),
    expiresAt: new Date("2026-08-25T00:00:00Z"),
    usedAt: null,
    invalidatedAt: null,
  });
  await assert.rejects(
    inspectLeaveEmailActionToken({ rawToken: "modified-token", TokenModel }),
    (error) => error.code === "INVALID_TOKEN",
  );
  await assert.rejects(
    inspectLeaveEmailActionToken({ rawToken: "expired-token", now: new Date("2026-08-26T00:00:00Z"), TokenModel }),
    (error) => error.code === "EXPIRED_TOKEN",
  );
});

test("a claimed token cannot be used twice", async () => {
  const TokenModel = createTokenModel();
  TokenModel.records.push({
    _id: "active",
    tokenHash: hashLeaveEmailToken("one-use-token"),
    expiresAt: new Date("2026-08-27T00:00:00Z"),
    usedAt: null,
    invalidatedAt: null,
  });
  await claimLeaveEmailActionToken({
    rawToken: "one-use-token",
    now: new Date("2026-08-26T00:00:00Z"),
    TokenModel,
  });
  await assert.rejects(
    claimLeaveEmailActionToken({
      rawToken: "one-use-token",
      now: new Date("2026-08-26T00:00:01Z"),
      TokenModel,
    }),
    (error) => error.code === "ALREADY_PROCESSED",
  );
});

test("decision authorization rejects a Manager not assigned to the leave", () => {
  assert.throws(() => assertLeaveDecisionAuthorized({
    actor: { _id: "manager-2", role: "Manager" },
    leaveRequest: {
      employeeId: { _id: "employee-1", role: "Employee" },
      managerId: "manager-1",
    },
    action: "approve",
  }), (error) => error.status === 403 && /not assigned/.test(error.message));
});
