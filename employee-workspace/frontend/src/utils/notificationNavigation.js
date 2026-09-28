const ROUTE_PAGE_MAP = {
  "/dashboard": "dashboard",
  "/finance-leaves": "financeLeaves",
  "/finance-reimbursements": "financeReimbursements",
  "/leave-calendar": "leaveCalendar",
  "/edit-profile": "editProfile",
};

const fallbackPageFor = (notification, role) => {
  const searchableText = `${notification?.title || ""} ${notification?.message || ""}`;
  const inferredType = notification?.type === "System"
    ? (/reimbursement/i.test(searchableText) ? "Reimbursement" : /leave/i.test(searchableText) ? "Leave" : "System")
    : notification?.type;

  if (inferredType === "Leave") {
    if (role === "Finance") return "financeLeaves";
    if (["Manager", "HR"].includes(role)) return "managerApprovals";
    if (role === "TeamLeader" && !/^your\b/i.test(notification.message || "")) {
      return "tlApprovals";
    }
    return "leave";
  }

  if (inferredType === "Reimbursement") {
    if (role === "Finance") return "financeReimbursements";
    if (["Manager", "HR"].includes(role)) return "reimbursementApprovals";
    if (role === "TeamLeader" && !/^your\b/i.test(notification.message || "")) {
      return "reimbursementApprovals";
    }
    return "reimbursements";
  }

  return "notifications";
};

export const getNotificationPage = (notification, role, allowedPages = []) => {
  let linkedPage = "";

  if (notification?.link) {
    try {
      const url = new URL(notification.link, "https://workspace.local");
      linkedPage = url.searchParams.get("page") || ROUTE_PAGE_MAP[url.pathname] || "";
    } catch {
      linkedPage = "";
    }
  }

  const fallbackPage = fallbackPageFor(notification, role);
  const destination = linkedPage && linkedPage !== "dashboard" ? linkedPage : fallbackPage;

  if (allowedPages.includes(destination)) return destination;
  if (allowedPages.includes("notifications")) return "notifications";
  return "dashboard";
};
