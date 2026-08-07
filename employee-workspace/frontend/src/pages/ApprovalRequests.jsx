import { useEffect, useState } from "react";
import {
  CheckCircle,
  XCircle,
  ClipboardList,
  X,
} from "lucide-react";

import api from "../api/api";
import { useAuth } from "../context/AuthContext";

const ApprovalRequests = () => {
  const { user } = useAuth();

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

  const [showRejectModal, setShowRejectModal] =
    useState(false);

  const [rejectLeaveId, setRejectLeaveId] =
    useState(null);

  const [rejectionReason, setRejectionReason] =
    useState("");

  const safeRequests = requests || [];

  const fetchRequests = async () => {
    try {
      const { data } = await api.get(
        "/leave/pending"
      );

      setRequests(
        data.leaveRequests ||
        data.requests ||
        []
      );
    } catch (error) {
      alert(
        error.response?.data?.message ||
        "Unable to fetch approvals"
      );

      console.log(
        error.response?.data
      );
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const filteredRequests =
    safeRequests.filter((item) => {
      const matchesFilter =
        activeFilter === "All"
          ? true
          : item.status ===
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
        item.leaveType
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
        item.status === "Pending"
    ).length;

  const approvedCount =
    safeRequests.filter(
      (item) =>
        item.status === "Approved"
    ).length;

  const rejectedCount =
    safeRequests.filter(
      (item) =>
        item.status === "Rejected"
    ).length;

  const openReasonModal = (
    title,
    content
  ) => {
    setModalTitle(title);

    setModalContent(
      content ||
      "No reason provided."
    );

    setShowReasonModal(true);
  };

  const openRejectModal = (id) => {
    setRejectLeaveId(id);

    setRejectionReason("");

    setShowRejectModal(true);
  };

  const handleDecision = async (
    id,
    decision,
    reason = ""
  ) => {
    try {
      if (
        decision === "Rejected" &&
        !reason.trim()
      ) {
        alert(
          "Rejection reason is required."
        );

        return;
      }

      const { data } =
        await api.put(
          `/leave/approve/${id}`,
          {
            decision,
            rejectionReason:
              reason,
          }
        );

      const updatedLeave =
        data.leaveRequest || {};

      alert(
        updatedLeave.status ===
          "Pending"
          ? "Your approval is recorded. Waiting for the other approver."
          : `Leave ${updatedLeave.status}`
      );

      fetchRequests();
    } catch (error) {
      alert(
        error.response?.data
          ?.message ||
        "Approval failed"
      );

      console.log(
        error.response?.data
      );
    }
  };

  const submitRejection =
    async () => {
      if (
        !rejectionReason.trim()
      ) {
        alert(
          "Rejection reason is required."
        );

        return;
      }

      await handleDecision(
        rejectLeaveId,
        "Rejected",
        rejectionReason
      );

      setShowRejectModal(false);

      setRejectLeaveId(null);

      setRejectionReason("");
    };

  const hasCurrentUserActed = (
    item
  ) => {
    if (
      user?.role === "Manager"
    ) {
      return (
        item.approvals
          ?.managerStatus !==
        "Pending"
      );
    }

    if (user?.role === "HR") {
      return (
        item.approvals
          ?.hrStatus !==
        "Pending"
      );
    }

    return true;
  };

  const getCurrentUserActionLabel =
    (item) => {
      if (
        user?.role ===
        "Manager"
      ) {
        return item.approvals
          ?.managerStatus ===
          "Approved"
          ? "Approved By You"
          : "Rejected By You";
      }

      if (
        user?.role === "HR"
      ) {
        return item.approvals
          ?.hrStatus ===
          "Approved"
          ? "Approved By You"
          : "Rejected By You";
      }

      return "";
    };

  const getCurrentUserActionClass =
    (item) => {
      if (
        user?.role ===
        "Manager"
      ) {
        return item.approvals
          ?.managerStatus ===
          "Approved"
          ? "badge badge-success"
          : "badge badge-danger";
      }

      if (
        user?.role === "HR"
      ) {
        return item.approvals
          ?.hrStatus ===
          "Approved"
          ? "badge badge-success"
          : "badge badge-danger";
      }

      return "badge badge-pending";
    };

  return (
    <>
      <div className="section-header">
        <div>
          <h2 className="card-title">
            Approval Requests
          </h2>

          <p className="section-subtitle">
            Review pending and completed leave applications.
          </p>
        </div>
      </div>

      <div className="reimbursement-summary-grid">
        <div className="reimbursement-summary-card">
          <span>Total Requests</span>
          <h3>
            {safeRequests.length}
          </h3>
          <p>
            leave applications
          </p>
        </div>

        <div className="reimbursement-summary-card">
          <span>Pending</span>
          <h3>{pendingCount}</h3>
          <p>
            awaiting review
          </p>
        </div>

        <div className="reimbursement-summary-card">
          <span>Approved</span>
          <h3>{approvedCount}</h3>
          <p>completed</p>
        </div>

        <div className="reimbursement-summary-card">
          <span>Rejected</span>
          <h3>{rejectedCount}</h3>
          <p>declined</p>
        </div>
      </div>

      <div
        style={{
          marginBottom: "18px",
        }}
      >
        <input
          type="text"
          placeholder="Search by employee, email or leave type..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(
              e.target.value
            );

            setCurrentPage(1);
          }}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: "12px",
            border:
              "1px solid #d1d5db",
            fontSize: "14px",
          }}
        />
      </div>

      <div className="leave-filter-tabs">
        {[
          "All",
          "Pending",
          "Approved",
          "Rejected",
        ].map((filter) => (
          <button
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
          >
            {filter === "All"
              ? "All Requests"
              : filter}
          </button>
        ))}
      </div>

      <div className="table-wrapper modern-table-wrapper">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Leave Type</th>
              <th>Duration</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Your Action</th>
              <th>Approval Flow</th>
              <th>
                Rejection Reason
              </th>
            </tr>
          </thead>

          <tbody>
            {paginatedRequests.map(
              (item) => (
                <tr key={item._id}>
                  <td>
                    <div className="user-cell">
                      <div className="avatar-circle">
                        <ClipboardList
                          size={16}
                        />
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
                    {item.leaveType}
                  </td>

                  <td>
                    {new Date(
                      item.startDate
                    ).toLocaleDateString()}
                    {" - "}
                    {new Date(
                      item.endDate
                    ).toLocaleDateString()}
                  </td>

                  <td>
                    <button
                      className="btn btn-secondary"
                      type="button"
                      onClick={() =>
                        openReasonModal(
                          "Leave Reason",
                          item.reason
                        )
                      }
                    >
                      View Reason
                    </button>
                  </td>

                  <td>
                    <span
                      className={
                        item.status ===
                          "Approved"
                          ? "badge badge-success"
                          : item.status ===
                            "Rejected"
                            ? "badge badge-danger"
                            : "badge badge-pending"
                      }
                    >
                      {item.status}
                    </span>
                  </td>

                  <td>
                    <div className="action-buttons">
                      {hasCurrentUserActed(
                        item
                      ) ? (
                        <span
                          className={getCurrentUserActionClass(
                            item
                          )}
                        >
                          {getCurrentUserActionLabel(
                            item
                          )}
                        </span>
                      ) : (
                        <>
                          <button
                            className="approve-btn"
                            onClick={() =>
                              handleDecision(
                                item._id,
                                "Approved"
                              )
                            }
                          >
                            <CheckCircle
                              size={16}
                            />
                            Approve
                          </button>

                          <button
                            className="reject-btn"
                            onClick={() =>
                              openRejectModal(
                                item._id
                              )
                            }
                          >
                            <XCircle
                              size={16}
                            />
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </td>

                  <td>
                    <div className="approval-flow">
                      <span
                        className={
                          item
                            .approvals
                            ?.managerStatus ===
                            "Approved"
                            ? "approval-approved"
                            : item
                              .approvals
                              ?.managerStatus ===
                              "Rejected"
                              ? "approval-rejected"
                              : "approval-pending"
                        }
                      >
                        Manager:{" "}
                        {item
                          .approvals
                          ?.managerStatus ||
                          "Pending"}
                      </span>

                      <span
                        className={
                          item
                            .approvals
                            ?.hrStatus ===
                            "Approved"
                            ? "approval-approved"
                            : item
                              .approvals
                              ?.hrStatus ===
                              "Rejected"
                              ? "approval-rejected"
                              : "approval-pending"
                        }
                      >
                        HR:{" "}
                        {item
                          .approvals
                          ?.hrStatus ||
                          "Pending"}
                      </span>
                    </div>
                  </td>

                  <td>
                    {item.rejectionReason ? (
                      <button
                        className="btn btn-secondary"
                        type="button"
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
                    colSpan="8"
                    style={{
                      textAlign:
                        "center",
                      padding:
                        "24px",
                    }}
                  >
                    No leave approval requests found.
                  </td>
                </tr>
              )}
          </tbody>
        </table>
      </div>

      {filteredRequests.length >
        REQUESTS_PER_PAGE && (
          <div
            style={{
              display: "flex",
              justifyContent:
                "center",
              alignItems: "center",
              gap: "10px",
              marginTop: "24px",
              flexWrap: "wrap",
            }}
          >
            <button
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
                >
                  {index + 1}
                </button>
              )
            )}

            <button
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
          </div>
        )}

      {showReasonModal && (
        <div className="modal-overlay">
          <div
            className="modal-card"
            style={{
              maxWidth: "500px",
            }}
          >
            <div className="modal-header">
              <h3>
                {modalTitle}
              </h3>

              <button
                onClick={() =>
                  setShowReasonModal(
                    false
                  )
                }
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
                whiteSpace:
                  "pre-wrap",
                wordBreak:
                  "break-word",
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
            style={{
              maxWidth: "600px",
              width: "90%",
            }}
          >
            <div className="modal-header">
              <h3>
                Reject Leave Request
              </h3>

              <button
                onClick={() =>
                  setShowRejectModal(
                    false
                  )
                }
              >
                <X size={18} />
              </button>
            </div>

            <div
              style={{
                padding: "20px",
              }}
            >
              <textarea
                rows="4"
                placeholder="Enter rejection reason"
                value={
                  rejectionReason
                }
                onChange={(e) =>
                  setRejectionReason(
                    e.target.value
                  )
                }
                style={{
                  width: "100%",
                }}
              />

              <button
                className="reject-btn"
                style={{
                  marginTop: "16px",
                }}
                onClick={
                  submitRejection
                }
              >
                Submit Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ApprovalRequests;
