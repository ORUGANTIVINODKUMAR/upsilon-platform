import { useEffect, useState } from "react";
import {
  CheckCircle,
  XCircle,
  Receipt,
  Printer,
  RotateCw,
  X,
} from "lucide-react";

import api from "../api/api";
import { useAuth } from "../context/useAuth";
import StatusBadge from "../components/ui/StatusBadge";
import { ErrorState, LoadingState } from "../components/ui/StatePanel";
import PageHeader from "../components/ui/PageHeader";
import MetricCard from "../components/ui/MetricCard";
import SearchField from "../components/ui/SearchField";
import FileAttachment from "../components/ui/FileAttachment";

const ReimbursementApprovals = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("Pending");
  const [requests, setRequests] = useState([]);
  const [activeFilter, setActiveFilter] =
    useState("All");

  const [searchTerm, setSearchTerm] =
    useState("");

  const [currentPage, setCurrentPage] =
    useState(1);

  const REQUESTS_PER_PAGE = 10;

  const [showReasonModal, setShowReasonModal] =
    useState(false);

  const [modalTitle, setModalTitle] =
    useState("");

  const [modalContent, setModalContent] =
    useState("");

  const [rejectionModal, setRejectionModal] =
    useState(false);

  const [rejectRequestId, setRejectRequestId] =
    useState(null);

  const [rejectionReason, setRejectionReason] =
    useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionRequestId, setActionRequestId] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [printRequest, setPrintRequest] = useState(null);

  const safeRequests = requests || [];

  const fetchRequests = async () => {
    setLoading(true);
    setError("");

    try {
      let endpoint = "";

      if (user?.role === "TeamLeader") {
        endpoint =
          activeTab === "Pending"
            ? "/reimbursements/tl-pending"
            : "/reimbursements/tl/history";
      } else {
        endpoint =
          activeTab === "Pending"
            ? "/reimbursements/manager-pending"
            : "/reimbursements/manager/history";
      }

      const { data } = await api.get(endpoint);

      let reimbursementRequests =
        data.reimbursementRequests ||
        data.reimbursements ||
        [];

      if (user?.role === "TeamLeader") {
        if (activeTab !== "Pending") {
          reimbursementRequests =
            reimbursementRequests.filter(
              (item) => item.tlStatus === activeTab
            );
        }
      } else {
        if (activeTab === "Approved") {
          reimbursementRequests =
            reimbursementRequests.filter(
              (item) =>
                item.finalStatus?.includes("Approved") ||
                item.finalStatus === "Paid by Finance"
            );
        }

        if (activeTab === "Rejected") {
          reimbursementRequests =
            reimbursementRequests.filter(
              (item) =>
                item.finalStatus?.includes("Rejected")
            );
        }
      }

      setRequests(reimbursementRequests);
    } catch (error) {
      setError(
        error.response?.data?.message ||
        "Unable to fetch reimbursement approvals."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch again when the workflow tab or reviewer role changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRequests();
    // The request intentionally captures the active workflow selection.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, user?.role]);

  const filteredRequests =
    safeRequests.filter((item) => {
      const matchesFilter =
        activeFilter === "All"
          ? true
          : item.finalStatus ===
          activeFilter;

      const search =
        searchTerm.toLowerCase();

      const matchesSearch =
        item.employeeId?.name
          ?.toLowerCase()
          .includes(search) ||
        item.employeeId?.email
          ?.toLowerCase()
          .includes(search) ||
        item.businessPurpose
          ?.toLowerCase()
          .includes(search);

      return (
        matchesFilter &&
        matchesSearch
      );
    });

  const totalPages =
    Math.ceil(
      filteredRequests.length /
      REQUESTS_PER_PAGE
    ) || 1;

  const startIndex =
    (currentPage - 1) *
    REQUESTS_PER_PAGE;

  const paginatedRequests =
    filteredRequests.slice(
      startIndex,
      startIndex +
      REQUESTS_PER_PAGE
    );

  const pendingCount =
    safeRequests.filter(
      (item) =>
        item.finalStatus === "Pending Final Approval"
    ).length;

  const approvedCount =
    safeRequests.filter(
      (item) =>
        ["Approved by Manager", "Approved by HR"].includes(
          item.finalStatus
        )
    ).length;

  const rejectedCount =
    safeRequests.filter(
      (item) =>
        item.finalStatus?.includes("Rejected")
    ).length;

  const totalAmount =
    safeRequests.reduce(
      (sum, item) =>
        sum +
        Number(
          item.totalReimbursement || 0
        ),
      0
    );

  const openReasonModal = (
    title,
    content
  ) => {
    setModalTitle(title);

    setModalContent(
      content ||
      "No reason available."
    );

    setShowReasonModal(true);
  };

  const openRejectModal = (id) => {
    setRejectRequestId(id);

    setRejectionReason("");

    setRejectionModal(true);
  };

  const handleDecision = async (
    id,
    decision,
    customReason = ""
  ) => {
    try {
      if (decision === "Rejected" && !customReason.trim()) {
        setFeedback({ type: "error", message: "A rejection reason is required." });
        return false;
      }

      setActionRequestId(id);
      setFeedback(null);

      const approveEndpoint =
        user?.role === "TeamLeader"
          ? `/reimbursements/tl-approve/${id}`
          : `/reimbursements/manager-approve/${id}`;

      const rejectEndpoint =
        user?.role === "TeamLeader"
          ? `/reimbursements/tl-reject/${id}`
          : `/reimbursements/manager-reject/${id}`;

      if (decision === "Approved") {
        await api.put(approveEndpoint);
      } else {
        await api.put(rejectEndpoint, {
          rejectionReason: customReason,
        });
      }

      setFeedback({
        type: "success",
        message:
          user?.role === "TeamLeader" && decision === "Rejected"
            ? "Team Leader review recorded. Manager or HR will make the final decision."
            : `Reimbursement ${decision.toLowerCase()} successfully.`,
      });

      await fetchRequests();
      return true;
    } catch (error) {
      setFeedback({
        type: "error",
        message: error.response?.data?.message || "The approval could not be saved.",
      });
      return false;
    } finally {
      setActionRequestId(null);
    }
  };

  const submitRejection =
    async () => {
      if (
        !rejectionReason.trim()
      ) {
        setFeedback({ type: "error", message: "A rejection reason is required." });

        return;
      }

      const succeeded = await handleDecision(
        rejectRequestId,
        "Rejected",
        rejectionReason
      );

      if (!succeeded) return;

      setRejectionModal(false);

      setRejectRequestId(null);

      setRejectionReason("");
    };

  const printReimbursementForm = (request) => {
    setPrintRequest(request);
    window.requestAnimationFrame(() => window.print());
  };

  useEffect(() => {
    const clearPrintRequest = () => setPrintRequest(null);
    window.addEventListener("afterprint", clearPrintRequest);
    return () => window.removeEventListener("afterprint", clearPrintRequest);
  }, []);

  useEffect(() => {
    if (!showReasonModal && !rejectionModal) return undefined;

    const closeOnEscape = (event) => {
      if (event.key !== "Escape") return;
      setShowReasonModal(false);
      setRejectionModal(false);
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [rejectionModal, showReasonModal]);

  if (loading && safeRequests.length === 0) {
    return <LoadingState label="Loading reimbursement approvals..." />;
  }

  if (error && safeRequests.length === 0) {
    return (
      <ErrorState
        title="Reimbursement approvals could not be loaded"
        description={error}
        action={(
          <button type="button" className="btn btn-secondary" onClick={fetchRequests}>
            <RotateCw size={15} aria-hidden="true" />
            Try again
          </button>
        )}
      />
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Approvals"
        title="Reimbursement Approvals"
        description="Review employee claims, inspect receipts, and move each request through the existing approval flow."
        icon={Receipt}
      />
      {feedback && (
        <div
          className={`alert ${feedback.type === "success" ? "alert-success" : "alert-error"}`}
          role={feedback.type === "error" ? "alert" : "status"}
        >
          {feedback.message}
        </div>
      )}
      {error && safeRequests.length > 0 && (
        <div className="alert alert-error" role="alert">{error}</div>
      )}
      {["TeamLeader", "Manager", "HR"].includes(user?.role) && (
        <div className="leave-filter-tabs">
          {["Pending", "Approved", "Rejected"].map((tab) => (
            <button
              type="button"
              key={tab}
              className={activeTab === tab ? "active-filter" : ""}
              onClick={() => {
                setActiveTab(tab);
                setCurrentPage(1);
              }}
              aria-pressed={activeTab === tab}
            >
              {tab}
            </button>
          ))}
        </div>
      )}
      <div className="reimbursement-summary-grid">
        <MetricCard label="Total claims" value={safeRequests.length} detail="Submitted" icon={Receipt} tone="brand" />
        <MetricCard label="Pending" value={pendingCount} detail="Awaiting review" icon={RotateCw} tone="warning" />
        <MetricCard label="Approved" value={approvedCount} detail="Completed" icon={CheckCircle} tone="success" />
        <MetricCard label="Rejected" value={rejectedCount} detail="Declined" icon={XCircle} tone="danger" />
        <MetricCard label="Total amount" value={`₹${totalAmount.toLocaleString("en-IN")}`} detail="Claims value" icon={Receipt} tone="neutral" />
      </div>

      <div className="ui-filter-search-row approvals-search">
        <SearchField
          id="reimbursement-approval-search"
          label="Search claims"
          placeholder="Search by employee, email, or business purpose…"
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

      <div className="leave-filter-tabs">
        {[
          "All",
          "Pending Final Approval",
          "Approved by Manager",
          "Approved by HR",
          "Rejected by Manager",
          "Rejected by HR",
        ].map((filter) => (
          <button
            type="button"
            key={filter}
            className={
              activeFilter ===
                filter
                ? "active-filter"
                : ""
            }
            onClick={() => {
              setActiveFilter(
                filter
              );

              setCurrentPage(1);
            }}
            aria-pressed={activeFilter === filter}
          >
            {filter === "All"
              ? "All Claims"
              : filter}
          </button>
        ))}
      </div>

      <div className="table-wrapper modern-table-wrapper">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Purpose</th>
              <th>Total</th>
              <th>Receipt</th>
              <th>Status</th>
              <th>Your Action</th>
              <th>Print</th>
              <th>Approval Flow</th>
              <th>Rejection Reason</th>
            </tr>
          </thead>

          <tbody>
            {paginatedRequests.map(
              (item) => (
                <tr key={item._id}>
                  <td>
                    <div className="user-cell">
                      <div className="avatar-circle">
                        <Receipt size={16} />
                      </div>

                      <div>
                        <strong>
                          {
                            item
                              .employeeId
                              ?.name
                          }
                        </strong>

                        <p
                          style={{
                            fontSize:
                              "13px",
                            color:
                              "var(--muted)",
                          }}
                        >
                          {
                            item
                              .employeeId
                              ?.email
                          }
                        </p>
                      </div>
                    </div>
                  </td>

                  <td>
                    {
                      item.businessPurpose
                    }
                  </td>

                  <td>
                    ₹ {Number(item.totalReimbursement || 0).toLocaleString("en-IN")}
                  </td>

                  <td>
                    {item.receiptFiles
                      ?.length > 0 ? (
                      <div
                        style={{
                          display:
                            "flex",
                          flexDirection:
                            "column",
                          gap: "6px",
                        }}
                      >
                        {item.receiptFiles.map(
                          (
                            file,
                            index
                          ) => (
                            <FileAttachment
                              key={index}
                              url={file}
                              label={`Receipt ${index + 1}`}
                              compact
                            />
                          )
                        )}
                      </div>
                    ) : (
                      "N/A"
                    )}
                  </td>
                  <td>
                    <StatusBadge status={item.finalStatus} />
                  </td>
                  <td>
                    {activeTab === "Pending" &&
                      item.finalStatus === "Pending Final Approval" ? (
                      <div className="action-buttons">
                        <button
                          type="button"
                          className="approve-btn"
                          disabled={actionRequestId === item._id}
                          onClick={() =>
                            handleDecision(item._id, "Approved")
                          }
                        >
                          <CheckCircle size={16} />
                          Approve
                        </button>

                        <button
                          type="button"
                          className="reject-btn"
                          disabled={actionRequestId === item._id}
                          onClick={() =>
                            openRejectModal(item._id)
                          }
                        >
                          <XCircle size={16} />
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span>Finalized</span>
                    )}
                  </td>

                  <td>
                    {["Manager", "HR"].includes(
                      user?.role
                    ) && (
                        <button
                          type="button"
                          className="print-btn"
                          onClick={() =>
                            printReimbursementForm(item)
                          }
                        >
                          <Printer
                            size={16}
                          />
                          Print
                        </button>
                      )}
                  </td>

                  <td>
                    <div className="approval-flow">
                      <span>TL: {item.tlStatus || "Pending"}</span>
                      <span>Manager: {item.managerStatus || "Pending"}</span>
                      <span>HR: {item.hrStatus || "Pending"}</span>
                      <span>Finance: {item.financeStatus || "Not Routed"}</span>
                    </div>
                  </td>

                  <td>
                    {item.rejectionReason ? (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() =>
                          openReasonModal(
                            "Rejection Reason",
                            item.rejectionReason
                          )
                        }
                      >
                        View Reason
                      </button>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              )
            )}

            {filteredRequests.length ===
              0 && (
                <tr>
                  <td
                    colSpan="9"
                    style={{
                      textAlign:
                        "center",
                      padding:
                        "24px",
                    }}
                  >
                    No reimbursement requests found.
                  </td>
                </tr>
              )}
          </tbody>
        </table>
      </div>

      {filteredRequests.length >
        REQUESTS_PER_PAGE && (
          <nav className="pagination" aria-label="Reimbursement approval pages">
            <button
              type="button"
              className="btn btn-primary"
              disabled={
                currentPage === 1
              }
              onClick={() =>
                setCurrentPage(
                  (prev) =>
                    prev - 1
                )
              }
            >
              Previous
            </button>

            {Array.from(
              {
                length: totalPages,
              },
              (_, index) => (
                <button
                  type="button"
                  key={index + 1}
                  className={
                    currentPage ===
                      index + 1
                      ? "btn btn-primary"
                      : "btn"
                  }
                  onClick={() =>
                    setCurrentPage(
                      index + 1
                    )
                  }
                  aria-current={currentPage === index + 1 ? "page" : undefined}
                >
                  {index + 1}
                </button>
              )
            )}

            <button
              type="button"
              className="btn btn-primary"
              disabled={
                currentPage ===
                totalPages
              }
              onClick={() =>
                setCurrentPage(
                  (prev) =>
                    prev + 1
                )
              }
            >
              Next
            </button>
          </nav>
        )}
      {showReasonModal && (
        <div className="modal-overlay">
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reimbursement-reason-title"
          >
            <div className="modal-header">
              <h3 id="reimbursement-reason-title">{modalTitle}</h3>

              <button type="button" aria-label="Close reason" onClick={() => setShowReasonModal(false)}>
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <div className="modal-copy">
              {modalContent}
            </div>
          </div>
        </div>
      )}
      {rejectionModal && (
        <div className="modal-overlay">
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reject-reimbursement-title"
          >
            <div className="modal-header">
              <h3 id="reject-reimbursement-title">Reject reimbursement</h3>

              <button type="button" aria-label="Close rejection form" onClick={() => setRejectionModal(false)}>
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <div className="input-group">
              <label htmlFor="reimbursement-rejection-reason">Reason for rejection</label>
              <textarea
                id="reimbursement-rejection-reason"
                rows="4"
                placeholder="Enter rejection reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                autoFocus
              />

              <button
                type="button"
                className="reject-btn"
                onClick={submitRejection}
                disabled={actionRequestId === rejectRequestId}
              >
                {actionRequestId === rejectRequestId ? "Saving..." : "Submit rejection"}
              </button>
            </div>
          </div>
        </div>
      )}

      {printRequest && (
        <article className="reimbursement-print-sheet" aria-hidden="true">
          <header>
            <h1>Upsilon reimbursement approval</h1>
            <p>Claim reference: {printRequest._id}</p>
          </header>
          <dl>
            <div><dt>Employee</dt><dd>{printRequest.employeeId?.name || "N/A"}</dd></div>
            <div><dt>Email</dt><dd>{printRequest.employeeId?.email || "N/A"}</dd></div>
            <div><dt>Business purpose</dt><dd>{printRequest.businessPurpose || "N/A"}</dd></div>
            <div><dt>Total amount</dt><dd>INR {Number(printRequest.totalReimbursement || 0).toLocaleString("en-IN")}</dd></div>
            <div><dt>Final status</dt><dd>{printRequest.finalStatus || "Pending"}</dd></div>
            <div><dt>Approval flow</dt><dd>TL: {printRequest.tlStatus || "Pending"}; Manager: {printRequest.managerStatus || "Pending"}; HR: {printRequest.hrStatus || "Pending"}; Finance: {printRequest.financeStatus || "Not routed"}</dd></div>
          </dl>
        </article>
      )}
    </>
  );
};

export default ReimbursementApprovals;
