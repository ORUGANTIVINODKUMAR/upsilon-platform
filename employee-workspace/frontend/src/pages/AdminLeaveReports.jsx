import { useCallback, useEffect, useState } from "react";
import { ClipboardList, FileSpreadsheet, RefreshCw } from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import api from "../api/api";
import PageHeader from "../components/ui/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/StatePanel";
import StatusBadge from "../components/ui/StatusBadge";
import UserAvatar from "../components/ui/UserAvatar";

const REPORTS_PER_PAGE = 10;

const formatDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not available" : date.toLocaleDateString();
};

const getLocalMonthKey = (value) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

const AdminLeaveReports = () => {
  const [requests, setRequests] = useState([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const { data } = await api.get("/admin/leave-reports");
      setRequests(Array.isArray(data.leaveRequests) ? data.leaveRequests : []);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Unable to fetch leave reports"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(fetchReports, 0);
    return () => window.clearTimeout(initialLoad);
  }, [fetchReports]);

  const employees = [
    ...new Map(
      requests
        .filter((item) => item.employeeId?._id)
        .map((item) => [item.employeeId._id, item.employeeId])
    ).values(),
  ];

  const filteredRequests = requests.filter((item) => {
    const matchesFilter =
      activeFilter === "All" || item.finalStatus === activeFilter;
    const search = searchTerm.trim().toLowerCase();
    const matchesSearch = [
      item.employeeId?.name,
      item.employeeId?.email,
      item.subcategoryId?.name,
    ].some((value) => String(value || "").toLowerCase().includes(search));
    const matchesEmployee =
      selectedEmployee === "All" || item.employeeId?._id === selectedEmployee;
    const matchesMonth =
      !selectedMonth || getLocalMonthKey(item.startDate) === selectedMonth;

    return matchesFilter && matchesSearch && matchesEmployee && matchesMonth;
  });

  const totalPages = Math.ceil(filteredRequests.length / REPORTS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * REPORTS_PER_PAGE;
  const paginatedRequests = filteredRequests.slice(
    startIndex,
    startIndex + REPORTS_PER_PAGE
  );

  const clearFilters = () => {
    setSelectedMonth("");
    setSelectedEmployee("All");
    setSearchTerm("");
    setActiveFilter("All");
    setCurrentPage(1);
  };

  const exportToExcel = () => {
    if (filteredRequests.length === 0) return;

    const exportData = filteredRequests.map((item) => ({
      Employee: item.employeeId?.name || "N/A",
      Email: item.employeeId?.email || "N/A",
      Department: item.subcategoryId?.name || "N/A",
      LeaveType: item.leaveType || "N/A",
      StartDate: formatDate(item.startDate),
      EndDate: formatDate(item.endDate),
      HRStatus: item.hrStatus || "N/A",
      FinalStatus: item.finalStatus || "N/A",
      TLStatus: item.tlStatus || "N/A",
      ManagerStatus: item.managerStatus || "N/A",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leave Reports");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const fileData = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });

    saveAs(
      fileData,
      `Leave_Reports${selectedMonth ? `_${selectedMonth}` : ""}.xlsx`
    );
  };

  const statusFilters = [
    "All",
    "Pending Final Approval",
    "Approved by Manager",
    "Approved by HR",
    "Rejected by Manager",
    "Rejected by HR",
  ];

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Leave Reports"
        description="Review and export employee leave requests."
        icon={ClipboardList}
        actions={(
          <button
            type="button"
            className="btn btn-primary"
            onClick={exportToExcel}
            disabled={isLoading || filteredRequests.length === 0}
            aria-label={`Export ${filteredRequests.length} filtered leave reports to Excel`}
          >
            <FileSpreadsheet size={17} aria-hidden="true" />
            Export Excel
          </button>
        )}
      />

      {error ? (
        <ErrorState
          title="Unable to load leave reports"
          description={error}
          action={(
            <button type="button" className="btn btn-secondary" onClick={fetchReports}>
              <RefreshCw size={16} aria-hidden="true" />
              Try again
            </button>
          )}
        />
      ) : isLoading ? (
        <LoadingState label="Loading leave reports" />
      ) : (
        <>
          <section aria-label="Leave report filters">
            <div className="input-group">
              <label htmlFor="leave-report-search">Search reports</label>
              <input
                id="leave-report-search"
                className="modern-input"
                type="search"
                placeholder="Search by employee, email or department"
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            <div className="grid-2">
              <div className="input-group">
                <label htmlFor="leave-report-month">Filter by month</label>
                <input
                  id="leave-report-month"
                  className="modern-input"
                  type="month"
                  value={selectedMonth}
                  onChange={(event) => {
                    setSelectedMonth(event.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>

              <div className="input-group">
                <label htmlFor="leave-report-employee">Filter by employee</label>
                <select
                  id="leave-report-employee"
                  className="modern-select"
                  value={selectedEmployee}
                  onChange={(event) => {
                    setSelectedEmployee(event.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="All">All employees</option>
                  {employees.map((employee) => (
                    <option key={employee._id} value={employee._id}>
                      {employee.name} - {employee.email}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={clearFilters}>
                Clear Filters
              </button>
              <span className="section-subtitle" role="status" aria-live="polite">
                {filteredRequests.length} report{filteredRequests.length === 1 ? "" : "s"}
              </span>
            </div>

            <div className="leave-filter-tabs" role="group" aria-label="Filter by leave status">
              {statusFilters.map((filter) => (
                <button
                  type="button"
                  key={filter}
                  className={activeFilter === filter ? "active-filter" : ""}
                  aria-pressed={activeFilter === filter}
                  onClick={() => {
                    setActiveFilter(filter);
                    setCurrentPage(1);
                  }}
                >
                  {filter}
                </button>
              ))}
            </div>
          </section>

          <div className="table-wrapper modern-table-wrapper">
            <table className="custom-table">
              <caption className="sr-only">Filtered employee leave reports</caption>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Leave Type</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Approval Flow</th>
                  <th>Rejection Reason</th>
                </tr>
              </thead>

              <tbody>
                {paginatedRequests.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <div className="user-cell">
                        <UserAvatar name={item.employeeId?.name || "Employee"} size="small" />
                        <div>
                          <strong>{item.employeeId?.name || "Unknown employee"}</strong>
                          <p className="section-subtitle">
                            {item.employeeId?.email || "Email not available"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>{item.subcategoryId?.name || "N/A"}</td>
                    <td>{item.leaveType || "N/A"}</td>
                    <td>
                      <time dateTime={item.startDate}>{formatDate(item.startDate)}</time>
                      {" - "}
                      <time dateTime={item.endDate}>{formatDate(item.endDate)}</time>
                    </td>
                    <td>
                      <StatusBadge
                        status={item.finalStatus || "Pending"}
                        label={item.finalStatus || "Pending"}
                      />
                    </td>
                    <td>
                      <div className="approval-flow">
                        <span>TL: {item.tlStatus || "Pending"}</span>
                        <span>Manager: {item.managerStatus || "Pending"}</span>
                        <span>HR: {item.hrStatus || "Pending"}</span>
                      </div>
                    </td>
                    <td>{item.rejectionReason || "Not applicable"}</td>
                  </tr>
                ))}

                {filteredRequests.length === 0 && (
                  <tr>
                    <td colSpan="7">
                      <EmptyState
                        compact
                        title="No leave reports found"
                        description={
                          requests.length > 0
                            ? "Try changing or clearing the current filters."
                            : "Leave requests will appear here when employees submit them."
                        }
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {filteredRequests.length > REPORTS_PER_PAGE && (
            <nav className="pagination" aria-label="Leave report pages">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((previousPage) => previousPage - 1)}
              >
                Previous
              </button>

              {Array.from({ length: totalPages }, (_, index) => {
                const page = index + 1;
                return (
                  <button
                    type="button"
                    key={page}
                    className={currentPage === page ? "active" : ""}
                    aria-label={`Page ${page}`}
                    aria-current={currentPage === page ? "page" : undefined}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                );
              })}

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((previousPage) => previousPage + 1)}
              >
                Next
              </button>
            </nav>
          )}
        </>
      )}
    </>
  );
};

export default AdminLeaveReports;
