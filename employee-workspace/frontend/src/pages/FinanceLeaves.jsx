import { useEffect, useState } from "react";
import {
  CalendarCheck,
  BadgeCheck,
  Users,
} from "lucide-react";

import api from "../api/api";
import StatusBadge from "../components/ui/StatusBadge";
import MetricCard from "../components/ui/MetricCard";
import SearchField from "../components/ui/SearchField";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "../components/ui/StatePanel";

const loadFinanceLeaves = async () => {
  const { data } = await api.get("/leave/finance");

  return data.leaveRequests || [];
};

const FinanceLeaves = () => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const RECORDS_PER_PAGE = 10;

  const safeLeaves = leaveRequests || [];

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      setError("");

      setLeaveRequests(await loadFinanceLeaves());
    } catch (error) {
      console.error("FETCH FINANCE LEAVES ERROR:", error.response?.data);
      setError(
        error.response?.data?.message ||
        "Unable to load finance leave records."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isCurrent = true;

    loadFinanceLeaves()
      .then((financeLeaves) => {
        if (isCurrent) {
          setLeaveRequests(financeLeaves);
        }
      })
      .catch((error) => {
        console.error("FETCH FINANCE LEAVES ERROR:", error.response?.data);

        if (isCurrent) {
          setError(
            error.response?.data?.message ||
            "Unable to load finance leave records."
          );
        }
      })
      .finally(() => {
        if (isCurrent) {
          setLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  const filteredLeaves = safeLeaves.filter((leave) => {
    const search = searchTerm.toLowerCase();

    return (
      leave.employeeId?.name?.toLowerCase().includes(search) ||
      leave.employeeId?.email?.toLowerCase().includes(search) ||
      leave.leaveType?.toLowerCase().includes(search) ||
      leave.finalStatus?.toLowerCase().includes(search)
    );
  });

  const totalPages =
    Math.ceil(filteredLeaves.length / RECORDS_PER_PAGE) || 1;

  const startIndex = (currentPage - 1) * RECORDS_PER_PAGE;

  const paginatedLeaves = filteredLeaves.slice(
    startIndex,
    startIndex + RECORDS_PER_PAGE
  );

  const approvedCount = safeLeaves.filter(
    (item) =>
      ["Approved by Manager", "Approved by HR"].includes(
        item.finalStatus
      )
  ).length;

  const totalDays = safeLeaves.reduce(
    (sum, item) => sum + Number(item.workingDays || 0),
    0
  );

  return (
    <div aria-busy={loading}>
      <div className="section-header">
        <div>
          <h2 className="card-title">Finance Leave Records</h2>

          <p className="section-subtitle">
            Approved employee leave records for finance tracking.
          </p>
        </div>
      </div>

      {error && !loading && (
        <ErrorState
          title="Unable to load finance leave records"
          description={error}
          action={(
            <button
              type="button"
              className="btn btn-secondary"
              onClick={fetchLeaves}
            >
              Try again
            </button>
          )}
        />
      )}

      {loading && (
        <LoadingState label="Loading finance leave records…" />
      )}

      {!loading && !error && (
        <>
      <div className="modern-stats-grid">
        <MetricCard icon={Users} label="Total Records" value={safeLeaves.length} detail="Employees" />
        <MetricCard icon={BadgeCheck} label="Approved Leaves" value={approvedCount} detail="Verified" tone="success" />
        <MetricCard icon={CalendarCheck} label="Total Leave Days" value={totalDays} detail="Days utilized" tone="brand" />
      </div>

      <div className="ui-filter-search-row">
        <SearchField
          id="finance-leave-search"
          label="Search finance leave records"
          placeholder="Search by employee, email, leave type or status..."
          value={searchTerm}
          onChange={(event) => {
            setSearchTerm(event.target.value);
            setCurrentPage(1);
          }}
          onClear={() => {
            setSearchTerm("");
            setCurrentPage(1);
          }}
        />
      </div>

      <div className="table-wrapper modern-table-wrapper">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Leave Type</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Total Days</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {paginatedLeaves.map((leave) => (
              <tr key={leave._id}>
                <td>
                  <div className="user-cell">
                    <div className="avatar-circle">
                      {leave.employeeId?.name?.charAt(0)?.toUpperCase()}
                    </div>

                    <div>
                      <strong>{leave.employeeId?.name}</strong>

                      <p
                        style={{
                          fontSize: "13px",
                          color: "var(--muted)",
                        }}
                      >
                        {leave.employeeId?.email}
                      </p>
                    </div>
                  </div>
                </td>

                <td>{leave.leaveType}</td>

                <td>{new Date(leave.startDate).toLocaleDateString()}</td>

                <td>{new Date(leave.endDate).toLocaleDateString()}</td>

                <td>{leave.workingDays}</td>

                <td>
                  <StatusBadge status={leave.finalStatus} />
                </td>
              </tr>
            ))}

            {filteredLeaves.length === 0 && (
              <tr>
                <td
                  colSpan="6"
                  style={{
                    textAlign: "center",
                    padding: "24px",
                  }}
                >
                  <EmptyState
                    compact
                    title="No approved leave records found"
                    description={
                      searchTerm
                        ? "Try a different employee, email, leave type, or status."
                        : "Final-approved leave records will appear here."
                    }
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {filteredLeaves.length > RECORDS_PER_PAGE && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "10px",
            marginTop: "24px",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            className="btn btn-primary"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => prev - 1)}
          >
            Previous
          </button>

          {Array.from({ length: totalPages }, (_, index) => (
            <button
              key={index + 1}
              type="button"
              aria-current={currentPage === index + 1 ? "page" : undefined}
              className={currentPage === index + 1 ? "btn btn-primary" : "btn"}
              onClick={() => setCurrentPage(index + 1)}
            >
              {index + 1}
            </button>
          ))}

          <button
            type="button"
            className="btn btn-primary"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((prev) => prev + 1)}
          >
            Next
          </button>
        </div>
      )}
        </>
      )}
    </div>
  );
};

export default FinanceLeaves;
