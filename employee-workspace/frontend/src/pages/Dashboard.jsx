import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import {
  LayoutDashboard,
  Users,
  Building2,
  CalendarCheck,
  Receipt,
  LogOut,
  BadgeCheck,
  Bell,
  Wallet,
  Menu,
  X,
  UserRound,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

import logo from "../assets/logo.png";

import { useAuth } from "../context/useAuth";
import api from "../api/api";

import FinanceLeaves from "./FinanceLeaves";
import FinanceReimbursements from "./FinanceReimbursements";
import AdminSubcategories from "./AdminSubcategories";
import AdminUsers from "./AdminUsers";
import AdminLeaveReports from "./AdminLeaveReports";
import AdminReimbursementReports from "./AdminReimbursementReports";
import LeaveRequests from "./LeaveRequests";
import LeaveCalendar from "./LeaveCalendar";
import Reimbursements from "./Reimbursements";
import ReimbursementApprovals from "./ReimbursementApprovals";
import SignatureUploader from "../components/SignatureUploader";
import Notifications from "./Notifications";
import HolidayManagement from "./HolidayManagement";
import EditProfile from "./EditProfile";
import AdminTeams from "./AdminTeams";
import TLApprovals from "./TLApprovals";
import ManagerApprovals from "./ManagerApprovals";
import PersonalLeaveBalance from "../components/PersonalLeaveBalance";
import HrLeaveBalances from "./HrLeaveBalances";
import AttendanceManagement from "./AttendanceManagement";
import WorkspaceThemePicker from "../components/WorkspaceThemePicker";

const PAGE_META = {
  dashboard: {
    eyebrow: "Overview",
    title: "Dashboard",
    description: "Your people, requests, balances, and recent workspace activity at a glance.",
  },
  notifications: {
    eyebrow: "Inbox",
    title: "Notifications",
    description: "Review important updates and keep track of changes that need your attention.",
  },
  attendance: {
    eyebrow: "Attendance",
    title: "Uninformed absence",
    description: "Review attendance history and manage absences that were not reported in advance.",
  },
  departments: {
    eyebrow: "Administration",
    title: "Departments",
    description: "Organize departments and review the teams and employees within each group.",
  },
  teams: {
    eyebrow: "Administration",
    title: "Teams",
    description: "Manage team structures, leaders, managers, and HR assignments.",
  },
  users: {
    eyebrow: "Administration",
    title: "User management",
    description: "Create accounts and maintain employee access, roles, and reporting relationships.",
  },
  leaveReports: {
    eyebrow: "Reports",
    title: "Leave reports",
    description: "Filter, review, and export organization-wide leave activity.",
  },
  reimbursementReports: {
    eyebrow: "Reports",
    title: "Reimbursement reports",
    description: "Review claim outcomes, amounts, receipts, and export-ready records.",
  },
  leave: {
    eyebrow: "Time off",
    title: "My leaves",
    description: "Apply for leave, follow approval progress, and review your request history.",
  },
  myLeaveBalance: {
    eyebrow: "Time off",
    title: "My leave balance",
    description: "See your current paid leave, carry-forward, usage, and excess leave totals.",
  },
  hrLeaveBalances: {
    eyebrow: "People operations",
    title: "Leave balance management",
    description: "Review and adjust employee leave balances with a clear audit trail.",
  },
  reimbursements: {
    eyebrow: "Expenses",
    title: "My reimbursements",
    description: "Submit expense claims and track each review and payment stage.",
  },
  tlApprovals: {
    eyebrow: "Approvals",
    title: "Team leave approvals",
    description: "Review leave requests submitted by employees in your teams.",
  },
  managerApprovals: {
    eyebrow: "Approvals",
    title: "Final leave approvals",
    description: "Make final decisions on requests that have completed team review.",
  },
  reimbursementApprovals: {
    eyebrow: "Approvals",
    title: "Reimbursement approvals",
    description: "Review expense evidence and move claims through the correct approval stage.",
  },
  leaveCalendar: {
    eyebrow: "Planning",
    title: "Leave calendar",
    description: "See approved absences and plan team coverage across the month.",
  },
  financeLeaves: {
    eyebrow: "Finance",
    title: "Approved leaves",
    description: "Review final leave outcomes and the records shared with Finance.",
  },
  financeReimbursements: {
    eyebrow: "Finance",
    title: "Reimbursement payments",
    description: "Verify approved claims, record payment details, and review completed payouts.",
  },
  holidays: {
    eyebrow: "Calendar",
    title: "Holidays",
    description: "View the company holiday schedule and maintain it when your role allows.",
  },
  editProfile: {
    eyebrow: "Account",
    title: "Profile and security",
    description: "Keep your personal details, profile photo, and password up to date.",
  },
};

const formatRole = (role) =>
  role === "TeamLeader" ? "Team Leader" : role || "Workspace member";

const ROLE_PAGES = {
  Admin: [
    "dashboard",
    "attendance",
    "departments",
    "teams",
    "users",
    "managerApprovals",
    "leaveReports",
    "reimbursementReports",
    "leaveCalendar",
    "holidays",
    "editProfile",
  ],
  Employee: [
    "dashboard",
    "notifications",
    "attendance",
    "leave",
    "myLeaveBalance",
    "reimbursements",
    "holidays",
    "editProfile",
  ],
  TeamLeader: [
    "dashboard",
    "notifications",
    "attendance",
    "leave",
    "myLeaveBalance",
    "reimbursements",
    "tlApprovals",
    "managerApprovals",
    "reimbursementApprovals",
    "leaveCalendar",
    "holidays",
    "editProfile",
  ],
  Manager: [
    "dashboard",
    "notifications",
    "attendance",
    "leave",
    "myLeaveBalance",
    "hrLeaveBalances",
    "managerApprovals",
    "reimbursementApprovals",
    "leaveCalendar",
    "holidays",
    "editProfile",
  ],
  HR: [
    "dashboard",
    "notifications",
    "attendance",
    "leave",
    "myLeaveBalance",
    "hrLeaveBalances",
    "managerApprovals",
    "reimbursementApprovals",
    "leaveCalendar",
    "holidays",
    "editProfile",
  ],
  Finance: [
    "dashboard",
    "notifications",
    "attendance",
    "leaveCalendar",
    "financeLeaves",
    "financeReimbursements",
    "holidays",
    "editProfile",
  ],
};

const Dashboard = () => {
  const { user, logout, updateUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const allowedPages = ROLE_PAGES[user?.role] || ["dashboard"];
  const requestedPage = searchParams.get("page") || "dashboard";
  const activePage = allowedPages.includes(requestedPage)
    ? requestedPage
    : "dashboard";

  const [stats, setStats] = useState({});
  const [showNotifications, setShowNotifications] =
    useState(false);

  const [notifications, setNotifications] = useState([]);

  const [
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
  ] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(
    () => localStorage.getItem("workspace-sidebar-collapsed") === "true"
  );

  const [showPasswordModal, setShowPasswordModal] = useState(
    user?.role === "Employee" && Boolean(user?.mustChangePassword)
  );

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

    setSearchParams(page === "dashboard" ? {} : { page });
  };

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [activePage]);

  useEffect(() => {
    localStorage.setItem("workspace-sidebar-collapsed", String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get(
          "/dashboard/stats"
        );

        setStats(data.stats || {});

        if (user?.role !== "Admin") {
          const notificationResponse =
            await api.get("/notifications");

          setNotifications(
            notificationResponse.data.notifications || []
          );
        }

        localStorage.setItem(
          "leaveBalance",
          JSON.stringify(
            data.stats?.leaveBalance || {}
          )
        );
      } catch (error) {
        console.error(
          "DASHBOARD STATS ERROR:",
          error.response?.data || error.message
        );
      }
    };

    fetchStats();
  }, [user?.role]);

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

  const menuButton = (
    key,
    icon,
    label
  ) => (
    <button
      type="button"
      className={
        activePage === key
          ? "active-menu"
          : ""
      }
      onClick={() =>
        navigateToPage(key)
      }
      aria-current={activePage === key ? "page" : undefined}
      title={label}
    >
      {icon}
      <span className="sidebar-item-label">{label}</span>
      <span className="sidebar-tooltip" role="tooltip">{label}</span>
    </button>
  );

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

          <nav className="sidebar-menu" aria-label="Primary">
            <span className="sidebar-group-label">Overview</span>
            {menuButton(
              "dashboard",
              <LayoutDashboard size={18} />,
              "Dashboard"
            )}

            {!isAdmin &&
              menuButton(
                "notifications",
                <Bell size={18} />,
                "Notifications"
              )}

            {menuButton(
              "attendance",
              <CalendarCheck size={18} />,
              "Attendance"
            )}

            {isAdmin && (
              <span className="sidebar-group-label">Administration</span>
            )}

            {isAdmin && (
              <>
                {menuButton(
                  "departments",
                  <Building2 size={18} />,
                  "Departments"
                )}

                {menuButton(
                  "teams",
                  <Users size={18} />,
                  "Teams"
                )}

                {menuButton(
                  "users",
                  <Users size={18} />,
                  "User Management"
                )}

                {menuButton(
                  "leaveReports",
                  <CalendarCheck size={18} />,
                  "Leave Reports"
                )}

                {menuButton(
                  "reimbursementReports",
                  <Receipt size={18} />,
                  "Reimbursement Reports"
                )}
              </>
            )}

            {!isAdmin && (
              <span className="sidebar-group-label">Workspace</span>
            )}

            {hasPersonalLeaveBalance &&
              menuButton(
                "leave",
                <CalendarCheck size={18} />,
                "Leaves"
              )}

            {hasPersonalLeaveBalance &&
              menuButton(
                "myLeaveBalance",
                <Wallet size={18} />,
                "My Leave Balance"
              )}

            {canManageLeaveBalances &&
              menuButton(
                "hrLeaveBalances",
                <Wallet size={18} />,
                "Leave Balance Management"
              )}

            {(isEmployee ||
              isTeamLeader) &&
              menuButton(
                "reimbursements",
                <Receipt size={18} />,
                "Reimbursements"
              )}

            {isTeamLeader &&
              menuButton(
                "tlApprovals",
                <CalendarCheck size={18} />,
                "TL Leave Approvals"
              )}

            {isTeamLeader &&
              menuButton(
                "reimbursementApprovals",
                <Receipt size={18} />,
                "TL Reimbursement Approvals"
              )}

            {canUseFinalApprovals &&
              menuButton(
                "managerApprovals",
                <CalendarCheck size={18} />,
                "Final Leave Approvals"
              )}

            {isManagerOrHR &&
              menuButton(
                "reimbursementApprovals",
                <Receipt size={18} />,
                "Reimbursement Approvals"
              )}

            {(isManagerOrHR ||
              isTeamLeader ||
              isFinance ||
              isAdmin) &&
              menuButton(
                "leaveCalendar",
                <CalendarCheck size={18} />,
                "Leave Calendar"
              )}

            {isFinance &&
              menuButton(
                "financeLeaves",
                <CalendarCheck size={18} />,
                "Finance Leaves"
              )}

            {isFinance &&
              menuButton(
                "financeReimbursements",
                <Receipt size={18} />,
                "Finance Reimbursements"
              )}

            <span className="sidebar-group-label">Account</span>

            {menuButton(
              "holidays",
              <CalendarCheck size={18} />,
              "Holidays"
            )}

            {menuButton(
              "editProfile",
              <UserRound size={18} />,
              "Edit Profile"
            )}
          </nav>
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

      <main id="workspace-main" className="dashboard-main modern-main" tabIndex={-1}>
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
                  {notifications.length === 0 ? (
                    <p className="empty-notification">
                      No notifications
                    </p>
                  ) : (
                    notifications
                      .slice(0, 8)
                      .map(
                        (notification) => (
                          <div
                            key={
                              notification._id
                            }
                            className={`notification-item ${!notification.isRead
                                ? "unread-notification"
                                : ""
                              }`}
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
                          </div>
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

        <div key={activePage} className="workspace-page-content">
        {activePage === "dashboard" && (
          <>
            <div
              className="modern-section-card"
              style={{
                background:
                  stats.tomorrowHoliday
                    ? "linear-gradient(135deg, #fff7ed, #ffffff)"
                    : "linear-gradient(135deg, #ecfdf5, #ffffff)",
                border:
                  stats.tomorrowHoliday
                    ? "1px solid #fed7aa"
                    : "1px solid #bbf7d0",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent:
                    "space-between",
                  gap: "16px",
                }}
              >
                <div>
                  <span className="eyebrow">
                    {stats.tomorrowHoliday
                      ? "HOLIDAY ALERT"
                      : "UPCOMING HOLIDAY"}
                  </span>

                  <h3
                    style={{
                      marginTop: "6px",
                    }}
                  >
                    {stats.tomorrowHoliday
                      ? `Tomorrow is ${stats.tomorrowHoliday.name}`
                      : stats.nearestUpcomingHoliday
                        ? stats
                          .nearestUpcomingHoliday
                          .name
                        : "No Upcoming Holiday"}
                  </h3>

                  {stats.tomorrowHoliday ? (
                    <>
                      <p
                        style={{
                          marginTop: "8px",
                        }}
                      >
                        📅{" "}
                        {new Date(
                          stats.tomorrowHoliday
                            .holidayDate
                        ).toLocaleDateString()}{" "}
                        •{" "}
                        {
                          stats.tomorrowHoliday
                            .type
                        }
                      </p>

                      <p
                        style={{
                          color: "#92400e",
                          fontWeight: 600,
                        }}
                      >
                        Office closed / holiday
                        configured.
                      </p>
                    </>
                  ) : stats.nearestUpcomingHoliday ? (
                    <>
                      <p
                        style={{
                          marginTop: "8px",
                        }}
                      >
                        📅{" "}
                        {new Date(
                          stats
                            .nearestUpcomingHoliday
                            .holidayDate
                        ).toLocaleDateString()}{" "}
                        •{" "}
                        {
                          stats
                            .nearestUpcomingHoliday
                            .type
                        }
                      </p>

                      <p
                        style={{
                          color: "#166534",
                          fontWeight: 600,
                        }}
                      >
                        Nearest upcoming company
                        holiday.
                      </p>
                    </>
                  ) : (
                    <p
                      style={{
                        marginTop: "8px",
                      }}
                    >
                      No upcoming holidays
                      configured.
                    </p>
                  )}
                </div>

                <div
                  style={{
                    fontSize: "42px",
                    width: "72px",
                    height: "72px",
                    borderRadius: "20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background:
                      stats.tomorrowHoliday
                        ? "#ffedd5"
                        : "#dcfce7",
                  }}
                >
                  {stats.tomorrowHoliday
                    ? "🎉"
                    : "📅"}
                </div>
              </div>
            </div>

            {stats.todaysBirthdayEmployees
              ?.length > 0 && (
                <div
                  className="modern-section-card"
                  style={{
                    background:
                      "linear-gradient(135deg, #fdf2f8, #ffffff)",
                    border:
                      "1px solid #fbcfe8",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      alignItems: "center",
                      gap: "16px",
                    }}
                  >
                    <div>
                      <span className="eyebrow">
                        TODAY&apos;S BIRTHDAYS
                      </span>

                      <h3
                        style={{
                          marginTop: "6px",
                        }}
                      >
                        🎂 Birthday Celebrations
                      </h3>

                      <div
                        style={{
                          marginTop: "12px",
                        }}
                      >
                        {stats.todaysBirthdayEmployees.map(
                          (employee) => (
                            <div
                              key={employee._id}
                              style={{
                                padding:
                                  "10px 0",
                                borderBottom:
                                  "1px solid #fce7f3",
                                display:
                                  "flex",
                                alignItems:
                                  "center",
                                gap: "12px",
                              }}
                            >
                              <div
                                style={{
                                  width: "42px",
                                  height: "42px",
                                  borderRadius:
                                    "50%",
                                  overflow:
                                    "hidden",
                                  background:
                                    "#fce7f3",
                                  display:
                                    "flex",
                                  alignItems:
                                    "center",
                                  justifyContent:
                                    "center",
                                  flexShrink: 0,
                                }}
                              >
                                {employee
                                  .profilePhoto
                                  ?.url ? (
                                  <img
                                    src={
                                      employee
                                        .profilePhoto
                                        .url
                                    }
                                    alt={
                                      employee.name ||
                                      "Employee"
                                    }
                                    style={{
                                      width:
                                        "100%",
                                      height:
                                        "100%",
                                      objectFit:
                                        "cover",
                                    }}
                                  />
                                ) : (
                                  employee.name
                                    ?.charAt(0)
                                    ?.toUpperCase() ||
                                  "U"
                                )}
                              </div>

                              <div>
                                <strong>
                                  {
                                    employee.name
                                  }
                                </strong>

                                <p
                                  style={{
                                    margin: 0,
                                    color:
                                      "#6b7280",
                                  }}
                                >
                                  {employee.designation ||
                                    employee.role}{" "}
                                  •{" "}
                                  {employee.employeeId ||
                                    "N/A"}
                                </p>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    <div
                      style={{
                        fontSize: "42px",
                        width: "72px",
                        height: "72px",
                        borderRadius: "20px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "#fce7f3",
                      }}
                    >
                      🎂
                    </div>
                  </div>
                </div>
              )}

            {[
              "Admin",
              "HR",
              "Manager",
              "TeamLeader",
            ].includes(user?.role) && (
                <div className="modern-section-card">
                  <h3>
                    Employees On Leave Today
                  </h3>

                  {stats.todayLeaves?.length >
                    0 ? (
                    <div
                      style={{
                        display: "flex",
                        flexDirection:
                          "column",
                        gap: "12px",
                        marginTop: "15px",
                      }}
                    >
                      {stats.todayLeaves.map(
                        (leave) => (
                          <div
                            key={leave._id}
                            style={{
                              display:
                                "flex",
                              justifyContent:
                                "space-between",
                              alignItems:
                                "center",
                              padding:
                                "16px",
                              border:
                                "1px solid #e5e7eb",
                              borderRadius:
                                "12px",
                              background:
                                "#ffffff",
                            }}
                          >
                            <div
                              style={{
                                display:
                                  "flex",
                                alignItems:
                                  "center",
                                gap: "12px",
                              }}
                            >
                              <div
                                style={{
                                  width: "44px",
                                  height: "44px",
                                  borderRadius:
                                    "50%",
                                  overflow:
                                    "hidden",
                                  background:
                                    "#f1f5f9",
                                  display:
                                    "flex",
                                  alignItems:
                                    "center",
                                  justifyContent:
                                    "center",
                                  flexShrink: 0,
                                }}
                              >
                                {leave.employeeId
                                  ?.profilePhoto
                                  ?.url ? (
                                  <img
                                    src={
                                      leave
                                        .employeeId
                                        .profilePhoto
                                        .url
                                    }
                                    alt={
                                      leave
                                        .employeeId
                                        ?.name ||
                                      "Employee"
                                    }
                                    style={{
                                      width:
                                        "100%",
                                      height:
                                        "100%",
                                      objectFit:
                                        "cover",
                                    }}
                                  />
                                ) : (
                                  leave.employeeId
                                    ?.name?.charAt(
                                      0
                                    )
                                    ?.toUpperCase() ||
                                  "U"
                                )}
                              </div>

                              <div>
                                <h4
                                  style={{
                                    margin: 0,
                                    fontSize:
                                      "16px",
                                    fontWeight:
                                      600,
                                  }}
                                >
                                  {leave
                                    .employeeId
                                    ?.name ||
                                    "Unknown Employee"}
                                </h4>

                                <p
                                  style={{
                                    margin:
                                      "4px 0",
                                    color:
                                      "#6b7280",
                                  }}
                                >
                                  🏢{" "}
                                  {leave
                                    .subcategoryId
                                    ?.name ||
                                    "N/A"}
                                </p>

                                <p
                                  style={{
                                    margin: 0,
                                    color:
                                      "#6b7280",
                                  }}
                                >
                                  📅{" "}
                                  {new Date(
                                    leave.startDate
                                  ).toLocaleDateString()}{" "}
                                  -{" "}
                                  {new Date(
                                    leave.endDate
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                            </div>

                            <div
                              style={{
                                padding:
                                  "8px 14px",
                                borderRadius:
                                  "20px",
                                background:
                                  "#ecfdf5",
                                color:
                                  "#166534",
                                fontWeight: 600,
                                fontSize:
                                  "13px",
                              }}
                            >
                              {leave.leaveType}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <p
                      style={{
                        marginTop: "15px",
                      }}
                    >
                      No employees are on leave
                      today.
                    </p>
                  )}
                </div>
              )}
            {hasPersonalLeaveBalance && !isEmployee && (
              <div style={{ marginBottom: "20px" }}>
                <PersonalLeaveBalance compact />
              </div>
            )}

            {isEmployee && (
              <>
                <div className="employee-dashboard-grid">
                  <div className="modern-profile-card">
                    <div className="profile-main-row">
                      <div className="large-avatar">
                        {user?.profilePhoto?.url ? (
                          <img
                            src={user.profilePhoto.url}
                            alt={user?.name || "Profile"}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              borderRadius: "50%",
                            }}
                          />
                        ) : (
                          user?.name
                            ?.charAt(0)
                            ?.toUpperCase() || "U"
                        )}
                      </div>

                      <div>
                        <h2>
                          {user?.firstName ||
                            user?.name}{" "}
                          {user?.lastName || ""}
                        </h2>

                        <p>
                          {user?.email || "N/A"}
                        </p>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: "10px",
                          alignItems: "center",
                          flexWrap: "wrap",
                        }}
                      >
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={openEditProfile}
                        >
                          <UserRound size={16} />
                          Edit Profile
                        </button>

                        <span className="active-pill">
                          <BadgeCheck size={14} />
                          {user?.isActive === false
                            ? "Inactive"
                            : "Active"}
                        </span>
                      </div>
                    </div>

                    <div className="profile-divider" />

                    <div className="profile-detail-grid">
                      <div>
                        <span>Employee ID</span>

                        <strong>
                          {user?.employeeId ||
                            "Not Updated"}
                        </strong>
                      </div>

                      <div>
                        <span>Phone</span>

                        <strong>
                          {user?.phone ||
                            "Not Updated"}
                        </strong>
                      </div>

                      <div>
                        <span>Designation</span>

                        <strong>
                          {user?.designation ||
                            "Not Updated"}
                        </strong>
                      </div>

                      <div>
                        <span>Joining Date</span>

                        <strong>
                          {user?.dateOfJoining
                            ? new Date(
                              user.dateOfJoining
                            ).toLocaleDateString()
                            : "Not Updated"}
                        </strong>
                      </div>

                      <div>
                        <span>Department</span>

                        <strong>
                          {user?.subcategoryId
                            ?.name || "Not Updated"}
                        </strong>
                      </div>

                      <div>
                        <span>Team</span>

                        <strong>
                          {user?.teamId?.name ||
                            "Not Updated"}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <PersonalLeaveBalance compact />
                </div>

                <div className="modern-stats-grid">
                  <div className="mini-stat-card">
                    <CalendarCheck size={23} />

                    <span>
                      Leaves Submitted
                    </span>

                    <h3>
                      {stats.myLeaves || 0}
                    </h3>

                    <p>lifetime</p>
                  </div>

                  <div className="mini-stat-card">
                    <CalendarCheck size={23} />

                    <span>Pending Leaves</span>

                    <h3>
                      {stats.myPendingLeaves ||
                        0}
                    </h3>
                  </div>

                  <div className="mini-stat-card">
                    <BadgeCheck size={23} />

                    <span>
                      Approved Leaves
                    </span>

                    <h3>
                      {stats.myApprovedLeaves ||
                        0}
                    </h3>
                  </div>

                  <div className="mini-stat-card">
                    <Receipt size={23} />

                    <span>
                      Rejected Leaves
                    </span>

                    <h3>
                      {stats.myRejectedLeaves ||
                        0}
                    </h3>
                  </div>

                  <div className="mini-stat-card">
                    <Receipt size={23} />

                    <span>
                      Claims Submitted
                    </span>

                    <h3>
                      {stats.myReimbursements ||
                        0}
                    </h3>

                    <p>lifetime</p>
                  </div>

                  <div className="mini-stat-card">
                    <Wallet size={23} />

                    <span>Pending Claims</span>

                    <h3>
                      {stats.myPendingReimbursements ||
                        0}
                    </h3>

                    <p>awaiting review</p>
                  </div>
                </div>

                <div className="modern-section-card dashboard-quick-action-card">
                  <h3>My Activity Overview</h3>

                  <div
                    className="dashboard-quick-actions"
                    style={{
                      display: "flex",
                      gap: "12px",
                      flexWrap: "wrap",
                      marginTop: "16px",
                    }}
                  >
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() =>
                        navigateToPage("leave")
                      }
                    >
                      Apply / Track Leave
                    </button>

                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() =>
                        navigateToPage(
                          "reimbursements"
                        )
                      }
                    >
                      Submit / Track Claims
                    </button>

                    <button
                      type="button"
                      className="btn"
                      onClick={
                        openEditProfile
                      }
                    >
                      Manage Profile
                    </button>
                  </div>
                </div>
              </>
            )}

            {isAdmin && (
              <>
                <div className="employee-dashboard-grid">
                  <div className="modern-profile-card">
                    <div className="profile-main-row">
                      <div className="large-avatar">
                        {user?.profilePhoto
                          ?.url ? (
                          <img
                            src={
                              user
                                .profilePhoto
                                .url
                            }
                            alt={
                              user?.name ||
                              "Administrator"
                            }
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit:
                                "cover",
                              borderRadius:
                                "50%",
                            }}
                          />
                        ) : (
                          user?.name
                            ?.charAt(0)
                            ?.toUpperCase() ||
                          "A"
                        )}
                      </div>

                      <div>
                        <h2>
                          {user?.name ||
                            "Administrator"}
                        </h2>

                        <p>
                          {user?.email ||
                            "N/A"}
                        </p>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: "10px",
                          alignItems:
                            "center",
                          flexWrap: "wrap",
                        }}
                      >
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={
                            openEditProfile
                          }
                        >
                          <UserRound
                            size={16}
                          />
                          Edit Profile
                        </button>

                        <span className="active-pill">
                          <BadgeCheck
                            size={14}
                          />
                          Administrator
                        </span>
                      </div>
                    </div>

                    <div className="profile-divider" />

                    <div className="profile-detail-grid">
                      <div>
                        <span>
                          Total Employees
                        </span>

                        <strong>
                          {stats.totalEmployees ||
                            0}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Departments
                        </span>

                        <strong>
                          {stats.departments ||
                            0}
                        </strong>
                      </div>

                      <div>
                        <span>Role</span>

                        <strong>
                          Admin
                        </strong>
                      </div>

                      <div>
                        <span>Status</span>

                        <strong>
                          {user?.isActive ===
                            false
                            ? "Inactive"
                            : "Active"}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modern-stats-grid">
                  <div className="mini-stat-card">
                    <Users size={23} />

                    <span>
                      Total Employees
                    </span>

                    <h3>
                      {stats.totalEmployees ||
                        0}
                    </h3>

                    <p>active users</p>
                  </div>

                  <div className="mini-stat-card">
                    <Building2 size={23} />

                    <span>
                      Departments
                    </span>

                    <h3>
                      {stats.departments ||
                        0}
                    </h3>

                    <p>company units</p>
                  </div>

                  <div className="mini-stat-card">
                    <CalendarCheck size={23} />

                    <span>
                      Pending Leaves
                    </span>

                    <h3>
                      {stats.pendingLeaves ||
                        0}
                    </h3>

                    <p>awaiting approval</p>
                  </div>

                  <div className="mini-stat-card">
                    <Receipt size={23} />

                    <span>
                      Pending Claims
                    </span>

                    <h3>
                      {stats.pendingReimbursements ||
                        0}
                    </h3>

                    <p>awaiting review</p>
                  </div>
                </div>

                <div className="modern-section-card dashboard-quick-action-card">
                  <h3>Quick Actions</h3>

                  <div
                    className="dashboard-quick-actions"
                    style={{
                      display: "flex",
                      gap: "15px",
                      flexWrap: "wrap",
                      marginTop: "15px",
                    }}
                  >
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() =>
                        navigateToPage("users")
                      }
                    >
                      Add Employee
                    </button>

                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() =>
                        navigateToPage(
                          "departments"
                        )
                      }
                    >
                      Manage Departments
                    </button>

                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() =>
                        navigateToPage(
                          "leaveReports"
                        )
                      }
                    >
                      Leave Reports
                    </button>

                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() =>
                        navigateToPage(
                          "reimbursementReports"
                        )
                      }
                    >
                      Reimbursement Reports
                    </button>

                    <button
                      type="button"
                      className="btn"
                      onClick={
                        openEditProfile
                      }
                    >
                      Edit My Profile
                    </button>
                  </div>
                </div>
              </>
            )}
            {isManagerOrHR && (
              <>
                <div className="employee-dashboard-grid">
                  <div className="modern-profile-card">
                    <div className="profile-main-row">
                      <div className="large-avatar">
                        {user?.profilePhoto?.url ? (
                          <img
                            src={user.profilePhoto.url}
                            alt={user?.name || user?.role}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              borderRadius: "50%",
                            }}
                          />
                        ) : (
                          user?.name
                            ?.charAt(0)
                            ?.toUpperCase() || "U"
                        )}
                      </div>

                      <div>
                        <h2>
                          {user?.name || user?.role}
                        </h2>

                        <p>
                          {user?.email || "N/A"}
                        </p>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: "10px",
                          alignItems: "center",
                          flexWrap: "wrap",
                        }}
                      >
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={openEditProfile}
                        >
                          <UserRound size={16} />
                          Edit Profile
                        </button>

                        <span className="active-pill">
                          <BadgeCheck size={14} />
                          {user?.role}
                        </span>
                      </div>
                    </div>

                    <div className="profile-divider" />

                    <div className="profile-detail-grid">
                      <div>
                        <span>Employee ID</span>

                        <strong>
                          {user?.employeeId || "Not Updated"}
                        </strong>
                      </div>

                      <div>
                        <span>Phone</span>

                        <strong>
                          {user?.phone || "Not Updated"}
                        </strong>
                      </div>

                      <div>
                        <span>Designation</span>

                        <strong>
                          {user?.designation || "Not Updated"}
                        </strong>
                      </div>

                      <div>
                        <span>Department</span>

                        <strong>
                          {user?.subcategoryId?.name ||
                            "Not Updated"}
                        </strong>
                      </div>

                      <div>
                        <span>Joining Date</span>

                        <strong>
                          {user?.dateOfJoining
                            ? new Date(
                              user.dateOfJoining
                            ).toLocaleDateString()
                            : "Not Updated"}
                        </strong>
                      </div>

                      <div>
                        <span>Status</span>

                        <strong>
                          {user?.isActive === false
                            ? "Inactive"
                            : "Active"}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modern-stats-grid">
                  <div className="mini-stat-card">
                    <Users size={23} />

                    <span>
                      {user?.role === "HR"
                        ? "Total Employees"
                        : "Employees Under Me"}
                    </span>

                    <h3>
                      {user?.role === "HR"
                        ? stats.totalEmployees || 0
                        : stats.managerEmployees?.length || 0}
                    </h3>

                    <p>
                      {user?.role === "HR"
                        ? "company users"
                        : "team members"}
                    </p>
                  </div>

                  <div className="mini-stat-card">
                    <Building2 size={23} />

                    <span>
                      {user?.role === "HR"
                        ? "Departments"
                        : "Teams Under Me"}
                    </span>

                    <h3>
                      {user?.role === "HR"
                        ? stats.departments || 0
                        : stats.managerTeamCount || 0}
                    </h3>

                    <p>
                      {user?.role === "HR"
                        ? "active departments"
                        : "managed teams"}
                    </p>
                  </div>

                  <div className="mini-stat-card">
                    <CalendarCheck size={23} />

                    <span>
                      {user?.role === "HR"
                        ? "Pending HR Leave Approvals"
                        : "Pending Manager Leaves"}
                    </span>

                    <h3>
                      {stats.pendingManagerLeaves || 0}
                    </h3>

                    <p>awaiting your approval</p>
                  </div>

                  <div className="mini-stat-card">
                    <Receipt size={23} />

                    <span>
                      {user?.role === "HR"
                        ? "Pending HR Reimbursements"
                        : "Pending Manager Reimbursements"}
                    </span>

                    <h3>
                      {stats.pendingManagerReimbursements || 0}
                    </h3>

                    <p>awaiting your approval</p>
                  </div>
                </div>

                <div className="modern-section-card">
                  {user?.role === "Manager" && (
                    <>
                      <h3>Teams Under Me</h3>

                      {stats.managerTeams?.length > 0 ? (
                        <div
                          style={{
                            marginTop: "15px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "12px",
                          }}
                        >
                          {stats.managerTeams.map(
                            (team) => (
                              <div
                                key={team._id}
                                style={{
                                  padding: "14px",
                                  border:
                                    "1px solid #e5e7eb",
                                  borderRadius:
                                    "12px",
                                  background:
                                    "#ffffff",
                                }}
                              >
                                <strong>
                                  {team.name}
                                </strong>

                                <p
                                  style={{
                                    margin:
                                      "8px 0 4px",
                                  }}
                                >
                                  Employees:{" "}
                                  {team.employeeCount ||
                                    0}
                                </p>

                                <p
                                  style={{
                                    margin: 0,
                                  }}
                                >
                                  Team Leader:{" "}
                                  {team.teamLeaderId
                                    ?.name ||
                                    "Not Assigned"}
                                </p>
                              </div>
                            )
                          )}
                        </div>
                      ) : (
                        <p
                          style={{
                            marginTop: "15px",
                          }}
                        >
                          No teams are assigned.
                        </p>
                      )}
                    </>
                  )}

                  {user?.role === "HR" && (
                    <>
                      <h3>HR Overview</h3>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit,minmax(200px,1fr))",
                          gap: "15px",
                          marginTop: "20px",
                        }}
                      >
                        <div className="mini-stat-card">
                          <span>Managers</span>

                          <h3>
                            {stats.totalManagers ||
                              0}
                          </h3>
                        </div>

                        <div className="mini-stat-card">
                          <span>
                            Team Leaders
                          </span>

                          <h3>
                            {stats.totalTeamLeaders ||
                              0}
                          </h3>
                        </div>

                        <div className="mini-stat-card">
                          <span>HR Users</span>

                          <h3>
                            {stats.totalHRs || 0}
                          </h3>
                        </div>

                        <div className="mini-stat-card">
                          <span>Finance</span>

                          <h3>
                            {stats.totalFinance ||
                              0}
                          </h3>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="modern-section-card dashboard-quick-action-card">
                  <h3>
                    {user?.role === "HR"
                      ? "HR Quick Actions"
                      : "Manager Quick Actions"}
                  </h3>

                  <div
                    className="dashboard-quick-actions"
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(220px, 1fr))",
                      gap: "16px",
                      marginTop: "16px",
                    }}
                  >
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() =>
                        navigateToPage(
                          "managerApprovals"
                        )
                      }
                    >
                      Review Leave Approvals
                    </button>

                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() =>
                        navigateToPage(
                          "reimbursementApprovals"
                        )
                      }
                    >
                      Review Reimbursements
                    </button>

                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() =>
                        navigateToPage(
                          "leaveCalendar"
                        )
                      }
                    >
                      View Leave Calendar
                    </button>

                    <button
                      type="button"
                      className="btn"
                      onClick={openEditProfile}
                    >
                      Edit My Profile
                    </button>
                  </div>
                </div>
              </>
            )}

            {isTeamLeader && (
              <>
                <div className="employee-dashboard-grid">
                  <div className="modern-profile-card">
                    <div className="profile-main-row">
                      <div className="large-avatar">
                        {user?.profilePhoto?.url ? (
                          <img
                            src={user.profilePhoto.url}
                            alt={
                              user?.name ||
                              "Team Leader"
                            }
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              borderRadius: "50%",
                            }}
                          />
                        ) : (
                          user?.name
                            ?.charAt(0)
                            ?.toUpperCase() || "T"
                        )}
                      </div>

                      <div>
                        <h2>
                          {user?.name ||
                            "Team Leader"}
                        </h2>

                        <p>
                          {user?.email || "N/A"}
                        </p>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: "10px",
                          alignItems: "center",
                          flexWrap: "wrap",
                        }}
                      >
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={openEditProfile}
                        >
                          <UserRound size={16} />
                          Edit Profile
                        </button>

                        <span className="active-pill">
                          <BadgeCheck size={14} />
                          Team Leader
                        </span>
                      </div>
                    </div>

                    <div className="profile-divider" />

                    <div className="profile-detail-grid">
                      <div>
                        <span>Employee ID</span>

                        <strong>
                          {user?.employeeId ||
                            "Not Updated"}
                        </strong>
                      </div>

                      <div>
                        <span>Phone</span>

                        <strong>
                          {user?.phone ||
                            "Not Updated"}
                        </strong>
                      </div>

                      <div>
                        <span>Designation</span>

                        <strong>
                          {user?.designation ||
                            "Not Updated"}
                        </strong>
                      </div>

                      <div>
                        <span>Department</span>

                        <strong>
                          {user?.subcategoryId?.name ||
                            "Not Updated"}
                        </strong>
                      </div>

                      <div>
                        <span>Team</span>

                        <strong>
                          {user?.teamId?.name ||
                            "Not Updated"}
                        </strong>
                      </div>

                      <div>
                        <span>Status</span>

                        <strong>
                          {user?.isActive === false
                            ? "Inactive"
                            : "Active"}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modern-stats-grid">
                  <div className="mini-stat-card">
                    <Users size={23} />

                    <span>My Team Members</span>

                    <h3>
                      {stats.teamMembers?.length ||
                        0}
                    </h3>

                    <p>assigned employees</p>
                  </div>

                  <div className="mini-stat-card">
                    <Building2 size={23} />

                    <span>My Teams</span>

                    <h3>
                      {stats.tlTeams?.length || 0}
                    </h3>

                    <p>teams under you</p>
                  </div>

                  <div className="mini-stat-card">
                    <CalendarCheck size={23} />

                    <span>
                      Pending Leave Review
                    </span>

                    <h3>
                      {stats.pendingTLLeaves || 0}
                    </h3>

                    <p>awaiting TL review</p>
                  </div>

                  <div className="mini-stat-card">
                    <Receipt size={23} />

                    <span>
                      Pending Claim Review
                    </span>

                    <h3>
                      {stats.pendingTLReimbursements ||
                        0}
                    </h3>

                    <p>awaiting TL review</p>
                  </div>
                </div>

                <div className="modern-section-card dashboard-quick-action-card">
                  <h3>
                    Team Leader Quick Actions
                  </h3>

                  <div
                    className="dashboard-quick-actions"
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(220px, 1fr))",
                      gap: "16px",
                      marginTop: "16px",
                    }}
                  >
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() =>
                        navigateToPage(
                          "tlApprovals"
                        )
                      }
                    >
                      Review Leave Requests
                    </button>

                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() =>
                        navigateToPage(
                          "reimbursementApprovals"
                        )
                      }
                    >
                      Review Reimbursements
                    </button>

                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() =>
                        navigateToPage("leave")
                      }
                    >
                      Apply / Track My Leave
                    </button>

                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() =>
                        navigateToPage(
                          "reimbursements"
                        )
                      }
                    >
                      Apply / Track Claims
                    </button>

                    <button
                      type="button"
                      className="btn"
                      onClick={openEditProfile}
                    >
                      Edit My Profile
                    </button>
                  </div>
                </div>

                <div className="modern-section-card">
                  <h3>My Team Members</h3>

                  {stats.teamMembers?.length > 0 ? (
                    <div
                      style={{
                        marginTop: "15px",
                      }}
                    >
                      {stats.teamMembers.map(
                        (member) => (
                          <div
                            key={member._id}
                            style={{
                              padding: "12px",
                              borderBottom:
                                "1px solid #eee",
                              display: "flex",
                              justifyContent:
                                "space-between",
                              alignItems:
                                "center",
                              gap: "12px",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems:
                                  "center",
                                gap: "12px",
                              }}
                            >
                              <div
                                style={{
                                  width: "42px",
                                  height: "42px",
                                  borderRadius:
                                    "50%",
                                  overflow:
                                    "hidden",
                                  background:
                                    "#f1f5f9",
                                  display: "flex",
                                  alignItems:
                                    "center",
                                  justifyContent:
                                    "center",
                                  flexShrink: 0,
                                }}
                              >
                                {member
                                  .profilePhoto
                                  ?.url ? (
                                  <img
                                    src={
                                      member
                                        .profilePhoto
                                        .url
                                    }
                                    alt={
                                      member.name ||
                                      "Member"
                                    }
                                    style={{
                                      width:
                                        "100%",
                                      height:
                                        "100%",
                                      objectFit:
                                        "cover",
                                    }}
                                  />
                                ) : (
                                  member.name
                                    ?.charAt(0)
                                    ?.toUpperCase() ||
                                  "U"
                                )}
                              </div>

                              <div>
                                <strong>
                                  {member.name}
                                </strong>

                                <p
                                  style={{
                                    margin:
                                      "4px 0",
                                    color:
                                      "#6b7280",
                                  }}
                                >
                                  {member.designation ||
                                    "No designation"}{" "}
                                  •{" "}
                                  {member.role}
                                </p>
                              </div>
                            </div>

                            <span className="active-pill">
                              {member.teamId
                                ?.name ||
                                "No Team"}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <p>
                      No team members assigned.
                    </p>
                  )}
                </div>
              </>
            )}
            {isFinance && (
              <>
                <div className="employee-dashboard-grid">
                  <div className="modern-profile-card">
                    <div className="profile-main-row">
                      <div className="large-avatar">
                        {user?.profilePhoto?.url ? (
                          <img
                            src={user.profilePhoto.url}
                            alt={user?.name || "Finance"}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              borderRadius: "50%",
                            }}
                          />
                        ) : (
                          user?.name
                            ?.charAt(0)
                            ?.toUpperCase() || "F"
                        )}
                      </div>

                      <div>
                        <h2>
                          {user?.name || "Finance"}
                        </h2>

                        <p>
                          {user?.email || "N/A"}
                        </p>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: "10px",
                          alignItems: "center",
                          flexWrap: "wrap",
                        }}
                      >
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={openEditProfile}
                        >
                          <UserRound size={16} />
                          Edit Profile
                        </button>

                        <span className="active-pill">
                          <BadgeCheck size={14} />
                          Finance
                        </span>
                      </div>
                    </div>

                    <div className="profile-divider" />

                    <div className="profile-detail-grid">
                      <div>
                        <span>Employee ID</span>

                        <strong>
                          {user?.employeeId ||
                            "Not Updated"}
                        </strong>
                      </div>

                      <div>
                        <span>Phone</span>

                        <strong>
                          {user?.phone ||
                            "Not Updated"}
                        </strong>
                      </div>

                      <div>
                        <span>Designation</span>

                        <strong>
                          {user?.designation ||
                            "Not Updated"}
                        </strong>
                      </div>

                      <div>
                        <span>Status</span>

                        <strong>
                          {user?.isActive === false
                            ? "Inactive"
                            : "Active"}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modern-stats-grid">
                  <div className="mini-stat-card">
                    <Receipt size={23} />

                    <span>
                      Approved Reimbursements
                    </span>

                    <h3>
                      {stats.approvedReimbursements ||
                        0}
                    </h3>

                    <p>ready for payment</p>
                  </div>

                  <div className="mini-stat-card">
                    <CalendarCheck size={23} />

                    <span>
                      Approved Leaves
                    </span>

                    <h3>
                      {stats.approvedLeaves || 0}
                    </h3>

                    <p>employee records</p>
                  </div>

                  <div className="mini-stat-card">
                    <BadgeCheck size={23} />

                    <span>Finance Role</span>

                    <h3>Finance</h3>

                    <p>authorized</p>
                  </div>
                </div>

                <div className="modern-section-card">
                  <h3>Finance Overview</h3>

                  <div
                    style={{
                      display: "flex",
                      gap: "12px",
                      flexWrap: "wrap",
                      marginTop: "16px",
                    }}
                  >
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() =>
                        navigateToPage(
                          "financeLeaves"
                        )
                      }
                    >
                      View Finance Leaves
                    </button>

                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() =>
                        navigateToPage(
                          "financeReimbursements"
                        )
                      }
                    >
                      View Reimbursements
                    </button>

                    <button
                      type="button"
                      className="btn"
                      onClick={openEditProfile}
                    >
                      Edit My Profile
                    </button>
                  </div>
                </div>
              </>
            )}

            {!isAdmin && !isFinance && (
              <SignatureUploader />
            )}
          </>
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

        {hasPersonalLeaveBalance && activePage === "myLeaveBalance" && (
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
              <Notifications />
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
        </div>
        {showPasswordModal && (
          <div className="modal-overlay">
            <div
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

              <div className="input-group">
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
              </div>

              <div className="input-group">
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
              </div>

              <div className="input-group">
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
              </div>

              <button
                type="button"
                className="btn btn-primary"
                onClick={handlePasswordChange}
              >
                Update Password
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
