# Attendance calendar implementation

The existing Attendance page now opens a monthly calendar. There is no new sidebar item. The in-page Recorded exceptions view retains the existing add, edit, cancel, audit-history, and Excel-export workflows.

## Files changed

- `frontend/src/pages/AttendanceManagement.jsx`: default calendar view, internal view switch, refresh after manual changes.
- `frontend/src/pages/Dashboard.jsx`: Attendance title and description.
- `frontend/src/components/AttendanceCalendar.jsx`: month navigation, employee/team/status filters, individual calendars, employee overview, date details, loading/error states.
- `frontend/src/components/AttendanceCalendar.css`: responsive calendar, scrollable overview, text badges, legend, today highlight, keyboard focus styles.
- `backend/controllers/attendanceController.js`: read-only calendar controller and role-scoped data loading.
- `backend/routes/attendanceRoutes.js`: authenticated calendar endpoint.
- `backend/services/attendanceCalendarService.js`: month validation and display-only date/status projection.
- `backend/tests/attendanceCalendar.test.js`: calendar, timezone, scope, and read-only regression checks.
- `backend/package.json`: includes calendar tests in the standard test suite.

## Backend/API

`GET /api/attendance/calendar?month=YYYY-MM&employeeId=...`

Both query parameters are optional. The backend selects the current business month when month is omitted. The response includes `month`, `today`, scoped `employees`, and `calendars` containing employee details and daily statuses. Supplying an employee ID outside the actor's permitted employees returns 403. Invalid months return 400.

The endpoint reads existing User, Team, AttendanceRecord, LeaveRequest, and Holiday documents. It does not create attendance, leave, monthly credits, or ledger entries. No database migration or new dependency is needed.

## Role behavior

| Role | Calendar visibility |
| --- | --- |
| Employee | Own monthly calendar |
| Team Leader | My Attendance; My Team for direct reports and employees in teams whose teamLeaderId identifies this TL |
| HR | All active personal-leave employees, including HR's own calendar |
| Manager | Active direct reports and assigned/managed teams, reusing the existing manager scope; own account remains excluded by that scope |
| Admin | Company-wide visibility for active personal-leave employees, consistent with existing attendance audit access |
| Finance | Company-wide read visibility, consistent with existing attendance access |

Personal-leave employee roles are Employee, TeamLeader, Manager, and HR. Admin and Finance accounts do not acquire personal leave entitlements. Attendance mutation permissions remain Manager/HR only and do not allow recording their own attendance.

The team/employee/status filters operate on backend-scoped results. The overview counts dates in each status, not payroll days: a half-day record occupies one date. Select an employee name to open their calendar.

## Status rules

1. Dates before the employee's joining date are blank.
2. Configured company holidays display Holiday; Saturdays and Sundays display Weekend. These match the existing leave and manual-attendance schedule rules.
3. Active dated LOP records display LOP. Half-day LOP retains 0.5 days in details and its calendar annotation. Legacy records without a balance treatment use the existing LOP default.
4. Final approved, non-deleted leave displays Leave. Pending, rejected, cancelled, or awaiting-reapproval leave does not qualify. A single-date approved leave with workingDays = 0.5 displays Half Day.
5. Other active manual records display Leave, Half Day, or Permission according to their existing type. Permission has no deduction.
6. Past working days with no qualifying record display Absent, without a database write or LOP deduction.
7. Today is highlighted and remains Pending when no qualifying record exists.
8. Normal future working dates stay blank. Future approved leave, weekends, and holidays remain visible. Future manual attendance is not shown as completed attendance.

The calendar uses the backend's existing `getRetrospectivePolicy()` and `LEAVE_TIME_ZONE` (default Asia/Kolkata) for today. Stored date-only attendance dates remain attached to their existing business date. The calendar refreshes on browser focus, relevant leave-balance updates, manual attendance changes, or the Refresh button.

## Verification

- Complete backend suite: 106 tests passed, including 8 calendar tests.
- Calendar checks cover leap years, year rollover, invalid months, configured timezone boundaries, today/future/pre-joining dates, weekends/holidays, final approval states, half-day/LOP/permission, cancelled and legacy records, precedence, role query scopes, employee-ID tampering, and no-write behavior.
- Frontend production build passed.
- ESLint passed for all changed JSX files.
- `git diff --check` passed.
- No connected browser was available, so authenticated visual and live-database end-to-end verification was not performed. Backend API tests use mocked model queries.

## Remaining integration limitations

- This checkout has no check-in/check-out model or API, shift schedule, or overnight attendance implementation. Consequently no dates are fabricated as Present, and worked hours/check-in times are not invented. Integrating those requires the actual source module mentioned in the request.
- Leave balance excess/LOP is calculated as an aggregate, without a stored per-date paid/unpaid allocation for approved leave. The calendar shows actual dated manual LOP, but does not assign aggregate excess or HR balance adjustments to guessed dates. Calendar Leave is an approval status, not a guarantee the entire date is paid.
- There is no existing end-of-day attendance processor. An unrecorded current day remains Pending; after it becomes a past working day, a refreshed calendar displays Absent without persisting a record.
- The production build still reports its existing large JavaScript chunk warning.
- Changes are local and have not been deployed. Deploy the backend and frontend together so the calendar endpoint is available.
