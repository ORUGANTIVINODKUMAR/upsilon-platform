const recipientKey = (user) => user?._id?.toString() || user?.email?.trim().toLowerCase();

export const deduplicateRecipients = (users = []) => [
  ...new Map(
    users
      .filter((user) => user?.isActive !== false && user?.email?.trim())
      .map((user) => [recipientKey(user), user])
  ).values(),
];

export const getLeaveNotificationRecipients = ({ team, hrUsers, employeeId }) =>
  deduplicateRecipients([
    ...(team?.managerIds || []),
    ...(hrUsers || []),
  ]).filter((user) => user._id?.toString() !== employeeId?.toString());

export const getManagerVisibleTeamIds = (manager, teams = []) => {
  const managerId = manager?._id?.toString();
  return teams
    .filter((team) =>
      (team.managerIds || []).some((id) => (id?._id || id)?.toString() === managerId)
      || (manager.assignedTeamIds || []).some((id) => id.toString() === team._id?.toString())
    )
    .map((team) => team._id.toString());
};
