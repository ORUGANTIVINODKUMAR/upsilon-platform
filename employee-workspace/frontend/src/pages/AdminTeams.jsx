import { useCallback, useEffect, useState } from "react";
import {
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Users,
} from "lucide-react";

import api from "../api/api";
import useConfirm from "../components/ui/useConfirm";
import PageHeader from "../components/ui/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/StatePanel";
import StatusBadge from "../components/ui/StatusBadge";

const initialFormData = {
  name: "",
  departmentId: "",
  managerIds: [],
  hrIds: [],
  teamLeaderId: "",
};

const AdminTeams = () => {
  const confirmAction = useConfirm();
  const [teams, setTeams] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [managers, setManagers] = useState([]);
  const [hrs, setHrs] = useState([]);
  const [teamLeaders, setTeamLeaders] = useState([]);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingTeamId, setDeletingTeamId] = useState("");
  const [editingTeam, setEditingTeam] = useState(null);
  const [formData, setFormData] = useState(initialFormData);

  const fetchTeams = useCallback(async () => {
    const { data } = await api.get("/admin/teams");
    setTeams(Array.isArray(data.teams) ? data.teams : []);
  }, []);

  const fetchDepartments = useCallback(async () => {
    const { data } = await api.get("/admin/subcategories");
    setDepartments(Array.isArray(data.subcategories) ? data.subcategories : []);
  }, []);

  const fetchUsers = useCallback(async () => {
    const { data } = await api.get("/admin/users");
    const users = Array.isArray(data.users) ? data.users : [];

    setManagers(
      users.filter((user) => user.role === "Manager" && user.isActive)
    );
    setHrs(users.filter((user) => user.role === "HR" && user.isActive));
    setTeamLeaders(
      users.filter((user) => user.role === "TeamLeader" && user.isActive)
    );
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");

    try {
      await Promise.all([fetchTeams(), fetchDepartments(), fetchUsers()]);
    } catch (requestError) {
      setLoadError(
        requestError.response?.data?.message || "Unable to load team management data"
      );
    } finally {
      setIsLoading(false);
    }
  }, [fetchDepartments, fetchTeams, fetchUsers]);

  useEffect(() => {
    const initialLoad = window.setTimeout(loadData, 0);

    const handleUsersUpdated = async () => {
      try {
        await Promise.all([fetchUsers(), fetchTeams()]);
      } catch (requestError) {
        setLoadError(
          requestError.response?.data?.message || "Unable to refresh team users"
        );
      }
    };

    const handleDepartmentsUpdated = async () => {
      try {
        await fetchDepartments();
      } catch (requestError) {
        setLoadError(
          requestError.response?.data?.message || "Unable to refresh departments"
        );
      }
    };

    window.addEventListener("users-updated", handleUsersUpdated);
    window.addEventListener("departments-updated", handleDepartmentsUpdated);

    return () => {
      window.clearTimeout(initialLoad);
      window.removeEventListener("users-updated", handleUsersUpdated);
      window.removeEventListener("departments-updated", handleDepartmentsUpdated);
    };
  }, [fetchDepartments, fetchTeams, fetchUsers, loadData]);

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingTeam(null);
    setError("");
  };

  const handleEdit = (team) => {
    setEditingTeam(team);
    setError("");
    setFormData({
      name: team.name || "",
      departmentId: team.departmentId?._id || "",
      teamLeaderId: team.teamLeaderId?._id || "",
      managerIds: team.managerIds?.map((manager) => manager._id) || [],
      hrIds: team.hrIds?.map((hr) => hr._id) || [],
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!formData.name.trim() || !formData.departmentId) {
      setError("Team name and department are required");
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingTeam) {
        await api.put(`/admin/teams/${editingTeam._id}`, formData);
        window.dispatchEvent(new CustomEvent("department-data-updated"));
      } else {
        await api.post("/admin/teams", formData);
      }

      await Promise.all([fetchTeams(), fetchUsers(), fetchDepartments()]);
      window.dispatchEvent(new CustomEvent("teams-updated"));
      window.dispatchEvent(new CustomEvent("department-data-updated"));

      window.alert(
        editingTeam ? "Team updated successfully" : "Team created successfully"
      );
      resetForm();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to save team");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!await confirmAction({
      title: "Delete this team?",
      description: "This action is available only when no employees or reporting assignments depend on the team.",
      confirmLabel: "Delete team",
    })) return;

    setDeletingTeamId(id);
    setError("");

    try {
      await api.delete(`/admin/teams/${id}`);
      await Promise.all([fetchTeams(), fetchDepartments()]);
      window.dispatchEvent(new CustomEvent("teams-updated"));
      window.dispatchEvent(new CustomEvent("department-data-updated"));
      window.alert("Team deleted successfully");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to delete team");
    } finally {
      setDeletingTeamId("");
    }
  };

  const selectManager = (managerId) => {
    setFormData((previousData) => ({
      ...previousData,
      managerIds: managerId ? [managerId] : [],
    }));
  };

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Team Management"
        description="Create teams and assign Managers, HR users and Team Leaders."
        icon={Users}
      />

      {loadError ? (
        <ErrorState
          title="Unable to load teams"
          description={loadError}
          action={(
            <button type="button" className="btn btn-secondary" onClick={loadData}>
              <RefreshCw size={16} aria-hidden="true" />
              Try again
            </button>
          )}
        />
      ) : isLoading ? (
        <LoadingState label="Loading teams and assignments" />
      ) : (
        <>
          <div className="card">
            <div className="section-header">
              <div>
                <h3 id="team-form-title">
                  {editingTeam ? `Edit ${editingTeam.name}` : "Create New Team"}
                </h3>
                <p className="section-subtitle">
                  Team name and department are required. Assignments are optional.
                </p>
              </div>
            </div>

            {error && (
              <div
                id="team-form-error"
                className="alert alert-error"
                role="alert"
                aria-live="assertive"
              >
                {error}
              </div>
            )}

            <form
              className="auth-form"
              onSubmit={handleSubmit}
              aria-labelledby="team-form-title"
              aria-busy={isSubmitting}
            >
              <div className="grid-2">
                <div className="input-group">
                  <label htmlFor="team-name">Team Name</label>
                  <input
                    id="team-name"
                    name="name"
                    placeholder="Example: Tax Team"
                    value={formData.name}
                    onChange={(event) =>
                      setFormData({ ...formData, name: event.target.value })
                    }
                    disabled={isSubmitting}
                    aria-invalid={Boolean(error) && !formData.name.trim()}
                    aria-describedby={error ? "team-form-error" : undefined}
                    required
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="team-department">Department</label>
                  <select
                    id="team-department"
                    name="departmentId"
                    value={formData.departmentId}
                    onChange={(event) =>
                      setFormData({ ...formData, departmentId: event.target.value })
                    }
                    disabled={isSubmitting}
                    aria-invalid={Boolean(error) && !formData.departmentId}
                    aria-describedby={error ? "team-form-error" : undefined}
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map((department) => (
                      <option key={department._id} value={department._id}>
                        {department.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid-2">
                <div className="input-group">
                  <label htmlFor="team-manager">Assign Manager</label>
                  <select
                    id="team-manager"
                    value={formData.managerIds[0] || ""}
                    onChange={(event) => selectManager(event.target.value)}
                    disabled={isSubmitting}
                  >
                    <option value="">No Manager Assigned</option>
                    {managers.map((manager) => (
                      <option key={manager._id} value={manager._id}>
                        {manager.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label htmlFor="team-hr">Assign HR</label>
                  <select
                    id="team-hr"
                    value={formData.hrIds[0] || ""}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        hrIds: event.target.value ? [event.target.value] : [],
                      })
                    }
                    disabled={isSubmitting}
                  >
                    <option value="">No HR Assigned</option>
                    {hrs.map((hr) => (
                      <option key={hr._id} value={hr._id}>
                        {hr.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="team-leader">Assign Team Leader</label>
                <select
                  id="team-leader"
                  name="teamLeaderId"
                  value={formData.teamLeaderId}
                  onChange={(event) =>
                    setFormData({ ...formData, teamLeaderId: event.target.value })
                  }
                  disabled={isSubmitting}
                >
                  <option value="">No Team Leader Assigned</option>
                  {teamLeaders.map((teamLeader) => (
                    <option key={teamLeader._id} value={teamLeader._id}>
                      {teamLeader.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-actions">
                <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <LoaderCircle className="ui-spin" size={18} aria-hidden="true" />
                  ) : (
                    <Plus size={18} aria-hidden="true" />
                  )}
                  <span aria-live="polite">
                    {isSubmitting
                      ? editingTeam
                        ? "Updating team…"
                        : "Creating team…"
                      : editingTeam
                        ? "Update Team"
                        : "Create Team"}
                  </span>
                </button>

                {editingTeam && (
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={resetForm}
                    disabled={isSubmitting}
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="table-wrapper modern-table-wrapper">
            <table className="custom-table">
              <caption className="sr-only">Configured employee teams</caption>
              <thead>
                <tr>
                  <th>Team</th>
                  <th>Department</th>
                  <th>Managers</th>
                  <th>HR</th>
                  <th>Team Leader</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {teams.map((team) => (
                  <tr key={team._id}>
                    <td>
                      <div className="user-cell">
                        <div className="avatar-circle" aria-hidden="true">
                          <Users size={16} />
                        </div>
                        <strong>{team.name}</strong>
                      </div>
                    </td>
                    <td>{team.departmentId?.name || "N/A"}</td>
                    <td>
                      {team.managerIds?.length > 0
                        ? team.managerIds.map((manager) => manager.name).join(", ")
                        : "Not Assigned"}
                    </td>
                    <td>
                      {team.hrIds?.length > 0
                        ? team.hrIds.map((hr) => hr.name).join(", ")
                        : "Not Assigned"}
                    </td>
                    <td>
                      {team.teamLeaderId
                        ? `${team.teamLeaderId.name} (${team.teamLeaderId.role})`
                        : "Not Assigned"}
                    </td>
                    <td>
                      <StatusBadge status={team.isActive ? "Active" : "Inactive"} />
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          type="button"
                          className="btn"
                          onClick={() => handleEdit(team)}
                          disabled={Boolean(deletingTeamId) || isSubmitting}
                          aria-label={`Edit ${team.name}`}
                        >
                          <Pencil size={14} aria-hidden="true" />
                          Edit
                        </button>

                        <button
                          type="button"
                          className="delete-icon-btn"
                          onClick={() => handleDelete(team._id)}
                          disabled={Boolean(deletingTeamId) || isSubmitting}
                          aria-label={`Delete ${team.name}`}
                        >
                          {deletingTeamId === team._id ? (
                            <LoaderCircle className="ui-spin" size={16} aria-hidden="true" />
                          ) : (
                            <Trash2 size={16} aria-hidden="true" />
                          )}
                          {deletingTeamId === team._id ? "Deleting…" : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {teams.length === 0 && (
                  <tr>
                    <td colSpan="7">
                      <EmptyState
                        compact
                        title="No teams found"
                        description="Create the first team using the form above."
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
};

export default AdminTeams;
