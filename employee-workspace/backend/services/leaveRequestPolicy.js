const DEFAULT_RETROSPECTIVE_LIMIT_DAYS = 7;
const MAX_RETROSPECTIVE_LIMIT_DAYS = 365;
const DEFAULT_LEAVE_TIME_ZONE = "Asia/Kolkata";

export const BLOCKING_LEAVE_STATUSES = [
  "Pending Final Approval",
  "Pending Reapproval",
  "On Hold",
  "Approved by Manager",
  "Approved by HR",
];

const parseConfiguredDays = (value) => {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return DEFAULT_RETROSPECTIVE_LIMIT_DAYS;
  }

  return Math.min(parsed, MAX_RETROSPECTIVE_LIMIT_DAYS);
};

export const getRetrospectiveLimitDays = () =>
  parseConfiguredDays(process.env.PAST_LEAVE_LIMIT_DAYS);

export const startOfUtcDay = (value = new Date()) => {
  const date = value instanceof Date ? new Date(value) : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
  ));
};

const businessDayFromInstant = (value) => {
  const date = value instanceof Date ? new Date(value) : new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const timeZone = process.env.LEAVE_TIME_ZONE || DEFAULT_LEAVE_TIME_ZONE;

  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);
    const values = Object.fromEntries(parts.map(({ type, value: partValue }) => [type, partValue]));
    return new Date(Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day)));
  } catch {
    return startOfUtcDay(date);
  }
};

export const formatDateOnly = (value) => {
  const date = startOfUtcDay(value);
  return date ? date.toISOString().slice(0, 10) : "";
};

export const getRetrospectivePolicy = (now = new Date()) => {
  const today = businessDayFromInstant(now);
  const maxPastDays = getRetrospectiveLimitDays();
  const earliestAllowedDate = new Date(today);
  earliestAllowedDate.setUTCDate(earliestAllowedDate.getUTCDate() - maxPastDays);

  return {
    maxPastDays,
    today,
    earliestAllowedDate,
    todayDate: formatDateOnly(today),
    earliestAllowedDateValue: formatDateOnly(earliestAllowedDate),
  };
};

export const describeLeaveTiming = (startDate, submittedAt = new Date()) => {
  const leaveDay = startOfUtcDay(startDate);
  const submissionDay = businessDayFromInstant(submittedAt);
  const difference = leaveDay && submissionDay
    ? Math.max(0, Math.round((submissionDay - leaveDay) / 86_400_000))
    : 0;

  return {
    requestKind: difference > 0 ? "Retrospective" : "Standard",
    retrospectiveDays: difference,
  };
};

export const validateLeaveDateRange = ({
  startDate,
  endDate,
  now = new Date(),
  enforceRetrospectiveLimit = true,
}) => {
  const parsedStartDate = startOfUtcDay(startDate);
  const parsedEndDate = startOfUtcDay(endDate);

  if (!parsedStartDate || !parsedEndDate) {
    return { valid: false, message: "Enter valid start and end dates." };
  }

  if (parsedEndDate < parsedStartDate) {
    return { valid: false, message: "End date cannot be earlier than start date." };
  }

  const policy = getRetrospectivePolicy(now);

  if (enforceRetrospectiveLimit && parsedStartDate < policy.earliestAllowedDate) {
    return {
      valid: false,
      code: "RETROSPECTIVE_LIMIT_EXCEEDED",
      message: policy.maxPastDays === 0
        ? "Past leave requests are not currently allowed."
        : `Past leave can only be requested within the last ${policy.maxPastDays} days (on or after ${policy.earliestAllowedDateValue}).`,
    };
  }

  return {
    valid: true,
    startDate: parsedStartDate,
    endDate: parsedEndDate,
    ...describeLeaveTiming(parsedStartDate, now),
    policy,
  };
};

export const buildOverlapQuery = ({ employeeId, startDate, endDate, excludeId }) => {
  const query = {
    employeeId,
    finalStatus: { $in: BLOCKING_LEAVE_STATUSES },
    startDate: { $lte: endDate },
    endDate: { $gte: startDate },
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  return query;
};

export const getOverlapMessage = (overlap) => {
  const start = formatDateOnly(overlap?.startDate);
  const end = formatDateOnly(overlap?.endDate);
  const range = start === end ? start : `${start} to ${end}`;

  return `You already have a ${overlap.finalStatus.toLowerCase()} leave request covering ${range}. Choose dates that do not overlap.`;
};

export const canCancelOwnLeaveRequest = ({ ownerId, userId, finalStatus }) => {
  if (!ownerId || !userId || ownerId.toString() !== userId.toString()) {
    return false;
  }

  return ["Pending Final Approval", "Pending Reapproval", "On Hold"].includes(
    finalStatus,
  );
};
