const numberFromEnvironment = (value, fallback) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : fallback;
};

export const getDailyLeaveSummaryConfig = (environment = process.env) => ({
  enabled: environment.DAILY_LEAVE_SUMMARY_ENABLED !== "false",
  timeZone: environment.LEAVE_TIME_ZONE || "Asia/Kolkata",
  hour: numberFromEnvironment(environment.DAILY_LEAVE_SUMMARY_HOUR, 9),
  minute: numberFromEnvironment(environment.DAILY_LEAVE_SUMMARY_MINUTE, 0),
  checkIntervalMs: numberFromEnvironment(environment.DAILY_LEAVE_SUMMARY_CHECK_INTERVAL_MS, 300000),
});

export const validateDailyLeaveSummaryConfig = (config) => {
  const errors = [];
  try {
    new Intl.DateTimeFormat("en", { timeZone: config.timeZone }).format();
  } catch {
    errors.push(`LEAVE_TIME_ZONE is invalid: ${config.timeZone}`);
  }
  if (config.hour < 0 || config.hour > 23) errors.push("DAILY_LEAVE_SUMMARY_HOUR must be between 0 and 23");
  if (config.minute < 0 || config.minute > 59) errors.push("DAILY_LEAVE_SUMMARY_MINUTE must be between 0 and 59");
  if (config.checkIntervalMs < 60000) errors.push("DAILY_LEAVE_SUMMARY_CHECK_INTERVAL_MS must be at least 60000");
  return { valid: errors.length === 0, errors };
};

export const getZonedScheduleParts = (date, timeZone) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date).reduce((values, part) => ({ ...values, [part.type]: part.value }), {});
  return {
    weekday: parts.weekday,
    dateKey: `${parts.year}-${parts.month}-${parts.day}`,
    hour: Number(parts.hour),
    minute: Number(parts.minute),
  };
};

export const shouldRunDailyLeaveSummary = (date, config) => {
  if (!config.enabled) return false;
  const parts = getZonedScheduleParts(date, config.timeZone);
  if (["Sat", "Sun"].includes(parts.weekday)) return false;
  return parts.hour > config.hour || (parts.hour === config.hour && parts.minute >= config.minute);
};

