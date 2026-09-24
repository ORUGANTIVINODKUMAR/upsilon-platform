import { useEffect, useMemo, useState } from "react";

import {
  Plus,
  CalendarDays,
  X,
  ClipboardList,
  Pencil,
  History,
  Upload,
  Clock3,
  Trash2,
} from "lucide-react";

import api from "../api/api";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import PageHeader from "../components/ui/PageHeader";
import { EmptyState } from "../components/ui/StatePanel";
import StatusBadge from "../components/ui/StatusBadge";
import MetricCard from "../components/ui/MetricCard";
import SearchField from "../components/ui/SearchField";
import { TableSkeleton } from "../components/ui/Skeleton";

const REQUESTS_PER_PAGE = 10;

const APPROVED_STATUSES = [
  "Approved by Manager",
  "Approved by HR",
];

const REJECTED_STATUSES = [
  "Rejected by Team Leader",
  "Rejected by Manager",
  "Rejected by HR",
];

const BLOCKING_STATUSES = [
  "Pending Final Approval",
  "Pending Reapproval",
  "On Hold",
  ...APPROVED_STATUSES,
];

const EDITABLE_STATUSES = [
  "Pending Final Approval",
  "Pending Reapproval",
  "Approved by Manager",
  "Approved by HR",
];

const LEAVE_TYPES = [
  "Sick",
  "Vacation",
  "Personal",
  "Travel",
  "Casual",
  "Earned",
  "Emergency",
];

const EMPTY_FORM_DATA = {
  leaveType: "Sick",
  startDate: "",
  endDate: "",
  reason: "",
  leaveExplanation: "",
  editRemarks: "",
  proofFile: null,
};

const formatDateForInput = (value) => {
  if (!value) {
    return "";
  }

  return new Date(value)
    .toISOString()
    .split("T")[0];
};

const formatDisplayDate = (value) => {
  if (!value) {
    return "N/A";
  }

  return new Date(value).toLocaleDateString();
};

const getReadableFieldName = (field) => {
  const fieldNames = {
    leaveType: "Leave Type",
    startDate: "Start Date",
    endDate: "End Date",
    reason: "Reason",
    leaveExplanation: "Leave Explanation",
    workingDays: "Working Days",
    proofFile: "Proof File",
    finalStatus: "Status",
  };

  return fieldNames[field] || field;
};

const formatHistoryValue = (field, value) => {
  if (value === null || value === undefined || value === "") {
    return "N/A";
  }

  if (field === "startDate" || field === "endDate") {
    return formatDisplayDate(value);
  }

  if (field === "workingDays") {
    return String(value);
  }

  if (field === "proofFile") {
    return value ? "Uploaded file" : "No file";
  }

  return String(value);
};

const LeaveRequests = () => {
  const [requests, setRequests] = useState([]);

  const [activeFilter, setActiveFilter] =
    useState("All");

  const [searchTerm, setSearchTerm] =
    useState("");

  const [currentPage, setCurrentPage] =
    useState(1);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [showFormModal, setShowFormModal] =
    useState(false);

  const [editingRequest, setEditingRequest] =
    useState(null);

  const [showReasonModal, setShowReasonModal] =
    useState(false);

  const [showHistoryModal, setShowHistoryModal] =
    useState(false);

  const [selectedHistoryRequest, setSelectedHistoryRequest] =
    useState(null);

  const [modalTitle, setModalTitle] =
    useState("");

  const [modalContent, setModalContent] =
    useState("");

  const [formData, setFormData] =
    useState({
      ...EMPTY_FORM_DATA,
    });

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [retrospectivePolicy, setRetrospectivePolicy] = useState({
    maxPastDays: 7,
    earliestAllowedDate: "",
    today: "",
  });

  const [requestToCancel, setRequestToCancel] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const safeRequests = useMemo(
    () => (Array.isArray(requests) ? requests : []),
    [requests]
  );

  const currentLocalDate = new Date();
  const todayDate = [
    currentLocalDate.getFullYear(),
    String(currentLocalDate.getMonth() + 1).padStart(2, "0"),
    String(currentLocalDate.getDate()).padStart(2, "0"),
  ].join("-");

  const effectiveToday = retrospectivePolicy.today || todayDate;
  const earliestPastDate = retrospectivePolicy.earliestAllowedDate || (() => {
    const date = new Date(`${todayDate}T00:00:00`);
    date.setDate(date.getDate() - retrospectivePolicy.maxPastDays);
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");
  })();

  const clearFeedback = () => {
    setMessage("");
    setError("");
  };

  const fetchRequests = async () => {
    try {
      setIsLoading(true);

      const { data } = await api.get(
        "/leave/my-requests"
      );

      setRequests(
        data.leaveRequests ||
        data.requests ||
        []
      );

      if (data.retrospectivePolicy) {
        setRetrospectivePolicy(data.retrospectivePolicy);
      }
    } catch (error) {
      console.error(
        "FETCH LEAVE REQUESTS ERROR:",
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
    // Load the employee's leave workflow when this page is mounted.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRequests();
  }, []);

  const filteredRequests = useMemo(() => {
    const normalizedSearch = searchTerm
      .trim()
      .toLowerCase();

    return safeRequests.filter((item) => {
      const matchesFilter =
        activeFilter === "All" ||
        item.finalStatus === activeFilter;

      const matchesSearch =
        !normalizedSearch ||
        item.leaveType
          ?.toLowerCase()
          .includes(normalizedSearch) ||
        item.finalStatus
          ?.toLowerCase()
          .includes(normalizedSearch) ||
        item.reason
          ?.toLowerCase()
          .includes(normalizedSearch) ||
        item.leaveExplanation
          ?.toLowerCase()
          .includes(normalizedSearch);

      return matchesFilter && matchesSearch;
    });
  }, [
    safeRequests,
    activeFilter,
    searchTerm,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredRequests.length /
      REQUESTS_PER_PAGE
    )
  );

  const paginatedRequests = useMemo(() => {
    const startIndex =
      (currentPage - 1) *
      REQUESTS_PER_PAGE;

    return filteredRequests.slice(
      startIndex,
      startIndex +
      REQUESTS_PER_PAGE
    );
  }, [
    filteredRequests,
    currentPage,
  ]);

  useEffect(() => {
    if (currentPage > totalPages) {
      // Keep pagination inside the current filtered result set.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentPage(totalPages);
    }
  }, [
    currentPage,
    totalPages,
  ]);

  const pendingCount = useMemo(
    () =>
      safeRequests.filter((item) =>
        [
          "Pending Final Approval",
          "Pending Reapproval",
        ].includes(item.finalStatus)
      ).length,
    [safeRequests]
  );

  const approvedCount = useMemo(
    () =>
      safeRequests.filter((item) =>
        APPROVED_STATUSES.includes(
          item.finalStatus
        )
      ).length,
    [safeRequests]
  );

  const rejectedCount = useMemo(
    () =>
      safeRequests.filter((item) =>
        REJECTED_STATUSES.includes(
          item.finalStatus
        )
      ).length,
    [safeRequests]
  );

  const reapprovalCount = useMemo(
    () =>
      safeRequests.filter(
        (item) =>
          item.finalStatus ===
          "Pending Reapproval"
      ).length,
    [safeRequests]
  );

  const cancelledCount = useMemo(
    () => safeRequests.filter((item) => item.finalStatus === "Cancelled").length,
    [safeRequests]
  );

  const resetForm = () => {
    setFormData({
      ...EMPTY_FORM_DATA,
    });
  };

  const closeFormModal = () => {
    setShowFormModal(false);
    setEditingRequest(null);
    setIsSubmitting(false);
    resetForm();
    clearFeedback();
  };

  const openCreateModal = () => {
    setEditingRequest(null);
    resetForm();
    clearFeedback();
    setShowFormModal(true);
  };

  const canEditRequest = (request) => {
    return EDITABLE_STATUSES.includes(
      request.finalStatus
    );
  };

  const openEditModal = (request) => {
    if (!canEditRequest(request)) {
      setError(
        "This leave request cannot be edited in its current status."
      );
      return;
    }

    setEditingRequest(request);
    clearFeedback();

    setFormData({
      leaveType:
        request.leaveType || "Sick",

      startDate:
        formatDateForInput(
          request.startDate
        ),

      endDate:
        formatDateForInput(
          request.endDate
        ),

      reason:
        request.reason || "",

      leaveExplanation:
        request.leaveExplanation || "",

      editRemarks: "",

      proofFile: null,
    });

    setShowFormModal(true);
  };

  const openReasonModal = (
    title,
    content
  ) => {
    setModalTitle(title);

    setModalContent(
      content ||
      "No details available."
    );

    setShowReasonModal(true);
  };

  const openHistoryModal = (request) => {
    setSelectedHistoryRequest(request);
    setShowHistoryModal(true);
  };

  const closeHistoryModal = () => {
    setSelectedHistoryRequest(null);
    setShowHistoryModal(false);
  };

  const handleChange = (event) => {
    const {
      name,
      value,
      files,
    } = event.target;

    if (name === "proofFile") {
      const selectedFile =
        files?.[0] || null;

      setFormData(
        (previousData) => ({
          ...previousData,
          proofFile:
            selectedFile,
        })
      );

      clearFeedback();
      return;
    }

    setFormData(
      (previousData) => ({
        ...previousData,
        [name]: value,
      })
    );

    clearFeedback();
  };

  const handleStartDateChange = (
    event
  ) => {
    const selectedStartDate =
      event.target.value;

    setFormData(
      (previousData) => ({
        ...previousData,

        startDate:
          selectedStartDate,

        endDate:
          previousData.endDate &&
            previousData.endDate <
            selectedStartDate
            ? ""
            : previousData.endDate,
      })
    );

    clearFeedback();
  };

  const calculateWorkingDaysPreview = (
    startDate,
    endDate
  ) => {
    if (!startDate || !endDate) {
      return 0;
    }

    let count = 0;

    const current =
      new Date(startDate);

    const end =
      new Date(endDate);

    while (current <= end) {
      const day =
        current.getDay();

      if (
        day !== 0 &&
        day !== 6
      ) {
        count += 1;
      }

      current.setDate(
        current.getDate() + 1
      );
    }

    return count;
  };

  const workingDaysPreview =
    calculateWorkingDaysPreview(
      formData.startDate,
      formData.endDate
    );

  const isPastLeaveRequest = Boolean(
    formData.startDate && formData.startDate < effectiveToday
  );

  const minimumSelectableStartDate = editingRequest &&
    formatDateForInput(editingRequest.startDate) < earliestPastDate
    ? formatDateForInput(editingRequest.startDate)
    : earliestPastDate;

  const isEditingApprovedRequest =
    Boolean(
      editingRequest &&
      APPROVED_STATUSES.includes(
        editingRequest.finalStatus
      )
    );
  const validateForm = () => {
    if (!formData.leaveType) {
      return "Leave type is required.";
    }

    if (!formData.startDate) {
      return "Start date is required.";
    }

    if (!formData.endDate) {
      return "End date is required.";
    }

    if (
      new Date(formData.endDate) <
      new Date(formData.startDate)
    ) {
      return "End date cannot be earlier than start date.";
    }

    if (formData.startDate < earliestPastDate) {
      return retrospectivePolicy.maxPastDays === 0
        ? "Past leave requests are not currently allowed."
        : `Past leave can only be requested within the last ${retrospectivePolicy.maxPastDays} days. Select ${earliestPastDate} or a later date.`;
    }

    const overlappingRequest = safeRequests.find((request) => {
      if (request._id === editingRequest?._id || !BLOCKING_STATUSES.includes(request.finalStatus)) {
        return false;
      }

      const requestStart = formatDateForInput(request.startDate);
      const requestEnd = formatDateForInput(request.endDate);
      return requestStart <= formData.endDate && requestEnd >= formData.startDate;
    });

    if (overlappingRequest) {
      return `These dates overlap your ${overlappingRequest.finalStatus.toLowerCase()} request from ${formatDisplayDate(overlappingRequest.startDate)} to ${formatDisplayDate(overlappingRequest.endDate)}.`;
    }

    if (!formData.reason.trim()) {
      return "Leave reason is required.";
    }

    if (
      formData.reason.trim().length < 3
    ) {
      return "Leave reason must contain at least 3 characters.";
    }

    if (
      formData.proofFile &&
      formData.proofFile.size >
      10 * 1024 * 1024
    ) {
      return "Proof file must not exceed 10 MB.";
    }

    if (
      formData.proofFile &&
      ![
        "application/pdf",
        "image/jpeg",
        "image/png",
      ].includes(
        formData.proofFile.type
      )
    ) {
      return "Proof file must be PDF, JPG, JPEG, or PNG.";
    }

    return "";
  };

  const buildRequestPayload = () => {
    const payload = new FormData();

    payload.append(
      "leaveType",
      formData.leaveType
    );

    payload.append(
      "startDate",
      formData.startDate
    );

    payload.append(
      "endDate",
      formData.endDate
    );

    payload.append(
      "reason",
      formData.reason.trim()
    );

    payload.append(
      "leaveExplanation",
      formData.leaveExplanation.trim()
    );

    if (
      editingRequest &&
      formData.editRemarks.trim()
    ) {
      payload.append(
        "editRemarks",
        formData.editRemarks.trim()
      );
    }

    if (formData.proofFile) {
      payload.append(
        "proofFile",
        formData.proofFile
      );
    }

    return payload;
  };

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    const validationMessage =
      validateForm();

    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    try {
      setIsSubmitting(true);
      clearFeedback();

      const payload =
        buildRequestPayload();

      let response;

      if (editingRequest) {
        response = await api.put(
          `/leave/request/${editingRequest._id}`,
          payload
        );
      } else {
        response = await api.post(
          "/leave/request",
          payload
        );
      }

      const responseMessage =
        response.data?.message ||
        (editingRequest
          ? "Leave request updated successfully."
          : "Leave request submitted successfully.");

      setMessage(responseMessage);

      await fetchRequests();

      setCurrentPage(1);

      setShowFormModal(false);
      setEditingRequest(null);
      resetForm();

      window.dispatchEvent(
        new CustomEvent(
          "leave-requests-updated"
        )
      );
    } catch (error) {
      console.error(
        editingRequest
          ? "UPDATE LEAVE REQUEST ERROR:"
          : "CREATE LEAVE REQUEST ERROR:",
        error.response?.data ||
        error.message
      );

      setError(
        error.response?.data?.message ||
        (editingRequest
          ? "Unable to update leave request."
          : "Unable to submit leave request.")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!requestToCancel) return;

    try {
      setIsCancelling(true);
      clearFeedback();
      const { data } = await api.delete(`/leave/request/${requestToCancel._id}`);
      setRequests((current) => current.filter((request) => request._id !== requestToCancel._id));
      setMessage(data.message || "Leave request deleted successfully.");
      setRequestToCancel(null);
      await fetchRequests();
      window.dispatchEvent(new CustomEvent("leave-requests-updated"));
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Unable to delete this leave request."
      );
    } finally {
      setIsCancelling(false);
    }
  };

  const canCancelRequest = (request) => [
    "Pending Final Approval",
    "Pending Reapproval",
    "On Hold",
    "Rejected by Team Leader",
    "Rejected by Manager",
    "Rejected by HR",
  ].includes(request.finalStatus);

  const getActionLabel = (
    request
  ) => {
    if (
      APPROVED_STATUSES.includes(
        request.finalStatus
      )
    ) {
      return "Edit & Reapprove";
    }

    if (
      request.finalStatus ===
      "Pending Reapproval"
    ) {
      return "Edit Again";
    }

    return "Edit";
  };

  const getApprovalFlowText = (
    request
  ) => {
    const steps = [];

    if (
      request.tlStatus !==
      "Not Required"
    ) {
      steps.push({
        label: "TL",
        value:
          request.tlStatus ||
          "Pending",
      });
    }

    steps.push({
      label: "Manager",
      value:
        request.managerStatus ||
        "Pending",
    });

    steps.push({
      label: "HR",
      value:
        request.hrStatus ||
        "Pending",
    });

    return steps;
  };

  const getLatestEditEntry = (
    request
  ) => {
    const history =
      Array.isArray(
        request.editHistory
      )
        ? request.editHistory
        : [];

    if (history.length === 0) {
      return null;
    }

    return history[
      history.length - 1
    ];
  };

  const getPreviousAndUpdatedRows = (
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

  const closeReasonModal = () => {
    setShowReasonModal(false);
    setModalTitle("");
    setModalContent("");
  };

  const getRequestEditWarning = () => {
    if (
      !editingRequest
    ) {
      return "";
    }

    if (
      APPROVED_STATUSES.includes(
        editingRequest.finalStatus
      )
    ) {
      return "This leave request is already approved. Saving changes will move it to Pending Reapproval and require Manager/HR approval again.";
    }

    if (
      editingRequest.finalStatus ===
      "Pending Reapproval"
    ) {
      return "This request is already awaiting reapproval. Further edits will be added to the edit history.";
    }

    return "Changes to this pending leave request will be saved directly and recorded in the edit history.";
  };

  const formTitle = editingRequest
    ? APPROVED_STATUSES.includes(
      editingRequest.finalStatus
    )
      ? "Edit Approved Leave Request"
      : "Edit Leave Request"
    : "Leave Request Form";

  const submitButtonText =
    isSubmitting
      ? editingRequest
        ? "Updating..."
        : "Submitting..."
      : editingRequest
        ? APPROVED_STATUSES.includes(
          editingRequest.finalStatus
        )
          ? "Update & Send for Reapproval"
          : "Update Leave Request"
        : "Submit Leave Request";

  const filterOptions = [
    "All",
    "Pending Final Approval",
    "Pending Reapproval",
    "Approved by Manager",
    "Approved by HR",
    "Rejected by Team Leader",
    "Rejected by Manager",
    "Rejected by HR",
    "Cancelled",
  ];
  return (
    <>
      <PageHeader
        eyebrow="Time away"
        title="Leave Requests"
        description={`Apply for upcoming leave or report absence from the last ${retrospectivePolicy.maxPastDays} days, then follow each approval.`}
        icon={CalendarDays}
        actions={(
          <button type="button" className="btn btn-primary" onClick={openCreateModal}>
            <Plus size={18} />
            New Request
          </button>
        )}
      />

      {message && (
        <div className="alert alert-success">
          {message}
        </div>
      )}

      {error && !showFormModal && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <div className="reimbursement-summary-grid">
        <MetricCard label="Total requests" value={safeRequests.length} detail="Leave applications" icon={ClipboardList} tone="brand" />
        <MetricCard label="Pending" value={pendingCount} detail="Under review" icon={Clock3} tone="warning" />
        <MetricCard label="Pending reapproval" value={reapprovalCount} detail="Edited after approval" icon={History} tone="info" />
        <MetricCard label="Approved" value={approvedCount} detail="Accepted" icon={CalendarDays} tone="success" />
        <MetricCard label="Rejected" value={rejectedCount} detail="Declined" icon={X} tone="danger" />
        <MetricCard label="Cancelled" value={cancelledCount} detail="Withdrawn by you" icon={Trash2} tone="neutral" />
      </div>

      <div className="ui-filter-search-row">
        <SearchField
          id="leave-request-search"
          label="Search leave requests"
          placeholder="Search by leave type, status, reason, or explanation…"
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
        {filterOptions.map((filter) => (
          <button
            type="button"
            key={filter}
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
              <th>Leave Type</th>
              <th>Duration</th>
              <th>Submitted</th>
              <th>Working Days</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Approval Flow</th>
              <th>Last Edited</th>
              <th>Rejection Reason</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {isLoading && (
              <tr>
                <td
                  colSpan="10"
                  style={{
                    textAlign: "center",
                    padding: "24px",
                  }}
                >
                  <TableSkeleton columns={10} rows={5} label="Loading leave requests" />
                </td>
              </tr>
            )}

            {!isLoading &&
              paginatedRequests.map((item) => {
                const latestEdit =
                  getLatestEditEntry(item);

                const approvalSteps =
                  getApprovalFlowText(item);

                return (
                  <tr key={item._id}>
                    <td>
                      <div className="user-cell">
                        <div className="avatar-circle">
                          <ClipboardList size={16} />
                        </div>

                        <div>
                          <strong>
                            {item.leaveType}
                          </strong>

                          {item.requiresReapproval && (
                            <div
                              style={{
                                marginTop: "5px",
                              }}
                            >
                              <span className="badge badge-pending">
                                Reapproval Required
                              </span>
                            </div>
                          )}

                          {(item.requestKind === "Retrospective" ||
                            formatDateForInput(item.startDate) < formatDateForInput(item.submittedAt || item.createdAt)) && (
                            <span className="leave-request-kind">
                              <Clock3 size={13} />
                              Past Leave Request
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td>
                      {formatDisplayDate(
                        item.startDate
                      )}
                      {" - "}
                      {formatDisplayDate(
                        item.endDate
                      )}
                    </td>

                    <td>
                      <time dateTime={item.submittedAt || item.createdAt}>
                        {formatDisplayDate(item.submittedAt || item.createdAt)}
                      </time>
                    </td>

                    <td>
                      {item.workingDays || 0}
                    </td>

                    <td>
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          flexWrap: "wrap",
                        }}
                      >
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() =>
                            openReasonModal(
                              "Leave Reason",
                              item.reason
                            )
                          }
                        >
                          View Reason
                        </button>

                        {item.leaveExplanation && (
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() =>
                              openReasonModal(
                                "Leave Explanation",
                                item.leaveExplanation
                              )
                            }
                          >
                            Explanation
                          </button>
                        )}
                      </div>
                    </td>

                    <td>
                      <StatusBadge status={item.finalStatus} />
                    </td>

                    <td>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                          fontSize: "13px",
                        }}
                      >
                        {approvalSteps.map((step) => (
                          <div key={step.label}>
                            <strong>
                              {step.label}:
                            </strong>{" "}
                            {step.value}
                          </div>
                        ))}
                      </div>
                    </td>

                    <td>
                      {latestEdit ? (
                        <div
                          style={{
                            fontSize: "13px",
                          }}
                        >
                          <div>
                            {latestEdit.editedBy?.name ||
                              item.lastEditedBy?.name ||
                              "User"}
                          </div>

                          <div
                            style={{
                              color: "#64748b",
                              marginTop: "4px",
                            }}
                          >
                            {formatDisplayDate(
                              latestEdit.editedAt ||
                              item.lastEditedAt
                            )}
                          </div>
                        </div>
                      ) : (
                        "-"
                      )}
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

                    <td>
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          flexWrap: "wrap",
                        }}
                      >
                        {canEditRequest(item) && (
                          <button
                            type="button"
                            className="btn"
                            onClick={() =>
                              openEditModal(item)
                            }
                          >
                            <Pencil size={14} />
                            {getActionLabel(item)}
                          </button>
                        )}

                        {canCancelRequest(item) && (
                          <button
                            type="button"
                            className="btn btn-danger"
                            onClick={() => setRequestToCancel(item)}
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        )}

                        {Array.isArray(
                          item.editHistory
                        ) &&
                          item.editHistory.length >
                          0 && (
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={() =>
                                openHistoryModal(item)
                              }
                            >
                              <History size={14} />
                              History
                            </button>
                          )}

                        {!canEditRequest(item) &&
                          (!item.editHistory ||
                            item.editHistory.length ===
                            0) && (
                            <span
                              style={{
                                color: "#64748b",
                                fontSize: "13px",
                              }}
                            >
                              No actions
                            </span>
                          )}
                      </div>
                    </td>
                  </tr>
                );
              })}

            {!isLoading &&
              filteredRequests.length === 0 && (
                <tr>
                  <td
                    colSpan="10"
                    style={{
                      textAlign: "center",
                      padding: "24px",
                    }}
                  >
                    <EmptyState
                      compact
                      title={searchTerm || activeFilter !== "All" ? "No matching requests" : "No leave requests yet"}
                      description={searchTerm || activeFilter !== "All"
                        ? "Try a different search term or status filter."
                        : "Create your first request when you need time away."}
                      action={!searchTerm && activeFilter === "All" ? (
                        <button type="button" className="btn btn-primary" onClick={openCreateModal}>
                          <Plus size={16} /> New request
                        </button>
                      ) : undefined}
                    />
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
              onClick={() =>
                setCurrentPage((previousPage) =>
                  Math.max(
                    1,
                    previousPage - 1
                  )
                )
              }
            >
              Previous
            </button>

            {Array.from(
              {
                length: totalPages,
              },
              (_, index) => index + 1
            ).map((pageNumber) => (
              <button
                type="button"
                key={pageNumber}
                className={
                  currentPage === pageNumber
                    ? "btn btn-primary"
                    : "btn"
                }
                onClick={() =>
                  setCurrentPage(pageNumber)
                }
              >
                {pageNumber}
              </button>
            ))}

            <button
              type="button"
              className="btn btn-primary"
              disabled={
                currentPage === totalPages
              }
              onClick={() =>
                setCurrentPage((previousPage) =>
                  Math.min(
                    totalPages,
                    previousPage + 1
                  )
                )
              }
            >
              Next
            </button>
          </div>
        )}
      {showFormModal && (
        <div className="modal-overlay leave-request-modal-overlay">
          <div
            className="modal-card leave-request-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="leave-request-modal-title"
            style={{
              maxWidth: "760px",
              width: "94%",
            }}
          >
            <div className="modal-header">
              <h3 id="leave-request-modal-title">{formTitle}</h3>

              <button
                type="button"
                aria-label="Close leave request form"
                onClick={closeFormModal}
                disabled={isSubmitting}
              >
                <X size={18} />
              </button>
            </div>

            {error && (
              <div
                className="alert alert-error"
                style={{
                  margin: "0 20px 12px",
                }}
              >
                {error}
              </div>
            )}

            {editingRequest && (
              <div
                className="leave-request-edit-notice"
                style={{
                  margin: "0 20px 16px",
                  padding: "12px 14px",
                  borderRadius: "10px",
                  background: isEditingApprovedRequest
                    ? "#fff7ed"
                    : "#f8fafc",
                  border: isEditingApprovedRequest
                    ? "1px solid #fdba74"
                    : "1px solid #e2e8f0",
                  color: isEditingApprovedRequest
                    ? "#9a3412"
                    : "#475569",
                  fontSize: "13px",
                  lineHeight: 1.6,
                }}
              >
                {getRequestEditWarning()}
              </div>
            )}

            <form
              className="auth-form leave-request-form-shell"
              onSubmit={handleSubmit}
            >
              <div className="leave-request-modal-body">

                {isPastLeaveRequest && (
                  <div className="past-leave-notice" role="status">
                    <Clock3 size={20} aria-hidden="true" />
                    <div>
                      <strong>Past Leave Request</strong>
                      <span>
                        This absence is before today. It will be recorded as a retrospective request and follow the normal approval workflow.
                      </span>
                    </div>
                  </div>
                )}

              <div className="grid-2">
                <div className="input-group">
                  <label>Leave Type</label>

                  <select
                    name="leaveType"
                    value={formData.leaveType}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    required
                  >
                    {LEAVE_TYPES.map(
                      (leaveType) => (
                        <option
                          key={leaveType}
                          value={leaveType}
                        >
                          {leaveType}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="input-group">
                  <label>
                    Working Days Preview
                  </label>

                  <input
                    value={
                      workingDaysPreview > 0
                        ? `${workingDaysPreview} day(s)`
                        : "Select valid dates"
                    }
                    disabled
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="input-group">
                  <label>Start Date</label>

                  <input
                    type="date"
                    name="startDate"
                    min={minimumSelectableStartDate}
                    value={formData.startDate}
                    onChange={handleStartDateChange}
                    disabled={isSubmitting}
                    required
                  />
                  <small className="leave-date-help">
                    Past leave is accepted from {formatDisplayDate(earliestPastDate)} onward.
                  </small>
                </div>

                <div className="input-group">
                  <label>End Date</label>

                  <input
                    type="date"
                    name="endDate"
                    min={
                      formData.startDate || minimumSelectableStartDate
                    }
                    disabled={
                      !formData.startDate ||
                      isSubmitting
                    }
                    value={formData.endDate}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Reason</label>

                <textarea
                  rows="3"
                  name="reason"
                  placeholder="Enter leave reason"
                  value={formData.reason}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div className="input-group">
                <label>
                  Leave Explanation
                </label>

                <textarea
                  rows="3"
                  name="leaveExplanation"
                  placeholder="Add more details if required"
                  value={
                    formData.leaveExplanation
                  }
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
              </div>

              {editingRequest && (
                <div className="input-group">
                  <label>
                    Edit Remarks
                  </label>

                  <textarea
                    rows="2"
                    name="editRemarks"
                    placeholder="Why are you changing this leave request?"
                    value={
                      formData.editRemarks
                    }
                    onChange={handleChange}
                    disabled={isSubmitting}
                  />
                </div>
              )}

              <div className="input-group">
                <label>
                  Proof File
                </label>

                <input
                  type="file"
                  name="proofFile"
                  accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                  onChange={handleChange}
                  disabled={isSubmitting}
                />

                <small
                  style={{
                    marginTop: "6px",
                    color: "#64748b",
                  }}
                >
                  Optional. PDF, JPG, JPEG, or PNG.
                  Maximum size: 10 MB.
                </small>

                {editingRequest?.proofFile &&
                  !formData.proofFile && (
                    <small
                      style={{
                        marginTop: "5px",
                        color: "#475569",
                      }}
                    >
                      Existing proof file will be kept
                      unless you upload a replacement.
                    </small>
                  )}

                {formData.proofFile && (
                  <div
                    style={{
                      marginTop: "8px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "13px",
                      color: "#475569",
                    }}
                  >
                    <Upload size={14} />

                    {formData.proofFile.name}
                  </div>
                )}
              </div>

              </div>

              <div className="leave-request-modal-actions">
                <button
                  type="button"
                  className="btn"
                  onClick={closeFormModal}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>

                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    opacity: isSubmitting
                      ? 0.7
                      : 1,
                    cursor: isSubmitting
                      ? "not-allowed"
                      : "pointer",
                  }}
                >
                  <CalendarDays size={16} />
                  {submitButtonText}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showReasonModal && (
        <div className="modal-overlay">
          <div
            className="modal-card"
            style={{
              maxWidth: "500px",
              width: "92%",
            }}
          >
            <div className="modal-header">
              <h3>{modalTitle}</h3>

              <button
                type="button"
                onClick={closeReasonModal}
              >
                <X size={18} />
              </button>
            </div>

            <div
              style={{
                padding: "20px",
                lineHeight: 1.7,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                maxHeight: "320px",
                overflowY: "auto",
              }}
            >
              {modalContent}
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(requestToCancel)}
        title="Delete Leave Request?"
        description={requestToCancel
          ? `Are you sure you want to delete the ${requestToCancel.leaveType} request for ${formatDisplayDate(requestToCancel.startDate)} to ${formatDisplayDate(requestToCancel.endDate)}? This action cannot be undone.`
          : ""}
        confirmLabel="Delete Request"
        busy={isCancelling}
        onCancel={() => !isCancelling && setRequestToCancel(null)}
        onConfirm={handleCancelRequest}
      />

      {showHistoryModal &&
        selectedHistoryRequest && (
          <div className="modal-overlay">
            <div
              className="modal-card"
              style={{
                maxWidth: "900px",
                width: "96%",
              }}
            >
              <div className="modal-header">
                <div>
                  <h3>
                    Leave Edit History
                  </h3>

                  <p
                    style={{
                      margin: "4px 0 0",
                      color: "#64748b",
                      fontSize: "13px",
                    }}
                  >
                    {selectedHistoryRequest.leaveType}{" "}
                    leave
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeHistoryModal}
                >
                  <X size={18} />
                </button>
              </div>

              <div
                style={{
                  padding: "20px",
                  maxHeight: "70vh",
                  overflowY: "auto",
                }}
              >
                {Array.isArray(
                  selectedHistoryRequest.editHistory
                ) &&
                  selectedHistoryRequest.editHistory
                    .length > 0 ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "16px",
                    }}
                  >
                    {[...
                      selectedHistoryRequest.editHistory,
                    ]
                      .reverse()
                      .map(
                        (
                          historyEntry,
                          index
                        ) => {
                          const rows =
                            getPreviousAndUpdatedRows(
                              historyEntry
                            );

                          return (
                            <div
                              key={
                                historyEntry._id ||
                                `${historyEntry.editedAt}-${index}`
                              }
                              style={{
                                border:
                                  "1px solid #e2e8f0",
                                borderRadius:
                                  "12px",
                                overflow:
                                  "hidden",
                              }}
                            >
                              <div
                                style={{
                                  padding:
                                    "12px 14px",
                                  background:
                                    historyEntry.requiredReapproval
                                      ? "#fff7ed"
                                      : "#f8fafc",
                                  borderBottom:
                                    "1px solid #e2e8f0",
                                }}
                              >
                                <div
                                  style={{
                                    display:
                                      "flex",
                                    justifyContent:
                                      "space-between",
                                    gap: "12px",
                                    flexWrap:
                                      "wrap",
                                  }}
                                >
                                  <strong>
                                    Edited by{" "}
                                    {historyEntry
                                      .editedBy
                                      ?.name ||
                                      "User"}
                                  </strong>

                                  <span
                                    style={{
                                      color:
                                        "#64748b",
                                      fontSize:
                                        "13px",
                                    }}
                                  >
                                    {historyEntry.editedAt
                                      ? new Date(
                                        historyEntry.editedAt
                                      ).toLocaleString()
                                      : "N/A"}
                                  </span>
                                </div>

                                <div
                                  style={{
                                    marginTop:
                                      "6px",
                                    display:
                                      "flex",
                                    gap: "8px",
                                    flexWrap:
                                      "wrap",
                                  }}
                                >
                                  {historyEntry.requiredReapproval && (
                                    <span className="badge badge-pending">
                                      Reapproval Required
                                    </span>
                                  )}

                                  {historyEntry.remarks && (
                                    <span
                                      style={{
                                        fontSize:
                                          "13px",
                                        color:
                                          "#475569",
                                      }}
                                    >
                                      {
                                        historyEntry.remarks
                                      }
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div
                                className="table-wrapper"
                                style={{
                                  margin: 0,
                                }}
                              >
                                <table className="custom-table">
                                  <thead>
                                    <tr>
                                      <th>
                                        Field
                                      </th>

                                      <th>
                                        Previous
                                      </th>

                                      <th>
                                        Updated
                                      </th>
                                    </tr>
                                  </thead>

                                  <tbody>
                                    {rows.length >
                                      0 ? (
                                      rows.map(
                                        (
                                          row
                                        ) => (
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
                                          style={{
                                            textAlign:
                                              "center",
                                            padding:
                                              "18px",
                                          }}
                                        >
                                          No changed
                                          fields were
                                          recorded.
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
                  <p>
                    No edit history available.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
    </>
  );
};

export default LeaveRequests;
