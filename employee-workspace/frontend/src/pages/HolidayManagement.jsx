import { useEffect, useState } from "react";
import {
  Plus,
  Trash2,
  Sparkles,
  ShieldCheck,
  X,
} from "lucide-react";

import api from "../api/api";
import useConfirm from "../components/ui/useConfirm";
import { useAuth } from "../context/useAuth";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/StatePanel";

const HolidayManagement = () => {
  const confirmAction = useConfirm();
  const { user } = useAuth();

  const [holidays, setHolidays] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [message, setMessage] = useState("");

  const canManageHolidays = ["Admin", "Manager", "HR"].includes(user?.role);

  const [formData, setFormData] = useState({
    name: "",
    holidayDate: "",
    type: "Company",
    description: "",
  });

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/holidays");
      setHolidays(data.holidays || []);
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to fetch holidays");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialLoad = window.setTimeout(fetchHolidays, 0);
    return () => window.clearTimeout(initialLoad);
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      holidayDate: "",
      type: "Company",
      description: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!canManageHolidays) {
      setFormError("You are not allowed to add holidays.");
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError("");
      setMessage("");
      await api.post("/holidays", formData);

      resetForm();
      setShowModal(false);
      await fetchHolidays();
      setMessage("Holiday added successfully.");
    } catch (requestError) {
      setFormError(requestError.response?.data?.message || "Unable to add holiday");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!canManageHolidays) {
      setError("You are not allowed to delete holidays.");
      return;
    }

    if (!await confirmAction({
      title: "Delete this holiday?",
      description: "Working-day calculations for future leave requests may change after removal.",
      confirmLabel: "Delete holiday",
    })) return;

    try {
      setDeletingId(id);
      setError("");
      setMessage("");
      await api.delete(`/holidays/${id}`);
      await fetchHolidays();
      setMessage("Holiday deleted successfully.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to delete holiday");
    } finally {
      setDeletingId("");
    }
  };

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const getDay = (date) =>
    new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
    });

  const getMonth = (date) =>
    new Date(date).toLocaleDateString("en-IN", {
      month: "short",
    });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sortedHolidays = [...holidays].sort(
    (first, second) => new Date(first.holidayDate) - new Date(second.holidayDate),
  );

  const upcomingHolidays = sortedHolidays.filter((item) => {
    const holidayDate = new Date(item.holidayDate);
    holidayDate.setHours(0, 0, 0, 0);
    return holidayDate >= today;
  });

  const nextHoliday = upcomingHolidays[0];

  const closeModal = () => {
    if (isSubmitting) return;
    setShowModal(false);
    setFormError("");
    resetForm();
  };

  return (
    <>
      <div className="section-header">
        <div>
          <h2 className="card-title">Holiday Calendar</h2>
          <p className="section-subtitle">
            View company, national and festival holidays.
          </p>
        </div>

        {canManageHolidays && (
          <button
            className="btn btn-primary"
            onClick={() => {
              setFormError("");
              setShowModal(true);
            }}
          >
            <Plus size={18} />
            Add Holiday
          </button>
        )}
      </div>

      {error && (
        <ErrorState
          title="Holiday calendar unavailable"
          description={error}
          action={<button type="button" className="btn" onClick={fetchHolidays}>Try again</button>}
          compact
        />
      )}
      {message && <div className="alert alert-success" role="status" aria-live="polite">{message}</div>}

      <div className="holiday-overview-grid">
        <div className="holiday-hero-card">
          <div className="holiday-hero-copy">
            <span className="holiday-hero-eyebrow">
              Next Holiday
            </span>

            <h2>
              {nextHoliday?.name || "No Upcoming Holiday"}
            </h2>

            <p>
              {nextHoliday
                ? `${formatDate(nextHoliday.holidayDate)} - ${nextHoliday.type}`
                : "No upcoming holiday configured yet."}
            </p>
          </div>

          <div className="holiday-hero-date" aria-label={nextHoliday ? formatDate(nextHoliday.holidayDate) : "No upcoming holiday date"}>
            <strong>
              {nextHoliday ? getDay(nextHoliday.holidayDate) : "--"}
            </strong>
            <span>
              {nextHoliday ? getMonth(nextHoliday.holidayDate) : "---"}
            </span>
          </div>
        </div>

        <div className="reimbursement-summary-card">
          <span>Your Access</span>
          <h3>{canManageHolidays ? "Manage" : "View Only"}</h3>
          <p>{user?.role}</p>

          <div className="holiday-access-detail">
            <ShieldCheck size={22} />
            <p>
              {canManageHolidays
                ? "You can add and remove holidays."
                : "You can view the holiday calendar."}
            </p>
          </div>
        </div>
      </div>

      <div className="reimbursement-summary-grid">
        <div className="reimbursement-summary-card">
          <span>Total Holidays</span>
          <h3>{holidays.length}</h3>
          <p>configured</p>
        </div>

        <div className="reimbursement-summary-card">
          <span>Upcoming Holidays</span>
          <h3>{upcomingHolidays.length}</h3>
          <p>from today</p>
        </div>

        <div className="reimbursement-summary-card">
          <span>Calendar Type</span>
          <h3>Company</h3>
          <p>shared across roles</p>
        </div>
      </div>

      <div className="holiday-card-grid">
        {sortedHolidays.map((holiday) => (
          <div
            key={holiday._id}
            className="holiday-card"
          >
            <div className="holiday-card-header">
              <div className="holiday-date-tile">
                <strong>
                  {getDay(holiday.holidayDate)}
                </strong>
                <span>
                  {getMonth(holiday.holidayDate)}
                </span>
              </div>

              <div className="holiday-card-title">
                <h3>
                  {holiday.name}
                </h3>

                <span className="badge badge-success">{holiday.type}</span>
              </div>

              <Sparkles className="holiday-card-sparkle" size={18} aria-hidden="true" />
            </div>

            <p className="holiday-card-description">
              {holiday.description || "No description added."}
            </p>

            <div className="holiday-card-footer">
              <small>
                Created by {holiday.createdBy?.name || "N/A"}
              </small>

              {canManageHolidays ? (
                <button
                  type="button"
                  className="delete-icon-btn"
                  onClick={() => handleDelete(holiday._id)}
                  disabled={deletingId === holiday._id}
                >
                  <Trash2 size={14} />
                  {deletingId === holiday._id ? "Deleting..." : "Delete"}
                </button>
              ) : (
                <span className="badge badge-success">View Only</span>
              )}
            </div>
          </div>
        ))}

        {loading && holidays.length === 0 && <LoadingState label="Loading holidays..." />}
        {!loading && holidays.length === 0 && (
          <EmptyState
            title="No holidays found"
            description={canManageHolidays ? "Add a company holiday to display it here." : "No company holidays have been configured yet."}
          />
        )}
      </div>

      {showModal && canManageHolidays && (
        <div className="modal-overlay">
          <div
            className="modal-card modern-department-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-holiday-title"
          >
            <div className="modal-header">
              <h3 id="add-holiday-title">Add Holiday</h3>

              <button
                type="button"
                onClick={closeModal}
                disabled={isSubmitting}
                aria-label="Close add holiday dialog"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            {formError && <ErrorState title="Holiday not saved" description={formError} compact />}

            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="input-group">
                <label htmlFor="holiday-name">Holiday Name</label>

                <input
                  id="holiday-name"
                  name="name"
                  placeholder="Example: Diwali"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div className="input-group">
                <label htmlFor="holiday-date">Holiday Date</label>

                <input
                  id="holiday-date"
                  type="date"
                  name="holidayDate"
                  value={formData.holidayDate}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div className="input-group">
                <label htmlFor="holiday-type">Holiday Type</label>

                <select
                  id="holiday-type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  disabled={isSubmitting}
                >
                  <option value="Company">Company</option>
                  <option value="National">National</option>
                  <option value="Festival">Festival</option>
                  <option value="Optional">Optional</option>
                </select>
              </div>

              <div className="input-group">
                <label htmlFor="holiday-description">Description</label>

                <textarea
                  id="holiday-description"
                  name="description"
                  rows="3"
                  placeholder="Optional description"
                  value={formData.description}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
              </div>

              <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Holiday"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default HolidayManagement;
