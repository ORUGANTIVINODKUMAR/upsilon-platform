import ModalFrame from "../components/ui/ModalFrame";
import FormField from "../components/ui/FormField";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { Bell, LogOut, Menu, X, ChevronRight, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { PAGE_META, ROLE_PAGES, formatRole } from "../components/workspace/navigation";
import WorkspaceNavigation from "../components/workspace/WorkspaceNavigation";
import WorkspaceOverview from "../components/workspace/WorkspaceOverview";
import { LoadingState } from "../components/ui/StatePanel";

import logo from "../api/logo.png";

import { useAuth } from "../context/useAuth";
import api from "../api/api";

const FinanceLeaves = lazy(() => import("./FinanceLeaves"));
const FinanceReimbursements = lazy(() => import("./FinanceReimbursements"));
const AdminSubcategories = lazy(() => import("./AdminSubcategories"));
const AdminUsers = lazy(() => import("./AdminUsers"));
const AdminLeaveReports = lazy(() => import("./AdminLeaveReports"));
const AdminReimbursementReports = lazy(() => import("./AdminReimbursementReports"));
const LeaveRequests = lazy(() => import("./LeaveRequests"));
const LeaveCalendar = lazy(() => import("./LeaveCalendar"));
const Reimbursements = lazy(() => import("./Reimbursements"));
const ReimbursementApprovals = lazy(() => import("./ReimbursementApprovals"));
const Notifications = lazy(() => import("./Notifications"));
const HolidayManagement = lazy(() => import("./HolidayManagement"));
const EditProfile = lazy(() => import("./EditProfile"));
const AdminTeams = lazy(() => import("./AdminTeams"));
const TLApprovals = lazy(() => import("./TLApprovals"));
const ManagerApprovals = lazy(() => import("./ManagerApprovals"));
import PersonalLeaveBalance from "../components/PersonalLeaveBalance";
const HrLeaveBalances = lazy(() => import("./HrLeaveBalances"));
const AttendanceManagement = lazy(() => import("./AttendanceManagement"));
import WorkspaceThemePicker from "../components/WorkspaceThemePicker";
import { getNotificationPage } from "../utils/notificationNavigation";

const Dashboard = ({ initialPage = "dashboard" }) => {
  const { user, logout, updateUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const allowedPages = ROLE_PAGES[user?.role] || ["dashboard"];
  const requestedPage = searchParams.get("page") || initialPage;
  const activePage = allowedPages.includes(requestedPage)
    ? requestedPage
    : "dashboard";

  const [stats, setStats] = useState({});
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState("");
  const [statsRevision, setStatsRevision] = useState(0);
  const [showNotifications, setShowNotifications] =
    useState(false);

  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [notificationError, setNotificationError] = useState("");
  const [notificationRevision, setNotificationRevision] = useState(0);
  const sidebarRef = useRef(null);

  const [
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
  ] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(
    () => localStorage.getItem("workspace-sidebar-collapsed") === "true"
  );

  // Every role must replace a temporary password set by an Admin; the API
  // blocks other requests until it is changed.
  const [showPasswordModal, setShowPasswordModal] = useState(
    Boolean(user?.mustChangePassword)
  );
  // Bumped after the temporary password is replaced so the current page
  // remounts and reloads the data the API refused while it was required.
  const [pageRevision, setPageRevision] = useState(0);

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [workspaceFeedback, setWorkspaceFeedback] = useState("");

  const isAdmin = user?.role === "Admin";
  const isEmployee = user?.role === "Employee";
  const isTeamLeader = user?.role === "TeamLeader";
  const isFinance = user?.role === "Finance";
  const hasPersonalLeaveBalance = [
    "Employee",
    "TeamLeader",
    "Manager",
    "HR",
  ].includes(user?.role);

  const isManagerOrHR = ["Manager", "HR"].includes(
    user?.role
  );
  const canViewPersonalLeaveBalance = hasPersonalLeaveBalance;
  const canUseFinalApprovals = ["TeamLeader", "Manager", "HR", "Admin"].includes(
    user?.role
  );
  const canManageLeaveBalances = isManagerOrHR;
  const pageMeta = PAGE_META[activePage] || PAGE_META.dashboard;
  const unreadNotificationCount = notifications.filter(
    (notification) => !notification.isRead
  ).length;

  const navigateToPage = (page) => {
    setIsMobileSidebarOpen(false);

    if (page === activePage) {
      return;
    }

    setSearchParams(page === "dashboard" && initialPage === "dashboard" ? {} : { page });
  };

  const openNotification = (notification) => {
    const destination = getNotificationPage(notification, user?.role, allowedPages);

    setShowNotifications(false);
    if (!notification.isRead) {
      setNotifications((current) => current.map((item) =>
        item._id === notification._id ? { ...item, isRead: true } : item
      ));
      api.patch(`/notifications/${notification._id}/read`).catch(() => {
        setNotificationRevision((value) => value + 1);
      });
    }
    navigateToPage(destination);
  };

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [activePage]);

  useEffect(() => {
    localStorage.setItem("workspace-sidebar-collapsed", String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  useEffect(() => {
    if (activePage !== "dashboard") return undefined;
    const controller = new AbortController();
    const fetchStats = async () => {
      setStatsLoading(true);
      setStatsError("");
      try {
        const { data } = await api.get("/dashboard/stats", { signal: controller.signal });
        if (controller.signal.aborted) return;
        setStats(data.stats || {});
        localStorage.setItem("leaveBalance", JSON.stringify(data.stats?.leaveBalance || {}));
      } catch {
        if (!controller.signal.aborted) setStatsError("Your workspace overview could not be loaded. Please try again.");
      } finally {
        if (!controller.signal.aborted) setStatsLoading(false);
      }
    };
    fetchStats();
    return () => controller.abort();
  }, [user?.role, statsRevision, activePage]);

  useEffect(() => {
    if (user?.role === "Admin") return undefined;
    const controller = new AbortController();
    api.get("/notifications", { signal: controller.signal })
      .then(({ data }) => {
        if (!controller.signal.aborted) {
          setNotifications(data.notifications || []);
          setNotificationError("");
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setNotificationError("Notifications could not be loaded. Please try again.");
      })
      .finally(() => { if (!controller.signal.aborted) setNotificationsLoading(false); });
    return () => controller.abort();
  }, [user?.role, notificationRevision]);

  useEffect(() => {
    const handleProfileUpdated = (event) => {
      const updatedUser = event.detail;

      if (updatedUser) {
        updateUser(updatedUser);
      }
    };

    window.addEventListener(
      "profile-updated",
      handleProfileUpdated
    );

    return () => {
      window.removeEventListener(
        "profile-updated",
        handleProfileUpdated
      );
    };
  }, [updateUser]);

  useEffect(() => {
    if (!isMobileSidebarOpen) return undefined;
    const previous = document.activeElement;
    const focusable = () => [...sidebarRef.current.querySelectorAll("button")].filter(element => element.getClientRects().length);
    focusable()[0]?.focus();
    const trap = event => {
      if (event.key !== "Tab") return;
      const items = focusable();
      if (event.shiftKey && document.activeElement === items[0]) { event.preventDefault(); items.at(-1)?.focus(); }
      if (!event.shiftKey && document.activeElement === items.at(-1)) { event.preventDefault(); items[0]?.focus(); }
    };
    window.addEventListener("keydown", trap);
    return () => { window.removeEventListener("keydown", trap); previous?.focus(); };
  }, [isMobileSidebarOpen]);

  useEffect(() => {
    if (!isMobileSidebarOpen && !showNotifications) return undefined;

    const closeTransientUi = (event) => {
      if (event.key !== "Escape") return;
      setIsMobileSidebarOpen(false);
      setShowNotifications(false);
    };

    const previousOverflow = document.body.style.overflow;
    if (isMobileSidebarOpen) document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeTransientUi);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeTransientUi);
    };
  }, [isMobileSidebarOpen, showNotifications]);

  const handlePasswordChange = async () => {
    if (
      !passwordData.currentPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      setPasswordError("All password fields are required.");
      return;
    }

    if (
      passwordData.newPassword !==
      passwordData.confirmPassword
    ) {
      setPasswordError("The new passwords do not match.");
      return;
    }

    if (
      passwordData.newPassword.length < 8
    ) {
      setPasswordError("The new password must contain at least 8 characters.");
      return;
    }

    try {
      setPasswordError("");
      await api.put(
        "/auth/change-password",
        {
          currentPassword:
            passwordData.currentPassword,
          newPassword:
            passwordData.newPassword,
        }
      );

      updateUser({
        ...user,
        mustChangePassword: false,
      });

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setShowPasswordModal(false);
      setWorkspaceFeedback("Password updated successfully.");
      setStatsRevision((value) => value + 1);
      setNotificationRevision((value) => value + 1);
      setPageRevision((value) => value + 1);
    } catch (error) {
      setPasswordError(
        error.response?.data?.message ||
        "Unable to update password."
      );
    }
  };

  const handleLogout = (
    event
  ) => {
    event.stopPropagation();
    logout();
  };

  const openEditProfile = () => {
    navigateToPage("editProfile");
  };

  return (
    <div className={`dashboard-layout portal-redesign ${isSidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      <a className="skip-link" href="#workspace-main">
        Skip to workspace content
      </a>
      <div className="mobile-topbar">
        <button
          type="button"
          className="mobile-menu-btn"
          aria-label="Open workspace navigation"
          aria-expanded={isMobileSidebarOpen}
          aria-controls="workspace-sidebar"
          onClick={() =>
            setIsMobileSidebarOpen(true)
          }
        >
          <Menu size={24} />
        </button>

        <img
          src={logo}
          alt="Upsilon"
        />

        <span>{user?.role}</span>
      </div>

      {isMobileSidebarOpen && (
        <button
          type="button"
          className="mobile-sidebar-overlay"
          aria-label="Close workspace navigation"
          onClick={() =>
            setIsMobileSidebarOpen(false)
          }
        />
      )}

      <aside
        ref={sidebarRef}
        id="workspace-sidebar"
        aria-label="Workspace navigation"
        className={`sidebar modern-sidebar ${isMobileSidebarOpen
            ? "mobile-sidebar-open"
            : ""
          } ${isSidebarCollapsed ? "is-collapsed" : ""}`}
      >
        <button
          type="button"
          className="mobile-sidebar-close"
          aria-label="Close workspace navigation"
          onClick={() =>
            setIsMobileSidebarOpen(false)
          }
        >
          <X size={22} />
        </button>

        <div>
          <div className="brand-block">
            <img
              src={logo}
              alt="Upsilon"
            />
            <span className="sidebar-brand-monogram" aria-hidden="true">U</span>
            <button
              type="button"
              className="sidebar-collapse-button"
              aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-pressed={isSidebarCollapsed}
              onClick={() => setIsSidebarCollapsed((collapsed) => !collapsed)}
            >
              {isSidebarCollapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
            </button>
          </div>

          <WorkspaceNavigation allowedPages={allowedPages} activePage={activePage} onNavigate={navigateToPage} />
        </div>
        <div className="sidebar-user-box">
          <button
            type="button"
            className="sidebar-profile-button"
            onClick={openEditProfile}
            aria-label="Open profile settings"
          >
            <div className="sidebar-avatar">
              {user?.profilePhoto?.url ? (
                <img
                  src={user.profilePhoto.url}
                  alt=""
                />
              ) : (
                user?.name
                  ?.charAt(0)
                  ?.toUpperCase() || "U"
              )}
            </div>

            <div className="sidebar-user-copy">
              <strong>
                {user?.name || "User"}
              </strong>

              <span>{formatRole(user?.role)}</span>
            </div>
          </button>

          <button
            type="button"
            className="logout-btn compact-logout"
            onClick={handleLogout}
          >
            <LogOut size={17} />
            <span className="sidebar-item-label">Sign out</span>
          </button>
        </div>
      </aside>

      <main inert={isMobileSidebarOpen || undefined} id="workspace-main" className="dashboard-main modern-main" tabIndex={-1}>
        <div className="modern-page-header">
          <div className="header-copy">
            <div className="page-breadcrumb" aria-label="Breadcrumb">
              <span>Workspace</span>
              <ChevronRight size={13} aria-hidden="true" />
              <span aria-current="page">{pageMeta.title}</span>
            </div>

            <span className="eyebrow">{pageMeta.eyebrow}</span>

            <h1>
              {activePage === "dashboard" ? (
                <>
                  Welcome back, <span>{user?.firstName || user?.name || "User"}</span>
                </>
              ) : (
                pageMeta.title
              )}
            </h1>

            <p>{pageMeta.description}</p>
          </div>

          <div className="header-actions">
            <WorkspaceThemePicker />
            <span className="header-role-chip">{formatRole(user?.role)}</span>

            {!isAdmin && <div className="notification-wrapper">
            <button
              type="button"
              className="notification-bell"
              aria-label={`Notifications${unreadNotificationCount ? `, ${unreadNotificationCount} unread` : ""}`}
              aria-expanded={showNotifications}
              aria-haspopup="dialog"
              onClick={() =>
                setShowNotifications(
                  (previousValue) =>
                    !previousValue
                )
              }
            >
              <Bell size={22} />

              {unreadNotificationCount > 0 && (
                  <span className="notification-count">
                    {unreadNotificationCount}
                  </span>
                )}
            </button>

            {showNotifications && (
              <div
                className="notification-dropdown"
                role="dialog"
                aria-label="Recent notifications"
              >
                <div className="notification-dropdown-header">
                  <h4>Notifications</h4>

                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await api.put(
                          "/notifications/read-all"
                        );

                        setNotifications(
                          (previousNotifications) =>
                            previousNotifications.map(
                              (notification) => ({
                                ...notification,
                                isRead: true,
                              })
                            )
                        );

                        setShowNotifications(
                          false
                        );
                      } catch (error) {
                        setNotificationError("Unable to mark notifications as read. Please try again.");
                        console.error(
                          "MARK NOTIFICATIONS READ ERROR:",
                          error.response?.data ||
                          error.message
                        );
                      }
                    }}
                  >
                    Mark all as read
                  </button>
                </div>

                <div className="notification-dropdown-body">
                  {notificationError ? <p role="alert" className="empty-notification">{notificationError}<button type="button" className="btn" onClick={() => setNotificationRevision(value => value + 1)}>Retry</button></p> : notificationsLoading ? <LoadingState compact label="Loading notifications..." /> : notifications.length === 0 ? (
                    <p className="empty-notification">
                      No notifications
                    </p>
                  ) : (
                    notifications
                      .slice(0, 8)
                      .map(
                        (notification) => (
                          <button
                            type="button"
                            key={
                              notification._id
                            }
                            className={`notification-item ${!notification.isRead
                                ? "unread-notification"
                                : ""
                              }`}
                            onClick={() => openNotification(notification)}
                            aria-label={`Open ${notification.title || "notification"}`}
                          >
                            <div className="notification-content">
                              <strong>
                                {
                                  notification.title
                                }
                              </strong>

                              <p>
                                {
                                  notification.message
                                }
                              </p>

                              <span>
                                {notification.createdAt
                                  ? new Date(
                                    notification.createdAt
                                  ).toLocaleString()
                                  : ""}
                              </span>
                            </div>
                          </button>
                        )
                      )
                  )}
                </div>
              </div>
            )}
            </div>}
            <button
              type="button"
              className="header-profile-button"
              onClick={openEditProfile}
              aria-label="Open profile and security settings"
            >
              <span className="header-profile-avatar" aria-hidden="true">
                {user?.profilePhoto?.url ? (
                  <img src={user.profilePhoto.url} alt="" />
                ) : (
                  user?.name?.charAt(0)?.toUpperCase() || "U"
                )}
              </span>
              <span className="header-profile-copy">
                <strong>{user?.name || "User"}</strong>
                <small>Profile</small>
              </span>
            </button>
          </div>
        </div>

        {workspaceFeedback && (
          <div className="alert alert-success workspace-feedback" role="status" aria-live="polite">
            {workspaceFeedback}
          </div>
        )}

        <div key={`${activePage}-${pageRevision}`} className="workspace-page-content" data-page={activePage}>
        <Suspense fallback={<LoadingState label="Loading workspace page..." />}>
        {activePage === "dashboard" && (
          <WorkspaceOverview user={user} stats={stats} loading={statsLoading} error={statsError}
            onRetry={() => setStatsRevision((value) => value + 1)} onNavigate={navigateToPage}
            allowedPages={allowedPages} notifications={notifications} notificationError={notificationError} />
        )}

        {isAdmin && activePage === "departments" && (
          <div className="modern-section-card">
            <AdminSubcategories />
          </div>
        )}

        {isAdmin && activePage === "teams" && (
          <div className="modern-section-card">
            <AdminTeams />
          </div>
        )}

        {isAdmin && activePage === "users" && (
          <div className="modern-section-card">
            <AdminUsers />
          </div>
        )}

        {activePage === "attendance" && (
          <div className="modern-section-card">
            <AttendanceManagement />
          </div>
        )}

        {isTeamLeader && activePage === "tlApprovals" && (
          <div className="modern-section-card">
            <TLApprovals />
          </div>
        )}

        {hasPersonalLeaveBalance && activePage === "leave" && (
          <div className="modern-section-card">
            <LeaveRequests />
          </div>
        )}

        {canViewPersonalLeaveBalance && activePage === "myLeaveBalance" && (
          <div className="modern-section-card">
            <PersonalLeaveBalance />
          </div>
        )}

        {canManageLeaveBalances && activePage === "hrLeaveBalances" && (
          <div className="modern-section-card">
            <HrLeaveBalances />
          </div>
        )}

        {(isEmployee || isTeamLeader) && activePage === "reimbursements" && (
          <div className="modern-section-card">
            <Reimbursements />
          </div>
        )}

        {canUseFinalApprovals && activePage === "managerApprovals" && (
          <div className="modern-section-card">
            <ManagerApprovals />
          </div>
        )}

        {(isManagerOrHR || isTeamLeader) && activePage === "reimbursementApprovals" && (
          <div className="modern-section-card">
            <ReimbursementApprovals />
          </div>
        )}

        {isAdmin && activePage === "leaveReports" && (
          <div className="modern-section-card">
            <AdminLeaveReports />
          </div>
        )}

        {isAdmin && activePage === "reimbursementReports" && (
          <div className="modern-section-card">
            <AdminReimbursementReports />
          </div>
        )}

        {activePage ===
          "financeLeaves" &&
          isFinance && (
            <div className="modern-section-card">
              <FinanceLeaves />
            </div>
          )}

        {activePage ===
          "financeReimbursements" &&
          isFinance && (
            <div className="modern-section-card">
              <FinanceReimbursements />
            </div>
          )}

        {activePage ===
          "leaveCalendar" && (
            <LeaveCalendar />
          )}

        {activePage ===
          "notifications" &&
          !isAdmin && (
            <div className="modern-section-card">
              <Notifications notifications={notifications} setNotifications={setNotifications}
                loading={notificationsLoading} loadError={notificationError}
                onReload={() => setNotificationRevision(value => value + 1)}
                onOpenNotification={openNotification} />
            </div>
          )}

        {activePage === "holidays" && (
          <div className="modern-section-card">
            <HolidayManagement />
          </div>
        )}

        {activePage === "editProfile" && (
          <div className="modern-section-card">
            <EditProfile
              onSuccess={(updatedUser) => {
                if (updatedUser) {
                  updateUser(updatedUser);
                }
              }}
            />
          </div>
        )}
        </Suspense>
        </div>
        {showPasswordModal && (
          <div className="modal-overlay">
            <ModalFrame
              className="modal-box"
              role="dialog"
              aria-modal="true"
              aria-labelledby="required-password-title"
              aria-describedby="required-password-description"
            >
              <h2 id="required-password-title">Change password</h2>

              <p id="required-password-description">
                You must change your password before continuing.
              </p>

              {passwordError && (
                <div className="alert alert-error" role="alert">{passwordError}</div>
              )}

              <FormField className="input-group">
                <label htmlFor="required-current-password">Current password</label>

                <input
                  id="required-current-password"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(event) =>
                    setPasswordData(
                      (previousData) => ({
                        ...previousData,
                        currentPassword:
                          event.target.value,
                      })
                    )
                  }
                  autoComplete="current-password"
                />
              </FormField>

              <FormField className="input-group">
                <label htmlFor="required-new-password">New password</label>

                <input
                  id="required-new-password"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(event) =>
                    setPasswordData(
                      (previousData) => ({
                        ...previousData,
                        newPassword:
                          event.target.value,
                      })
                    )
                  }
                  minLength={8}
                  autoComplete="new-password"
                />
              </FormField>

              <FormField className="input-group">
                <label htmlFor="required-confirm-password">Confirm password</label>

                <input
                  id="required-confirm-password"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(event) =>
                    setPasswordData(
                      (previousData) => ({
                        ...previousData,
                        confirmPassword:
                          event.target.value,
                      })
                    )
                  }
                  minLength={8}
                  autoComplete="new-password"
                />
              </FormField>

              <button
                type="button"
                className="btn btn-primary"
                onClick={handlePasswordChange}
              >
                Update Password
              </button>
            </ModalFrame>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
