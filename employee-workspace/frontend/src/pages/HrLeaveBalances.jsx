import { useEffect, useMemo, useState } from "react";
import api from "../api/api";

const roles = ["All", "Employee", "TeamLeader", "Manager", "HR"];
const formatNumber = (value) => Number(value || 0).toFixed(1).replace(/\.0$/, "");

const HrLeaveBalances = () => {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("All");
  const [selected, setSelected] = useState(null);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const loadBalances = async () => {
    try {
      const { data } = await api.get("/leave-balance/manage");
      setRows(data.balances || []);
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load leave balances");
    }
  };

  useEffect(() => {
    const initialLoad = window.setTimeout(loadBalances, 0);
    return () => window.clearTimeout(initialLoad);
  }, []);

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter(({ user }) => {
      const matchesRole = role === "All" || user.role === role;
      const matchesSearch =
        !term ||
        user.name?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term) ||
        user.employeeId?.toLowerCase().includes(term);
      return matchesRole && matchesSearch;
    });
  }, [rows, search, role]);

  const submitAdjustment = async (event) => {
    event.preventDefault();
    if (!selected) return;
    try {
      setSaving(true);
      setError("");
      await api.post(`/leave-balance/manage/${selected.user._id}/adjustments`, {
        amount: Number(amount),
        reason,
      });
      setMessage("Leave adjustment recorded successfully.");
      setSelected(null);
      setAmount("");
      setReason("");
      await loadBalances();
      window.dispatchEvent(new CustomEvent("leave-balance-updated"));
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to record adjustment");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="section-header">
        <div>
          <h2 className="card-title">Leave Balance Management</h2>
          <p className="section-subtitle">Review paid leave, carry-forward and excess/LOP for all applicable users.</p>
        </div>
      </div>

      {error && <div className="feedback-error">{error}</div>}
      {message && <div className="feedback-success">{message}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px", marginBottom: "18px" }}>
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search employee name, ID or email" />
        <select value={role} onChange={(event) => setRole(event.target.value)}>
          {roles.map((item) => <option key={item} value={item}>{item === "TeamLeader" ? "Team Leader" : item}</option>)}
        </select>
      </div>

      <div className="table-wrapper modern-table-wrapper">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Role</th>
              <th>Department / Team</th>
              <th>Monthly</th>
              <th>Carry Forward</th>
              <th>Available</th>
              <th>Paid Used</th>
              <th>Excess / LOP</th>
              <th>Last Updated</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => (
              <tr key={row.user._id}>
                <td><strong>{row.user.name}</strong><div>{row.user.employeeId || "No ID"}</div></td>
                <td>{row.user.role === "TeamLeader" ? "Team Leader" : row.user.role}</td>
                <td>{row.user.subcategoryId?.name || "N/A"} / {row.user.teamId?.name || "N/A"}</td>
                <td>{formatNumber(row.balance.monthlyAllocation)}</td>
                <td>{formatNumber(row.balance.carryForward)}</td>
                <td><strong>{formatNumber(row.balance.availablePaidLeave)}</strong></td>
                <td>{formatNumber(row.balance.paidLeaveUsed)}</td>
                <td style={{ color: row.balance.excessLeaveDays > 0 ? "#b91c1c" : undefined }}>{formatNumber(row.balance.excessLeaveDays)}</td>
                <td>{row.balance.lastUpdated ? new Date(row.balance.lastUpdated).toLocaleString() : "N/A"}</td>
                <td><button className="btn btn-primary" onClick={() => { setSelected(row); setMessage(""); }}>Adjust</button></td>
              </tr>
            ))}
            {filteredRows.length === 0 && <tr><td colSpan="10" style={{ textAlign: "center" }}>No users found.</td></tr>}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="modal-overlay">
          <form className="modal-box" onSubmit={submitAdjustment}>
            <h2>Adjust {selected.user.name}&apos;s Leave</h2>
            <p>Use a positive number to add leave and a negative number to subtract it. The entry is permanently audited.</p>
            <div className="input-group">
              <label>Adjustment Days</label>
              <input type="number" step="0.5" min="-365" max="365" value={amount} onChange={(event) => setAmount(event.target.value)} required />
            </div>
            <div className="input-group">
              <label>Reason</label>
              <textarea value={reason} onChange={(event) => setReason(event.target.value)} minLength="3" maxLength="500" required />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "18px" }}>
              <button type="button" className="btn" onClick={() => setSelected(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving..." : "Save Adjustment"}</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default HrLeaveBalances;
