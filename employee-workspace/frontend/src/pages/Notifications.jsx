import PageHeader from "../components/ui/PageHeader";
import { useState } from "react";
import { Bell, CheckCircle, Search } from "lucide-react";
import api from "../api/api";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "../components/ui/StatePanel";

const Notifications = ({ notifications, setNotifications, loading, loadError, onReload, onOpenNotification }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [actionError, setError] = useState("");
  const error = actionError || loadError;
  const [updatingId, setUpdatingId] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);

  const markAsRead = async (id) => {
    try {
      setUpdatingId(id);
      setError("");
      await api.patch(`/notifications/${id}/read`);
      setNotifications((currentNotifications) =>
        currentNotifications.map((notification) =>
          notification._id === id
            ? { ...notification, isRead: true }
            : notification
        )
      );
    } catch (error) {
      console.error("MARK NOTIFICATION READ ERROR:", error.response?.data);
      setError(
        error.response?.data?.message ||
        "Unable to mark this notification as read."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const markAllAsRead = async () => {
    try {
      setMarkingAll(true);
      setError("");
      await api.put("/notifications/read-all");
      setNotifications((currentNotifications) =>
        currentNotifications.map((notification) => ({
          ...notification,
          isRead: true,
        }))
      );
    } catch (error) {
      console.error("MARK ALL NOTIFICATIONS READ ERROR:", error.response?.data);
      setError(
        error.response?.data?.message ||
        "Unable to mark all notifications as read."
      );
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = notifications.filter((item) => !item.isRead).length;

  const notificationFilters = [
    { label: "All", count: notifications.length },
    { label: "Unread", count: unreadCount },
    ...["Leave", "Reimbursement", "Attendance"].map((label) => ({
      label,
      count: notifications.filter((item) => item.type === label).length,
    })),
  ];

  const filteredNotifications = notifications.filter((item) => {
    const search = searchTerm.toLowerCase();
    const matchesFilter =
      activeFilter === "All" ||
      (activeFilter === "Unread" && !item.isRead) ||
      item.type === activeFilter;

    return (
      matchesFilter &&
      (item.title?.toLowerCase().includes(search) ||
        item.message?.toLowerCase().includes(search))
    );
  });

  return (
    <div aria-busy={loading || markingAll || Boolean(updatingId)}>
      <PageHeader title={<>Notifications</>} description={<>View all system updates, approvals and alerts.</>} actions={<><button
          type="button"
          className="btn btn-primary"
          onClick={markAllAsRead}
          disabled={
            loading || markingAll || Boolean(updatingId) || unreadCount === 0
          }
        >
          {markingAll ? "Marking all…" : "Mark All Read"}
        </button></>} />

      {error && !loading && (
        <ErrorState
          title={
            notifications.length === 0
              ? "Unable to load notifications"
              : "Notification action failed"
          }
          description={error}
          action={(
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => { setError(""); onReload(); }}
            >
              {notifications.length === 0 ? "Try again" : "Reload"}
            </button>
          )}
        />
      )}

      {loading && <LoadingState label="Loading notifications…" />}

      {!loading && (
        <>
      <div className="reimbursement-summary-grid">
        <div className="reimbursement-summary-card">
          <span>Total Notifications</span>
          <h3>{notifications.length}</h3>
          <p>all time</p>
        </div>

        <div className="reimbursement-summary-card">
          <span>Unread</span>
          <h3>{unreadCount}</h3>
          <p>needs attention</p>
        </div>
      </div>

      <div className="notification-tools">
        <div className="notification-filter-tabs" role="group" aria-label="Filter notifications">
          {notificationFilters.map((filter) => (
            <button
              key={filter.label}
              type="button"
              aria-pressed={activeFilter === filter.label}
              className={activeFilter === filter.label ? "active" : ""}
              onClick={() => setActiveFilter(filter.label)}
            >
              {filter.label}
              <span>{filter.count}</span>
            </button>
          ))}
        </div>

        <label className="notification-search">
          <Search size={17} aria-hidden="true" />
          <span className="sr-only">Search notifications</span>
          <input
            type="search"
            placeholder="Search notifications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </label>
      </div>

      <div className="modern-section-card notification-list">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((item) => (
            <article
              key={item._id}
              aria-label={`${item.isRead ? "Read" : "Unread"} notification: ${item.title || "Notification"}`}
              className={`notification-list-item ${item.isRead ? "is-read" : "is-unread"}`}
            >
              <div className="user-cell">
                <div className={`avatar-circle notification-type-icon type-${(item.type || "system").toLowerCase()}`}>
                  <Bell size={16} />
                </div>

                <div className="notification-content">
                  <div className="notification-title-row">
                    <strong>{item.title}</strong>
                    <span className="notification-type-badge">{item.type || "System"}</span>
                  </div>
                  <p>{item.message}</p>
                  <time dateTime={item.createdAt}>
                    {new Date(item.createdAt).toLocaleString()}
                  </time>
                  <button
                    type="button"
                    className="notification-open-link"
                    onClick={() => onOpenNotification(item)}
                  >
                    View request
                  </button>
                </div>

                {!item.isRead && (
                  <button
                    className="btn btn-secondary"
                    onClick={() => markAsRead(item._id)}
                    disabled={markingAll || Boolean(updatingId)}
                    aria-label={`Mark ${item.title || "notification"} as read`}
                  >
                    <CheckCircle size={15} />
                    {updatingId === item._id ? "Marking…" : "Mark Read"}
                  </button>
                )}
              </div>
            </article>
          ))
        ) : (
          <EmptyState
            title={searchTerm || activeFilter !== "All" ? "No matching notifications" : "No notifications yet"}
            description={
              searchTerm || activeFilter !== "All"
                ? "Try a different search or notification filter."
                : "Updates and approval alerts will appear here."
            }
            compact
          />
        )}
      </div>
        </>
      )}
    </div>
  );
};

export default Notifications;
