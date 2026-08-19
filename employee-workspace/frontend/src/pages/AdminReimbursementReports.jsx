import { useCallback, useEffect, useState } from "react";
import {
  ExternalLink,
  FileSpreadsheet,
  Receipt,
  RefreshCw,
} from "lucide-react";

import api from "../api/api";
import PageHeader from "../components/ui/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/StatePanel";
import StatusBadge from "../components/ui/StatusBadge";
import UserAvatar from "../components/ui/UserAvatar";

const REPORTS_PER_PAGE = 10;
const apiBaseUrl = String(import.meta.env.VITE_API_URL || "")
  .trim()
  .replace(/\/api\/?$/i, "")
  .replace(/\/+$/, "");

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatCurrency = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount) ? currencyFormatter.format(amount) : "Not available";
};

const formatDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not available" : date.toLocaleDateString();
};

const getLocalMonthKey = (value) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

const getReceiptUrl = (file) => {
  const rawValue =
    typeof file === "string"
      ? file
      : file?.secure_url || file?.url || file?.path || "";
  const value = String(rawValue).trim();

  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  if (/^\/\//.test(value)) return `https:${value}`;
  if (/^[a-z][a-z\d+.-]*:/i.test(value)) return "";

  const normalizedPath = value.replace(/\\/g, "/").replace(/^\/+/, "");
  return apiBaseUrl ? `${apiBaseUrl}/${normalizedPath}` : `/${normalizedPath}`;
};

const AdminReimbursementReports = () => {
  const [requests, setRequests] = useState([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState("All");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const { data } = await api.get("/admin/reimbursement-reports");
      setRequests(Array.isArray(data.reimbursements) ? data.reimbursements : []);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to fetch reimbursement reports"
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
      item.businessPurpose,
      item.finalStatus,
    ].some((value) => String(value || "").toLowerCase().includes(search));
    const matchesEmployee =
      selectedEmployee === "All" || item.employeeId?._id === selectedEmployee;
    const matchesMonth =
      !selectedMonth || getLocalMonthKey(item.createdAt) === selectedMonth;

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

  const exportToExcel = async () => {
    if (filteredRequests.length === 0) return;
    const [XLSX, fileSaver] = await Promise.all([import("xlsx"), import("file-saver")]);
    const saveAs = fileSaver.saveAs || fileSaver.default;

    const exportData = filteredRequests.map((item) => {
      const totalAmount = Number(item.totalReimbursement);

      return {
        Employee: item.employeeId?.name || "N/A",
        Email: item.employeeId?.email || "N/A",
        BusinessPurpose: item.businessPurpose || "N/A",
        TotalAmount: Number.isFinite(totalAmount) ? totalAmount : 0,
        FinalStatus: item.finalStatus || "N/A",
        TLStatus: item.tlStatus || "N/A",
        ManagerStatus: item.managerStatus || "N/A",
        HRStatus: item.hrStatus || "N/A",
        FinanceStatus: item.financeStatus || "N/A",
        SubmittedDate: formatDate(item.createdAt),
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reimbursement Reports");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const fileData = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });

    saveAs(
      fileData,
      `Reimbursement_Reports${selectedMonth ? `_${selectedMonth}` : ""}.xlsx`
    );
  };

  const statusFilters = [
    "All",
    "Pending Final Approval",
    "Approved by Manager",
    "Approved by HR",
    "Rejected by Manager",
    "Rejected by HR",
    "Paid by Finance",
  ];

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Reimbursement Reports"
        description="Review and export employee reimbursement requests."
        icon={Receipt}
        actions={(
          <button
            type="button"
            className="btn btn-primary"
            onClick={exportToExcel}
            disabled={isLoading || filteredRequests.length === 0}
            aria-label={`Export ${filteredRequests.length} filtered reimbursement reports to Excel`}
          >
            <FileSpreadsheet size={17} aria-hidden="true" />
            Export Excel
          </button>
        )}
      />

      {error ? (
        <ErrorState
          title="Unable to load reimbursement reports"
          description={error}
          action={(
            <button type="button" className="btn btn-secondary" onClick={fetchReports}>
              <RefreshCw size={16} aria-hidden="true" />
              Try again
            </button>
          )}
        />
      ) : isLoading ? (
        <LoadingState label="Loading reimbursement reports" />
      ) : (
        <>
          <section aria-label="Reimbursement report filters">
            <div className="input-group">
              <label htmlFor="reimbursement-report-search">Search reports</label>
              <input
                id="reimbursement-report-search"
                className="modern-input"
                type="search"
                placeholder="Search by employee, email, purpose or status"
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            <div className="grid-2">
              <div className="input-group">
                <label htmlFor="reimbursement-report-month">Filter by month</label>
                <input
                  id="reimbursement-report-month"
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
                <label htmlFor="reimbursement-report-employee">Filter by employee</label>
                <select
                  id="reimbursement-report-employee"
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

            <div
              className="leave-filter-tabs"
              role="group"
              aria-label="Filter by reimbursement status"
            >
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
            <table className="custom-table responsive-card-table">
              <caption className="sr-only">Filtered employee reimbursement reports</caption>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Business Purpose</th>
                  <th>Total Amount</th>
                  <th>Receipts</th>
                  <th>Final Status</th>
                  <th>Finance</th>
                  <th>Approval Flow</th>
                </tr>
              </thead>

              <tbody>
                {paginatedRequests.map((item) => {
                  const receiptUrls = (item.receiptFiles || [])
                    .map(getReceiptUrl)
                    .filter(Boolean);

                  return (
                    <tr key={item._id}>
                      <td data-label="Employee">
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
                      <td data-label="Business purpose">{item.businessPurpose || "Not provided"}</td>
                      <td data-label="Total amount">{formatCurrency(item.totalReimbursement)}</td>
                      <td data-label="Receipts">
                        {receiptUrls.length > 0 ? (
                          <div className="action-buttons">
                            {receiptUrls.map((receiptUrl, index) => (
                              <a
                                key={`${receiptUrl}-${index}`}
                                href={receiptUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="file-link"
                                aria-label={`Open receipt ${index + 1} for ${
                                  item.employeeId?.name || "employee"
                                } in a new tab`}
                              >
                                Receipt {index + 1}
                                <ExternalLink size={13} aria-hidden="true" />
                              </a>
                            ))}
                          </div>
                        ) : (
                          "No receipt"
                        )}
                      </td>
                      <td data-label="Final status">
                        <StatusBadge
                          status={item.finalStatus || "Pending"}
                          label={item.finalStatus || "Pending"}
                        />
                      </td>
                      <td data-label="Finance">
                        <StatusBadge
                          status={item.financeStatus || "Not routed"}
                          label={item.financeStatus || "Not routed"}
                        />
                      </td>
                      <td data-label="Approval flow">
                        <div className="approval-flow">
                          <span>TL: {item.tlStatus || "Pending"}</span>
                          <span>Manager: {item.managerStatus || "Pending"}</span>
                          <span>HR: {item.hrStatus || "Pending"}</span>
                          <span>Finance: {item.financeStatus || "Not routed"}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredRequests.length === 0 && (
                  <tr>
                    <td colSpan="7">
                      <EmptyState
                        compact
                        title="No reimbursement reports found"
                        description={
                          requests.length > 0
                            ? "Try changing or clearing the current filters."
                            : "Reimbursement requests will appear here after they are submitted."
                        }
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {filteredRequests.length > REPORTS_PER_PAGE && (
            <nav className="pagination" aria-label="Reimbursement report pages">
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

export default AdminReimbursementReports;
