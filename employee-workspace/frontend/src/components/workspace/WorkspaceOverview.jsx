import { ArrowUpRight, CalendarDays, CalendarCheck, Users, Building2, Receipt, Wallet, Cake, ArrowRight } from "lucide-react";
import { EmptyState, ErrorState, LoadingState } from "../ui/StatePanel";
import MetricCard from "../ui/MetricCard";
import UserAvatar from "../ui/UserAvatar";
import StatusBadge from "../ui/StatusBadge";
import SignatureUploader from "../SignatureUploader";
import { formatRole } from "./navigation";

const date = (value, options = {}) => value ? new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", ...options }) : "—";
const number = (value) => value ?? "—";

const metricsFor = (role, stats) => {
  if (role === "Admin") return [
    ["Employees", stats.totalEmployees, "All employee accounts", Users],
    ["Departments", stats.departments, "Across the organization", Building2],
    ["Pending leave", stats.pendingLeaves, "Awaiting final approval", CalendarCheck],
    ["Pending claims", stats.pendingReimbursements, "Awaiting review", Receipt],
  ];
  if (role === "Finance") return [
    ["Approved leave", stats.approvedLeaves, "Final approved requests", CalendarCheck],
    ["Claims to pay", stats.approvedReimbursements, "Approved · pending payment", Wallet],
    ["Paid claims", stats.paidReimbursements, "Completed reimbursements", Receipt],
  ];
  if (["HR", "Manager", "TeamLeader"].includes(role)) return [
    [role === "HR" ? "Employees" : "Team members", role === "HR" ? stats.totalEmployees : role === "Manager" ? stats.managerTeamCount : stats.teamLeaderTeamCount, role === "HR" ? "Across the organization" : "Active direct reports", Users],
    ["Pending leave", role === "TeamLeader" ? stats.pendingTLLeaves : stats.pendingManagerLeaves, "Awaiting your review", CalendarCheck],
    ["Pending claims", role === "TeamLeader" ? stats.pendingTLReimbursements : stats.pendingManagerReimbursements, "Awaiting your review", Receipt],
    ["Available leave", stats.leaveBalance?.availablePaidLeave, "Your paid leave · days", Wallet],
  ];
  return [
    ["Available leave", stats.leaveBalance?.availablePaidLeave, "Paid leave · days", Wallet],
    ["My requests", stats.myLeaves, "Total leave requests", CalendarDays],
    ["Pending leave", stats.myPendingLeaves, "Awaiting approval", CalendarCheck],
    ["My claims", stats.myReimbursements, "Total reimbursements", Receipt],
  ];
};

function Panel({ title, description, action, children, className = "" }) {
  return <section className={`overview-panel ${className}`}>
    <header className="overview-panel-heading"><div><h2>{title}</h2>{description && <p>{description}</p>}</div>{action}</header>
    {children}
  </section>;
}

export default function WorkspaceOverview({ user, stats, loading, error, onRetry, onNavigate, allowedPages, notifications, notificationError }) {
  const personal = ["Employee", "TeamLeader", "Manager", "HR"].includes(user.role);
  const operational = ["Admin", "TeamLeader", "Manager", "HR"].includes(user.role);
  const holiday = stats.tomorrowHoliday || stats.nearestUpcomingHoliday;
  const teams = user.role === "Manager" ? stats.managerTeams : stats.tlTeams;
  const link = (page, label) => allowedPages.includes(page) ? <button type="button" className="overview-text-link" onClick={() => onNavigate(page)}>{label}<ArrowRight size={14} aria-hidden="true" /></button> : null;
  const actions = [
    ["users", "Manage employees"], ["leave", "Request leave"], ["managerApprovals", "Review leave"],
    ["financeReimbursements", "Review payments"], ["reimbursements", "Submit a claim"], ["leaveCalendar", "Open calendar"],
  ].filter(([key]) => allowedPages.includes(key)).slice(0, 3);

  return <div className="workspace-overview">
    {/* The page title ("Welcome back, …") lives in the shell header. */}
    <div className="overview-actions" aria-label="Quick actions">
      {actions.map(([page, label], index) => <button key={page} type="button" className={`btn ${index === 0 ? "btn-primary" : "btn-secondary"}`} onClick={() => onNavigate(page)}>{label}<ArrowUpRight size={15} aria-hidden="true" /></button>)}
      <time className="overview-date" dateTime={new Date().toISOString()}><CalendarDays size={16} aria-hidden="true" />{date(new Date(), { weekday: "short", year: "numeric" })}</time>
    </div>
    {loading ? <LoadingState label="Loading your workspace overview…" /> : error ? <ErrorState title="Overview unavailable" description={error} action={<button className="btn" onClick={onRetry}>Try again</button>} /> : <>
      <div className="overview-metrics">{metricsFor(user.role, stats).map(([label, value, detail, icon]) => <MetricCard key={label} label={label} value={number(value)} detail={detail} icon={icon} />)}</div>
      <div className="overview-columns">
        <div className="overview-primary">
          {operational ? <Panel title="Away today" description="Approved leave across your scope" action={link("leaveCalendar", "View calendar")}>
            {stats.todayLeaves?.length ? <div className="overview-list">{stats.todayLeaves.map(leave => <div className="overview-person" key={leave._id}><UserAvatar name={leave.employeeId?.name} /><div><strong>{leave.employeeId?.name || "Employee"}</strong><small>{[leave.subcategoryId?.name, leave.teamId?.name].filter(Boolean).join(" · ") || "Department not assigned"}</small></div><div className="overview-person-detail"><StatusBadge status={leave.leaveType} /><small>{date(leave.startDate)} – {date(leave.endDate)}</small></div></div>)}</div> : <EmptyState compact title="Everyone is in" description="No employees are on approved leave today." />}
          </Panel> : user.role === "Employee" ? <Panel title="My leave activity" description="Track the progress of your requests" action={link("leave", "View requests")}>
            <dl className="overview-ledger"><div><dt>Pending approval</dt><dd>{number(stats.myPendingLeaves)}</dd></div><div><dt>Approved</dt><dd>{number(stats.myApprovedLeaves)}</dd></div><div><dt>Rejected</dt><dd>{number(stats.myRejectedLeaves)}</dd></div></dl>
          </Panel> : null}
          {personal && <Panel title="My leave balance" description="Allocation and usage in days" action={link("myLeaveBalance", "View history")}>
            <dl className="overview-balance">{[["Monthly allocation", stats.leaveBalance?.monthlyAllocation], ["Carry forward", stats.leaveBalance?.carryForward], ["Paid leave used", stats.leaveBalance?.paidLeaveUsed], ["Excess / LOP", stats.leaveBalance?.excessLeaveDays]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{number(value)}</dd></div>)}</dl>
            {user.role !== "Employee" && <div className="overview-inline-summary">My leave requests: {number(stats.myLeaves)} · Pending: {number(stats.myPendingLeaves)} · Approved: {number(stats.myApprovedLeaves)} · Rejected: {number(stats.myRejectedLeaves)}</div>}
          </Panel>}
          {user.role === "Admin" && <Panel title="Organization" description="Your people and operational records" action={link("departments", "Departments")}><dl className="overview-balance">{[["Managers", stats.totalManagers], ["Team leaders", stats.totalTeamLeaders], ["HR", stats.totalHRs], ["Finance", stats.totalFinance]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{number(value)}</dd></div>)}</dl><div className="overview-panel-footer">{link("teams", "Manage teams")}{link("leaveReports", "Leave reports")}{link("reimbursementReports", "Claim reports")}</div></Panel>}
          {user.role === "HR" && <Panel title="Organization overview"><dl className="overview-balance">{[["Managers", stats.totalManagers], ["Team leaders", stats.totalTeamLeaders], ["HR", stats.totalHRs], ["Finance", stats.totalFinance]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{number(value)}</dd></div>)}</dl></Panel>}
          {["Manager", "TeamLeader"].includes(user.role) && <Panel title="My teams" description="Team structure and direct reports">
            {teams?.length ? teams.map(team => <details className="overview-team" key={team._id}><summary><span>{team.name}<small>{team.departmentId?.name || "Department not assigned"}</small></span><span>{team.employeeCount ?? team.employees?.length ?? 0} members</span></summary><p>Team leader: {team.teamLeaderId?.name || (user.role === "TeamLeader" ? user.name : "Not assigned")}</p>{(team.employees || []).map(member => <div className="overview-person" key={member._id}><UserAvatar name={member.name} /><div><strong>{member.name}</strong><small>{member.email} · {member.designation || formatRole(member.role)}</small></div><small>{member.employeeId}</small></div>)}</details>) : <EmptyState compact title="No teams assigned" />}
            <details className="overview-team"><summary>All direct reports <span>{(user.role === "Manager" ? stats.managerEmployees : stats.teamMembers)?.length ?? 0}</span></summary>{(user.role === "Manager" ? stats.managerEmployees : stats.teamMembers)?.map(member => <div className="overview-person" key={member._id}><UserAvatar name={member.name} /><div><strong>{member.name}</strong><small>{member.email} · {member.designation || formatRole(member.role)}</small></div><small>{member.teamId?.name || "No team"}</small></div>)}</details>
          </Panel>}
          {user.role === "Finance" && <Panel title="Finance queue" description="Open the existing records to review leave and payments"><div className="overview-panel-footer">{link("financeLeaves", "Approved leave records")}{link("financeReimbursements", "Reimbursement payments")}</div></Panel>}
        </div>
        <div className="overview-secondary">
          <Panel title="Next holiday" action={link("holidays", "All holidays")} className="overview-holiday">
            {holiday ? <div className="overview-holiday-content"><div className="overview-date-tile"><span>{date(holiday.holidayDate, { day: undefined, month: "short" })}</span><strong>{new Date(holiday.holidayDate).getDate()}</strong></div><div><h3>{holiday.name}</h3><p>{date(holiday.holidayDate, { weekday: "long", year: "numeric" })}</p><StatusBadge status={holiday.type || "Company holiday"} /></div></div> : <EmptyState compact title="No upcoming holidays" description="Scheduled holidays will appear here." />}
          </Panel>
          {personal && allowedPages.includes("reimbursements") && <Panel title="My reimbursements" action={link("reimbursements", "View claims")}><dl className="overview-ledger"><div><dt>Total claims</dt><dd>{number(stats.myReimbursements)}</dd></div><div><dt>Pending review</dt><dd>{number(stats.myPendingReimbursements)}</dd></div><div><dt>Approved</dt><dd>{number(stats.myApprovedReimbursements)}</dd></div></dl></Panel>}
          {allowedPages.includes("notifications") && <Panel title="Recent updates" action={link("notifications", "View all")}>
            {notificationError ? <ErrorState compact title="Updates unavailable" description={notificationError} /> : notifications.length ? <div className="overview-updates">{notifications.slice(0, 4).map(item => <article key={item._id} className={item.isRead ? "is-read" : "is-unread"}><strong>{item.title}</strong><p>{item.message}</p><small>{item.isRead ? "Read" : "Unread"} · {date(item.createdAt)}</small></article>)}</div> : <EmptyState compact title="No recent updates" description="Your notifications will appear here." />}
          </Panel>}
          {stats.todaysBirthdayEmployees?.length > 0 && <Panel title="Birthdays today"><div className="overview-list">{stats.todaysBirthdayEmployees.map(person => <div className="overview-person" key={person._id}><Cake size={18} aria-hidden="true" /><div><strong>{person.name}</strong><small>{person.designation || formatRole(person.role)}</small></div></div>)}</div></Panel>}
        </div>
      </div>
    </>}
    {personal && <details className="overview-signature"><summary>My approval signature <span>View or update signature</span></summary><SignatureUploader /></details>}
  </div>;
}
