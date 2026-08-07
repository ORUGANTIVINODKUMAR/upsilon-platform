import { useEffect, useState } from "react";
import {
  CheckCircle,
  XCircle,
  Receipt,
  Printer,
} from "lucide-react";

import api from "../api/api";
import { useAuth } from "../context/AuthContext";

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

  const safeRequests = requests || [];

  const fetchRequests = async () => {
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
      alert(
        error.response?.data?.message ||
        "Unable to fetch reimbursement approvals"
      );
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [activeTab, user?.role]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, searchTerm]);

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
        alert("Rejection reason is required.");
        return;
      }

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

      alert(
        user?.role === "TeamLeader" && decision === "Rejected"
          ? "Team Leader review recorded. Manager or HR will make the final decision."
          : `Reimbursement ${decision.toLowerCase()} successfully`
      );

      fetchRequests();
    } catch (error) {
      alert(error.response?.data?.message || "Approval failed");
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
        rejectRequestId,
        "Rejected",
        rejectionReason
      );

      setRejectionModal(false);

      setRejectRequestId(null);

      setRejectionReason("");
    };

  const printReimbursementForm = () => {
    window.print();
  };

  return (
    <>
      <div className="section-header">
        <div>
          <h2 className="card-title">
            Reimbursement Approvals
          </h2>

          <p className="section-subtitle">
            Review employee reimbursement claims.
          </p>
        </div>
      </div>
      {["TeamLeader", "Manager", "HR"].includes(user?.role) && (
        <div className="leave-filter-tabs">
          {["Pending", "Approved", "Rejected"].map((tab) => (
            <button
              key={tab}
              className={activeTab === tab ? "active-filter" : ""}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      )}
      <div className="reimbursement-summary-grid">
        <div className="reimbursement-summary-card">
          <span>Total Claims</span>
          <h3>
            {safeRequests.length}
          </h3>
          <p>submitted</p>
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
          <p>rejected</p>
        </div>

        <div className="reimbursement-summary-card">
          <span>Total Amount</span>
          <h3>₹ {totalAmount.toLocaleString("en-IN")}</h3>
          <p>claims value</p>
        </div>
      </div>

      <div
        style={{
          marginBottom: "18px",
        }}
      >
        <input
          type="text"
          placeholder="Search by employee, email or business purpose..."
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
          "Pending Final Approval",
          "Approved by Manager",
          "Approved by HR",
          "Rejected by Manager",
          "Rejected by HR",
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
                            <a
                              key={
                                index
                              }
                              href={
                                file
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="file-link"
                            >
                              View
                              Receipt{" "}
                              {index +
                                1}
                            </a>
                          )
                        )}
                      </div>
                    ) : (
                      "N/A"
                    )}
                  </td>
                  <td>
                    <span
                      className={
                        [
                          "Approved by Manager",
                          "Approved by HR",
                          "Paid by Finance",
                        ].includes(item.finalStatus)
                          ? "badge badge-success"
                          : item.finalStatus?.includes("Rejected")
                            ? "badge badge-danger"
                            : "badge badge-pending"
                      }
                    >
                      {item.finalStatus}
                    </span>
                  </td>
                  <td>
                    {activeTab === "Pending" &&
                      item.finalStatus === "Pending Final Approval" ? (
                      <div className="action-buttons">
                        <button
                          className="approve-btn"
                          onClick={() =>
                            handleDecision(item._id, "Approved")
                          }
                        >
                          <CheckCircle size={16} />
                          Approve
                        </button>

                        <button
                          className="reject-btn"
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
                          className="print-btn"
                          onClick={() =>
                            printReimbursementForm()
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
          <div className="modal-card" style={{ maxWidth: "500px" }}>
            <div className="modal-header">
              <h3>{modalTitle}</h3>

              <button onClick={() => setShowReasonModal(false)}>
                ✕
              </button>
            </div>

            <div
              style={{
                padding: "20px",
                lineHeight: "1.7",
                whiteSpace: "pre-wrap",
              }}
            >
              {modalContent}
            </div>
          </div>
        </div>
      )}
      {rejectionModal && (
        <div className="modal-overlay">
          <div
            className="modal-card"
            style={{
              maxWidth: "600px",
              width: "90%",
            }}
          >
            <div className="modal-header">
              <h3>Reject Reimbursement</h3>

              <button onClick={() => setRejectionModal(false)}>
                ✕
              </button>
            </div>

            <div style={{ padding: "20px" }}>
              <textarea
                rows="4"
                placeholder="Enter rejection reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                style={{ width: "100%" }}
              />

              <button
                className="reject-btn"
                style={{ marginTop: "16px" }}
                onClick={submitRejection}
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

export default ReimbursementApprovals;
