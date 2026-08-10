import { useEffect, useState } from "react";
import { Bell, CheckCircle } from "lucide-react";
import api from "../api/api";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "../components/ui/StatePanel";

const loadNotifications = async () => {
  const { data } = await api.get("/notifications");

  return data.notifications || [];
};

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError("");

      setNotifications(await loadNotifications());
    } catch (error) {
      console.error("FETCH NOTIFICATIONS ERROR:", error.response?.data);
      setError(
        error.response?.data?.message ||
        "Unable to load notifications."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isCurrent = true;

    loadNotifications()
      .then((notificationItems) => {
        if (isCurrent) {
          setNotifications(notificationItems);
        }
      })
      .catch((error) => {
        console.error("FETCH NOTIFICATIONS ERROR:", error.response?.data);

        if (isCurrent) {
          setError(
            error.response?.data?.message ||
            "Unable to load notifications."
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
  }, []);

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

  const filteredNotifications = notifications.filter((item) => {
    const search = searchTerm.toLowerCase();

    return (
      item.title?.toLowerCase().includes(search) ||
      item.message?.toLowerCase().includes(search)
    );
  });

  const unreadCount = notifications.filter((item) => !item.isRead).length;

  return (
    <div aria-busy={loading || markingAll || Boolean(updatingId)}>
      <div className="section-header">
        <div>
          <h2 className="card-title">Notifications</h2>
          <p className="section-subtitle">
            View all system updates, approvals and alerts.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={markAllAsRead}
          disabled={
            loading || markingAll || Boolean(updatingId) || unreadCount === 0
          }
        >
          {markingAll ? "Marking all…" : "Mark All Read"}
        </button>
      </div>

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
              onClick={fetchNotifications}
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

      <div style={{ marginBottom: "18px" }}>
        <input
          type="text"
          aria-label="Search notifications"
          placeholder="Search notifications..."
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

      <div className="modern-section-card">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((item) => (
            <article
              key={item._id}
              aria-label={`${item.isRead ? "Read" : "Unread"} notification: ${item.title || "Notification"}`}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "14px",
                padding: "16px",
                marginBottom: "12px",
                background: item.isRead ? "#ffffff" : "#eff6ff",
              }}
            >
              <div className="user-cell">
                <div className="avatar-circle">
                  <Bell size={16} />
                </div>

                <div style={{ flex: 1 }}>
                  <strong>{item.title}</strong>
                  <p style={{ marginTop: "6px" }}>{item.message}</p>
                  <p style={{ fontSize: "13px", color: "var(--muted)" }}>
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
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
            title={searchTerm ? "No matching notifications" : "No notifications yet"}
            description={
              searchTerm
                ? "Try a different title or message."
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
