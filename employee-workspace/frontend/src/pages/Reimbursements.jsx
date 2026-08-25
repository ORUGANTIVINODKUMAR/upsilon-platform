import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Receipt,
  X,
  Trash2,
  Pencil,
  CircleCheck,
  Clock3,
  CircleX,
} from "lucide-react";

import api from "../api/api";
import StatusBadge from "../components/ui/StatusBadge";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import PageHeader from "../components/ui/PageHeader";
import FileAttachment from "../components/ui/FileAttachment";
import MetricCard from "../components/ui/MetricCard";
import SearchField from "../components/ui/SearchField";
import {
  EmptyState,
  ErrorState,
} from "../components/ui/StatePanel";
import { TableSkeleton } from "../components/ui/Skeleton";

const defaultCategories = [
  "Business Cards",
  "Business Meals",
  "Dues",
  "Legal Fees",
  "License Fees",
  "Mileage",
  "Office Supplies",
  "Passport fee",
  "Postage",
  "Printer Cartridges",
  "Printer Paper",
  "Software",
  "Stationery",
  "Subscriptions",
  "Telephones",
  "Tools",
  "Training Fees",
  "Travel",
  "Work Clothing",
  "Other",
];

const formatLocalDateInput = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatCurrency = (value) => new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
}).format(Number(value || 0));

const formatShortDate = (value) => new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
}).format(new Date(value));

const getApprovalTone = (status = "") => {
  if (/approved|paid/i.test(status)) return "approved";
  if (/rejected/i.test(status)) return "rejected";
  if (/pending/i.test(status)) return "pending";
  return "neutral";
};

const loadReimbursementRequests = async () => {
  const { data } = await api.get("/reimbursements/my-requests");

  return data.reimbursementRequests || data.reimbursements || [];
};

const Reimbursements = () => {

  const [requests, setRequests] = useState([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  const REQUESTS_PER_PAGE = 10;
  const [showModal, setShowModal] =
    useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] =
    useState(false);
  const [editingRequest, setEditingRequest] = useState(null);
  const [requestToDelete, setRequestToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [showReasonModal, setShowReasonModal] =
    useState(false);

  const [selectedReason, setSelectedReason] =
    useState("");
  const [categories, setCategories] =
    useState(defaultCategories);
  const todayDate = formatLocalDateInput();
  const filteredRequests = (requests || []).filter((item) => {
    const matchesFilter =
      activeFilter === "All"
        ? true
        : item.finalStatus === activeFilter;

    const search = searchTerm.toLowerCase();

    const matchesSearch =
      item.businessPurpose
        ?.toLowerCase()
        .includes(search) ||
      item.finalStatus?.toLowerCase()
        .includes(search);

    return matchesFilter && matchesSearch;
  });

  const totalSubmitted = (requests || []).length;

  const approvedAmount = requests
    .filter((item) =>
      [
        "Approved by Manager",
        "Approved by HR",
        "Paid by Finance",
      ].includes(item.finalStatus)
    )
    .reduce((sum, item) => sum + Number(item.totalReimbursement || 0), 0);

  const pendingAmount = requests
    .filter((item) => item.finalStatus === "Pending Final Approval")
    .reduce((sum, item) => sum + Number(item.totalReimbursement || 0), 0);

  const rejectedCount = requests.filter(
    (item) => item.finalStatus?.includes("Rejected")
  ).length;
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
      startIndex + REQUESTS_PER_PAGE
    );
  const [formData, setFormData] =
    useState({
      expenseFrom: "",
      expenseTo: "",
      businessPurpose: "",
      lessCashAdvance: 0,
      receiptFiles: [],

      items: [
        {
          description: "",
          category: "Travel",
          cost: "",
        },
      ],
    });

  const subtotal = useMemo(() => {
    return formData.items.reduce(
      (sum, item) =>
        sum + Number(item.cost || 0),
      0
    );
  }, [formData.items]);

  const totalReimbursement =
    subtotal -
    Number(
      formData.lessCashAdvance || 0
    );

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      setLoadError("");

      setRequests(await loadReimbursementRequests());
    } catch (error) {
      console.error(
        "FETCH REIMBURSEMENTS ERROR:",
        error.response?.data
      );
      setLoadError(
        error.response?.data?.message ||
        "Unable to load reimbursement requests."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isCurrent = true;

    loadReimbursementRequests()
      .then((reimbursementRequests) => {
        if (isCurrent) {
          setRequests(reimbursementRequests);
        }
      })
      .catch((error) => {
        console.error(
          "FETCH REIMBURSEMENTS ERROR:",
          error.response?.data
        );

        if (isCurrent) {
          setLoadError(
            error.response?.data?.message ||
            "Unable to load reimbursement requests."
          );
        }
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(() => {
    if (!showModal && !showReasonModal) return undefined;

    const closeOnEscape = (event) => {
      if (event.key !== "Escape" || submitting) return;
      setShowModal(false);
      setShowReasonModal(false);
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [showModal, showReasonModal, submitting]);

  const handleMainChange = (
    e
  ) => {
    setFormData({
      ...formData,
      [e.target.name]:
        e.target.value,
    });
  };

  const handleItemChange = (
    index,
    field,
    value
  ) => {
    const updatedItems = [
      ...formData.items,
    ];

    updatedItems[index][field] =
      value;

    setFormData({
      ...formData,
      items: updatedItems,
    });
  };

  const handleCategoryChange = (
    index,
    value
  ) => {
    if (value === "__custom__") {
      const customCategory =
        window.prompt(
          "Enter custom category"
        );

      if (
        !customCategory?.trim()
      )
        return;

      const cleanCategory =
        customCategory.trim();

      if (
        !categories.includes(
          cleanCategory
        )
      ) {
        setCategories([
          ...categories,
          cleanCategory,
        ]);
      }

      handleItemChange(
        index,
        "category",
        cleanCategory
      );

      return;
    }

    handleItemChange(
      index,
      "category",
      value
    );
  };

  const addItemRow = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          description: "",
          category: "Travel",
          cost: "",
        },
      ],
    });
  };

  const removeItemRow = (
    index
  ) => {
    const updatedItems =
      formData.items.filter(
        (_, i) => i !== index
      );

    setFormData({
      ...formData,
      items:
        updatedItems.length > 0
          ? updatedItems
          : [
            {
              description: "",
              category:
                "Travel",
              cost: "",
            },
          ],
    });
  };

  const resetForm = () => {
    setFormData({
      expenseFrom: "",
      expenseTo: "",
      businessPurpose: "",
      lessCashAdvance: 0,
      receiptFiles: [],

      items: [
        {
          description: "",
          category: "Travel",
          cost: "",
        },
      ],
    });
  };

  const closeRequestModal = () => {
    if (submitting) return;
    setShowModal(false);
    setEditingRequest(null);
    setFormError("");
    resetForm();
  };

  const openCreateModal = () => {
    setEditingRequest(null);
    resetForm();
    setFormError("");
    setFeedback(null);
    setShowModal(true);
  };

  const openEditModal = (request) => {
    if (request.finalStatus !== "Pending Final Approval") return;
    setEditingRequest(request);
    setFormError("");
    setFeedback(null);
    setFormData({
      expenseFrom: new Date(request.expenseFrom).toISOString().slice(0, 10),
      expenseTo: new Date(request.expenseTo).toISOString().slice(0, 10),
      businessPurpose: request.businessPurpose || "",
      lessCashAdvance: request.lessCashAdvance || 0,
      receiptFiles: [],
      items: request.items?.length
        ? request.items.map((item) => ({
          description: item.description,
          category: item.category,
          cost: item.cost,
        }))
        : [{ description: "", category: "Travel", cost: "" }],
    });
    setShowModal(true);
  };

  const canDeleteRequest = (request) => [
    "Pending Final Approval",
    "Rejected by Manager",
    "Rejected by HR",
  ].includes(request.finalStatus);

  const handleDeleteRequest = async () => {
    if (!requestToDelete) return;
    try {
      setDeleting(true);
      const { data } = await api.delete(`/reimbursements/request/${requestToDelete._id}`);
      setRequests((current) => current.filter((request) => request._id !== requestToDelete._id));
      setFeedback({ type: "success", message: data.message || "Reimbursement request deleted successfully." });
      setRequestToDelete(null);
    } catch (error) {
      setFeedback({ type: "error", message: error.response?.data?.message || "Unable to delete reimbursement request." });
    } finally {
      setDeleting(false);
    }
  };

  const handleSubmit = async (
    e
  ) => {
    e.preventDefault();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expenseFrom = new Date(formData.expenseFrom);
    const expenseTo = new Date(formData.expenseTo);

    if (expenseFrom > today || expenseTo > today) {
      setFormError("Reimbursement expense dates cannot be after today's date.");
      return;
    }

    if (expenseTo < expenseFrom) {
      setFormError("The expense end date cannot be before the start date.");
      return;
    }
    if (
      (!formData.receiptFiles || formData.receiptFiles.length === 0) &&
      !editingRequest?.receiptFiles?.length
    ) {
      setFormError("At least one receipt or invoice is required.");

      return;
    }

    try {
      setSubmitting(true);
      setFormError("");
      const payload =
        new FormData();

      payload.append(
        "expenseFrom",
        formData.expenseFrom
      );

      payload.append(
        "expenseTo",
        formData.expenseTo
      );

      payload.append(
        "businessPurpose",
        formData.businessPurpose
      );

      payload.append(
        "lessCashAdvance",
        formData.lessCashAdvance
      );

      payload.append(
        "items",
        JSON.stringify(
          formData.items
        )
      );
      payload.append(
        "subtotal",
        subtotal
      );

      payload.append(
        "totalReimbursement",
        totalReimbursement
      );
      formData.receiptFiles.forEach((file) => {
        payload.append("receiptFiles", file);
      });

      await api.request({
        method: editingRequest ? "put" : "post",
        url: editingRequest
          ? `/reimbursements/request/${editingRequest._id}`
          : "/reimbursements/request",
        data: payload,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      await fetchRequests();
      setShowModal(false);
      setEditingRequest(null);
      resetForm();
      setFeedback({
        type: "success",
        message: editingRequest
          ? "Reimbursement request updated successfully."
          : "Reimbursement submitted successfully.",
      });
    } catch (error) {
      setFormError(
        error.response?.data?.message ||
        "The reimbursement could not be submitted. Please try again."
      );

      console.log(
        error.response?.data
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div aria-busy={isLoading}>
      <PageHeader
        eyebrow="Expenses"
        title="Reimbursements"
        description="Submit expense claims, keep receipts organized, and follow every approval stage."
        icon={Receipt}
        actions={(
          <button type="button" className="btn btn-primary" onClick={openCreateModal}>
            <Plus size={18} />
            New Request
          </button>
        )}
      />
      {feedback && (
        <div
          className={`alert ${feedback.type === "success" ? "alert-success" : "alert-error"}`}
          role={feedback.type === "error" ? "alert" : "status"}
          aria-live="polite"
        >
          {feedback.message}
        </div>
      )}
      {loadError && !isLoading && (
        <ErrorState
          title="Unable to load reimbursements"
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

      {isLoading && (
        <TableSkeleton columns={8} rows={6} label="Loading reimbursement requests" />
      )}

      {!isLoading && !loadError && (
        <>
      <div className="reimbursement-summary-grid">
        <MetricCard label="Total submitted" value={totalSubmitted} detail="Claims" icon={Receipt} tone="brand" />
        <MetricCard label="Approved" value={formatCurrency(approvedAmount)} detail="Approved value" icon={CircleCheck} tone="success" />
        <MetricCard label="Pending" value={formatCurrency(pendingAmount)} detail="Awaiting review" icon={Clock3} tone="warning" />
        <MetricCard label="Rejected" value={rejectedCount} detail="Claims" icon={CircleX} tone="danger" />
      </div>

      <section className="modern-section-card reimbursement-filter-card" aria-label="Reimbursement filters">
        <SearchField
          id="reimbursement-search"
          label="Search reimbursement requests"
          placeholder="Search by purpose or status…"
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

      <div className="leave-filter-tabs" aria-label="Filter reimbursements by status">
        {[
          "All",
          "Pending Final Approval",
          "Approved by Manager",
          "Approved by HR",
          "Rejected by Manager",
          "Rejected by HR",
          "Paid by Finance",
        ].map((filter) => (
          <button
            key={filter}
            type="button"
            aria-pressed={activeFilter === filter}
            className={activeFilter === filter ? "active-filter" : ""}
            onClick={() => {
              setActiveFilter(filter);
              setCurrentPage(1);
            }}
          >
            {filter === "All" ? "All Claims" : filter}
          </button>
        ))}
      </div>
        <div className="reimbursement-filter-summary">
          <span>
            Showing <strong>{filteredRequests.length}</strong> of {requests.length} claims
          </span>
          {(searchTerm || activeFilter !== "All") && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setSearchTerm("");
                setActiveFilter("All");
                setCurrentPage(1);
              }}
            >
              <X size={14} /> Clear filters
            </button>
          )}
        </div>
      </section>
      <div className="table-wrapper modern-table-wrapper">
        <table className="custom-table reimbursement-request-table">
          <thead>
            <tr>
              <th>Purpose</th>
              <th>Period</th>
              <th>Total</th>
              <th>Receipt</th>
              <th>Status</th>
              <th>Approval Flow</th>
              <th>Reason</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginatedRequests.map((item) => (
              <tr key={item._id}>
                <td data-label="Purpose">
                  <div className="user-cell">
                    <div className="avatar-circle">
                      <Receipt size={16} />
                    </div>

                    <div className="reimbursement-purpose-copy">
                      <strong>{item.businessPurpose}</strong>
                      <small>{item.items?.length || 0} expense item{item.items?.length === 1 ? "" : "s"}</small>
                    </div>
                  </div>
                </td>
                <td data-label="Period">
                  <div className="reimbursement-period">
                    <span>{formatShortDate(item.expenseFrom)}</span>
                    <small>to {formatShortDate(item.expenseTo)}</small>
                  </div>
                </td>

                <td data-label="Total"><strong className="reimbursement-amount">{formatCurrency(item.totalReimbursement)}</strong></td>

                <td data-label="Receipts">
                  {item.receiptFiles?.length > 0 ? (
                    <div className="reimbursement-receipts">
                      {item.receiptFiles.map((file, index) => (
                        <FileAttachment
                          key={index}
                          url={file}
                          label={`Receipt ${index + 1}`}
                          compact
                        />
                      ))}
                    </div>
                  ) : (
                    "N/A"
                  )}
                </td>

                <td data-label="Status">
                  <StatusBadge status={item.finalStatus} />
                </td>

                <td data-label="Approval Flow">
                  <div className="approval-flow">
                    {[
                      ["TL", item.tlStatus || "Pending"],
                      ["Manager", item.managerStatus || "Pending"],
                      ["HR", item.hrStatus || "Pending"],
                      ["Finance", item.financeStatus || "Not Routed"],
                    ].map(([label, status]) => (
                      <span className="reimbursement-approval-step" key={label}>
                        <i className={`is-${getApprovalTone(status)}`} aria-hidden="true" />
                        <span><small>{label}</small><strong>{status}</strong></span>
                      </span>
                    ))}
                  </div>
                </td>
                <td data-label="Reason">
                  {item.rejectionReason ? (
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        setSelectedReason(
                          item.rejectionReason
                        );

                        setShowReasonModal(true);
                      }}
                    >
                      View Reason
                    </button>
                  ) : (
                    "-"
                  )}
                </td>
                <td data-label="Actions">
                  <div className="table-actions">
                    {item.finalStatus === "Pending Final Approval" && (
                      <button type="button" className="btn btn-secondary" onClick={() => openEditModal(item)}>
                        <Pencil size={14} /> Edit
                      </button>
                    )}
                    {canDeleteRequest(item) && (
                      <button type="button" className="btn btn-danger" onClick={() => setRequestToDelete(item)}>
                        <Trash2 size={14} /> Delete
                      </button>
                    )}
                    {item.finalStatus !== "Pending Final Approval" && !canDeleteRequest(item) && (
                      <span className="ui-muted-text">Read only</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}

            {filteredRequests.length === 0 && (
              <tr className="reimbursement-empty-row">
                <td colSpan="8" style={{ textAlign: "center", padding: "24px" }}>
                  <EmptyState
                    compact
                    title="No reimbursement requests found"
                    description={
                      searchTerm || activeFilter !== "All"
                        ? "Try changing your search or status filter."
                        : "Your submitted reimbursement claims will appear here."
                    }
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {filteredRequests.length >
        REQUESTS_PER_PAGE && (
          <div className="ui-pagination" aria-label="Reimbursement pagination">
            <button
              type="button"
              className="btn btn-primary"
              disabled={currentPage === 1}
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
                  aria-current={currentPage === index + 1 ? "page" : undefined}
                  className={
                    currentPage === index + 1
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
              disabled={currentPage === totalPages}
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

      {showModal && (
        <div className="modal-overlay">
          <div
            className="modal-card reimbursement-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reimbursement-form-title"
          >
            <div className="modal-header">
              <h3 id="reimbursement-form-title">
                {editingRequest ? "Edit Reimbursement Request" : "Expense Reimbursement Form"}
              </h3>

              <button
                type="button"
                aria-label="Close reimbursement form"
                disabled={submitting}
                onClick={closeRequestModal}
              >
                <X size={18} />
              </button>
            </div>

            <form
              className="auth-form"
              onSubmit={handleSubmit}
              aria-describedby={formError ? "reimbursement-form-error" : undefined}
            >
              {formError && (
                <div id="reimbursement-form-error" className="alert alert-error" role="alert">
                  {formError}
                </div>
              )}
              <div className="input-group">
                <label htmlFor="reimbursement-receipts">
                  Upload Receipt /
                  Invoice
                </label>

                <input
                  id="reimbursement-receipts"
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      receiptFiles: Array.from(
                        e.target.files
                      ),
                    })
                  }
                  required={!editingRequest?.receiptFiles?.length}
                />
              </div>
              {editingRequest?.receiptFiles?.length > 0 && formData.receiptFiles.length === 0 && (
                <div className="alert alert-info" role="status">
                  {editingRequest.receiptFiles.length} existing receipt(s) will be preserved. Select new files only to replace them.
                </div>
              )}
              {formData.receiptFiles?.length > 0 && (
                <p
                  style={{
                    marginTop: "8px",
                    fontSize: "13px",
                    color: "#64748b",
                  }}
                >
                  {formData.receiptFiles.length} receipt(s) selected
                </p>
              )}
              <div className="grid-2">
                <div className="input-group">
                  <label htmlFor="reimbursement-expense-from">
                    Expense From
                  </label>

                  <input
                    id="reimbursement-expense-from"
                    type="date"
                    name="expenseFrom"
                    max={todayDate}
                    value={
                      formData.expenseFrom
                    }
                    onChange={
                      handleMainChange
                    }
                    required
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="reimbursement-expense-to">
                    Expense To
                  </label>

                  <input
                    id="reimbursement-expense-to"
                    type="date"
                    name="expenseTo"
                    min={formData.expenseFrom || ""}
                    max={todayDate}
                    value={
                      formData.expenseTo
                    }
                    onChange={
                      handleMainChange
                    }
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="reimbursement-business-purpose">
                  Business Purpose
                </label>

                <textarea
                  id="reimbursement-business-purpose"
                  rows="3"
                  name="businessPurpose"
                  placeholder="Enter business purpose"
                  value={
                    formData.businessPurpose
                  }
                  onChange={
                    handleMainChange
                  }
                  required
                />
              </div>

              <div className="reimbursement-toolbar">
                <h4>
                  Itemized Expenses
                </h4>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={
                    addItemRow
                  }
                >
                  <Plus size={16} />
                  Add Row
                </button>
              </div>

              <div className="table-wrapper">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>
                        Description
                      </th>
                      <th>
                        Category
                      </th>
                      <th>Cost</th>
                      <th></th>
                    </tr>
                  </thead>

                  <tbody>
                    {formData.items.map(
                      (
                        item,
                        index
                      ) => (
                        <tr
                          key={
                            index
                          }
                        >
                          <td>
                            <input
                              className="table-input"
                              placeholder="Expense description"
                              value={
                                item.description
                              }
                              onChange={(
                                e
                              ) =>
                                handleItemChange(
                                  index,
                                  "description",
                                  e
                                    .target
                                    .value
                                )
                              }
                              required
                            />
                          </td>

                          <td>
                            <select
                              className="table-input"
                              value={
                                item.category
                              }
                              onChange={(
                                e
                              ) =>
                                handleCategoryChange(
                                  index,
                                  e
                                    .target
                                    .value
                                )
                              }
                              required
                            >
                              {categories.map(
                                (
                                  category
                                ) => (
                                  <option
                                    key={
                                      category
                                    }
                                    value={
                                      category
                                    }
                                  >
                                    {
                                      category
                                    }
                                  </option>
                                )
                              )}

                              <option value="__custom__">
                                +
                                Add
                                Custom
                                Category
                              </option>
                            </select>
                          </td>

                          <td>
                            <input
                              className="table-input"
                              type="number"
                              min="0"
                              placeholder="0"
                              value={
                                item.cost
                              }
                              onChange={(
                                e
                              ) =>
                                handleItemChange(
                                  index,
                                  "cost",
                                  e
                                    .target
                                    .value
                                )
                              }
                              required
                            />
                          </td>

                          <td>
                            <button
                              type="button"
                              className="delete-icon-btn"
                              onClick={() =>
                                removeItemRow(
                                  index
                                )
                              }
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>

              <div className="reimbursement-summary">
                <div>
                  <span>
                    Subtotal
                  </span>

                  <strong>
                    ₹{" "}
                    {
                      subtotal
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Less Cash
                    Advance
                  </span>

                  <input
                    type="number"
                    name="lessCashAdvance"
                    value={
                      formData.lessCashAdvance
                    }
                    onChange={
                      handleMainChange
                    }
                  />
                </div>

                <div className="total-line">
                  <span>
                    Total
                    Reimbursement
                  </span>

                  <strong>
                    ₹{" "}
                    {
                      totalReimbursement
                    }
                  </strong>
                </div>
              </div>

              <button
                className="btn btn-primary"
                type="submit"
                disabled={submitting}
                style={{
                  opacity: submitting ? 0.7 : 1,
                  cursor: submitting ? "not-allowed" : "pointer",
                }}
              >
                {submitting
                  ? (editingRequest ? "Saving..." : "Submitting...")
                  : (editingRequest ? "Save Changes" : "Submit Reimbursement")}
              </button>
            </form>
          </div>
        </div>
      )}
      <ConfirmDialog
        open={Boolean(requestToDelete)}
        title="Delete Reimbursement Request?"
        description="Are you sure you want to delete this reimbursement request? It will be removed from normal views and this action cannot be undone."
        confirmLabel="Delete Request"
        busy={deleting}
        onCancel={() => !deleting && setRequestToDelete(null)}
        onConfirm={handleDeleteRequest}
      />
      {showReasonModal && (
        <div className="modal-overlay">
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reimbursement-reason-title"
            style={{
              maxWidth: "500px",
            }}
          >
            <div className="modal-header">
              <h3 id="reimbursement-reason-title">Rejection Reason</h3>

              <button
                type="button"
                aria-label="Close rejection reason"
                onClick={() =>
                  setShowReasonModal(false)
                }
              >
                ✕
              </button>
            </div>

            <div
              style={{
                padding: "20px",
                lineHeight: "1.7",
                wordBreak: "break-word",
                maxHeight: "400px",
                overflowY: "auto",
              }}
            >
              {selectedReason}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reimbursements;
