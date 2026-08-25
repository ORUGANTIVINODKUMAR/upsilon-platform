import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarX2, Download, Pencil, Plus, RefreshCw, Search, X } from "lucide-react";
import api from "../api/api";
import { useAuth } from "../context/useAuth";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import PageHeader from "../components/ui/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/StatePanel";
import "./AttendanceManagement.css";

const STATUS = "Absent \u2013 Uninformed";

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

const emptyForm = () => ({ employeeId: "", date: businessDate(), remarks: "" });

const AttendanceManagement = () => {
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
      const payload = { employeeId: form.employeeId, date: form.date, remarks: form.remarks };
      const { data } = editingRecord
        ? await api.patch(`/attendance/uninformed-absence/${editingRecord._id}`, payload)
        : await api.post("/attendance/uninformed-absence", payload);
      setSuccess(data.message);
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
        `Uninformed_Absence_${filters.startDate}_to_${filters.endDate}.xlsx`,
      );
    } catch {
      setError("Unable to export attendance records.");
    } finally {
      setExporting(false);
    }
  };

  const confirmationName = selectedEmployee?.name || editingRecord?.employeeName || "this employee";

  return (
    <section className="attendance-page">
      <PageHeader
        eyebrow="Attendance"
        title="Uninformed Absence"
        description={canManage ? "Record and review employees who were absent without informing the company." : "Review your attendance history."}
        icon={CalendarX2}
        actions={canManage ? (
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            <Plus size={16} /> Add Uninformed Absence
          </button>
        ) : null}
      />

      {success && <div className="success-banner" role="status">{success}</div>}
      {error && <ErrorState title="Attendance could not be loaded" description={error} compact />}

      <div className="attendance-filters">
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
        <EmptyState title="No uninformed absences" description="No matching attendance records were found for this period." />
      ) : (
        <div className="attendance-table-wrap">
          <table className="attendance-table">
            <thead><tr><th>Employee</th><th>Date</th><th>Status</th><th>Remarks</th><th>Audit</th>{canManage && <th>Actions</th>}</tr></thead>
            <tbody>
              {records.map((record) => (
                <tr key={record._id}>
                  <td data-label="Employee"><strong>{record.employeeId?.name || record.employeeName}</strong><small>{record.employeeId?.employeeId || record.employeeId?.email || ""}</small></td>
                  <td data-label="Date">{formatDate(record.attendanceDate)}</td>
                  <td data-label="Status"><span className="attendance-status-badge">{record.status}</span></td>
                  <td data-label="Remarks">{record.remarks || "-"}</td>
                  <td data-label="Audit"><strong>{record.createdBy?.name || "Unknown"} · {record.createdByRole}</strong><small>Created {formatDateTime(record.createdAt)}</small><small>Last updated by {record.lastModifiedBy?.name || "Unknown"} · {formatDateTime(record.lastModifiedAt)}</small>{record.changeHistory?.length > 0 && <small>{record.changeHistory.length} correction{record.changeHistory.length === 1 ? "" : "s"}</small>}</td>
                  {canManage && <td data-label="Actions"><button type="button" className="btn btn-secondary btn-compact" onClick={() => openEdit(record)}><Pencil size={14} /> Edit</button></td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" role="presentation" onMouseDown={closeForm}>
          <section className="modal-card attendance-modal" role="dialog" aria-modal="true" aria-labelledby="attendance-form-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div><span className="ui-eyebrow">Manual attendance</span><h3 id="attendance-form-title">{editingRecord ? "Correct uninformed absence" : "Add uninformed absence"}</h3></div>
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
              <div className="input-group"><label htmlFor="attendance-date">Date</label><input id="attendance-date" type="date" value={form.date} max={businessDate()} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} required /></div>
              <div className="input-group"><label htmlFor="attendance-status">Attendance status</label><input id="attendance-status" value={STATUS} readOnly aria-readonly="true" /></div>
              <div className="input-group"><label htmlFor="attendance-remarks">Remarks <span>(optional)</span></label><textarea id="attendance-remarks" rows="4" maxLength="500" value={form.remarks} onChange={(event) => setForm((current) => ({ ...current, remarks: event.target.value }))} placeholder="Employee did not inform the manager before the start of the shift." /><small>{form.remarks.length}/500</small></div>
              <div className="form-actions"><button type="button" className="btn btn-secondary" onClick={closeForm}>Cancel</button><button type="submit" className="btn btn-primary">{editingRecord ? "Review Correction" : "Mark as Absent"}</button></div>
            </form>
          </section>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title={editingRecord ? "Confirm attendance correction" : "Confirm uninformed absence"}
        description={`${editingRecord ? "Update" : "Mark"} ${confirmationName} as “${STATUS}” for ${formatDate(`${form.date}T00:00:00.000Z`)}?`}
        confirmLabel={editingRecord ? "Update Record" : "Mark as Absent"}
        tone="danger"
        busy={saving}
        onCancel={() => !saving && setConfirmOpen(false)}
        onConfirm={saveRecord}
      />
    </section>
  );
};

export default AttendanceManagement;
