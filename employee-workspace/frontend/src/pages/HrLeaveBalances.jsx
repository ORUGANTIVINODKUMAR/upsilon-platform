import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarCheck2,
  Filter,
  PencilLine,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import api from "../api/api";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/StatePanel";

const roles = ["All", "Employee", "TeamLeader", "Manager", "HR"];
const formatNumber = (value) => Number(value || 0).toFixed(1).replace(/\.0$/, "");
const formatRole = (value) => (value === "TeamLeader" ? "Team Leader" : value);

const HrLeaveBalances = () => {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("All");
  const [selected, setSelected] = useState(null);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [modalError, setModalError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadBalances = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/leave-balance/manage");
      setRows(data.balances || []);
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load leave balances");
    } finally {
      setLoading(false);
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
        user.employeeId?.toLowerCase().includes(term) ||
        user.subcategoryId?.name?.toLowerCase().includes(term) ||
        user.teamId?.name?.toLowerCase().includes(term);
      return matchesRole && matchesSearch;
    });
  }, [rows, search, role]);

  const totals = useMemo(
    () =>
      rows.reduce(
        (summary, row) => ({
          available: summary.available + Number(row.balance.availablePaidLeave || 0),
          used: summary.used + Number(row.balance.paidLeaveUsed || 0),
          excess: summary.excess + Number(row.balance.excessLeaveDays || 0),
        }),
        { available: 0, used: 0, excess: 0 },
      ),
    [rows],
  );

  const openAdjustment = (row) => {
    setSelected(row);
    setAmount("");
    setReason("");
    setMessage("");
    setError("");
    setModalError("");
  };

  const closeAdjustment = () => {
    if (saving) return;
    setSelected(null);
    setAmount("");
    setReason("");
    setModalError("");
  };

  const submitAdjustment = async (event) => {
    event.preventDefault();
    if (!selected) return;

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount === 0) {
      setModalError("Enter a non-zero adjustment. Use a positive value to add leave or a negative value to reduce it.");
      return;
    }

    try {
      setSaving(true);
      setModalError("");
      await api.post(`/leave-balance/manage/${selected.user._id}/adjustments`, {
        amount: numericAmount,
        reason,
      });
      setMessage(`Balance updated successfully for ${selected.user.name}.`);
      setSelected(null);
      setAmount("");
      setReason("");
      await loadBalances();
      window.dispatchEvent(new CustomEvent("leave-balance-updated"));
    } catch (requestError) {
      setModalError(requestError.response?.data?.message || "Unable to record adjustment");
    } finally {
      setSaving(false);
    }
  };

  const summaryCards = [
    { label: "Active Users", value: rows.length, caption: "balance accounts", icon: Users, tone: "green" },
    { label: "Available Leave", value: formatNumber(totals.available), caption: "paid days available", icon: WalletCards, tone: "blue" },
    { label: "Paid Leave Used", value: formatNumber(totals.used), caption: "approved paid days", icon: CalendarCheck2, tone: "amber" },
    { label: "Excess / LOP", value: formatNumber(totals.excess), caption: "days requiring review", icon: AlertTriangle, tone: "red" },
  ];

  return (
    <div className="balance-management-page">
      <div className="balance-management-header">
        <div className="balance-management-heading">
          <span className="balance-management-icon"><ShieldCheck size={22} /></span>
          <div>
            <p className="balance-eyebrow">Workforce leave controls</p>
            <h2>Leave Balance Management</h2>
            <p>Review allocations, carry-forward, paid usage and excess/LOP across the company.</p>
          </div>
        </div>
        <button type="button" className="balance-refresh-button" onClick={loadBalances} disabled={loading}>
          <RefreshCw size={17} className={loading ? "is-spinning" : ""} />
          Refresh
        </button>
      </div>

      {error && (
        <ErrorState
          title="Unable to load leave balances"
          description={error}
          action={<button type="button" className="btn" onClick={loadBalances}>Try again</button>}
          compact
        />
      )}
      {message && <div className="feedback-success balance-feedback" role="status" aria-live="polite">{message}</div>}

      <div className="balance-summary-grid">
        {summaryCards.map(({ label, value, caption, icon: Icon, tone }) => (
          <div className={`balance-summary-tile balance-summary-${tone}`} key={label}>
            <div className="balance-summary-icon"><Icon size={20} /></div>
            <div>
              <span>{label}</span>
              <strong>{value}</strong>
              <small>{caption}</small>
            </div>
          </div>
        ))}
      </div>

      <div className="balance-toolbar">
        <label className="balance-search-field">
          <Search size={18} />
          <input
            aria-label="Search leave balances"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search employee, ID, department or team"
          />
          {search && (
            <button type="button" onClick={() => setSearch("")} aria-label="Clear search"><X size={16} /></button>
          )}
        </label>
        <label className="balance-role-filter">
          <Filter size={17} />
          <select aria-label="Filter leave balances by role" value={role} onChange={(event) => setRole(event.target.value)}>
            {roles.map((item) => <option key={item} value={item}>{item === "All" ? "All roles" : formatRole(item)}</option>)}
          </select>
        </label>
        <span className="balance-result-count">{filteredRows.length} of {rows.length} users</span>
      </div>

      <div className="balance-table-shell">
        <div className="table-wrapper">
          <table className="custom-table balance-management-table">
            <caption className="sr-only">Leave balances for applicable employees</caption>
            <thead>
              <tr>
                <th scope="col">Employee</th>
                <th scope="col">Role</th>
                <th scope="col">Department / Team</th>
                <th scope="col">Monthly</th>
                <th scope="col">Carry Forward</th>
                <th scope="col">Available</th>
                <th scope="col">Paid Used</th>
                <th scope="col">Excess / LOP</th>
                <th scope="col">Last Updated</th>
                <th scope="col"><span className="sr-only">Action</span></th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => {
                const hasExcess = Number(row.balance.excessLeaveDays) > 0;
                return (
                  <tr key={row.user._id}>
                    <td>
                      <div className="balance-employee-cell">
                        <span className="balance-avatar">{row.user.name?.charAt(0)?.toUpperCase() || "U"}</span>
                        <div><strong>{row.user.name}</strong><small>{row.user.employeeId || "No employee ID"}</small></div>
                      </div>
                    </td>
                    <td><span className={`balance-role-badge role-${row.user.role.toLowerCase()}`}>{formatRole(row.user.role)}</span></td>
                    <td>
                      <div className="balance-org-cell"><strong>{row.user.subcategoryId?.name || "Not assigned"}</strong><small>{row.user.teamId?.name || "No team"}</small></div>
                    </td>
                    <td><span className="balance-number-muted">{formatNumber(row.balance.monthlyAllocation)}</span></td>
                    <td><span className="balance-number-muted">{formatNumber(row.balance.carryForward)}</span></td>
                    <td><span className="balance-number-pill balance-number-available">{formatNumber(row.balance.availablePaidLeave)}</span></td>
                    <td><span className="balance-number-muted">{formatNumber(row.balance.paidLeaveUsed)}</span></td>
                    <td><span className={`balance-number-pill ${hasExcess ? "balance-number-excess" : "balance-number-clear"}`}>{formatNumber(row.balance.excessLeaveDays)}</span></td>
                    <td><span className="balance-updated-time">{row.balance.lastUpdated ? new Date(row.balance.lastUpdated).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "Not updated"}</span></td>
                    <td>
                      <button className="balance-adjust-button" onClick={() => openAdjustment(row)}>
                        <PencilLine size={15} /> Adjust
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!loading && filteredRows.length === 0 && (
                <tr><td colSpan="10"><EmptyState title="No users found" description="Try changing the search term or role filter." compact /></td></tr>
              )}
              {loading && rows.length === 0 && (
                <tr><td colSpan="10"><LoadingState label="Loading leave balances..." compact /></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="modal-overlay">
          <form
            className="modal-box balance-adjust-modal"
            onSubmit={submitAdjustment}
            role="dialog"
            aria-modal="true"
            aria-labelledby="balance-adjustment-title"
            aria-describedby="balance-adjustment-description"
          >
            <div className="balance-modal-header">
              <div>
                <span>Manual adjustment</span>
                <h2 id="balance-adjustment-title">{selected.user.name}</h2>
                <p id="balance-adjustment-description">{selected.user.employeeId || "No employee ID"} | {formatRole(selected.user.role)}</p>
              </div>
              <button type="button" onClick={closeAdjustment} disabled={saving} aria-label="Close modal"><X size={20} /></button>
            </div>

            <div className="balance-current-strip">
              <span>Current available balance</span>
              <strong>{formatNumber(selected.balance.availablePaidLeave)} days</strong>
            </div>

            {modalError && (
              <div className="balance-adjustment-error">
                <ErrorState title="Adjustment not saved" description={modalError} compact />
              </div>
            )}

            <div className="input-group">
              <label htmlFor="adjustment-days">Adjustment days</label>
              <input id="adjustment-days" type="number" step="0.5" min="-365" max="365" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Example: 1 or -1" required autoFocus />
              <small>Positive values add leave; negative values reduce leave.</small>
              <div className="balance-quick-adjustments">
                {[1, 2, -1].map((value) => (
                  <button type="button" key={value} onClick={() => setAmount(String(value))}>{value > 0 ? "+" : ""}{value} day{Math.abs(value) === 1 ? "" : "s"}</button>
                ))}
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="adjustment-reason">Reason for adjustment</label>
              <textarea id="adjustment-reason" value={reason} onChange={(event) => setReason(event.target.value)} minLength="3" maxLength="500" rows="4" placeholder="Explain why this balance is being adjusted" required />
              <small>This reason will be stored permanently in the audit history.</small>
            </div>

            <div className="balance-modal-actions">
              <button type="button" className="btn" onClick={closeAdjustment} disabled={saving}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving || !amount || Number(amount) === 0 || !reason.trim()}>{saving ? "Saving adjustment..." : "Save adjustment"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default HrLeaveBalances;
