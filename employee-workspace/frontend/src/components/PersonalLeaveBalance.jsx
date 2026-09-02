import { useCallback, useEffect, useState } from "react";
import {
  CalendarCheck,
  CalendarPlus,
  History,
  RefreshCw,
  TriangleAlert,
  Wallet,
} from "lucide-react";
import api from "../api/api";
import PageHeader from "./ui/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "./ui/StatePanel";
import StatusBadge from "./ui/StatusBadge";

const formatNumber = (value) => Number(value || 0).toFixed(1).replace(/\.0$/, "");

const entryLabel = (entry) => {
  if (entry.entryType === "MONTHLY_CREDIT") return "+ Monthly leave credit";
  if (entry.entryType === "HR_ADJUSTMENT") return "HR adjustment";
  if (entry.entryType === "MONTHLY_ALLOCATION_ADJUSTMENT") return "Monthly allocation adjustment";
  if (entry.entryType === "CARRY_FORWARD_ADJUSTMENT") return "Carry-forward adjustment";
  if (entry.entryType === "PAID_USED_ADJUSTMENT") return "Paid leave used adjustment";
  if (entry.entryType === "EXCESS_ADJUSTMENT") return "Excess / LOP adjustment";
  if (entry.entryType === "APPROVED_LEAVE") return "Approved leave";
  if (entry.entryType === "UNINFORMED_ABSENCE") return "Uninformed absence (LOP)";
  return entry.entryType;
};

const PersonalLeaveBalance = ({ compact = false }) => {
  const [balance, setBalance] = useState(null);
  const [error, setError] = useState("");

  const loadBalance = useCallback(async () => {
    try {
      setError("");
      const { data } = await api.get("/leave-balance/me");
      setBalance(data.balance);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load leave balance");
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(loadBalance, 0);
    window.addEventListener("leave-balance-updated", loadBalance);
    return () => {
      window.clearTimeout(initialLoad);
      window.removeEventListener("leave-balance-updated", loadBalance);
    };
  }, [loadBalance]);

  if (error) {
    return (
      <div className="leave-balance-card">
        <ErrorState
          compact={compact}
          title="Unable to load leave balance"
          description={error}
          action={(
            <button type="button" className="btn btn-secondary" onClick={loadBalance}>
              <RefreshCw size={16} aria-hidden="true" />
              Try again
            </button>
          )}
        />
      </div>
    );
  }

  if (!balance) {
    return (
      <div className="leave-balance-card">
        <LoadingState label="Loading leave balance" compact={compact} />
      </div>
    );
  }

  const items = [
    {
      label: "Available Paid Leave",
      value: balance.availablePaidLeave,
      description: "Ready to use",
      icon: Wallet,
    },
    {
      label: "Monthly Allocation",
      value: balance.monthlyAllocation,
      description: "Credited this period",
      icon: CalendarPlus,
    },
    {
      label: "Carry Forward",
      value: balance.carryForward,
      description: "Brought forward",
      icon: History,
    },
    {
      label: "Paid Leave Used",
      value: balance.paidLeaveUsed,
      description: "Approved leave taken",
      icon: CalendarCheck,
    },
    {
      label: "Excess / LOP",
      value: balance.excessLeaveDays,
      description: "Unpaid leave recorded",
      icon: TriangleAlert,
    },
  ];

  return (
    <section className="leave-balance-card" aria-labelledby="personal-leave-balance-title">
      <PageHeader
        eyebrow="Leave"
        title={<span id="personal-leave-balance-title">My Leave Balance</span>}
        description={compact ? undefined : "Review your paid leave allocation, usage and balance history."}
        icon={Wallet}
      />

      <div className="modern-stats-grid" aria-label="Personal leave balance summary">
        {items.map(({ label, value, description, icon: Icon }) => (
          <article className="mini-stat-card" key={label}>
            <Icon size={18} aria-hidden="true" />
            <span>{label}</span>
            <h3>{formatNumber(value)}</h3>
            <p>{description}</p>
          </article>
        ))}
      </div>

      {!compact && (
        <section aria-labelledby="leave-balance-history-title">
          <div className="section-header">
            <div>
              <h3 id="leave-balance-history-title">Balance History</h3>
              <p className="section-subtitle">
                A chronological record of credits, adjustments and approved leave.
              </p>
            </div>
          </div>

          <div className="table-wrapper modern-table-wrapper">
            <table className="custom-table">
              <caption className="sr-only">Personal leave balance transaction history</caption>
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
                    <td>
                      <time dateTime={entry.effectiveDate}>
                        {new Date(entry.effectiveDate).toLocaleDateString()}
                      </time>
                    </td>
                    <td>{entryLabel(entry)}</td>
                    <td>{entry.reason || "Not provided"}</td>
                    <td>
                      <StatusBadge
                        status={entry.entryType === "UNINFORMED_ABSENCE" || entry.amount < 0 ? "rejected" : "paid"}
                        label={entry.entryType === "UNINFORMED_ABSENCE"
                          ? `${formatNumber(entry.leaveDays || 1)} day LOP`
                          : `${entry.amount >= 0 ? "+" : ""}${formatNumber(entry.amount)}`}
                      />
                    </td>
                  </tr>
                ))}
                {(balance.history || []).length === 0 && (
                  <tr>
                    <td colSpan="4">
                      <EmptyState
                        compact
                        title="No balance history yet"
                        description="Credits and approved leave will appear here."
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </section>
  );
};

export default PersonalLeaveBalance;
