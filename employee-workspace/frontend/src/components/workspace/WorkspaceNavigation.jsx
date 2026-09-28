import { LayoutDashboard, Bell, Users, Building2, CalendarDays, CalendarCheck, ClipboardList, Receipt, Wallet, UserRound, ShieldCheck, Clock } from "lucide-react";
import { PAGE_META } from "./navigation";

const groups = [
  { label: "Workspace", items: [["dashboard", LayoutDashboard], ["notifications", Bell], ["attendance", Clock]] },
  { label: "People", items: [["users", Users], ["departments", Building2], ["teams", Users]] },
  { label: "Time off", items: [["leave", CalendarCheck], ["myLeaveBalance", Wallet], ["hrLeaveBalances", Wallet], ["tlApprovals", ShieldCheck], ["managerApprovals", ShieldCheck], ["leaveCalendar", CalendarDays], ["holidays", CalendarDays]] },
  { label: "Finance & reports", items: [["reimbursements", Receipt], ["reimbursementApprovals", Receipt], ["financeLeaves", ClipboardList], ["financeReimbursements", Wallet], ["leaveReports", ClipboardList], ["reimbursementReports", Receipt]] },
  { label: "Account", items: [["editProfile", UserRound]] },
];

export default function WorkspaceNavigation({ allowedPages, activePage, onNavigate }) {
  return <nav className="sidebar-menu" aria-label="Primary">
    {groups.map(({ label, items }) => {
      const visible = items.filter(([key]) => allowedPages.includes(key));
      if (!visible.length) return null;
      return <div className="workspace-nav-group" key={label}>
        <span className="sidebar-group-label">{label}</span>
        {visible.map(([key, Icon]) => <button key={key} type="button"
          className={activePage === key ? "active-menu" : ""}
          onClick={() => onNavigate(key)} aria-current={activePage === key ? "page" : undefined}
          title={PAGE_META[key].title} aria-label={PAGE_META[key].title}>
          <Icon size={17} aria-hidden="true" />
          <span className="sidebar-item-label">{PAGE_META[key].title}</span>
          <span className="sidebar-tooltip" aria-hidden="true">{PAGE_META[key].title}</span>
        </button>)}
      </div>;
    })}
  </nav>;
}
