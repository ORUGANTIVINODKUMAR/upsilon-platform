import { useEffect, useState } from "react";
import {
  Receipt,
  BadgeCheck,
  Wallet,
  Users,
  CheckCircle,
} from "lucide-react";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import api from "../api/api";
import useConfirm from "../components/ui/useConfirm";
import StatusBadge from "../components/ui/StatusBadge";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "../components/ui/StatePanel";

const loadFinanceReimbursements = async () => {
  const { data } = await api.get("/reimbursements/finance");

  return data.reimbursementRequests || [];
};

const FinanceReimbursements = () => {
  const confirmAction = useConfirm();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  const RECORDS_PER_PAGE = 10;
  const safeRequests = requests || [];
  const filteredRequests = safeRequests.filter((item) => {
    const matchesFilter =
      activeFilter === "All"
        ? true
        : item.financeStatus === activeFilter;

    const search = searchTerm.toLowerCase();

    const matchesSearch =
      item.employeeId?.name?.toLowerCase().includes(search) ||
      item.employeeId?.email?.toLowerCase().includes(search) ||
      item.businessPurpose?.toLowerCase().includes(search);

    return matchesFilter && matchesSearch;
  });

  const totalPages =
    Math.ceil(filteredRequests.length / RECORDS_PER_PAGE) || 1;

  const visiblePage = Math.min(currentPage, totalPages);

  const startIndex =
    (visiblePage - 1) * RECORDS_PER_PAGE;

  const paginatedRequests =
    filteredRequests.slice(
      startIndex,
      startIndex + RECORDS_PER_PAGE
    );
  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError("");

      setRequests(await loadFinanceReimbursements());
    } catch (error) {
      console.error("FETCH FINANCE REIMBURSEMENTS ERROR:", error.response?.data);
      setError(
        error.response?.data?.message ||
        "Unable to load finance reimbursement records."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isCurrent = true;

    loadFinanceReimbursements()
      .then((financeRequests) => {
        if (isCurrent) {
          setRequests(financeRequests);
        }
      })
      .catch((error) => {
        console.error(
          "FETCH FINANCE REIMBURSEMENTS ERROR:",
          error.response?.data
        );

        if (isCurrent) {
          setError(
            error.response?.data?.message ||
            "Unable to load finance reimbursement records."
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

  const handleMarkAsPaid = async (id) => {
    const confirmPayment = await confirmAction({
      title: "Mark this reimbursement as paid?",
      description: "This records the finance payment decision and notifies the employee.",
      confirmLabel: "Mark as paid",
      tone: "warning",
    });

    if (!confirmPayment) return;

    try {
      setProcessingId(id);
      setFeedback(null);
      await api.put(`/reimbursements/mark-paid/${id}`);
      setFeedback({ type: "success", message: "Reimbursement marked as paid successfully." });
      await fetchRequests();
    } catch (error) {
      setFeedback({
        type: "error",
        message: error.response?.data?.message || "Unable to mark this reimbursement as paid.",
      });
      console.error(error.response?.data);
    } finally {
      setProcessingId(null);
    }
  };

  const pendingPaymentCount = safeRequests.filter(
    (item) => item.financeStatus === "Pending Payment"
  ).length;

  const paidCount = safeRequests.filter(
    (item) => item.financeStatus === "Paid"
  ).length;

  const totalAmount = safeRequests.reduce(
    (sum, item) => sum + Number(item.totalReimbursement || 0),
    0
  );
  const exportToExcel = () => {
    const exportData = safeRequests.map(
      (item) => ({
        Employee:
          item.employeeId?.name || "N/A",

        Email:
          item.employeeId?.email || "N/A",

        BusinessPurpose:
          item.businessPurpose,

        TotalAmount:
          item.totalReimbursement,

        FinalStatus: item.finalStatus,

        FinanceStatus:
          item.financeStatus,

        SubmittedDate: new Date(
          item.createdAt
        ).toLocaleDateString(),
      })
    );

    const worksheet =
      XLSX.utils.json_to_sheet(exportData);

    const workbook =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Finance Reimbursements"
    );

    const excelBuffer = XLSX.write(
      workbook,
      {
        bookType: "xlsx",
        type: "array",
      }
    );

    const fileData = new Blob(
      [excelBuffer],
      {
        type:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
      }
    );

    saveAs(
      fileData,
      "Finance_Reimbursements.xlsx"
    );
  };
  return (
    <div aria-busy={loading || Boolean(processingId)}>
      <div className="section-header">
        <div>
          <h2 className="card-title">Finance Reimbursements</h2>
          <p className="section-subtitle">
            Approved reimbursement claims ready for payment processing.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={exportToExcel}
          disabled={safeRequests.length === 0 || loading}
        >
          Export Excel
        </button>
      </div>

      {feedback && (
        <div
          className={`alert ${feedback.type === "success" ? "alert-success" : "alert-error"}`}
          role={feedback.type === "error" ? "alert" : "status"}
          aria-live="polite"
        >
          {feedback.message}
        </div>
      )}

      {error && !loading && (
        <ErrorState
          title="Unable to load finance reimbursements"
          description={error}
          action={(
            <button
              type="button"
              className="btn btn-secondary"
              onClick={fetchRequests}
            >
              Try again
            </button>
          )}
        />
      )}

      {loading && (
        <LoadingState label="Loading finance reimbursement records…" />
      )}

      {!loading && !error && (
        <>
      <div className="modern-stats-grid">
        <div className="mini-stat-card">
          <Users size={22} />
          <span>Total Claims</span>
          <h3>{safeRequests.length}</h3>
          <p>ready for finance</p>
        </div>

        <div className="mini-stat-card">
          <Receipt size={22} />
          <span>Pending Payment</span>
          <h3>{pendingPaymentCount}</h3>
          <p>to process</p>
        </div>

        <div className="mini-stat-card">
          <BadgeCheck size={22} />
          <span>Paid</span>
          <h3>{paidCount}</h3>
          <p>completed</p>
        </div>

        <div className="mini-stat-card">
          <Wallet size={22} />
          <span>Total Amount</span>
          <h3>₹ {totalAmount.toLocaleString("en-IN")}</h3>
          <p>approved value</p>
        </div>
      </div>
      <div style={{ marginBottom: "18px" }}>
        <input
          type="text"
          aria-label="Search finance reimbursement records"
          placeholder="Search employee, email or business purpose..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: "12px",
            border: "1px solid #d1d5db",
            fontSize: "14px",
          }}
        />
      </div>

      <div className="leave-filter-tabs">
        {["All", "Pending Payment", "Paid"].map((filter) => (
          <button
            key={filter}
            type="button"
            aria-pressed={activeFilter === filter}
            className={
              activeFilter === filter
                ? "active-filter"
                : ""
            }
            onClick={() => {
              setActiveFilter(filter);
              setCurrentPage(1);
            }}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="table-wrapper modern-table-wrapper">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Business Purpose</th>
              <th>Total Amount</th>
              <th>Receipt</th>
              <th>Final Approval</th>
              <th>Finance Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {paginatedRequests.map((request) => (
              <tr key={request._id}>
                <td>
                  <div className="user-cell">
                    <div className="avatar-circle">
                      {request.employeeId?.name?.charAt(0)?.toUpperCase()}
                    </div>

                    <div>
                      <strong>{request.employeeId?.name}</strong>
                      <p style={{ fontSize: "13px", color: "var(--muted)" }}>
                        {request.employeeId?.email}
                      </p>
                    </div>
                  </div>
                </td>

                <td>{request.businessPurpose}</td>

                <td>₹ {Number(
                  request.totalReimbursement || 0
                ).toLocaleString("en-IN")}</td>

                <td>
                  {request.receiptFiles?.length > 0 ? (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                      }}
                    >
                      {request.receiptFiles.map((file, index) => (
                        <a
                          key={index}
                          href={file}
                          target="_blank"
                          rel="noreferrer"
                          className="file-link"
                          aria-label={`View receipt ${index + 1} for ${request.employeeId?.name || "employee"}`}
                        >
                          View Receipt {index + 1}
                        </a>
                      ))}
                    </div>
                  ) : (
                    "N/A"
                  )}
                </td>

                <td>
                  <StatusBadge status={request.finalStatus} />
                </td>

                <td>
                  <StatusBadge status={request.financeStatus} />
                </td>

                <td>
                  {request.financeStatus === "Paid" ? (
                    <StatusBadge status="Paid" />
                  ) : (
                    <button
                      className="approve-btn"
                      type="button"
                      onClick={() => handleMarkAsPaid(request._id)}
                      disabled={Boolean(processingId)}
                      aria-label={`Mark reimbursement for ${request.employeeId?.name || "employee"} as paid`}
                    >
                      <CheckCircle size={16} />
                      {processingId === request._id
                        ? "Processing…"
                        : "Mark as Paid"}
                    </button>
                  )}
                </td>
              </tr>
            ))}

            {filteredRequests.length === 0 && (
              <tr>
                <td
                  colSpan="7"
                  style={{
                    textAlign: "center",
                    padding: "24px",
                  }}
                >
                  <EmptyState
                    compact
                    title="No reimbursement records found"
                    description={
                      searchTerm || activeFilter !== "All"
                        ? "Try changing your search or payment-status filter."
                        : "Final-approved reimbursement claims will appear here."
                    }
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {filteredRequests.length > RECORDS_PER_PAGE && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "10px",
            marginTop: "24px",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            className="btn btn-primary"
            disabled={visiblePage === 1}
            onClick={() =>
              setCurrentPage((prev) => prev - 1)
            }
          >
            Previous
          </button>

          {Array.from(
            { length: totalPages },
            (_, index) => (
                <button
                  key={index + 1}
                  type="button"
                  aria-current={visiblePage === index + 1 ? "page" : undefined}
                className={
                  visiblePage === index + 1
                    ? "btn btn-primary"
                    : "btn"
                }
                onClick={() =>
                  setCurrentPage(index + 1)
                }
              >
                {index + 1}
              </button>
            )
          )}

          <button
            type="button"
            className="btn btn-primary"
            disabled={visiblePage === totalPages}
            onClick={() =>
              setCurrentPage((prev) => prev + 1)
            }
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

export default FinanceReimbursements;
