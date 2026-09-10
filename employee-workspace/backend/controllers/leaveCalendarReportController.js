import { getLeaveCalendarReport } from "../services/leaveCalendarReportService.js";

export const calendarLeaveReport = async (req, res) => {
  try {
    return res.json(await getLeaveCalendarReport(req.user, req.query));
  } catch (error) {
    const status = error.status || (error instanceof RangeError ? 400 : 500);
    if (status === 500) console.error("CALENDAR LEAVE REPORT ERROR:", error);
    return res.status(status).json({ message: status === 500 ? "Unable to generate the calendar leave report." : error.message });
  }
};
