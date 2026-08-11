import { useEffect, useState } from "react";
import {
  Building2,
  CalendarCheck2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  RotateCw,
  UsersRound,
  X,
} from "lucide-react";
import api from "../api/api";
import { useAuth } from "../context/useAuth";
import PageHeader from "../components/ui/PageHeader";
import StatusBadge from "../components/ui/StatusBadge";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/StatePanel";

const LEAVE_COLORS = {
  Sick: "#dc4c4c",
  Vacation: "#3478c8",
  Personal: "#25845e",
  Travel: "#c47b13",
  Casual: "#7c5cc4",
  Earned: "#16828e",
  Emergency: "#c04d7c",
};

const EXPORT_ROLES = ["Admin", "HR", "Manager"];

const LeaveCalendar = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [todayLeaves, setTodayLeaves] = useState([]);
  const [activeView, setActiveView] = useState("Monthly");
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDateLeaves, setSelectedDateLeaves] = useState([]);
  const [viewDate, setViewDate] = useState(() => new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchCalendarData = async () => {
    setLoading(true);
    setError("");

    try {
      const [calendarRes, todayRes] = await Promise.all([
        api.get("/leave/calendar"),
        api.get("/leave/today-leaves"),
      ]);

      setEvents(calendarRes.data.calendarEvents || []);
      setTodayLeaves(todayRes.data.leaveRequests || []);
    } catch (error) {
      console.log(error.response?.data);
      setError(error.response?.data?.message || "Unable to load the leave calendar.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial server synchronization for this standalone view.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCalendarData();
  }, []);

  useEffect(() => {
    if (!selectedDate) return undefined;

    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setSelectedDate(null);
        setSelectedDateLeaves([]);
      }
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [selectedDate]);

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const toDateInputValue = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const parseLocalDate = (value) => {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getLeaveColor = (leaveType) => LEAVE_COLORS[leaveType] || "#66736d";

  const isDateInLeaveRange = (date, event) => {
    const checkDate = new Date(date);
    const start = new Date(event.start);
    const end = new Date(event.end);

    checkDate.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    return checkDate >= start && checkDate <= end;
  };

  const getWeekRange = (date = viewDate) => {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - start.getDay());

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  };

  const filteredEvents = events.filter((event) => {
    const start = new Date(event.start);
    const end = new Date(event.end);

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    if (activeView === "Daily") {
      const selectedDay = new Date(viewDate);
      selectedDay.setHours(0, 0, 0, 0);
      return selectedDay >= start && selectedDay <= end;
    }

    if (activeView === "Weekly") {
      const { start: weekStart, end: weekEnd } = getWeekRange(viewDate);
      return start <= weekEnd && end >= weekStart;
    }

    if (activeView === "Monthly") {
      const monthStart = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
      const monthEnd = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
      monthEnd.setHours(23, 59, 59, 999);

      return start <= monthEnd && end >= monthStart;
    }

    return true;
  });

  const visibleEmployeeCount = new Set(
    filteredEvents.map((event) => event.employeeName).filter(Boolean)
  ).size;
  const visibleDepartmentCount = new Set(
    filteredEvents.map((event) => event.department).filter(Boolean)
  ).size;

  const exportCalendar = async () => {
    if (!EXPORT_ROLES.includes(user?.role) || filteredEvents.length === 0) return;
    const [XLSX, fileSaver] = await Promise.all([import("xlsx"), import("file-saver")]);
    const saveAs = fileSaver.saveAs || fileSaver.default;

    const exportRows = filteredEvents.map((event) => ({
      Employee: event.employeeName || "N/A",
      Department: event.department || "N/A",
      "Leave Type": event.leaveType || "N/A",
      "Start Date": formatDate(event.start),
      "End Date": formatDate(event.end),
      Status: event.status || "Approved",
      View: activeView,
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    worksheet["!cols"] = [
      { wch: 24 },
      { wch: 22 },
      { wch: 16 },
      { wch: 14 },
      { wch: 14 },
      { wch: 22 },
      { wch: 12 },
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leave Calendar");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const fileData = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });
    const period = activeView === "Monthly"
      ? toDateInputValue(viewDate).slice(0, 7)
      : toDateInputValue(viewDate);

    saveAs(fileData, `Leave_Calendar_${activeView}_${period}.xlsx`);
  };

  const getMonthDays = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days = [];

    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }

    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const openDateModal = (date) => {
    if (!date) return;

    const leaves = events.filter((event) =>
      isDateInLeaveRange(date, event)
    );

    setSelectedDate(date);
    setSelectedDateLeaves(leaves);
  };

  const monthDays = getMonthDays();

  const selectedMonthValue = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, "0")}`;
  const selectedDateValue = toDateInputValue(viewDate);
  const selectedPeriodLabel = (() => {
    if (activeView === "Daily") return formatDate(viewDate);
    if (activeView === "Weekly") {
      const { start, end } = getWeekRange(viewDate);
      return `${formatDate(start)} – ${formatDate(end)}`;
    }
    return viewDate.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  })();

  const selectSpecificDate = (value) => {
    if (!value) return;
    setViewDate(parseLocalDate(value));
    setActiveView("Daily");
  };

  const selectMonth = (value) => {
    if (!value) return;
    const [year, month] = value.split("-").map(Number);
    setViewDate(new Date(year, month - 1, 1));
    setActiveView("Monthly");
  };

  const moveMonth = (offset) => {
    setViewDate((currentDate) =>
      new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1)
    );
  };

  if (loading) {
    return <LoadingState label="Loading the organization leave calendar…" />;
  }

  if (error) {
    return (
      <ErrorState
        title="The leave calendar could not be loaded"
        description={error}
        action={(
          <button type="button" className="btn btn-secondary" onClick={fetchCalendarData}>
            <RotateCw size={15} aria-hidden="true" />
            Try again
          </button>
        )}
      />
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Workforce availability"
        title="Organization Leave Calendar"
        description="Review approved employee leave by day, week, or month and plan team coverage with confidence."
        icon={CalendarDays}
        actions={EXPORT_ROLES.includes(user?.role) ? (
          <button
            type="button"
            className="btn btn-primary"
            onClick={exportCalendar}
            disabled={filteredEvents.length === 0}
            aria-label={`Export ${filteredEvents.length} visible leave records to Excel`}
          >
            <FileSpreadsheet size={17} aria-hidden="true" />
            Export Excel
          </button>
        ) : undefined}
      />

      <div className="calendar-summary-grid reimbursement-summary-grid" aria-label="Leave calendar summary">
        <article className="calendar-summary-card calendar-summary-card--accent reimbursement-summary-card">
          <CalendarCheck2 size={20} aria-hidden="true" />
          <div>
            <span>On leave today</span>
            <strong>{todayLeaves.length}</strong>
            <small>approved employees</small>
          </div>
        </article>
        <article className="calendar-summary-card reimbursement-summary-card">
          <CalendarDays size={20} aria-hidden="true" />
          <div>
            <span>{activeView} records</span>
            <strong>{filteredEvents.length}</strong>
            <small>approved leaves shown</small>
          </div>
        </article>
        <article className="calendar-summary-card reimbursement-summary-card">
          <UsersRound size={20} aria-hidden="true" />
          <div>
            <span>Employees away</span>
            <strong>{visibleEmployeeCount}</strong>
            <small>in the selected view</small>
          </div>
        </article>
        <article className="calendar-summary-card reimbursement-summary-card">
          <Building2 size={20} aria-hidden="true" />
          <div>
            <span>Departments</span>
            <strong>{visibleDepartmentCount}</strong>
            <small>with scheduled leave</small>
          </div>
        </article>
      </div>

      <section className="modern-section-card calendar-today-card" aria-labelledby="today-leaves-title">
        <div className="section-header">
          <div>
            <span className="ui-eyebrow">Today</span>
            <h3 id="today-leaves-title">Who&apos;s away</h3>
            <p className="section-subtitle">A quick view of approved absences for today.</p>
          </div>
          <StatusBadge
            status={todayLeaves.length > 0 ? "pending" : "active"}
            label={todayLeaves.length > 0 ? `${todayLeaves.length} away` : "Full attendance"}
          />
        </div>

        {todayLeaves.length > 0 ? (
          <div className="calendar-people-grid">
            {todayLeaves.map((leave) => (
              <article className="calendar-person-card mini-stat-card" key={leave._id}>
                <span
                  className="calendar-person-marker"
                  style={{ "--event-color": getLeaveColor(leave.leaveType) }}
                  aria-hidden="true"
                />
                <div>
                  <strong>{leave.employeeId?.name || "Employee"}</strong>
                  <span>{leave.leaveType} leave</span>
                  <small>{formatDate(leave.startDate)} – {formatDate(leave.endDate)}</small>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            compact
            title="Everyone is available today"
            description="There are no approved leaves scheduled for today."
          />
        )}
      </section>

      <section className="calendar-view-toolbar modern-section-card" aria-label="Calendar view options">
        <div className="calendar-view-controls">
          <div className="leave-filter-tabs" aria-label="Calendar period type">
            {["Daily", "Weekly", "Monthly"].map((view) => (
              <button
                type="button"
                key={view}
                className={activeView === view ? "active-filter" : ""}
                onClick={() => setActiveView(view)}
                aria-pressed={activeView === view}
              >
                {view}
              </button>
            ))}
          </div>

          <div className="calendar-date-selectors">
            <label className="calendar-date-field">
              <span>Specific date</span>
              <input
                type="date"
                value={selectedDateValue}
                onChange={(event) => selectSpecificDate(event.target.value)}
                aria-label="Show leave for a specific date"
              />
            </label>
            <label className="calendar-date-field">
              <span>Month</span>
              <input
                type="month"
                value={selectedMonthValue}
                onChange={(event) => selectMonth(event.target.value)}
                aria-label="Show leave for a selected month"
              />
            </label>
            <button
              type="button"
              className="btn btn-secondary calendar-today-button"
              onClick={() => setViewDate(new Date())}
            >
              Today
            </button>
          </div>
        </div>

        <div className="calendar-legend" aria-label="Leave type colors">
          {Object.entries(LEAVE_COLORS).map(([leaveType, color]) => (
            <span key={leaveType} className="ui-status ui-status--neutral">
              <i style={{ "--legend-color": color }} aria-hidden="true" />
              {leaveType}
            </span>
          ))}
        </div>
      </section>

      {activeView === "Monthly" && (
        <section className="modern-section-card calendar-month-card">
          <div className="calendar-toolbar">
            <div>
              <span className="ui-eyebrow">Monthly schedule</span>
              <h3>
                {viewDate.toLocaleDateString("en-IN", {
                  month: "long",
                  year: "numeric",
                })}
              </h3>
            </div>

            <div className="calendar-navigation" aria-label="Calendar month navigation">
              <button type="button" onClick={() => moveMonth(-1)} aria-label="Previous month">
                <ChevronLeft size={18} aria-hidden="true" />
              </button>
              <button type="button" onClick={() => setViewDate(new Date())}>
                Today
              </button>
              <button type="button" onClick={() => moveMonth(1)} aria-label="Next month">
                <ChevronRight size={18} aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="calendar-scroll" role="region" aria-label="Monthly leave calendar" tabIndex="0">
          <div className="leave-calendar-grid">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="leave-calendar-weekday">
                {day}
              </div>
            ))}

            {monthDays.map((date, index) => {
              const dayLeaves = date
                ? events.filter((event) => isDateInLeaveRange(date, event))
                : [];

              const isToday =
                date &&
                date.toDateString() === today.toDateString();

              return (
                <button
                  type="button"
                  key={index}
                  onClick={() => openDateModal(date)}
                  disabled={!date}
                  className={`leave-calendar-day${isToday ? " is-today" : ""}${!date ? " is-empty" : ""}`}
                  aria-label={date ? `${formatDate(date)}, ${dayLeaves.length} approved leave${dayLeaves.length === 1 ? "" : "s"}` : undefined}
                >
                  <span className="leave-calendar-date">
                    {date ? date.getDate() : ""}
                  </span>

                  {dayLeaves.slice(0, 3).map((event) => (
                    <span
                      key={`${event.id}-${event.employeeName}`}
                      className="leave-calendar-event"
                      style={{ "--event-color": getLeaveColor(event.leaveType) }}
                      title={`${event.employeeName} - ${event.leaveType}`}
                    >
                      {event.employeeName}
                    </span>
                  ))}

                  {dayLeaves.length > 3 && (
                    <span className="leave-calendar-more">
                      +{dayLeaves.length - 3} more
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          </div>
        </section>
      )}

      <section className="modern-section-card calendar-list-card" aria-labelledby="calendar-list-title">
        <div className="section-header">
          <div>
            <span className="ui-eyebrow">Approved schedule</span>
            <h3 id="calendar-list-title">{activeView} leave details</h3>
            <p className="section-subtitle">
              {selectedPeriodLabel} · {filteredEvents.length} approved leave {filteredEvents.length === 1 ? "record" : "records"}.
            </p>
          </div>
        </div>

        <div className="table-wrapper modern-table-wrapper">
          <table className="custom-table">
          <caption className="sr-only">Approved employee leave in the selected calendar view</caption>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Department</th>
              <th>Leave Type</th>
              <th>From</th>
              <th>To</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {filteredEvents.map((event) => (
              <tr key={event.id}>
                <td>{event.employeeName}</td>
                <td>{event.department || "N/A"}</td>
                <td>{event.leaveType}</td>
                <td>{formatDate(event.start)}</td>
                <td>{formatDate(event.end)}</td>
                <td>
                  <StatusBadge status={event.status || "Approved"} />
                </td>
              </tr>
            ))}

            {filteredEvents.length === 0 && (
              <tr>
                <td colSpan="6">
                  <EmptyState
                    compact
                    title={`No approved leaves in the ${activeView.toLowerCase()} view`}
                    description="Choose another specific date or month to review scheduled leave."
                  />
                </td>
              </tr>
            )}
          </tbody>
          </table>
        </div>
      </section>

      {selectedDate && (
        <div className="modal-overlay">
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="calendar-day-dialog-title"
          >
            <div className="modal-header">
              <h3 id="calendar-day-dialog-title">Leaves on {formatDate(selectedDate)}</h3>

              <button
                type="button"
                aria-label="Close leave details"
                onClick={() => {
                  setSelectedDate(null);
                  setSelectedDateLeaves([]);
                }}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <div className="calendar-day-details">
              {selectedDateLeaves.length > 0 ? (
                selectedDateLeaves.map((leave) => (
                  <div
                    key={leave.id}
                    className="calendar-leave-detail"
                  >
                    <CalendarDays size={18} aria-hidden="true" />
                    <div>
                      <strong>{leave.employeeName}</strong>
                      <p>{leave.leaveType}</p>
                      <p>
                        {formatDate(leave.start)} - {formatDate(leave.end)}
                      </p>
                      <StatusBadge status={leave.status || "Approved"} />
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState compact title="No approved leaves on this date" />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LeaveCalendar;
