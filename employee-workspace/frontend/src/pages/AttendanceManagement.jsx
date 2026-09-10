import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarX2, Download, Pencil, Plus, RefreshCw, Search, Trash2, X } from "lucide-react";
import api from "../api/api";
import { useAuth } from "../context/useAuth";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import PageHeader from "../components/ui/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/StatePanel";
import "./AttendanceManagement.css";
import AttendanceCalendar from "../components/AttendanceCalendar";

const ATTENDANCE_OPTIONS = {
  FULL_DAY: { label: "Full-day absence", status: "Absent \u2013 Uninformed", durationDays: 1 },
  HALF_DAY: { label: "Half-day leave", status: "Half Day Leave", durationDays: 0.5 },
  PERMISSION: { label: "Permission", status: "Permission", durationDays: 0 },
};

const businessDate = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
};

const currentMonthStart = () => `${businessDate().slice(0, 7)}-01`;

const formatDate = (value) => {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
};

const formatDateTime = (value) => {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
};

const emptyForm = () => ({ employeeId: "", date: businessDate(), attendanceType: "FULL_DAY", balanceTreatment: "LOP", remarks: "" });

const AttendanceManagement = () => {
  const [view, setView] = useState("calendar");
  const [calendarRevision, setCalendarRevision] = useState(0);
  const { user } = useAuth();
  const canManage = ["Manager", "HR"].includes(user?.role);
  const canExport = ["Manager", "HR", "Admin"].includes(user?.role);
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [filters, setFilters] = useState({ startDate: currentMonthStart(), endDate: businessDate(), employeeId: "" });
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState("");

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { startDate: filters.startDate, endDate: filters.endDate };
      if (filters.employeeId) params.employeeId = filters.employeeId;
      const { data } = await api.get("/attendance", { params });
      setRecords(data.records || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load attendance records.");
    } finally {
      setLoading(false);
    }
  }, [filters.endDate, filters.employeeId, filters.startDate]);

  const fetchEmployees = useCallback(async () => {
    if (!canManage) return;
    try {
      const { data } = await api.get("/attendance/employees");
      setEmployees(data.employees || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load employees.");
    }
  }, [canManage]);

  useEffect(() => {
    // Load the server-backed view whenever its filters change.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRecords();
  }, [fetchRecords]);

  useEffect(() => {
    // Synchronize the role-scoped employee picker with the API.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchEmployees();
  }, [fetchEmployees]);

  const visibleEmployees = useMemo(() => {
    const query = employeeSearch.trim().toLowerCase();
    if (!query) return employees;
    return employees.filter((employee) =>
      [employee.name, employee.email, employee.employeeId, employee.teamId?.name]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query)),
    );
  }, [employeeSearch, employees]);

  const selectedEmployee = employees.find((employee) => employee._id === form.employeeId);
  const selectedAttendance = ATTENDANCE_OPTIONS[form.attendanceType] || ATTENDANCE_OPTIONS.FULL_DAY;
  const STATUS = selectedAttendance.status;

  const selectFilterMonth = (value) => {
    if (!/^\d{4}-\d{2}$/.test(value)) return;
    const [year, month] = value.split("-").map(Number);
    const monthEnd = new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
    setFilters((current) => ({
      ...current,
      startDate: `${value}-01`,
      endDate: monthEnd > businessDate() ? businessDate() : monthEnd,
    }));
  };

  const openCreate = () => {
    setEditingRecord(null);
    setForm(emptyForm());
    setEmployeeSearch("");
    setFormError("");
    setShowForm(true);
  };

  const openEdit = (record) => {
    setEditingRecord(record);
    setForm({
      employeeId: record.employeeId?._id || record.employeeId,
      date: String(record.attendanceDate).slice(0, 10),
      attendanceType: record.attendanceType || "FULL_DAY",
      balanceTreatment: record.balanceTreatment || (record.attendanceType === "PERMISSION" ? "NONE" : "LOP"),
      remarks: record.remarks || "",
    });
    setEmployeeSearch(record.employeeId?.name || record.employeeName || "");
    setFormError("");
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) return;
    setShowForm(false);
    setConfirmOpen(false);
    setFormError("");
  };

  const requestConfirmation = (event) => {
    event.preventDefault();
    setFormError("");
    if (!form.employeeId) {
      setFormError("Select an employee.");
      return;
    }
    if (!form.date) {
      setFormError("Select an attendance date.");
      return;
    }
    setConfirmOpen(true);
  };

  const saveRecord = async () => {
    setSaving(true);
    setFormError("");
    try {
      const payload = {
        employeeId: form.employeeId,
        date: form.date,
        attendanceType: form.attendanceType,
        balanceTreatment: form.attendanceType === "PERMISSION" ? "NONE" : form.balanceTreatment,
        remarks: form.remarks,
      };
      const { data } = editingRecord
        ? await api.patch(`/attendance/uninformed-absence/${editingRecord._id}`, payload)
        : await api.post("/attendance/uninformed-absence", payload);
      setSuccess(data.message);
      setCalendarRevision((value) => value + 1);
      setShowForm(false);
      setConfirmOpen(false);
      await fetchRecords();
    } catch (requestError) {
      const response = requestError.response?.data;
      setFormError(
        response?.existingStatus
          ? `${response.message} Existing status: ${response.existingStatus}. Use the appropriate attendance correction workflow.`
          : response?.message || "Unable to save the attendance record.",
      );
      setConfirmOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const exportRecords = async () => {
    if (records.length === 0) return;
    setExporting(true);
    try {
      const [XLSX, fileSaver] = await Promise.all([import("xlsx"), import("file-saver")]);
      const rows = records.map((record) => ({
        "Employee ID": record.employeeId?.employeeId || "",
        Employee: record.employeeId?.name || record.employeeName,
        Email: record.employeeId?.email || "",
        Date: String(record.attendanceDate).slice(0, 10),
        Status: record.status,
        "Balance Treatment": record.balanceTreatment || "LOP",
        "Leave / LOP Days": record.active === false ? 0 : record.durationDays ?? 1,
        Remarks: record.remarks || "",
        "Created By": record.createdBy?.name || "",
        "Created By Role": record.createdByRole,
        "Created At": formatDateTime(record.createdAt),
        "Last Modified By": record.lastModifiedBy?.name || "",
        "Last Modified At": formatDateTime(record.lastModifiedAt),
      }));
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
      const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      fileSaver.saveAs(
        new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
        `Attendance_Exceptions_${filters.startDate}_to_${filters.endDate}.xlsx`,
      );
    } catch {
      setError("Unable to export attendance records.");
    } finally {
      setExporting(false);
    }
  };

  const cancelRecord = async (event) => {
    event.preventDefault();
    if (!cancelTarget) return;
    if (cancelReason.trim().length < 3) {
      setCancelError("Enter a cancellation reason of at least 3 characters.");
      return;
    }
    try {
      setSaving(true);
      setCancelError("");
      const { data } = await api.patch(`/attendance/uninformed-absence/${cancelTarget._id}/cancel`, {
        reason: cancelReason.trim(),
      });
      setSuccess(data.message);
      setCancelTarget(null);
      setCalendarRevision((value) => value + 1);
      setCancelReason("");
      await fetchRecords();
      window.dispatchEvent(new CustomEvent("leave-balance-updated"));
    } catch (requestError) {
      setCancelError(requestError.response?.data?.message || "Unable to cancel the attendance record.");
    } finally {
      setSaving(false);
    }
  };

  const confirmationName = selectedEmployee?.name || editingRecord?.employeeName || "this employee";

  return (
    <section className="attendance-page">
      <PageHeader
        eyebrow="Attendance"
        title="Attendance"
        description="Review monthly attendance, approved leave, and company holidays."
        icon={CalendarX2}
        actions={canManage ? (
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            <Plus size={16} /> Add Attendance Record
          </button>
        ) : null}
      />

      <div className="attendance-view-switch" aria-label="Attendance view">
        <button className="btn btn-secondary" aria-pressed={view === "calendar"} onClick={() => setView("calendar")}>Monthly calendar</button>
        <button className="btn btn-secondary" aria-pressed={view === "records"} onClick={() => setView("records")}>Recorded exceptions</button>
      </div>
      {view === "calendar" && <AttendanceCalendar revision={calendarRevision} />}

      {success && <div className="success-banner" role="status">{success}</div>}
      {error && <ErrorState title="Attendance could not be loaded" description={error} compact />}

      {view === "records" && <>
      <div className="attendance-filters">
        <label>
          <span>Month</span>
          <input
            type="month"
            value={filters.startDate.slice(0, 7)}
            max={businessDate().slice(0, 7)}
            onChange={(event) => selectFilterMonth(event.target.value)}
          />
        </label>
        <label>
          <span>From</span>
          <input type="date" value={filters.startDate} max={filters.endDate} onChange={(event) => setFilters((current) => ({ ...current, startDate: event.target.value }))} />
        </label>
        <label>
          <span>To</span>
          <input type="date" value={filters.endDate} min={filters.startDate} max={businessDate()} onChange={(event) => setFilters((current) => ({ ...current, endDate: event.target.value }))} />
        </label>
        {canManage && (
          <label>
            <span>Employee</span>
            <select value={filters.employeeId} onChange={(event) => setFilters((current) => ({ ...current, employeeId: event.target.value }))}>
              <option value="">All permitted employees</option>
              {employees.map((employee) => <option key={employee._id} value={employee._id}>{employee.name} ({employee.employeeId || employee.role})</option>)}
            </select>
          </label>
        )}
        <div className="attendance-filter-actions">
          <button type="button" className="btn btn-secondary" onClick={fetchRecords} disabled={loading}>
            <RefreshCw size={15} /> Refresh
          </button>
          {canExport && (
            <button type="button" className="btn btn-secondary" onClick={exportRecords} disabled={exporting || records.length === 0}>
              <Download size={15} /> {exporting ? "Exporting..." : "Export Excel"}
            </button>
          )}
        </div>
      </div>

      {loading ? <LoadingState label="Loading attendance records..." /> : records.length === 0 ? (
        <EmptyState title="No attendance exceptions" description="No matching attendance records were found for this period." />
      ) : (
        <div className="attendance-table-wrap">
          <table className="attendance-table">
            <thead><tr><th>Employee</th><th>Date</th><th>Status</th><th>Remarks</th><th>Audit</th>{canManage && <th>Actions</th>}</tr></thead>
            <tbody>
              {records.map((record) => (
                <tr key={record._id}>
                  <td data-label="Employee"><strong>{record.employeeId?.name || record.employeeName}</strong><small>{record.employeeId?.employeeId || record.employeeId?.email || ""}</small></td>
                  <td data-label="Date">{formatDate(record.attendanceDate)}</td>
                  <td data-label="Status"><span className="attendance-status-badge">{record.status}</span><small>{record.active === false ? "No balance effect" : record.balanceTreatment === "PAID" ? `${record.durationDays} paid leave` : record.balanceTreatment === "NONE" ? "No deduction" : `${record.durationDays} LOP`}</small></td>
                  <td data-label="Remarks">{record.remarks || "-"}{record.cancellationReason && <small>Cancelled: {record.cancellationReason}</small>}</td>
                  <td data-label="Audit"><strong>{record.createdBy?.name || "Unknown"} · {record.createdByRole}</strong><small>Created {formatDateTime(record.createdAt)}</small><small>Last updated by {record.lastModifiedBy?.name || "Unknown"} · {formatDateTime(record.lastModifiedAt)}</small>{record.changeHistory?.length > 0 && <small>{record.changeHistory.length} correction{record.changeHistory.length === 1 ? "" : "s"}</small>}</td>
                  {canManage && <td data-label="Actions"><div className="attendance-row-actions"><button type="button" className="btn btn-secondary btn-compact" onClick={() => openEdit(record)}><Pencil size={14} /> {record.active === false ? "Reactivate" : "Edit"}</button>{record.active !== false && <button type="button" className="btn btn-danger btn-compact" onClick={() => { setCancelTarget(record); setCancelReason(""); setCancelError(""); }}><Trash2 size={14} /> Cancel</button>}</div></td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      </>}
      {showForm && (
        <div className="modal-overlay" role="presentation" onMouseDown={closeForm}>
          <section className="modal-card attendance-modal" role="dialog" aria-modal="true" aria-labelledby="attendance-form-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div><span className="ui-eyebrow">Manual attendance</span><h3 id="attendance-form-title">{editingRecord ? "Correct attendance record" : "Add attendance record"}</h3></div>
              <button type="button" className="modal-close" onClick={closeForm} disabled={saving} aria-label="Close attendance form"><X size={18} /></button>
            </div>
            {formError && <ErrorState title="Attendance not saved" description={formError} compact />}
            <form className="auth-form" onSubmit={requestConfirmation}>
              {!editingRecord && (
                <>
                  <div className="input-group">
                    <label htmlFor="attendance-employee-search">Search employee</label>
                    <div className="attendance-search"><Search size={16} aria-hidden="true" /><input id="attendance-employee-search" type="search" value={employeeSearch} onChange={(event) => setEmployeeSearch(event.target.value)} placeholder="Search name, email, ID, or team" autoComplete="off" /></div>
                  </div>
                  <div className="input-group">
                    <label htmlFor="attendance-employee">Employee</label>
                    <select id="attendance-employee" value={form.employeeId} onChange={(event) => setForm((current) => ({ ...current, employeeId: event.target.value }))} required>
                      <option value="">Select employee</option>
                      {visibleEmployees.map((employee) => <option key={employee._id} value={employee._id}>{employee.name} · {employee.employeeId || employee.email}{employee.teamId?.name ? ` · ${employee.teamId.name}` : ""}</option>)}
                    </select>
                  </div>
                </>
              )}
              {editingRecord && <div className="attendance-employee-summary"><strong>{editingRecord.employeeId?.name || editingRecord.employeeName}</strong><span>{editingRecord.employeeId?.employeeId || editingRecord.employeeId?.email || ""}</span></div>}
              <div className="input-group"><label htmlFor="attendance-date">Date</label><input id="attendance-date" type="date" value={form.date} min={selectedEmployee?.dateOfJoining ? String(selectedEmployee.dateOfJoining).slice(0, 10) : undefined} max={businessDate()} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} required /><small>You can select any previous working date after the employee&apos;s joining date.</small></div>
              <div className="input-group">
                <label htmlFor="attendance-type">Record type</label>
                <select id="attendance-type" value={form.attendanceType} onChange={(event) => setForm((current) => ({ ...current, attendanceType: event.target.value }))} required>
                  {Object.entries(ATTENDANCE_OPTIONS).map(([value, option]) => <option key={value} value={value}>{option.label}</option>)}
                </select>
              </div>
              {form.attendanceType !== "PERMISSION" ? (
                <div className="input-group">
                  <label htmlFor="attendance-balance-treatment">Balance treatment</label>
                  <select id="attendance-balance-treatment" value={form.balanceTreatment} onChange={(event) => setForm((current) => ({ ...current, balanceTreatment: event.target.value }))} required>
                    <option value="LOP">Loss of Pay (LOP)</option>
                    <option value="PAID">Use available paid leave</option>
                  </select>
                  <small>{selectedAttendance.durationDays} day{selectedAttendance.durationDays === 1 ? "" : "s"} will be applied using the selected treatment.</small>
                </div>
              ) : <div className="input-group"><small>Permission is shown in attendance and the leave calendar with no leave deduction.</small></div>}
              <div className="input-group"><label htmlFor="attendance-remarks">Remarks <span>(optional)</span></label><textarea id="attendance-remarks" rows="4" maxLength="500" value={form.remarks} onChange={(event) => setForm((current) => ({ ...current, remarks: event.target.value }))} placeholder="Employee did not inform the manager before the start of the shift." /><small>{form.remarks.length}/500</small></div>
              <div className="form-actions"><button type="button" className="btn btn-secondary" onClick={closeForm}>Cancel</button><button type="submit" className="btn btn-primary">{editingRecord ? "Review Correction" : "Review Record"}</button></div>
            </form>
          </section>
        </div>
      )}

      {cancelTarget && (
        <div className="modal-overlay" role="presentation" onMouseDown={() => !saving && setCancelTarget(null)}>
          <form className="modal-card attendance-modal" role="dialog" aria-modal="true" aria-labelledby="attendance-cancel-title" onSubmit={cancelRecord} onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div><span className="ui-eyebrow">Audited correction</span><h3 id="attendance-cancel-title">Cancel attendance record</h3></div>
              <button type="button" className="modal-close" onClick={() => setCancelTarget(null)} disabled={saving} aria-label="Close cancellation form"><X size={18} /></button>
            </div>
            {cancelError && <ErrorState title="Record not cancelled" description={cancelError} compact />}
            <div className="input-group"><label htmlFor="attendance-cancel-reason">Cancellation reason</label><textarea id="attendance-cancel-reason" rows="4" minLength="3" maxLength="500" value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} placeholder="Explain why this attendance record must be cancelled" required autoFocus /><small>Cancelling reverses its linked paid-leave or LOP entry and preserves the audit history.</small></div>
            <div className="form-actions"><button type="button" className="btn btn-secondary" onClick={() => setCancelTarget(null)} disabled={saving}>Keep Record</button><button type="submit" className="btn btn-danger" disabled={saving || cancelReason.trim().length < 3}>{saving ? "Cancelling..." : "Cancel Record"}</button></div>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title={editingRecord ? "Confirm attendance correction" : "Confirm attendance record"}
        description={`${editingRecord ? "Update" : "Mark"} ${confirmationName} as “${STATUS}” for ${formatDate(`${form.date}T00:00:00.000Z`)}? ${form.attendanceType === "PERMISSION" ? "No leave will be deducted." : `${selectedAttendance.durationDays} day${selectedAttendance.durationDays === 1 ? "" : "s"} will be recorded as ${form.balanceTreatment === "PAID" ? "paid leave" : "LOP"}.`}`}
        confirmLabel={editingRecord ? "Update Record" : "Save Record"}
        tone={selectedAttendance.durationDays > 0 ? "danger" : "default"}
        busy={saving}
        onCancel={() => !saving && setConfirmOpen(false)}
        onConfirm={saveRecord}
      />
    </section>
  );
};

export default AttendanceManagement;
