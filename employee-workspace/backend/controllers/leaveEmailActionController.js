import LeaveRequest from "../models/LeaveRequest.js";
import User from "../models/User.js";
import {
  assertLeaveDecisionAuthorized,
  processLeaveDecision,
} from "../services/leaveDecisionService.js";
import {
  claimLeaveEmailActionToken,
  inspectLeaveEmailActionToken,
  LeaveEmailActionError,
} from "../services/leaveEmailActionService.js";

const escapeHtml = (value = "") => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const page = ({ title, message, form = "" }) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title></head>
<body style="margin:0;background:#f4f7f6;font-family:Arial,sans-serif;color:#14231d">
  <main style="max-width:560px;margin:64px auto;background:#fff;padding:32px;border-radius:10px;box-shadow:0 4px 18px rgba(0,0,0,.08)">
    <h1 style="font-size:24px;color:#075b45">${escapeHtml(title)}</h1>
    <p>${escapeHtml(message)}</p>${form}
  </main>
</body></html>`;

const sendPage = (res, status, content) => {
  res.set({
    "Cache-Control": "no-store",
    "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
    "X-Robots-Tag": "noindex, nofollow",
  });
  return res.status(status).type("html").send(content);
};

export const getEmailActionRejectionReason = (body) =>
  body?.rejectionReason || "";

const getContext = async (rawToken, action) => {
  const tokenRecord = await inspectLeaveEmailActionToken({ rawToken, action });
  const [actor, leaveRequest] = await Promise.all([
    User.findById(tokenRecord.approverId).select("_id name email role isActive"),
    LeaveRequest.findById(tokenRecord.leaveRequestId)
      .select("employeeId managerId finalStatus tlStatus")
      .populate("employeeId", "_id role"),
  ]);

  if (!leaveRequest) {
    throw new LeaveEmailActionError("Leave request not found.", {
      code: "NOT_FOUND",
      status: 404,
    });
  }
  if (!actor || actor.isActive === false) {
    throw new LeaveEmailActionError(
      "You are not authorized to process this leave request.",
      { code: "FORBIDDEN", status: 403 },
    );
  }

  try {
    assertLeaveDecisionAuthorized({ actor, leaveRequest, action });
  } catch (error) {
    throw new LeaveEmailActionError(error.message, {
      code: error.code || "FORBIDDEN",
      status: error.status || 403,
    });
  }
  const oppositeManagerStatus = action === "approve"
    ? "Rejected by Manager"
    : "Approved by Manager";
  if (
    !["Pending Final Approval", "Pending Reapproval", oppositeManagerStatus]
      .includes(leaveRequest.finalStatus)
  ) {
    throw new LeaveEmailActionError("This leave request has already been processed.", {
      code: "ALREADY_PROCESSED",
      status: 409,
    });
  }
  return { actor, leaveRequest, tokenRecord };
};

const renderError = (res, error) => {
  const status = error.status && error.status < 500 ? error.status : 500;
  const message = status >= 500
    ? "Unable to process this leave request. Please use Upsilon Workspace."
    : error.message;
  return sendPage(res, status, page({ title: "Leave request", message }));
};

export const showLeaveEmailAction = async (req, res) => {
  try {
    const action = req.params.action;
    if (!["approve", "reject"].includes(action)) {
      throw new LeaveEmailActionError("This approval link is invalid.", { status: 400 });
    }
    await getContext(req.params.token, action);

    const form = action === "reject"
      ? `<form method="post"><label for="reason"><strong>Rejection reason</strong></label>
          <textarea id="reason" name="rejectionReason" required maxlength="1000" rows="5" style="box-sizing:border-box;width:100%;margin:10px 0 18px;padding:10px"></textarea>
          <button type="submit" style="border:0;border-radius:7px;background:#a12828;color:#fff;padding:11px 18px;cursor:pointer">Reject Leave</button></form>`
      : `<form method="post"><button type="submit" style="border:0;border-radius:7px;background:#075b45;color:#fff;padding:11px 18px;cursor:pointer">Confirm Approve Leave</button></form>`;
    return sendPage(res, 200, page({
      title: action === "approve" ? "Approve leave request" : "Reject leave request",
      message: action === "approve"
        ? "Confirm that you want to approve this leave request."
        : "Enter a reason and confirm the rejection.",
      form,
    }));
  } catch (error) {
    return renderError(res, error);
  }
};

export const processLeaveEmailAction = async (req, res) => {
  try {
    const action = req.params.action;
    const rejectionReason = getEmailActionRejectionReason(req.body);
    if (!["approve", "reject"].includes(action)) {
      throw new LeaveEmailActionError("This approval link is invalid.", { status: 400 });
    }
    if (action === "reject" && !rejectionReason.trim()) {
      throw new LeaveEmailActionError("Rejection reason is required.", { status: 400 });
    }

    const { actor, tokenRecord } = await getContext(req.params.token, action);
    await claimLeaveEmailActionToken({ rawToken: req.params.token, action });
    const result = await processLeaveDecision({
      leaveRequestId: tokenRecord.leaveRequestId,
      actor,
      action,
      rejectionReason,
      allowRevision: true,
    });
    if (result.alreadyProcessed) {
      throw new LeaveEmailActionError("This leave request has already been processed.", {
        code: "ALREADY_PROCESSED",
        status: 409,
      });
    }

    return sendPage(res, 200, page({
      title: "Leave request",
      message: action === "approve"
        ? result.wasRevision
          ? "Leave decision updated to approved successfully."
          : "Leave request approved successfully."
        : result.wasRevision
          ? "Leave decision updated to rejected successfully."
          : "Leave request rejected successfully.",
    }));
  } catch (error) {
    return renderError(res, error);
  }
};
