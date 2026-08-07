import { useEffect, useState } from "react";
import { Wallet } from "lucide-react";
import api from "../api/api";

const formatNumber = (value) => Number(value || 0).toFixed(1).replace(/\.0$/, "");

const entryLabel = (entry) => {
  if (entry.entryType === "MONTHLY_CREDIT") return "+ Monthly leave credit";
  if (entry.entryType === "HR_ADJUSTMENT") return "HR adjustment";
  if (entry.entryType === "APPROVED_LEAVE") return "Approved leave";
  return entry.entryType;
};

const PersonalLeaveBalance = ({ compact = false }) => {
  const [balance, setBalance] = useState(null);
  const [error, setError] = useState("");

  const loadBalance = async () => {
    try {
      const { data } = await api.get("/leave-balance/me");
      setBalance(data.balance);
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load leave balance");
    }
  };

  useEffect(() => {
    const initialLoad = window.setTimeout(loadBalance, 0);
    window.addEventListener("leave-balance-updated", loadBalance);
    return () => {
      window.clearTimeout(initialLoad);
      window.removeEventListener("leave-balance-updated", loadBalance);
    };
  }, []);

  if (error) {
    return <div className="feedback-error">{error}</div>;
  }

  if (!balance) {
    return <div className="leave-balance-card">Loading leave balance...</div>;
  }

  const items = [
    ["Available Paid Leave", balance.availablePaidLeave],
    ["Monthly Allocation", balance.monthlyAllocation],
    ["Carry Forward", balance.carryForward],
    ["Paid Leave Used", balance.paidLeaveUsed],
    ["Excess / LOP", balance.excessLeaveDays],
  ];

  return (
    <div className="leave-balance-card" style={{ height: "auto" }}>
      <div className="balance-title">
        <Wallet size={20} />
        My Leave Balance
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))",
          gap: "12px",
          marginTop: "16px",
        }}
      >
        {items.map(([label, value]) => (
          <div
            key={label}
            style={{
              padding: "14px",
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              background: label === "Excess / LOP" && Number(value) > 0 ? "#fff1f2" : "#f8fafc",
            }}
          >
            <span style={{ display: "block", color: "#64748b", fontSize: "12px" }}>{label}</span>
            <strong style={{ display: "block", marginTop: "5px", fontSize: "22px" }}>
              {formatNumber(value)}
            </strong>
          </div>
        ))}
      </div>

      {!compact && (
        <div style={{ marginTop: "22px" }}>
          <h3 style={{ marginBottom: "12px" }}>Balance History</h3>
          <div className="table-wrapper modern-table-wrapper">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Entry</th>
                  <th>Reason</th>
                  <th>Change</th>
                </tr>
              </thead>
              <tbody>
                {(balance.history || []).map((entry) => (
                  <tr key={entry._id}>
                    <td>{new Date(entry.effectiveDate).toLocaleDateString()}</td>
                    <td>{entryLabel(entry)}</td>
                    <td>{entry.reason}</td>
                    <td>
                      <strong style={{ color: entry.amount >= 0 ? "#15803d" : "#b91c1c" }}>
                        {entry.amount >= 0 ? "+" : ""}{formatNumber(entry.amount)}
                      </strong>
                    </td>
                  </tr>
                ))}
                {(balance.history || []).length === 0 && (
                  <tr><td colSpan="4" style={{ textAlign: "center" }}>No balance history found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonalLeaveBalance;
