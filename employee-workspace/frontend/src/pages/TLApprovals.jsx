import { useEffect, useState } from "react";
import {
  CheckCircle,
  XCircle,
  ClipboardList,
  X,
} from "lucide-react";

import api from "../api/api";

const TLApprovals = () => {
  const [requests, setRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalContent, setModalContent] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectLeaveId, setRejectLeaveId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [activeTab, setActiveTab] = useState("Pending Review");

  const fetchRequests = async () => {
    try {
      let data;

      if (activeTab === "Pending Review") {
        data = await api.get("/leave/tl-pending");
        setRequests(data.data.leaveRequests || []);
        return;
      }

      data = await api.get("/leave/tl/history");

      let rows = data.data.leaveRequests || [];

      if (activeTab === "Final Approved") {
        rows = rows.filter((x) =>
          ["Approved by Manager", "Approved by HR"].includes(x.finalStatus)
        );
      }

      if (activeTab === "Final Rejected") {
        rows = rows.filter((x) =>
          x.finalStatus?.includes("Rejected")
        );
      }

      setRequests(rows);
    } catch (error) {
      console.log(error.response?.data);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [activeTab]);

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
    setShowRejectModal(true);
  };

  const approveLeave = async (id) => {
    try {
      await api.put(`/leave/tl-approve/${id}`);
      alert("Leave approved by Team Leader");
      await fetchRequests();
    } catch (error) {
      alert(error.response?.data?.message || "Approval failed");
    }
  };

  const submitRejection = async () => {
    if (!rejectionReason.trim()) {
      alert("Rejection reason is required.");
      return;
    }

    try {
      await api.put(`/leave/tl-reject/${rejectLeaveId}`, {
        rejectionReason,
      });

      alert("Leave rejected by Team Leader");

      setShowRejectModal(false);
      setRejectLeaveId(null);
      setRejectionReason("");

      await fetchRequests();
    } catch (error) {
      alert(error.response?.data?.message || "Rejection failed");
    }
  };

  return (
    <>
      <div className="section-header">
        <div>
          <h2 className="card-title">Team Leader Leave Review</h2>
          <p className="section-subtitle">
            Review leave requests from your reporting employees.
          </p>
        </div>
      </div>

      <div className="leave-filter-tabs">
        {[
          "Pending Review",
          "All Requests",
          "Final Approved",
          "Final Rejected",
        ].map((tab) => (
          <button
            key={tab}
            className={activeTab === tab ? "active-filter" : ""}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: "18px" }}>
        <input
          type="text"
          placeholder="Search by employee, email, leave type or status..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: "12px",
            border: "1px solid #d1d5db",
            fontSize: "14px",
          }}
        />
      </div>

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
            {filteredRequests.map((item) => (
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
                  <span
                    className={
                      item.tlStatus === "Approved"
                        ? "badge badge-success"
                        : item.tlStatus === "Rejected"
                          ? "badge badge-danger"
                          : "badge badge-pending"
                    }
                  >
                    {item.tlStatus}
                  </span>
                </td>

                <td>
                  <span
                    className={
                      item.managerStatus === "Approved"
                        ? "badge badge-success"
                        : item.managerStatus === "Rejected"
                          ? "badge badge-danger"
                          : "badge badge-pending"
                    }
                  >
                    {item.managerStatus}
                  </span>
                </td>

                <td>
                  <span
                    className={
                      item.hrStatus === "Approved"
                        ? "badge badge-success"
                        : item.hrStatus === "Rejected"
                          ? "badge badge-danger"
                          : "badge badge-pending"
                    }
                  >
                    {item.hrStatus}
                  </span>
                </td>

                <td>
                  <span
                    className={
                      ["Approved by Manager", "Approved by HR"].includes(item.finalStatus)
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
                  {item.tlStatus === "Pending" &&
                    item.finalStatus === "Pending Final Approval" ? (
                    <div className="action-buttons">
                      <button
                        className="approve-btn"
                        onClick={() => approveLeave(item._id)}
                      >
                        <CheckCircle size={16} />
                        Approve
                      </button>

                      <button
                        className="reject-btn"
                        onClick={() => openRejectModal(item._id)}
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

            {filteredRequests.length === 0 && (
              <tr>
                <td colSpan="8" style={{ textAlign: "center", padding: "24px" }}>
                  No leave requests found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showReasonModal && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: "500px" }}>
            <div className="modal-header">
              <h3>{modalTitle}</h3>

              <button onClick={() => setShowReasonModal(false)}>
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
          <div className="modal-card" style={{ maxWidth: "600px", width: "90%" }}>
            <div className="modal-header">
              <h3>Reject Leave Recommendation</h3>

              <button onClick={() => setShowRejectModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: "20px" }}>
              <textarea
                rows="4"
                placeholder="Enter TL rejection reason"
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

export default TLApprovals;
