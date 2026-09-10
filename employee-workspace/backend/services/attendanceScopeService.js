import Team from "../models/Team.js";
import { ATTENDANCE_EMPLOYEE_ROLES } from "./attendancePolicy.js";

export const getManagedTeamIds = async (user) => {
  const teams = await Team.find({ managerIds: user._id }).select("_id").lean();
  return [...new Set([
    ...(user.assignedTeamIds || []).map((id) => id.toString()),
    ...teams.map((team) => team._id.toString()),
  ])];
};

export const employeeBaseFilter = (actor) => ({
  isActive: true,
  role: { $in: ATTENDANCE_EMPLOYEE_ROLES },
  _id: { $ne: actor._id },
});

export const getAuthorizedEmployeeFilter = async (actor) => {
  const base = employeeBaseFilter(actor);
  if (actor.role === "HR") return base;
  const managedTeamIds = await getManagedTeamIds(actor);
  return { ...base, $or: [
    { managerId: actor._id },
    ...(managedTeamIds.length > 0 ? [{ teamId: { $in: managedTeamIds } }] : []),
  ] };
};
