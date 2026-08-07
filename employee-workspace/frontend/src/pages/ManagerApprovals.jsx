import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  AlertCircle,
  CheckCircle,
  Clock3,
  FileClock,
  History,
  ListFilter,
  MoreVertical,
  PauseCircle,
  RefreshCcw,
  Search,
  Settings2,
  ShieldCheck,
  X,
  XCircle,
} from "lucide-react";

import api from "../api/api";
import { useAuth } from "../context/AuthContext";

const STATUS_FILTERS = [
  "All",
  "Pending Final Approval",
  "Pending Reapproval",
  "On Hold",
  "Approved",
  "Rejected",
];

const PENDING_STATUSES = [
  "Pending Final Approval",
  "Pending Reapproval",
];

const APPROVED_STATUSES = [
  "Approved by Manager",
  "Approved by HR",
];

const REJECTED_STATUSES = [
  "Rejected by Manager",
  "Rejected by HR",
];

const SUMMARY_CARDS = [
  {
    key: "all",
    label: "All Requests",
    description: "all leave statuses",
    icon: ListFilter,
    className: "leave-summary-all",
  },
  {
    key: "pending",
    label: "Pending Approval",
    description: "new requests",
    icon: Clock3,
    className: "leave-summary-pending",
  },
  {
    key: "reapproval",
    label: "Pending Reapproval",
    description: "edited approved requests",
    icon: FileClock,
    className: "leave-summary-reapproval",
  },
  {
    key: "onHold",
    label: "On Hold",
    description: "temporarily paused",
    icon: PauseCircle,
    className: "leave-summary-hold",
  },
  {
    key: "approved",
    label: "Approved",
    description: "approved leave records",
    icon: ShieldCheck,
    className: "leave-summary-approved",
  },
  {
    key: "rejected",
    label: "Rejected",
    description: "rejected leave records",
    icon: AlertCircle,
    className: "leave-summary-rejected",
  },
];

const formatDisplayDate = (value) => {
  if (!value) {
    return "N/A";
  }

  return new Date(value).toLocaleDateString();
};

const formatDateTime = (value) => {
  if (!value) {
    return "N/A";
  }

  return new Date(value).toLocaleString();
};

const getReadableFieldName = (field) => {
  const names = {
    leaveType: "Leave Type",
    startDate: "Start Date",
    endDate: "End Date",
    reason: "Reason",
    leaveExplanation: "Leave Explanation",
    workingDays: "Working Days",
    proofFile: "Proof File",
    finalStatus: "Final Status",
  };

  return names[field] || field;
};

const formatHistoryValue = (
  field,
  value
) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "N/A";
  }

  if (
    field === "startDate" ||
    field === "endDate"
  ) {
    return formatDisplayDate(value);
  }

  if (field === "proofFile") {
    return value
      ? "Uploaded file"
      : "No file";
  }

  return String(value);
};

const getStatusVisualType = (
  status
) => {
  if (
    status ===
    "Pending Final Approval"
  ) {
    return "pending";
  }

  if (
    status ===
    "Pending Reapproval"
  ) {
    return "reapproval";
  }

  if (status === "On Hold") {
    return "hold";
  }

  if (
    APPROVED_STATUSES.includes(
      status
    )
  ) {
    return "approved";
  }

  if (
    REJECTED_STATUSES.includes(
      status
    )
  ) {
    return "rejected";
  }

  return "pending";
};

const getApprovalDotClass = (
  status
) => {
  if (status === "Approved") {
    return "approved";
  }

  if (status === "Rejected") {
    return "rejected";
  }

  return "pending";
};

const ManagerApprovals = () => {
  const { user } = useAuth();

  const [allRequests, setAllRequests] =
    useState([]);

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("All");

  const [
    searchTerm,
    setSearchTerm,
  ] = useState("");

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [
    showReasonModal,
    setShowReasonModal,
  ] = useState(false);

  const [
    modalTitle,
    setModalTitle,
  ] = useState("");

  const [
    modalContent,
    setModalContent,
  ] = useState("");

  const [
    showRejectModal,
    setShowRejectModal,
  ] = useState(false);

  const [
    selectedRejectRequest,
    setSelectedRejectRequest,
  ] = useState(null);

  const [
    rejectionReason,
    setRejectionReason,
  ] = useState("");

  const [
    showStatusModal,
    setShowStatusModal,
  ] = useState(false);

  const [
    selectedStatusRequest,
    setSelectedStatusRequest,
  ] = useState(null);

  const [
    newStatus,
    setNewStatus,
  ] = useState("");

  const [
    statusRemarks,
    setStatusRemarks,
  ] = useState("");

  const [
    showEditHistoryModal,
    setShowEditHistoryModal,
  ] = useState(false);

  const [
    selectedEditHistoryRequest,
    setSelectedEditHistoryRequest,
  ] = useState(null);

  const [
    showStatusHistoryModal,
    setShowStatusHistoryModal,
  ] = useState(false);

  const [
    selectedStatusHistoryRequest,
    setSelectedStatusHistoryRequest,
  ] = useState(null);

  const [
    openActionMenuId,
    setOpenActionMenuId,
  ] = useState(null);

  const actionMenuRef =
    useRef(null);

  const clearFeedback = () => {
    setMessage("");
    setError("");
  };

  const fetchAllRequests = async () => {
    const { data } = await api.get(
      "/leave/manager-all"
    );

    setAllRequests(
      Array.isArray(
        data.leaveRequests
      )
        ? data.leaveRequests
        : []
    );
  };

  const loadRequests = async () => {
    try {
      setIsLoading(true);
      setError("");

      await fetchAllRequests();
    } catch (error) {
      console.error(
        "LOAD MANAGER LEAVES ERROR:",
        error.response?.data ||
        error.message
      );

      setError(
        error.response?.data?.message ||
        "Unable to load leave requests."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  useEffect(() => {
    const handleDocumentClick = (
      event
    ) => {
      if (
        actionMenuRef.current &&
        !actionMenuRef.current.contains(
          event.target
        )
      ) {
        setOpenActionMenuId(null);
      }
    };

    document.addEventListener(
      "mousedown",
      handleDocumentClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleDocumentClick
      );
    };
  }, []);

  const filteredRequests =
    useMemo(() => {
      const search = searchTerm
        .trim()
        .toLowerCase();

      return allRequests.filter(
        (item) => {
          let matchesStatus =
            true;

          if (
            statusFilter ===
            "Approved"
          ) {
            matchesStatus =
              APPROVED_STATUSES.includes(
                item.finalStatus
              );
          } else if (
            statusFilter ===
            "Rejected"
          ) {
            matchesStatus =
              REJECTED_STATUSES.includes(
                item.finalStatus
              );
          } else if (
            statusFilter !== "All"
          ) {
            matchesStatus =
              item.finalStatus ===
              statusFilter;
          }

          const matchesSearch =
            !search ||
            item.employeeId?.name
              ?.toLowerCase()
              .includes(search) ||
            item.employeeId?.email
              ?.toLowerCase()
              .includes(search) ||
            item.employeeId?.employeeId
              ?.toLowerCase()
              .includes(search) ||
            item.leaveType
              ?.toLowerCase()
              .includes(search) ||
            item.finalStatus
              ?.toLowerCase()
              .includes(search) ||
            item.reason
              ?.toLowerCase()
              .includes(search);

          return (
            matchesStatus &&
            matchesSearch
          );
        }
      );
    }, [
      allRequests,
      statusFilter,
      searchTerm,
    ]);

  const counts = useMemo(() => {
    return {
      all: allRequests.length,

      pending:
        allRequests.filter(
          (item) =>
            item.finalStatus ===
            "Pending Final Approval"
        ).length,

      reapproval:
        allRequests.filter(
          (item) =>
            item.finalStatus ===
            "Pending Reapproval"
        ).length,

      onHold:
        allRequests.filter(
          (item) =>
            item.finalStatus ===
            "On Hold"
        ).length,

      approved:
        allRequests.filter(
          (item) =>
            APPROVED_STATUSES.includes(
              item.finalStatus
            )
        ).length,

      rejected:
        allRequests.filter(
          (item) =>
            REJECTED_STATUSES.includes(
              item.finalStatus
            )
        ).length,
    };
  }, [allRequests]);

  const canApproveOrReject = (
    request
  ) => {
    return (
      request.employeeId?._id !== user?._id &&
      PENDING_STATUSES.includes(request.finalStatus)
    );
  };

  const canChangeStatus = (
    request
  ) => {
    return (
      request.employeeId?._id !== user?._id &&
      [
        "On Hold",
        ...APPROVED_STATUSES,
        ...REJECTED_STATUSES,
      ].includes(request.finalStatus)
    );
  };

  const getEmployeePhoto = (
    request
  ) => {
    return (
      request.employeeId
        ?.profilePhoto?.url || ""
    );
  };

  const getEmployeeInitial = (
    request
  ) => {
    return (
      request.employeeId?.name
        ?.charAt(0)
        ?.toUpperCase() || "U"
    );
  };

  const getApprovalFlow = (
    request
  ) => {
    const flow = [];

    if (
      request.tlStatus !==
      "Not Required"
    ) {
      flow.push({
        label: "TL",
        status:
          request.tlStatus ||
          "Pending",
      });
    }

    flow.push({
      label: "Manager",
      status:
        request.managerStatus ||
        "Pending",
    });

    flow.push({
      label: "HR",
      status:
        request.hrStatus ||
        "Pending",
    });

    return flow;
  };

  const toggleActionMenu = (
    requestId
  ) => {
    setOpenActionMenuId(
      (currentId) =>
        currentId === requestId
          ? null
          : requestId
    );
  };

  const closeActionMenu = () => {
    setOpenActionMenuId(null);
  };

  const openReasonModal = (
    title,
    content
  ) => {
    closeActionMenu();

    setModalTitle(title);

    setModalContent(
      content ||
      "No details available."
    );

    setShowReasonModal(true);
  };

  const closeReasonModal = () => {
    setShowReasonModal(false);
    setModalTitle("");
    setModalContent("");
  };

  const openRejectModal = (
    request
  ) => {
    closeActionMenu();
    clearFeedback();

    setSelectedRejectRequest(
      request
    );

    setRejectionReason("");

    setShowRejectModal(true);
  };

  const closeRejectModal = () => {
    if (isSubmitting) {
      return;
    }

    setShowRejectModal(false);

    setSelectedRejectRequest(
      null
    );

    setRejectionReason("");
  };

  const openStatusModal = (
    request
  ) => {
    closeActionMenu();
    clearFeedback();

    setSelectedStatusRequest(
      request
    );

    setNewStatus("");

    setStatusRemarks("");

    setShowStatusModal(true);
  };

  const closeStatusModal = () => {
    if (isSubmitting) {
      return;
    }

    setShowStatusModal(false);

    setSelectedStatusRequest(
      null
    );

    setNewStatus("");

    setStatusRemarks("");
  };

  const openEditHistoryModal = (
    request
  ) => {
    closeActionMenu();

    setSelectedEditHistoryRequest(
      request
    );

    setShowEditHistoryModal(
      true
    );
  };

  const closeEditHistoryModal =
    () => {
      setShowEditHistoryModal(
        false
      );

      setSelectedEditHistoryRequest(
        null
      );
    };

  const openStatusHistoryModal = (
    request
  ) => {
    closeActionMenu();

    setSelectedStatusHistoryRequest(
      request
    );

    setShowStatusHistoryModal(
      true
    );
  };

  const closeStatusHistoryModal =
    () => {
      setShowStatusHistoryModal(
        false
      );

      setSelectedStatusHistoryRequest(
        null
      );
    };
  const approveLeave = async (
    request
  ) => {
    if (
      !canApproveOrReject(
        request
      )
    ) {
      setError(
        "This leave request is not awaiting approval."
      );
      return;
    }

    const isReapproval =
      request.finalStatus ===
      "Pending Reapproval";

    const confirmed =
      window.confirm(
        isReapproval
          ? "Reapprove this updated leave request?"
          : "Approve this leave request?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setIsSubmitting(true);
      clearFeedback();

      const { data } =
        await api.put(
          `/leave/manager-approve/${request._id}`
        );

      setMessage(
        data.message ||
        (isReapproval
          ? "Leave reapproved successfully."
          : "Leave approved successfully.")
      );

      await fetchAllRequests();
    } catch (error) {
      console.error(
        "APPROVE LEAVE ERROR:",
        error.response?.data ||
        error.message
      );

      setError(
        error.response?.data
          ?.message ||
        "Unable to approve leave request."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitRejection =
    async () => {
      if (
        !selectedRejectRequest
      ) {
        setError(
          "No leave request was selected."
        );
        return;
      }

      if (
        !rejectionReason.trim()
      ) {
        setError(
          "Rejection reason is required."
        );
        return;
      }

      try {
        setIsSubmitting(true);
        clearFeedback();

        const { data } =
          await api.put(
            `/leave/manager-reject/${selectedRejectRequest._id}`,
            {
              rejectionReason:
                rejectionReason.trim(),
            }
          );

        setMessage(
          data.message ||
          "Leave rejected successfully."
        );

        setShowRejectModal(false);

        setSelectedRejectRequest(
          null
        );

        setRejectionReason("");

        await fetchAllRequests();
      } catch (error) {
        console.error(
          "REJECT LEAVE ERROR:",
          error.response?.data ||
          error.message
        );

        setError(
          error.response?.data
            ?.message ||
          "Unable to reject leave request."
        );
      } finally {
        setIsSubmitting(false);
      }
    };

  const changeStatus =
    async () => {
      if (
        !selectedStatusRequest
      ) {
        setError(
          "No leave request was selected."
        );
        return;
      }

      if (!newStatus) {
        setError(
          "Please select a status."
        );
        return;
      }

      if (
        newStatus ===
        selectedStatusRequest.finalStatus
      ) {
        setError(
          "Please select a different status."
        );
        return;
      }

      if (
        !statusRemarks.trim()
      ) {
        setError(
          "Remarks are required."
        );
        return;
      }

      try {
        setIsSubmitting(true);
        clearFeedback();

        const { data } =
          await api.put(
            `/leave/status/${selectedStatusRequest._id}`,
            {
              status:
                newStatus,

              remarks:
                statusRemarks.trim(),
            }
          );

        setMessage(
          data.message ||
          "Leave status updated successfully."
        );

        setShowStatusModal(false);

        setSelectedStatusRequest(
          null
        );

        setNewStatus("");

        setStatusRemarks("");

        await fetchAllRequests();
      } catch (error) {
        console.error(
          "CHANGE LEAVE STATUS ERROR:",
          error.response?.data ||
          error.message
        );

        setError(
          error.response?.data
            ?.message ||
          "Unable to change leave status."
        );
      } finally {
        setIsSubmitting(false);
      }
    };

  const getLatestEdit = (
    request
  ) => {
    const history =
      Array.isArray(
        request.editHistory
      )
        ? request.editHistory
        : [];

    if (
      history.length === 0
    ) {
      return null;
    }

    return history[
      history.length - 1
    ];
  };

  const getEditHistoryRows = (
    historyEntry
  ) => {
    if (!historyEntry) {
      return [];
    }

    const changedFields =
      Array.isArray(
        historyEntry.changedFields
      )
        ? historyEntry.changedFields
        : [];

    return changedFields.map(
      (field) => ({
        field,

        label:
          getReadableFieldName(
            field
          ),

        previous:
          formatHistoryValue(
            field,
            historyEntry
              .previousValues?.[
            field
            ]
          ),

        updated:
          formatHistoryValue(
            field,
            historyEntry
              .updatedValues?.[
            field
            ]
          ),
      })
    );
  };

  const getLatestStatusChange = (
    request
  ) => {
    const history =
      Array.isArray(
        request.statusHistory
      )
        ? request.statusHistory
        : [];

    if (
      history.length === 0
    ) {
      return null;
    }

    return history[
      history.length - 1
    ];
  };

  const getStatusFilterCount = (
    filter
  ) => {
    if (filter === "All") {
      return counts.all;
    }

    if (
      filter ===
      "Pending Final Approval"
    ) {
      return counts.pending;
    }

    if (
      filter ===
      "Pending Reapproval"
    ) {
      return counts.reapproval;
    }

    if (
      filter === "On Hold"
    ) {
      return counts.onHold;
    }

    if (
      filter === "Approved"
    ) {
      return counts.approved;
    }

    if (
      filter === "Rejected"
    ) {
      return counts.rejected;
    }

    return 0;
  };

  const getApproveButtonLabel = (
    request
  ) => {
    return (
      request.finalStatus ===
        "Pending Reapproval"
        ? "Reapprove"
        : "Approve"
    );
  };

  const getRejectButtonLabel = (
    request
  ) => {
    return (
      request.finalStatus ===
        "Pending Reapproval"
        ? "Reject Update"
        : "Reject"
    );
  };

  const getStatusDescription = (
    request
  ) => {
    if (
      request.finalStatus ===
      "Pending Final Approval"
    ) {
      return "Awaiting final approval";
    }

    if (
      request.finalStatus ===
      "Pending Reapproval"
    ) {
      return "Updated request awaiting reapproval";
    }

    if (
      request.finalStatus ===
      "On Hold"
    ) {
      return "Temporarily placed on hold";
    }

    if (
      APPROVED_STATUSES.includes(
        request.finalStatus
      )
    ) {
      return "Approved leave";
    }

    if (
      REJECTED_STATUSES.includes(
        request.finalStatus
      )
    ) {
      return "Rejected leave";
    }

    return "";
  };

  const getAvailableStatusOptions = (
    request
  ) => {
    const allOptions = [
      "Pending Final Approval",
      "On Hold",
      ...(user?.role === "HR"
        ? ["Approved by HR", "Rejected by HR"]
        : ["Approved by Manager", "Rejected by Manager"]),
    ];

    return allOptions.filter(
      (status) =>
        status !==
        request?.finalStatus
    );
  };

  const getLatestEditSummary = (
    request
  ) => {
    const latestEdit =
      getLatestEdit(request);

    if (!latestEdit) {
      return null;
    }

    return {
      editedBy:
        latestEdit.editedBy
          ?.name ||
        request.lastEditedBy
          ?.name ||
        "User",

      editedAt:
        latestEdit.editedAt ||
        request.lastEditedAt,

      changedFields:
        Array.isArray(
          latestEdit.changedFields
        )
          ? latestEdit.changedFields
          : [],

      requiredReapproval:
        Boolean(
          latestEdit.requiredReapproval
        ),
    };
  };

  const getLatestStatusSummary = (
    request
  ) => {
    const latestChange =
      getLatestStatusChange(
        request
      );

    if (!latestChange) {
      return null;
    }

    return {
      changedBy:
        latestChange.changedBy
          ?.name ||
        request.lastStatusChangedBy
          ?.name ||
        "User",

      changedAt:
        latestChange.changedAt ||
        request.lastStatusChangedAt,

      previousStatus:
        latestChange.previousStatus ||
        "N/A",

      newStatus:
        latestChange.newStatus ||
        request.finalStatus,

      remarks:
        latestChange.remarks || "",
    };
  };

  const getActionMenuItems = (
    request
  ) => {
    const items = [];

    items.push({
      key: "reason",
      label: "View Reason",
      icon: FileClock,
      onClick: () =>
        openReasonModal(
          "Leave Reason",
          request.reason
        ),
    });

    if (
      request.leaveExplanation
    ) {
      items.push({
        key: "explanation",
        label:
          "View Explanation",
        icon: FileClock,
        onClick: () =>
          openReasonModal(
            "Leave Explanation",
            request.leaveExplanation
          ),
      });
    }

    if (
      request.rejectionReason
    ) {
      items.push({
        key:
          "rejection-reason",
        label:
          "Rejection Reason",
        icon: XCircle,
        danger: true,
        onClick: () =>
          openReasonModal(
            "Rejection Reason",
            request.rejectionReason
          ),
      });
    }

    if (
      request.tlRejectionReason
    ) {
      items.push({
        key: "tl-reason",
        label: "TL Review Reason",
        icon: AlertCircle,
        onClick: () =>
          openReasonModal(
            "Team Leader Review Reason",
            request.tlRejectionReason
          ),
      });
    }

    if (
      Array.isArray(
        request.editHistory
      ) &&
      request.editHistory.length > 0
    ) {
      items.push({
        key: "edit-history",
        label: "Edit History",
        icon: History,
        onClick: () =>
          openEditHistoryModal(
            request
          ),
      });
    }

    if (
      Array.isArray(
        request.statusHistory
      ) &&
      request.statusHistory.length >
      0
    ) {
      items.push({
        key: "status-history",
        label: "Status History",
        icon: History,
        onClick: () =>
          openStatusHistoryModal(
            request
          ),
      });
    }

    return items;
  };
  return (
    <div className="manager-leave-page">
      <div className="manager-leave-header">
        <div>
          <h2 className="manager-leave-title">
            Final Leave Approvals
          </h2>

          <p className="manager-leave-subtitle">
            Review, approve, reject, hold, and manage employee leave requests.
          </p>
        </div>

        <button
          type="button"
          className="manager-refresh-btn"
          onClick={loadRequests}
          disabled={isLoading}
        >
          <RefreshCcw
            size={16}
            className={
              isLoading
                ? "refresh-icon-spinning"
                : ""
            }
          />

          {isLoading
            ? "Refreshing..."
            : "Refresh"}
        </button>
      </div>

      {message && (
        <div className="alert alert-success">
          {message}
        </div>
      )}

      {error &&
        !showRejectModal &&
        !showStatusModal && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

      <div className="leave-status-summary-grid">
        {SUMMARY_CARDS.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.key}
              className={`leave-status-summary-card ${card.className}`}
            >
              <div className="leave-summary-icon">
                <Icon size={19} />
              </div>

              <span className="leave-summary-label">
                {card.label}
              </span>

              <div className="leave-summary-value">
                {counts[card.key]}
              </div>

              <p className="leave-summary-description">
                {card.description}
              </p>
            </div>
          );
        })}
      </div>

      <div className="leave-status-tabs">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter}
            type="button"
            className={`leave-status-tab ${statusFilter === filter
                ? "active"
                : ""
              }`}
            onClick={() => {
              setStatusFilter(filter);
              closeActionMenu();
            }}
          >
            {filter}

            <span className="leave-status-tab-count">
              {getStatusFilterCount(
                filter
              )}
            </span>
          </button>
        ))}
      </div>

      <div className="leave-approval-toolbar">
        <div className="leave-search-box">
          <Search size={17} />

          <input
            type="text"
            placeholder="Search employee, email, ID, leave type, reason, or status..."
            value={searchTerm}
            onChange={(event) => {
              setSearchTerm(
                event.target.value
              );

              closeActionMenu();
            }}
          />
        </div>
      </div>

      <div className="leave-approval-table-card">
        <div className="leave-approval-table-scroll">
          <table className="leave-approval-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Leave</th>
                <th>Duration</th>
                <th>Approval Flow</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Last Update</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {isLoading && (
                <tr>
                  <td
                    colSpan="8"
                    className="leave-empty-state"
                  >
                    <div className="leave-empty-state-icon">
                      <RefreshCcw
                        size={22}
                      />
                    </div>

                    <div className="leave-empty-state-title">
                      Loading leave requests
                    </div>

                    <p className="leave-empty-state-text">
                      Please wait while the latest records are loaded.
                    </p>
                  </td>
                </tr>
              )}

              {!isLoading &&
                filteredRequests.map(
                  (item) => {
                    const employeePhoto =
                      getEmployeePhoto(
                        item
                      );

                    const approvalFlow =
                      getApprovalFlow(
                        item
                      );

                    const editSummary =
                      getLatestEditSummary(
                        item
                      );

                    const statusSummary =
                      getLatestStatusSummary(
                        item
                      );

                    const statusType =
                      getStatusVisualType(
                        item.finalStatus
                      );

                    const menuItems =
                      getActionMenuItems(
                        item
                      );

                    return (
                      <tr key={item._id}>
                        <td>
                          <div className="leave-employee-cell">
                            <div className="leave-employee-avatar">
                              {employeePhoto ? (
                                <img
                                  src={
                                    employeePhoto
                                  }
                                  alt={
                                    item
                                      .employeeId
                                      ?.name ||
                                    "Employee"
                                  }
                                />
                              ) : (
                                getEmployeeInitial(
                                  item
                                )
                              )}
                            </div>

                            <div className="leave-employee-info">
                              <span className="leave-employee-name">
                                {item
                                  .employeeId
                                  ?.name ||
                                  "Unknown Employee"}
                              </span>

                              <span className="leave-employee-id">
                                #
                                {item
                                  .employeeId
                                  ?.employeeId ||
                                  "N/A"}
                              </span>

                              <span className="leave-employee-email">
                                {item
                                  .employeeId
                                  ?.email ||
                                  "N/A"}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div>
                            <span className="leave-type-name">
                              {
                                item.leaveType
                              }
                            </span>

                            <span className="leave-days-label">
                              {item.workingDays ||
                                0}{" "}
                              working day(s)
                            </span>

                            {item.finalStatus ===
                              "Pending Reapproval" && (
                                <span className="leave-row-marker reapproval">
                                  <FileClock
                                    size={11}
                                  />
                                  Updated request
                                </span>
                              )}

                            {item.finalStatus ===
                              "On Hold" && (
                                <span className="leave-row-marker hold">
                                  <PauseCircle
                                    size={11}
                                  />
                                  On hold
                                </span>
                              )}
                          </div>
                        </td>

                        <td>
                          <div
                            style={{
                              color:
                                "#244438",
                              fontWeight:
                                700,
                              fontSize:
                                "12px",
                            }}
                          >
                            {formatDisplayDate(
                              item.startDate
                            )}
                          </div>

                          <div
                            style={{
                              marginTop:
                                "4px",
                              color:
                                "#89958f",
                              fontSize:
                                "11px",
                            }}
                          >
                            to{" "}
                            {formatDisplayDate(
                              item.endDate
                            )}
                          </div>
                        </td>

                        <td>
                          <div className="approval-flow-list">
                            {approvalFlow.map(
                              (step) => (
                                <div
                                  key={
                                    step.label
                                  }
                                  className="approval-flow-item"
                                >
                                  <span
                                    className={`approval-flow-dot ${getApprovalDotClass(
                                      step.status
                                    )}`}
                                  />

                                  <span className="approval-flow-label">
                                    {
                                      step.label
                                    }
                                  </span>

                                  <span className="approval-flow-value">
                                    {
                                      step.status
                                    }
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        </td>

                        <td>
                          <button
                            type="button"
                            className="leave-reason-btn"
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
                            className={`leave-status-pill ${statusType}`}
                          >
                            {
                              item.finalStatus
                            }
                          </span>

                          <span className="leave-status-description">
                            {getStatusDescription(
                              item
                            )}
                          </span>
                        </td>

                        <td>
                          <div className="leave-last-update">
                            {statusSummary ? (
                              <>
                                <span className="leave-last-update-user">
                                  {
                                    statusSummary.changedBy
                                  }
                                </span>

                                <span className="leave-last-update-time">
                                  {formatDateTime(
                                    statusSummary.changedAt
                                  )}
                                </span>

                                <span className="leave-last-update-change">
                                  {
                                    statusSummary.previousStatus
                                  }
                                  {" → "}
                                  {
                                    statusSummary.newStatus
                                  }
                                </span>
                              </>
                            ) : editSummary ? (
                              <>
                                <span className="leave-last-update-user">
                                  {
                                    editSummary.editedBy
                                  }
                                </span>

                                <span className="leave-last-update-time">
                                  {formatDateTime(
                                    editSummary.editedAt
                                  )}
                                </span>

                                <span className="leave-last-update-change">
                                  {
                                    editSummary
                                      .changedFields
                                      .length
                                  }{" "}
                                  field(s)
                                  changed
                                </span>
                              </>
                            ) : (
                              <span className="leave-last-update-change">
                                No updates
                              </span>
                            )}
                          </div>
                        </td>

                        <td>
                          <div className="leave-row-actions">
                            {canApproveOrReject(
                              item
                            ) && (
                                <>
                                  <button
                                    type="button"
                                    className="leave-primary-action"
                                    onClick={() =>
                                      approveLeave(
                                        item
                                      )
                                    }
                                    disabled={
                                      isSubmitting
                                    }
                                  >
                                    <CheckCircle
                                      size={
                                        14
                                      }
                                    />

                                    {getApproveButtonLabel(
                                      item
                                    )}
                                  </button>

                                  <button
                                    type="button"
                                    className="leave-reject-action"
                                    onClick={() =>
                                      openRejectModal(
                                        item
                                      )
                                    }
                                    disabled={
                                      isSubmitting
                                    }
                                  >
                                    <XCircle
                                      size={
                                        14
                                      }
                                    />

                                    {getRejectButtonLabel(
                                      item
                                    )}
                                  </button>
                                </>
                              )}

                            {canChangeStatus(
                              item
                            ) && (
                                <button
                                  type="button"
                                  className="leave-primary-action"
                                  onClick={() =>
                                    openStatusModal(
                                      item
                                    )
                                  }
                                  disabled={
                                    isSubmitting
                                  }
                                >
                                  <Settings2
                                    size={
                                      14
                                    }
                                  />

                                  Change Status
                                </button>
                              )}

                            {menuItems.length >
                              0 && (
                                <div
                                  className="leave-actions-menu-wrapper"
                                  ref={
                                    openActionMenuId ===
                                      item._id
                                      ? actionMenuRef
                                      : null
                                  }
                                >
                                  <button
                                    type="button"
                                    className="leave-actions-menu-button"
                                    onClick={() =>
                                      toggleActionMenu(
                                        item._id
                                      )
                                    }
                                    aria-label="More actions"
                                    aria-expanded={
                                      openActionMenuId ===
                                      item._id
                                    }
                                  >
                                    <MoreVertical
                                      size={
                                        17
                                      }
                                    />
                                  </button>

                                  {openActionMenuId ===
                                    item._id && (
                                      <div className="leave-actions-menu">
                                        {menuItems.map(
                                          (
                                            menuItem
                                          ) => {
                                            const MenuIcon =
                                              menuItem.icon;

                                            return (
                                              <button
                                                key={
                                                  menuItem.key
                                                }
                                                type="button"
                                                className={
                                                  menuItem.danger
                                                    ? "danger"
                                                    : ""
                                                }
                                                onClick={
                                                  menuItem.onClick
                                                }
                                              >
                                                <MenuIcon
                                                  size={
                                                    14
                                                  }
                                                />

                                                {
                                                  menuItem.label
                                                }
                                              </button>
                                            );
                                          }
                                        )}
                                      </div>
                                    )}
                                </div>
                              )}
                          </div>
                        </td>
                      </tr>
                    );
                  }
                )}

              {!isLoading &&
                filteredRequests.length ===
                0 && (
                  <tr>
                    <td
                      colSpan="8"
                      className="leave-empty-state"
                    >
                      <div className="leave-empty-state-icon">
                        <Search size={22} />
                      </div>

                      <div className="leave-empty-state-title">
                        No leave requests found
                      </div>

                      <p className="leave-empty-state-text">
                        Try changing the status filter or search term.
                      </p>
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>
      </div>
      {showReasonModal && (
        <div className="modal-overlay">
          <div className="manager-leave-modal">
            <div className="modal-header">
              <h3>{modalTitle}</h3>

              <button
                type="button"
                onClick={closeReasonModal}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div
              className="manager-leave-modal-body"
              style={{
                lineHeight: 1.7,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {modalContent}
            </div>
          </div>
        </div>
      )}

      {showRejectModal &&
        selectedRejectRequest && (
          <div className="modal-overlay">
            <div className="manager-leave-modal">
              <div className="modal-header">
                <div>
                  <h3>
                    {selectedRejectRequest.finalStatus ===
                      "Pending Reapproval"
                      ? "Reject Updated Leave Request"
                      : "Reject Leave Request"}
                  </h3>

                  <p
                    style={{
                      marginTop: "5px",
                      color: "#75827b",
                      fontSize: "13px",
                    }}
                  >
                    Provide a clear reason for the employee.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeRejectModal}
                  disabled={isSubmitting}
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="manager-leave-modal-body">
                <div
                  style={{
                    marginBottom: "16px",
                    padding: "14px",
                    border: "1px solid #e2e9e5",
                    borderRadius: "13px",
                    background: "#f8fbf9",
                  }}
                >
                  <strong
                    style={{
                      color: "#173c2e",
                    }}
                  >
                    {selectedRejectRequest
                      .employeeId?.name ||
                      "Employee"}
                  </strong>

                  <div
                    style={{
                      marginTop: "6px",
                      color: "#64736b",
                      fontSize: "13px",
                    }}
                  >
                    {selectedRejectRequest.leaveType} leave
                    {" • "}
                    {formatDisplayDate(
                      selectedRejectRequest.startDate
                    )}
                    {" – "}
                    {formatDisplayDate(
                      selectedRejectRequest.endDate
                    )}
                  </div>
                </div>

                {error && (
                  <div className="alert alert-error">
                    {error}
                  </div>
                )}

                <div className="input-group">
                  <label>Rejection Reason</label>

                  <textarea
                    rows="5"
                    placeholder="Explain why this leave request is being rejected"
                    value={rejectionReason}
                    onChange={(event) => {
                      setRejectionReason(
                        event.target.value
                      );
                      setError("");
                    }}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="manager-leave-modal-footer">
                  <button
                    type="button"
                    className="btn"
                    onClick={closeRejectModal}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="leave-reject-action"
                    onClick={submitRejection}
                    disabled={isSubmitting}
                  >
                    <XCircle size={15} />

                    {isSubmitting
                      ? "Submitting..."
                      : selectedRejectRequest.finalStatus ===
                        "Pending Reapproval"
                        ? "Reject Update"
                        : "Reject Leave"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      {showStatusModal &&
        selectedStatusRequest && (
          <div className="modal-overlay">
            <div className="manager-leave-modal">
              <div className="modal-header">
                <div>
                  <h3>Change Leave Status</h3>

                  <p
                    style={{
                      marginTop: "5px",
                      color: "#75827b",
                      fontSize: "13px",
                    }}
                  >
                    Move this leave to another workflow status.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeStatusModal}
                  disabled={isSubmitting}
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="manager-leave-modal-body">
                <div
                  style={{
                    marginBottom: "16px",
                    padding: "14px",
                    border: "1px solid #e2e9e5",
                    borderRadius: "13px",
                    background: "#f8fbf9",
                  }}
                >
                  <strong
                    style={{
                      color: "#173c2e",
                    }}
                  >
                    {selectedStatusRequest
                      .employeeId?.name ||
                      "Employee"}
                  </strong>

                  <div
                    style={{
                      marginTop: "6px",
                      color: "#64736b",
                      fontSize: "13px",
                    }}
                  >
                    Current status:{" "}
                    <span
                      className={`leave-status-pill ${getStatusVisualType(
                        selectedStatusRequest.finalStatus
                      )}`}
                    >
                      {selectedStatusRequest.finalStatus}
                    </span>
                  </div>
                </div>

                {error && (
                  <div className="alert alert-error">
                    {error}
                  </div>
                )}

                <div className="input-group">
                  <label>New Status</label>

                  <select
                    value={newStatus}
                    onChange={(event) => {
                      setNewStatus(
                        event.target.value
                      );
                      setError("");
                    }}
                    disabled={isSubmitting}
                    required
                  >
                    <option value="">
                      Select a new status
                    </option>

                    {getAvailableStatusOptions(
                      selectedStatusRequest
                    ).map((status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label>Remarks</label>

                  <textarea
                    rows="5"
                    placeholder="Explain why this status is being changed"
                    value={statusRemarks}
                    onChange={(event) => {
                      setStatusRemarks(
                        event.target.value
                      );
                      setError("");
                    }}
                    disabled={isSubmitting}
                    required
                  />
                </div>

                <div className="manager-leave-modal-footer">
                  <button
                    type="button"
                    className="btn"
                    onClick={closeStatusModal}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="leave-primary-action"
                    onClick={changeStatus}
                    disabled={isSubmitting}
                  >
                    <Settings2 size={15} />

                    {isSubmitting
                      ? "Saving..."
                      : "Save Status"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      {showEditHistoryModal &&
        selectedEditHistoryRequest && (
          <div className="modal-overlay">
            <div className="manager-leave-modal manager-leave-modal-wide">
              <div className="modal-header">
                <div>
                  <h3>Leave Edit History</h3>

                  <p
                    style={{
                      marginTop: "5px",
                      color: "#75827b",
                      fontSize: "13px",
                    }}
                  >
                    {selectedEditHistoryRequest
                      .employeeId?.name ||
                      "Employee"}
                    {" • "}
                    {selectedEditHistoryRequest.leaveType}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeEditHistoryModal}
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
              </div>

              <div
                className="manager-leave-modal-body"
                style={{
                  maxHeight: "72vh",
                  overflowY: "auto",
                }}
              >
                {Array.isArray(
                  selectedEditHistoryRequest.editHistory
                ) &&
                  selectedEditHistoryRequest.editHistory
                    .length > 0 ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "16px",
                    }}
                  >
                    {[
                      ...selectedEditHistoryRequest.editHistory,
                    ]
                      .reverse()
                      .map(
                        (
                          historyEntry,
                          index
                        ) => {
                          const rows =
                            getEditHistoryRows(
                              historyEntry
                            );

                          return (
                            <div
                              key={
                                historyEntry._id ||
                                `${historyEntry.editedAt}-${index}`
                              }
                              style={{
                                overflow: "hidden",
                                border:
                                  "1px solid #e2e9e5",
                                borderRadius:
                                  "14px",
                                background:
                                  "#ffffff",
                              }}
                            >
                              <div
                                style={{
                                  padding:
                                    "14px 16px",
                                  borderBottom:
                                    "1px solid #e8eeeb",
                                  background:
                                    historyEntry.requiredReapproval
                                      ? "#fff8ec"
                                      : "#f8fbf9",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent:
                                      "space-between",
                                    gap: "12px",
                                    flexWrap: "wrap",
                                  }}
                                >
                                  <strong
                                    style={{
                                      color:
                                        "#173c2e",
                                    }}
                                  >
                                    Edited by{" "}
                                    {historyEntry
                                      .editedBy
                                      ?.name ||
                                      "User"}
                                  </strong>

                                  <span
                                    style={{
                                      color:
                                        "#7d8983",
                                      fontSize:
                                        "12px",
                                    }}
                                  >
                                    {formatDateTime(
                                      historyEntry.editedAt
                                    )}
                                  </span>
                                </div>

                                {historyEntry.remarks && (
                                  <p
                                    style={{
                                      marginTop:
                                        "7px",
                                      color:
                                        "#52665c",
                                      fontSize:
                                        "13px",
                                    }}
                                  >
                                    {
                                      historyEntry.remarks
                                    }
                                  </p>
                                )}

                                {historyEntry.requiredReapproval && (
                                  <span className="leave-row-marker reapproval">
                                    <FileClock
                                      size={11}
                                    />
                                    Reapproval required
                                  </span>
                                )}
                              </div>

                              <div className="leave-approval-table-scroll">
                                <table className="leave-approval-table">
                                  <thead>
                                    <tr>
                                      <th>Field</th>
                                      <th>Previous</th>
                                      <th>Updated</th>
                                    </tr>
                                  </thead>

                                  <tbody>
                                    {rows.length >
                                      0 ? (
                                      rows.map(
                                        (row) => (
                                          <tr
                                            key={
                                              row.field
                                            }
                                          >
                                            <td>
                                              <strong>
                                                {
                                                  row.label
                                                }
                                              </strong>
                                            </td>

                                            <td>
                                              {
                                                row.previous
                                              }
                                            </td>

                                            <td>
                                              {
                                                row.updated
                                              }
                                            </td>
                                          </tr>
                                        )
                                      )
                                    ) : (
                                      <tr>
                                        <td
                                          colSpan="3"
                                          className="leave-empty-state"
                                        >
                                          No changed fields were recorded.
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          );
                        }
                      )}
                  </div>
                ) : (
                  <div className="leave-empty-state">
                    <div className="leave-empty-state-icon">
                      <History size={22} />
                    </div>

                    <div className="leave-empty-state-title">
                      No edit history
                    </div>

                    <p className="leave-empty-state-text">
                      This leave request has not been edited.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      {showStatusHistoryModal &&
        selectedStatusHistoryRequest && (
          <div className="modal-overlay">
            <div className="manager-leave-modal manager-leave-modal-wide">
              <div className="modal-header">
                <div>
                  <h3>Leave Status History</h3>

                  <p
                    style={{
                      marginTop: "5px",
                      color: "#75827b",
                      fontSize: "13px",
                    }}
                  >
                    {selectedStatusHistoryRequest
                      .employeeId?.name ||
                      "Employee"}
                    {" • "}
                    {selectedStatusHistoryRequest.leaveType}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeStatusHistoryModal}
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
              </div>

              <div
                className="manager-leave-modal-body"
                style={{
                  maxHeight: "70vh",
                  overflowY: "auto",
                }}
              >
                {Array.isArray(
                  selectedStatusHistoryRequest.statusHistory
                ) &&
                  selectedStatusHistoryRequest.statusHistory
                    .length > 0 ? (
                  <div className="leave-approval-table-card">
                    <div className="leave-approval-table-scroll">
                      <table className="leave-approval-table">
                        <thead>
                          <tr>
                            <th>Previous Status</th>
                            <th>New Status</th>
                            <th>Changed By</th>
                            <th>Date & Time</th>
                            <th>Remarks</th>
                          </tr>
                        </thead>

                        <tbody>
                          {[
                            ...selectedStatusHistoryRequest.statusHistory,
                          ]
                            .reverse()
                            .map(
                              (
                                historyEntry,
                                index
                              ) => (
                                <tr
                                  key={
                                    historyEntry._id ||
                                    `${historyEntry.changedAt}-${index}`
                                  }
                                >
                                  <td>
                                    <span
                                      className={`leave-status-pill ${getStatusVisualType(
                                        historyEntry.previousStatus
                                      )}`}
                                    >
                                      {historyEntry.previousStatus ||
                                        "N/A"}
                                    </span>
                                  </td>

                                  <td>
                                    <span
                                      className={`leave-status-pill ${getStatusVisualType(
                                        historyEntry.newStatus
                                      )}`}
                                    >
                                      {historyEntry.newStatus ||
                                        "N/A"}
                                    </span>
                                  </td>

                                  <td>
                                    {historyEntry.changedBy
                                      ?.name ||
                                      "User"}
                                  </td>

                                  <td>
                                    {formatDateTime(
                                      historyEntry.changedAt
                                    )}
                                  </td>

                                  <td>
                                    {historyEntry.remarks ||
                                      "N/A"}
                                  </td>
                                </tr>
                              )
                            )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="leave-empty-state">
                    <div className="leave-empty-state-icon">
                      <History size={22} />
                    </div>

                    <div className="leave-empty-state-title">
                      No status history
                    </div>

                    <p className="leave-empty-state-text">
                      No manual status changes have been recorded.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default ManagerApprovals;
