import {
  getDailyLeaveSummaryConfig,
  getZonedScheduleParts,
  shouldRunDailyLeaveSummary,
  validateDailyLeaveSummaryConfig,
} from "../config/dailyLeaveSummary.js";
import { runDailyLeaveSummary } from "./dailyLeaveSummaryService.js";

let jobRunning = false;

export const runDailyLeaveSummarySchedulerTick = async (now = new Date(), config = getDailyLeaveSummaryConfig()) => {
  if (jobRunning || !shouldRunDailyLeaveSummary(now, config)) return false;
  jobRunning = true;
  const { dateKey } = getZonedScheduleParts(now, config.timeZone);
  try {
    await runDailyLeaveSummary({ dateKey });
    return true;
  } catch (error) {
    console.error("[daily-leave-summary] Job failed", { dateKey, message: error.message, stack: error.stack });
    return false;
  } finally {
    jobRunning = false;
  }
};

export const startDailyLeaveSummaryScheduler = () => {
  const config = getDailyLeaveSummaryConfig();
  const validation = validateDailyLeaveSummaryConfig(config);
  if (!validation.valid) {
    console.error("[daily-leave-summary] Scheduler disabled: invalid configuration", { errors: validation.errors });
    return null;
  }
  if (!config.enabled) {
    console.info("[daily-leave-summary] Scheduler disabled by configuration");
    return null;
  }
  console.info("[daily-leave-summary] Scheduler started", {
    timeZone: config.timeZone,
    schedule: `Monday-Friday at ${String(config.hour).padStart(2, "0")}:${String(config.minute).padStart(2, "0")}`,
    checkIntervalMs: config.checkIntervalMs,
  });
  void runDailyLeaveSummarySchedulerTick(new Date(), config);
  const timer = setInterval(() => void runDailyLeaveSummarySchedulerTick(new Date(), config), config.checkIntervalMs);
  timer.unref?.();
  return timer;
};

