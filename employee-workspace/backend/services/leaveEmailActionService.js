import crypto from "node:crypto";

import LeaveEmailActionToken from "../models/LeaveEmailActionToken.js";

const PENDING_STATUSES = new Set(["Pending Final Approval", "Pending Reapproval"]);
const DEFAULT_TTL_HOURS = 48;

export class LeaveEmailActionError extends Error {
  constructor(message, { code, status = 400 } = {}) {
    super(message);
    this.name = "LeaveEmailActionError";
    this.code = code;
    this.status = status;
  }
}

export const hashLeaveEmailToken = (token) =>
  crypto.createHash("sha256").update(String(token)).digest("hex");

export const getLeaveEmailActionTtlHours = (env = process.env) => {
  const configured = Number(env.LEAVE_EMAIL_ACTION_TTL_HOURS || DEFAULT_TTL_HOURS);
  return Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_TTL_HOURS;
};

export const getBackendPublicUrl = (env = process.env) => {
  // Render supplies RENDER_EXTERNAL_URL automatically. BACKEND_PUBLIC_URL
  // remains an explicit override for custom domains and other hosts.
  const configured = (
    env.BACKEND_PUBLIC_URL
    || env.RENDER_EXTERNAL_URL
    || (env.RENDER_EXTERNAL_HOSTNAME
      ? `https://${env.RENDER_EXTERNAL_HOSTNAME}`
      : "")
  ).trim();
  if (!configured) return "";
  let url;
  try {
    url = new URL(configured);
  } catch {
    throw new LeaveEmailActionError("The public backend URL must be an absolute URL.", {
      code: "INVALID_CONFIGURATION",
      status: 500,
    });
  }
  if (env.NODE_ENV === "production" && url.protocol !== "https:") {
    throw new LeaveEmailActionError("The public backend URL must use HTTPS in production.", {
      code: "INVALID_CONFIGURATION",
      status: 500,
    });
  }
  return configured.replace(/\/$/, "");
};

export const issueLeaveEmailActionToken = async ({
  leaveRequestId,
  approverId,
  action,
  now = new Date(),
  TokenModel = LeaveEmailActionToken,
  env = process.env,
}) => {
  const rawToken = crypto.randomBytes(32).toString("base64url");
  const tokenHash = hashLeaveEmailToken(rawToken);
  const expiresAt = new Date(
    now.getTime() + getLeaveEmailActionTtlHours(env) * 60 * 60 * 1000,
  );

  await TokenModel.create({
    leaveRequestId,
    approverId,
    action,
    tokenHash,
    expiresAt,
  });

  return { rawToken, expiresAt };
};

export const createLeaveEmailActionUrls = async ({
  leaveRequest,
  recipient,
  env = process.env,
  TokenModel = LeaveEmailActionToken,
}) => {
  const backendUrl = getBackendPublicUrl(env);
  const isAssignedManager =
    recipient?.role === "Manager"
    && recipient?._id?.toString() === leaveRequest.managerId?.toString();
  const isHrApprover = recipient?.role === "HR";

  if (
    (!isAssignedManager && !isHrApprover)
    || !PENDING_STATUSES.has(leaveRequest.finalStatus)
  ) {
    return {};
  }
  if (!backendUrl) {
    throw new LeaveEmailActionError(
      "No public backend URL is available for leave email actions.",
      { code: "MISSING_PUBLIC_URL", status: 500 },
    );
  }

  const now = new Date();
  await TokenModel.updateMany(
    {
      leaveRequestId: leaveRequest._id,
      approverId: recipient._id,
      usedAt: null,
      invalidatedAt: null,
    },
    { $set: { invalidatedAt: now } },
  );
  const [approveToken, rejectToken] = await Promise.all([
    issueLeaveEmailActionToken({
      leaveRequestId: leaveRequest._id,
      approverId: recipient._id,
      action: "approve",
      now,
      TokenModel,
      env,
    }),
    issueLeaveEmailActionToken({
      leaveRequestId: leaveRequest._id,
      approverId: recipient._id,
      action: "reject",
      now,
      TokenModel,
      env,
    }),
  ]);

  return {
    approveUrl: `${backendUrl}/api/leave/email-action/${encodeURIComponent(approveToken.rawToken)}/approve`,
    rejectUrl: `${backendUrl}/api/leave/email-action/${encodeURIComponent(rejectToken.rawToken)}/reject`,
  };
};

const findTokenRecord = (TokenModel, tokenHash) =>
  TokenModel.findOne({ tokenHash }).select("+tokenHash");

export const inspectLeaveEmailActionToken = async ({
  rawToken,
  action,
  now = new Date(),
  TokenModel = LeaveEmailActionToken,
}) => {
  if (!rawToken || typeof rawToken !== "string" || rawToken.length > 200) {
    throw new LeaveEmailActionError("This approval link is invalid.", {
      code: "INVALID_TOKEN",
      status: 400,
    });
  }

  const record = await findTokenRecord(TokenModel, hashLeaveEmailToken(rawToken));
  if (!record || record.invalidatedAt) {
    throw new LeaveEmailActionError("This approval link is invalid.", {
      code: "INVALID_TOKEN",
      status: 400,
    });
  }
  if (record.action && record.action !== action) {
    throw new LeaveEmailActionError("This approval link is invalid.", {
      code: "ACTION_MISMATCH",
      status: 400,
    });
  }
  if (record.usedAt) {
    throw new LeaveEmailActionError("This leave request has already been processed.", {
      code: "ALREADY_PROCESSED",
      status: 409,
    });
  }
  if (new Date(record.expiresAt) <= now) {
    throw new LeaveEmailActionError("This approval link has expired.", {
      code: "EXPIRED_TOKEN",
      status: 410,
    });
  }

  return record;
};

export const claimLeaveEmailActionToken = async ({
  rawToken,
  action,
  now = new Date(),
  TokenModel = LeaveEmailActionToken,
}) => {
  const inspected = await inspectLeaveEmailActionToken({
    rawToken,
    action,
    now,
    TokenModel,
  });
  const claimed = await TokenModel.findOneAndUpdate(
    {
      _id: inspected._id,
      usedAt: null,
      invalidatedAt: null,
      expiresAt: { $gt: now },
    },
    { $set: { usedAt: now } },
    { new: true },
  );

  if (!claimed) {
    throw new LeaveEmailActionError("This leave request has already been processed.", {
      code: "ALREADY_PROCESSED",
      status: 409,
    });
  }
  return claimed;
};
