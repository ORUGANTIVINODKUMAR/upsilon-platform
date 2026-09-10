# HR and Manager calendar reports

Open the existing Leave Calendar, choose Daily, Weekly, Monthly, or Custom, review the calendar and employee summary, then select Download Excel or Download PDF beside the filters. Refresh report reloads the selected period. Custom ranges are inclusive and limited to 366 days, consistent with bounded attendance reports. Calendar weeks remain Sunday-Saturday.

## Shared dataset and permissions

`GET /api/leave/calendar-report` returns the report metadata, detailed records, dated allocations, employee summary, and calculation notes. Authentication and HR/Manager authorization run on the route; the report service checks the role again.

Parameters:

- Day: `filterType=day&date=2026-09-10`
- Week: `filterType=week&date=2026-09-10`
- Month: `filterType=month&month=2026-09`
- Custom: `filterType=custom&startDate=2026-09-01&endDate=2026-09-10`

Manager leave-request visibility continues to use the existing `managerId` filter. Manual attendance visibility reuses the existing direct-report/assigned-team/managed-team scope. HR retains company-wide visibility. No organization-wide data is added for Employees or Team Leaders. Existing Admin Excel download remains available without the new PDF/summary entitlement; other legacy calendar views retain their current access.

For HR/Manager, the calendar's selected-period events, date details, employee summary, Excel, and PDF all consume the same loaded backend report snapshot. A changed period invalidates the previous snapshot for export. Stale requests cannot overwrite a newer report. The separate Who's away today panel keeps its existing independent purpose.

## Totals and payment allocation

- Only final-approved, non-deleted leave requests that do not require reapproval enter the report. Cancelled/inactive manual records are excluded.
- Multi-day requests are clipped to the selected period after excluding Saturdays, Sundays, and configured holidays. A half-day contributes 0.5.
- Manual attendance uses its actual date, duration, and paid/LOP treatment. Permission remains visible for calendar consistency and contributes zero leave days.
- Employee summaries use database user IDs, so identical names are not merged.
- Paid and LOP allocations reuse the existing leave-balance consumption algorithm through an optional allocation callback. The normal balance calculation result is unchanged.
- Complete existing ledger history is considered, including leave outside the selected report period, so paid capacity is not incorrectly reset for each export.
- To attribute a request-level paid/LOP split to dates, paid capacity is assigned to the earliest working dates in the request before clipping. This reporting convention is stated in both exports and the on-screen notes.
- Missing/inactive/not-yet-credited ledger allocations are shown as Unallocated instead of invented paid/LOP values. Undated balance adjustments are not assigned to guessed leave dates. Existing ledger records are read, not created or migrated by reporting.
- Total days = paid days + LOP days + unallocated days. Half-day count/days is an additional breakdown of those same days, never added again.
- Approved request count/days covers leave requests. Manager/HR-recorded attendance remains a separate source and is included in overall leave totals.

## Export contents

Excel keeps the existing Leave Calendar sheet and its initial Employee, Department, Leave Type, Start Date, End Date, Status, and View columns. Additional columns show employee ID, team, source, days within the period, paid/LOP/unallocated days, half-day count/days, and approved days. Employee Summary and Report Information are new sheets.

PDF includes the title, date range, generation timestamp explicitly labeled UTC, employee summary, detailed leave records, calculation notes, and page numbering. It uses landscape A4, fixed-width wrapped columns, repeated table headers, and complete rows where possible. Non-empty details start on a new page to prevent orphan headings. Empty periods export normally.

PDF generation uses lazily loaded [jsPDF](https://github.com/parallax/jsPDF) and [jsPDF-AutoTable](https://github.com/simonbengtsson/jsPDF-AutoTable). Excel continues to use the existing SheetJS dependency. Neither export format recalculates business totals on the client.

## Files changed for this update

- `backend/services/leaveCalendarReportService.js`: shared query, clipping, allocation, and employee aggregation.
- `backend/controllers/leaveCalendarReportController.js`: report response and errors.
- `backend/routes/leaveRoutes.js`: authenticated HR/Manager report route.
- `backend/services/leaveBalanceService.js`: optional callback exposing the existing paid/LOP allocation.
- `backend/services/attendanceScopeService.js`: shared unchanged attendance scope logic.
- `backend/controllers/attendanceController.js`: imports that shared scope logic.
- `backend/tests/leaveCalendarReport.test.js` and `backend/package.json`: report tests in the standard suite.
- `frontend/src/pages/LeaveCalendar.jsx` and `LeaveCalendar.css`: custom range, report actions, summary, date breakdown, and wrapping toolbar.
- `frontend/src/utils/leaveReportExport.js`: Excel and paginated PDF formatting.
- `frontend/tests/leaveReportExport.test.js`: workbook round-trip, PDF pagination, empty period, and formula-like text tests.
- `frontend/package.json` and `package-lock.json`: PDF dependencies and export-test command.

Earlier Attendance calendar changes remain in the working tree.

## Verification

- Complete backend suite: 120 tests passed, including 14 report tests.
- Frontend export tests: 3 passed (`npm run test:leave-report`).
- Full frontend ESLint check passed.
- Production frontend build passed; the existing main-bundle size warning remains.
- A test-only dataset of 35 employees and 70 detailed records round-tripped through Excel with matching totals and metadata. No fixtures were inserted into the application database.
- The generated 14-page PDF and empty-period PDF were rendered with Poppler and visually reviewed. Text extraction confirmed employee coverage, titles/footers, page bounds, and section-heading placement. Test artifacts are under ignored `tmp/pdfs/leave-report/`.
- No authenticated browser or live-database end-to-end test was performed. API tests use mocked model queries; calculations and both export formats are exercised with test fixtures.

Deploy the updated backend and frontend together. The frontend requires the new report endpoint and PDF dependencies. No database migration is required. Changes have not been deployed.
