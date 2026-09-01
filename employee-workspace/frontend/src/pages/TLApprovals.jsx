import { useEffect, useState } from "react";
import {
  CheckCircle,
  XCircle,
  ClipboardList,
  X,
} from "lucide-react";

import api from "../api/api";
import StatusBadge from "../components/ui/StatusBadge";
import SearchField from "../components/ui/SearchField";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "../components/ui/StatePanel";

const loadTlRequests = async (activeTab) => {
  if (activeTab === "Pending Review") {
    const { data } = await api.get("/leave/tl-pending");
    return data.leaveRequests || [];
  }

  const { data } = await api.get("/leave/tl/history");
  let rows = data.leaveRequests || [];

  if (activeTab === "Final Approved") {
    rows = rows.filter((request) =>
      ["Approved by Manager", "Approved by HR"].includes(
        request.finalStatus
      )
    );
  }

  if (activeTab === "Final Rejected") {
    rows = rows.filter((request) =>
      request.finalStatus?.includes("Rejected")
    );
  }

  return rows;
};

const TLApprovals = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [processingId, setProcessingId] = useState(null);
  const [isRejecting, setIsRejecting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalContent, setModalContent] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectLeaveId, setRejectLeaveId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [activeTab, setActiveTab] = useState("Pending Review");
  const [feedback, setFeedback] = useState(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setLoadError("");

      setRequests(await loadTlRequests(activeTab));
    } catch (error) {
      console.error("FETCH TL LEAVE REQUESTS ERROR:", error.response?.data);
      setLoadError(
        error.response?.data?.message ||
        "Unable to load Team Leader leave requests."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isCurrent = true;

    loadTlRequests(activeTab)
      .then((leaveRequests) => {
        if (isCurrent) {
          setRequests(leaveRequests);
        }
      })
      .catch((error) => {
        console.error("FETCH TL LEAVE REQUESTS ERROR:", error.response?.data);

        if (isCurrent) {
          setLoadError(
            error.response?.data?.message ||
            "Unable to load Team Leader leave requests."
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
  }, [activeTab]);

  useEffect(() => {
    if (!showReasonModal && !showRejectModal) return undefined;

    const closeOnEscape = (event) => {
      if (event.key !== "Escape" || isRejecting) return;
      setShowReasonModal(false);
      setShowRejectModal(false);
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isRejecting, showReasonModal, showRejectModal]);

  const filteredRequests = requests.filter((item) => {
    const search = searchTerm.toLowerCase();

    return (
      item.employeeId?.name?.toLowerCase().includes(search) ||
      item.employeeId?.email?.toLowerCase().includes(search) ||
      item.leaveType?.toLowerCase().includes(search) ||
      item.finalStatus?.toLowerCase().includes(search) ||
      item.tlStatus?.toLowerCase().includes(search)
    );
  });

  const openReasonModal = (title, content) => {
    setModalTitle(title);
    setModalContent(content || "No reason provided.");
    setShowReasonModal(true);
  };

  const openRejectModal = (id) => {
    setRejectLeaveId(id);
    setRejectionReason("");
    setFeedback(null);
    setShowRejectModal(true);
  };

  const approveLeave = async (id) => {
    try {
      setProcessingId(id);
      setFeedback(null);
      await api.put(`/leave/tl-approve/${id}`);
      setFeedback({ type: "success", message: "Leave approved by the Team Leader." });
      await fetchRequests();
    } catch (error) {
      setFeedback({
        type: "error",
        message: error.response?.data?.message || "The leave approval could not be saved.",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const submitRejection = async () => {
    if (!rejectionReason.trim()) {
      setFeedback({ type: "error", message: "A rejection reason is required." });
      return;
    }

    try {
      setIsRejecting(true);
      await api.put(`/leave/tl-reject/${rejectLeaveId}`, {
        rejectionReason,
      });

      setFeedback({ type: "success", message: "Leave rejected by the Team Leader." });

      setShowRejectModal(false);
      setRejectLeaveId(null);
      setRejectionReason("");

      await fetchRequests();
    } catch (error) {
      setFeedback({
        type: "error",
        message: error.response?.data?.message || "The rejection could not be saved.",
      });
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <div aria-busy={loading || Boolean(processingId) || isRejecting}>
      <div className="section-header">
        <div>
          <h2 className="card-title">Team Leader Leave Review</h2>
          <p className="section-subtitle">
            Review leave requests from your reporting employees.
          </p>
        </div>
      </div>

      {feedback && !showRejectModal && (
        <div
          className={`alert ${feedback.type === "success" ? "alert-success" : "alert-error"}`}
          role={feedback.type === "error" ? "alert" : "status"}
          aria-live="polite"
        >
          {feedback.message}
        </div>
      )}

      <div className="leave-filter-tabs">
        {[
          "Pending Review",
          "All Requests",
          "Final Approved",
          "Final Rejected",
        ].map((tab) => (
          <button
            key={tab}
            type="button"
            aria-pressed={activeTab === tab}
            disabled={loading || Boolean(processingId) || isRejecting}
            className={activeTab === tab ? "active-filter" : ""}
            onClick={() => {
              setLoading(true);
              setLoadError("");
              setActiveTab(tab);
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="ui-filter-search-row">
        <SearchField
          id="team-leader-leave-search"
          label="Search Team Leader leave requests"
          placeholder="Search by employee, email, leave type or status..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          onClear={() => setSearchTerm("")}
        />
      </div>

      {loadError && !loading && (
        <ErrorState
          title="Unable to load leave requests"
          description={loadError}
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

      {!loadError && (
      <div className="table-wrapper modern-table-wrapper">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Leave Type</th>
              <th>Duration</th>
              <th>Working Days</th>
              <th>Reason</th>
              <th>TL Status</th>
              <th>Manager</th>
              <th>HR</th>
              <th>Final Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan="10">
                  <LoadingState
                    compact
                    label="Loading Team Leader leave requests…"
                  />
                </td>
              </tr>
            )}

            {!loading && filteredRequests.map((item) => (
              <tr key={item._id}>
                <td>
                  <div className="user-cell">
                    <div className="avatar-circle">
                      <ClipboardList size={16} />
                    </div>

                    <div>
                      <strong>{item.employeeId?.name}</strong>
                      <p style={{ fontSize: "13px", color: "var(--muted)" }}>
                        {item.employeeId?.email}
                      </p>
                    </div>
                  </div>
                </td>

                <td>{item.leaveType}</td>

                <td>
                  {new Date(item.startDate).toLocaleDateString()} -{" "}
                  {new Date(item.endDate).toLocaleDateString()}
                </td>

                <td>{item.workingDays || 0}</td>

                <td>
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={() =>
                      openReasonModal("Leave Reason", item.reason)
                    }
                  >
                    View Reason
                  </button>
                </td>

                <td>
                  <StatusBadge status={item.tlStatus} />
                </td>

                <td>
                  <StatusBadge status={item.managerStatus} />
                </td>

                <td>
                  <StatusBadge status={item.hrStatus} />
                </td>

                <td>
                  <StatusBadge status={item.finalStatus} />
                </td>

                <td>
                  {item.tlStatus === "Pending" &&
                    item.finalStatus === "Pending Final Approval" ? (
                    <div className="action-buttons">
                      <button
                        type="button"
                        className="approve-btn"
                        onClick={() => approveLeave(item._id)}
                        disabled={Boolean(processingId)}
                      >
                        <CheckCircle size={16} />
                        {processingId === item._id ? "Approving…" : "Approve"}
                      </button>

                      <button
                        type="button"
                        className="reject-btn"
                        onClick={() => openRejectModal(item._id)}
                        disabled={Boolean(processingId)}
                      >
                        <XCircle size={16} />
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span>
                      {item.tlStatus === "Approved"
                        ? "TL Approved"
                        : item.tlStatus === "Rejected"
                          ? "TL Rejected"
                          : "Finalized"}
                    </span>
                  )}
                </td>
              </tr>
            ))}

            {!loading && filteredRequests.length === 0 && (
              <tr>
                <td colSpan="10" style={{ textAlign: "center", padding: "24px" }}>
                  <EmptyState
                    compact
                    title="No leave requests found"
                    description={
                      searchTerm
                        ? "Try a different employee, email, leave type, or status."
                        : `There are no requests in ${activeTab.toLowerCase()}.`
                    }
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      )}

      {showReasonModal && (
        <div className="modal-overlay">
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tl-reason-title"
            style={{ maxWidth: "500px" }}
          >
            <div className="modal-header">
              <h3 id="tl-reason-title">{modalTitle}</h3>

              <button
                type="button"
                aria-label="Close leave reason"
                onClick={() => setShowReasonModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div
              style={{
                padding: "20px",
                lineHeight: "1.7",
                maxHeight: "300px",
                overflowY: "auto",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {modalContent}
            </div>
          </div>
        </div>
      )}

      {showRejectModal && (
        <div className="modal-overlay">
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tl-reject-title"
            style={{ maxWidth: "600px", width: "90%" }}
          >
            <div className="modal-header">
              <h3 id="tl-reject-title">Reject Leave Recommendation</h3>

              <button
                type="button"
                aria-label="Close rejection form"
                onClick={() => setShowRejectModal(false)}
                disabled={isRejecting}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: "20px" }}>
              {feedback?.type === "error" && (
                <div className="alert alert-error" role="alert">{feedback.message}</div>
              )}
              <label htmlFor="tl-rejection-reason">Rejection reason</label>
              <textarea
                id="tl-rejection-reason"
                rows="4"
                placeholder="Enter TL rejection reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                style={{ width: "100%" }}
                disabled={isRejecting}
              />
              <button
                type="button"
                className="reject-btn"
                style={{ marginTop: "16px" }}
                onClick={submitRejection}
                disabled={isRejecting}
              >
                {isRejecting ? "Submitting…" : "Submit Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TLApprovals;
