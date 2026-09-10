import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import api from "../api/api";
import { useAuth } from "../context/useAuth";
import { EmptyState, ErrorState, LoadingState } from "./ui/StatePanel";
import "./AttendanceCalendar.css";

const STATUSES = ["Present", "Absent", "Leave", "Half Day", "LOP", "Holiday", "Weekend", "Permission", "Pending"];
const statusClass = (status) => status.toLowerCase().replaceAll(" ", "-");
const formatMonth = (month) => new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${month}-01T00:00:00Z`));
const labels = { note: "Note", holiday: "Holiday", type: "Type", recordType: "Record", durationDays: "Days", balanceTreatment: "Balance treatment", remarks: "Remarks", leaveType: "Leave type", approvalStatus: "Approval" };

export default function AttendanceCalendar({ revision = 0 }) {
  const { user } = useAuth();
  const ownOnly = user?.role === "Employee";
  const isTL = user?.role === "TeamLeader";
  const [scope, setScope] = useState("me");
  const [month, setMonth] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [teamId, setTeamId] = useState("");
  const [status, setStatus] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    const update = () => setRefresh((value) => value + 1);
    // Refresh after returning to the tab, including across business-day boundaries.
    window.addEventListener("focus", update);
    window.addEventListener("leave-balance-updated", update);
    return () => {
      window.removeEventListener("focus", update);
      window.removeEventListener("leave-balance-updated", update);
    };
  }, []);

  useEffect(() => {
    let current = true;
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError("");
      setSelectedDay(null);
      try {
        const response = await api.get("/attendance/calendar", { params: month ? { month } : {}, signal: controller.signal });
        if (current) setData(response.data);
      } catch (requestError) {
        if (current) setError(requestError.response?.data?.message || "Unable to load attendance calendar.");
      } finally {
        if (current) setLoading(false);
      }
    }
    load();
    return () => { current = false; controller.abort(); };
  }, [month, refresh, revision, user?._id, user?.role]);

  const personal = ownOnly || (isTL && scope === "me");
  const employees = useMemo(() => (data?.employees || []).filter((employee) =>
    (!isTL || scope !== "team" || String(employee._id) !== String(user?._id)) &&
    (!teamId || employee.teamId?._id === teamId)), [data, isTL, scope, user?._id, teamId]);
  const teams = [...new Map((data?.employees || []).filter((employee) => employee.teamId?._id)
    .map((employee) => [employee.teamId._id, employee.teamId])).values()];
  const calendars = (data?.calendars || []).filter((calendar) => personal
    ? String(calendar.employee._id) === String(user?._id)
    : employees.some((employee) => employee._id === calendar.employee._id) && (!employeeId || calendar.employee._id === employeeId));
  const selectedCalendar = personal || employeeId ? calendars[0] : null;
  const displayedMonth = month || data?.month;
  const changeMonth = (offset) => {
    const date = new Date(`${displayedMonth}-01T00:00:00Z`);
    date.setUTCMonth(date.getUTCMonth() + offset);
    setMonth(date.toISOString().slice(0, 7));
  };

  return <section className="attendance-calendar" aria-label="Monthly attendance">
    <div className="attendance-calendar-toolbar">
      {isTL && <div className="attendance-view-switch" aria-label="Attendance scope">
        <button className="btn btn-secondary" aria-pressed={scope === "me"} onClick={() => { setScope("me"); setEmployeeId(""); setSelectedDay(null); }}>My Attendance</button>
        <button className="btn btn-secondary" aria-pressed={scope === "team"} onClick={() => { setScope("team"); setEmployeeId(""); setSelectedDay(null); }}>My Team</button>
      </div>}
      <div className="attendance-month-navigation">
        <button className="btn btn-secondary" aria-label="Previous month" disabled={!displayedMonth || displayedMonth <= "1900-01"} onClick={() => changeMonth(-1)}><ChevronLeft size={18} /></button>
        <h2>{displayedMonth ? formatMonth(displayedMonth) : "Attendance"}</h2>
        <button className="btn btn-secondary" aria-label="Next month" disabled={!displayedMonth || displayedMonth >= "9998-12"} onClick={() => changeMonth(1)}><ChevronRight size={18} /></button>
      </div>
      <label>Month<input type="month" min="1900-01" max="9998-12" value={displayedMonth || ""} onChange={(event) => { if (event.target.value) setMonth(event.target.value); }} /></label>
      <button className="btn btn-secondary" onClick={() => { setMonth(""); setRefresh((value) => value + 1); }}>Current month</button>
      <button className="btn btn-secondary" aria-label="Refresh calendar" disabled={loading} onClick={() => setRefresh((value) => value + 1)}><RefreshCw size={16} /></button>
    </div>
    <div className="attendance-calendar-toolbar">
      {!personal && <>
        <label>Team<select value={teamId} onChange={(event) => { setTeamId(event.target.value); setEmployeeId(""); setSelectedDay(null); }}><option value="">All teams</option>{teams.map((team) => <option key={team._id} value={team._id}>{team.name}</option>)}</select></label>
        <label>Employee<select value={employeeId} onChange={(event) => { setEmployeeId(event.target.value); setSelectedDay(null); }}><option value="">All permitted employees</option>{employees.map((employee) => <option key={employee._id} value={employee._id}>{employee.name} ({employee.employeeId || employee.role})</option>)}</select></label>
      </>}
      <label>Status<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All statuses</option>{STATUSES.map((value) => <option key={value}>{value}</option>)}</select></label>
    </div>
    <p className="attendance-calendar-note">Past working days without a record display Absent. This does not deduct leave or record LOP. Check-in tracking is not available in this workspace.</p>
    <div className="attendance-calendar-legend" aria-label="Status legend">{STATUSES.map((value) => <span key={value} className={`attendance-day-badge ${statusClass(value)}`}>{value}</span>)}</div>
    {error ? <ErrorState title="Calendar could not be loaded" description={error} action={<button className="btn btn-secondary" onClick={() => setRefresh((value) => value + 1)}>Try again</button>} />
      : loading ? <LoadingState label="Loading monthly attendance..." />
      : selectedCalendar ? <>
        <h3>{selectedCalendar.employee.name}</h3>
        <div className="attendance-calendar-scroll">
          <div className="attendance-month-grid" role="group" aria-label={`${selectedCalendar.employee.name}, ${formatMonth(data.month)}`}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <div className="attendance-weekday" key={day}>{day}</div>)}
            {Array.from({ length: new Date(`${data.month}-01T00:00:00Z`).getUTCDay() }, (_, index) => <div className="attendance-day-spacer" key={`empty-${index}`} />)}
            {selectedCalendar.days.map((day) => <button key={day.date} type="button"
              className={`attendance-calendar-day ${day.today ? "is-today" : ""} ${status && day.status !== status ? "is-muted" : ""}`}
              aria-label={`${day.date}${day.today ? ", Today" : ""}, ${day.status || "No status"}`}
              aria-current={day.today ? "date" : undefined}
              aria-pressed={selectedDay?.date === day.date}
              onClick={() => setSelectedDay(day)}>
              <span className="attendance-day-number">{Number(day.date.slice(-2))}{day.today && <small>Today</small>}</span>
              {day.status && <span className={`attendance-day-badge ${statusClass(day.status)}`}>{day.status}</span>}
              {day.details.durationDays === 0.5 && day.status === "LOP" && <small>Half day · 0.5 LOP</small>}
            </button>)}
          </div>
        </div>
        {selectedDay && <aside className="attendance-day-details" aria-live="polite">
          <h3>{selectedDay.date} — {selectedDay.status || "No status"}</h3>
          <dl>{Object.entries(selectedDay.details).filter(([, value]) => value !== undefined && value !== "").map(([key, value]) => <div key={key}><dt>{labels[key] || key}</dt><dd>{value}</dd></div>)}</dl>
          <button className="btn btn-secondary" onClick={() => setSelectedDay(null)}>Close details</button>
        </aside>}
      </> : calendars.length ? <div className="attendance-calendar-scroll">
        <table className="attendance-overview"><caption>Dates by attendance status (half days count as one date) — select an employee to open their calendar</caption>
          <thead><tr><th>Employee</th>{STATUSES.map((value) => <th key={value}>{value}</th>)}</tr></thead>
          <tbody>{calendars.filter((calendar) => !status || calendar.days.some((day) => day.status === status)).map((calendar) => <tr key={calendar.employee._id}>
            <th><button className="btn btn-secondary" onClick={() => { setEmployeeId(calendar.employee._id); setSelectedDay(null); }}>{calendar.employee.name}</button></th>
            {STATUSES.map((value) => <td key={value}>{calendar.days.filter((day) => day.status === value).length}</td>)}
          </tr>)}</tbody>
        </table>
        {status && !calendars.some((calendar) => calendar.days.some((day) => day.status === status)) && <EmptyState title="No matching attendance" description="Try another status or month." />}
      </div> : <EmptyState title="No employees available" description="No employees match this attendance scope." />}
  </section>;
}
