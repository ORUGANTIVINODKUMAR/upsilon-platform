import assert from "node:assert/strict";
import test from "node:test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { Buffer } from "node:buffer";
import process from "node:process";
import { createLeaveReportWorkbook, createLeaveReportPdf } from "../src/utils/leaveReportExport.js";
import { buildLeaveCalendarReport, getCalendarReportRange } from "../../backend/services/leaveCalendarReportService.js";

// Test-only fixtures; nothing is inserted into the application database.
const leaves = [];
const attendance = [];
const ledger = [];
for (let index = 1; index <= 35; index += 1) {
  const employee = { _id: `employee-${index}`, employeeId: `QA-${String(index).padStart(3, "0")}`,
    name: index === 1 ? "A deliberately long employee name to exercise table wrapping and pagination" : `Test Employee ${String(index).padStart(3, "0")}`,
    subcategoryId: { name: "Audit and Assurance" }, teamId: { name: "International Accounting Services Team" } };
  leaves.push({ _id: `leave-${index}`, employeeId: employee, leaveType: "Casual", finalStatus: "Approved by HR", workingDays: 2,
    startDate: "2026-08-06", endDate: "2026-08-07", subcategoryId: employee.subcategoryId, teamId: employee.teamId });
  attendance.push({ _id: `attendance-${index}`, employeeId: employee, attendanceDate: "2026-08-11", status: "Half Day Leave", attendanceType: "HALF_DAY", balanceTreatment: "LOP", durationDays: 0.5 });
  ledger.push({ userId: employee._id, entryType: "MONTHLY_CREDIT", amount: 2, effectiveDate: "2026-08-01", period: "2026-08" },
    { userId: employee._id, entryType: "APPROVED_LEAVE", leaveDays: 2, amount: -2, effectiveDate: "2026-08-06", period: "2026-08", leaveRequestId: { _id: `leave-${index}`, finalStatus: "Approved by HR" } });
}
const report = buildLeaveCalendarReport({ leaves, attendance, ledger, holidays: [],
  range: getCalendarReportRange({ filterType: "month", month: "2026-08" }), now: new Date("2026-09-10T06:00:00Z") });

test("Excel round-trip preserves existing columns, summaries, exact totals and report metadata", async () => {
  const { workbook, XLSX } = await createLeaveReportWorkbook(report);
  const bytes = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  const result = XLSX.read(bytes, { type: "buffer" });
  assert.deepEqual(result.SheetNames, ["Leave Calendar", "Employee Summary", "Report Information"]);
  const details = XLSX.utils.sheet_to_json(result.Sheets["Leave Calendar"]);
  const summary = XLSX.utils.sheet_to_json(result.Sheets["Employee Summary"]);
  assert.equal(details.length, report.records.length);
  assert.equal(summary.length, report.summary.length);
  assert.deepEqual(Object.keys(details[0]).slice(0, 7), ["Employee", "Department", "Leave Type", "Start Date", "End Date", "Status", "View"]);
  assert.equal(details.reduce((sum, row) => sum + row["Days in Period"], 0), 87.5);
  for (const row of summary) {
    assert.equal(row["Total Leave Days"], 2.5);
    assert.equal(row["Paid Days"], 2);
    assert.equal(row["LOP Days"], 0.5);
    assert.equal(row["Half-day Days"], 0.5);
    assert.equal(row["Approved Request Count"], 1);
  }
  if (process.env.LEAVE_REPORT_QA_DIR) {
    await mkdir(process.env.LEAVE_REPORT_QA_DIR, { recursive: true });
    await writeFile(path.join(process.env.LEAVE_REPORT_QA_DIR, "leave-report-qa.xlsx"), bytes);
  }
});

test("PDF paginates a long report and can export an empty period", async () => {
  const doc = await createLeaveReportPdf(report);
  assert.ok(doc.getNumberOfPages() >= 3);
  assert.ok(doc.internal.pageSize.getWidth() > doc.internal.pageSize.getHeight());
  const bytes = Buffer.from(doc.output("arraybuffer"));
  assert.equal(bytes.subarray(0, 4).toString(), "%PDF");
  const empty = await createLeaveReportPdf({ ...report, records: [], summary: [] });
  assert.equal(empty.getNumberOfPages(), 1);
  if (process.env.LEAVE_REPORT_QA_DIR) {
    await mkdir(process.env.LEAVE_REPORT_QA_DIR, { recursive: true });
    await writeFile(path.join(process.env.LEAVE_REPORT_QA_DIR, "leave-report-qa.pdf"), bytes);
    await writeFile(path.join(process.env.LEAVE_REPORT_QA_DIR, "leave-report-empty-qa.pdf"), Buffer.from(empty.output("arraybuffer")));
    await writeFile(path.join(process.env.LEAVE_REPORT_QA_DIR, "leave-report-qa.json"), JSON.stringify(report, null, 2));
  }
});

test("Excel stores employee-supplied formula-like text as a literal string", async () => {
  const { workbook } = await createLeaveReportWorkbook({ ...report, records: [{ ...report.records[0], employeeName: "=HYPERLINK(\"https://example.invalid\")" }], summary: [] });
  assert.equal(workbook.Sheets["Leave Calendar"].A2.t, "s");
  assert.equal(workbook.Sheets["Leave Calendar"].A2.f, undefined);
});
