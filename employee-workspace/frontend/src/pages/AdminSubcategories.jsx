import { useEffect, useState } from "react";
import {
  Building2,
  Crown,
  Network,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserCog,
  UsersRound,
  X,
} from "lucide-react";
import api from "../api/api";
import useConfirm from "../components/ui/useConfirm";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/StatePanel";
import UserAvatar from "../components/ui/UserAvatar";

const AdminSubcategories = () => {
  const confirmAction = useConfirm();
  const [name, setName] = useState("");
  const [subcategories, setSubcategories] = useState([]);
  const [approvalUserCount, setApprovalUserCount] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [departmentSearch, setDepartmentSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [viewingId, setViewingId] = useState("");
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [message, setMessage] = useState("");

  const fetchSubcategories = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/admin/subcategories");
      setSubcategories(data.subcategories || []);
      setApprovalUserCount(
        Number(data.userSummary?.managerCount || 0) +
        Number(data.userSummary?.hrCount || 0)
      );
      setError("");
      return data.subcategories || [];
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load departments.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialLoad = window.setTimeout(fetchSubcategories, 0);

    const handleUsersUpdated = () => {
      fetchSubcategories();
    };

    const handleDepartmentRefresh = () => {
      fetchSubcategories();
    };

    window.addEventListener(
      "users-updated",
      handleUsersUpdated
    );

    window.addEventListener(
      "department-data-updated",
      handleDepartmentRefresh
    );

    return () => {
      window.clearTimeout(initialLoad);
      window.removeEventListener(
        "users-updated",
        handleUsersUpdated
      );

      window.removeEventListener(
        "department-data-updated",
        handleDepartmentRefresh
      );
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);
      setFormError("");
      setMessage("");
      await api.post("/admin/subcategories", {
        name: name.trim(),
      });

      setName("");
      setShowModal(false);
      await fetchSubcategories();
      setMessage("Department created successfully.");

      window.dispatchEvent(
        new CustomEvent("departments-updated")
      );
    } catch (requestError) {
      setFormError(requestError.response?.data?.message || "Unable to create department.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!await confirmAction({
      title: "Delete this department?",
      description: "The department can only be deleted when no employees or teams depend on it.",
      confirmLabel: "Delete department",
    })) return;

    try {
      setDeletingId(id);
      setError("");
      setMessage("");
      await api.delete(`/admin/subcategories/${id}`);
      await fetchSubcategories();
      setMessage("Department deleted successfully.");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
        "Users are associated with this department. You cannot delete it."
      );
    } finally {
      setDeletingId("");
    }
  };

  const viewDepartment = async (department) => {
    try {
      setViewingId(department._id);
      setError("");
      const { data } = await api.get("/admin/subcategories");
      const updated = (data.subcategories || []).find(
        (item) => item._id === department._id
      );
      setSubcategories(data.subcategories || []);
      setApprovalUserCount(
        Number(data.userSummary?.managerCount || 0) +
        Number(data.userSummary?.hrCount || 0)
      );
      setDepartmentSearch("");
      setSelectedDepartment(updated || department);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load department details.");
    } finally {
      setViewingId("");
    }
  };

  const totalEmployees = subcategories.reduce(
    (sum, item) => sum + (item.employeeCount || 0),
    0
  );

  const totalTeamLeaders = subcategories.reduce(
    (sum, item) => sum + (item.teamLeaderCount || 0),
    0
  );

  const closeDepartmentDetails = () => {
    setSelectedDepartment(null);
    setDepartmentSearch("");
  };

  useEffect(() => {
    if (!selectedDepartment) return undefined;

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setSelectedDepartment(null);
        setDepartmentSearch("");
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [selectedDepartment]);

  const normalizedDepartmentSearch = departmentSearch.trim().toLowerCase();
  const visibleDepartmentTeams = (selectedDepartment?.teams || [])
    .map((team) => {
      const leadership = [
        ...(team.managers || []),
        ...(team.hrs || []),
        ...(team.teamLeader ? [team.teamLeader] : []),
      ];
      const teamMatches = [team.name, ...leadership.map((user) => user.name)]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedDepartmentSearch));
      const employees = !normalizedDepartmentSearch || teamMatches
        ? team.employees || []
        : (team.employees || []).filter((employee) =>
          [employee.name, employee.employeeId, employee.designation]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(normalizedDepartmentSearch))
        );

      return { ...team, employees, matchesSearch: teamMatches || employees.length > 0 };
    })
    .filter((team) => !normalizedDepartmentSearch || team.matchesSearch);

  return (
    <>
      <div className="section-header">
        <div>
          <h2 className="card-title">Department Management</h2>
          <p className="section-subtitle">
            Manage departments and view employees, team leaders, managers and HRs.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setFormError("");
            setShowModal(true);
          }}
        >
          <Plus size={18} />
          Add Department
        </button>
      </div>

      {error && (
        <ErrorState
          title="Department management unavailable"
          description={error}
          action={<button type="button" className="btn" onClick={fetchSubcategories}>Try again</button>}
          compact
        />
      )}
      {message && <div className="alert alert-success" role="status" aria-live="polite">{message}</div>}

      <div className="reimbursement-summary-grid">
        <div className="reimbursement-summary-card">
          <span>Total Departments</span>
          <h3>{subcategories.length}</h3>
          <p>active units</p>
        </div>

        <div className="reimbursement-summary-card">
          <span>Employees</span>
          <h3>{totalEmployees}</h3>
          <p>assigned employees</p>
        </div>

        <div className="reimbursement-summary-card">
          <span>Team Leaders</span>
          <h3>{totalTeamLeaders}</h3>
          <p>department TLs</p>
        </div>

        <div className="reimbursement-summary-card">
          <span>Managers / HR</span>
          <h3>{approvalUserCount}</h3>
          <p>unique user accounts</p>
        </div>
      </div>

      <div className="table-wrapper modern-table-wrapper">
        <table className="custom-table responsive-card-table">
          <thead>
            <tr>
              <th scope="col">Department</th>
              <th scope="col">Employees</th>
              <th scope="col">TL</th>
              <th scope="col">Managers</th>
              <th scope="col">HR</th>
              <th scope="col">Total Users</th>
              <th scope="col">Created</th>
              <th scope="col">Status</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>

          <tbody>
            {subcategories.map((item) => (
              <tr key={item._id}>
                <td data-label="Department">
                  <div className="user-cell">
                    <div className="avatar-circle">
                      <Building2 size={16} />
                    </div>

                    <strong>{item.name}</strong>
                  </div>
                </td>

                <td data-label="Employees">
                  <span className="badge badge-success">
                    {item.employeeCount || 0}
                  </span>
                </td>

                <td data-label="Team leaders">
                  <span className="badge badge-pending">
                    {item.teamLeaderCount || 0}
                  </span>
                </td>

                <td data-label="Managers">
                  <span className="badge badge-pending">
                    {item.managerCount || 0}
                  </span>
                </td>

                <td data-label="HR">
                  <span className="badge badge-pending">
                    {item.hrCount || 0}
                  </span>
                </td>

                <td data-label="Total users">
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span className="badge badge-success">
                      {item.userCount || 0}
                    </span>

                    {item.userCount > 0 && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => viewDepartment(item)}
                        disabled={viewingId === item._id}
                      >
                        {viewingId === item._id ? "Loading..." : "View"}
                      </button>
                    )}
                  </div>
                </td>

                <td data-label="Created">{new Date(item.createdAt).toLocaleDateString()}</td>

                <td data-label="Status">
                  <span className="badge badge-success">Active</span>
                </td>

                <td data-label="Actions">
                  <button
                    type="button"
                    className="delete-icon-btn"
                    onClick={() => handleDelete(item._id)}
                    disabled={deletingId === item._id}
                  >
                    <Trash2 size={16} />
                    {deletingId === item._id ? "Deleting..." : "Delete"}
                  </button>
                </td>
              </tr>
            ))}

            {loading && subcategories.length === 0 && (
              <tr>
                <td colSpan="9"><LoadingState label="Loading departments..." compact /></td>
              </tr>
            )}

            {!loading && subcategories.length === 0 && (
              <tr>
                <td colSpan="9"><EmptyState title="No departments found" description="Create a department to begin organizing users and teams." compact /></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedDepartment && (
        <div className="modal-overlay" onMouseDown={closeDepartmentDetails}>
          <div
            className="modal-card department-details-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="department-users-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="modal-header department-details-header">
              <div className="department-details-heading">
                <span className="department-details-icon" aria-hidden="true">
                  <Building2 size={22} />
                </span>
                <div>
                  <span className="ui-eyebrow">Department overview</span>
                  <h3 id="department-users-title">{selectedDepartment.name}</h3>
                  <p>
                    {selectedDepartment.userCount || 0} assigned users across{" "}
                    {selectedDepartment.teams?.length || 0} teams
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={closeDepartmentDetails}
                aria-label="Close department details"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <div className="department-details-content">
              <div className="department-metric-grid" aria-label="Department role summary">
                {[
                  ["Employees", selectedDepartment.employeeCount, UsersRound, "success"],
                  ["Team Leaders", selectedDepartment.teamLeaderCount, Crown, "info"],
                  ["Managers", selectedDepartment.managerCount, UserCog, "warning"],
                  ["HR Partners", selectedDepartment.hrCount, ShieldCheck, "neutral"],
                ].map(([label, count, Icon, tone]) => (
                  <article className={`department-metric department-metric--${tone}`} key={label}>
                    <span className="department-metric-icon" aria-hidden="true">
                      <Icon size={18} />
                    </span>
                    <div>
                      <span>{label}</span>
                      <strong>{count || 0}</strong>
                    </div>
                  </article>
                ))}
              </div>

              <div className="department-directory-toolbar">
                <label className="department-directory-search">
                  <Search size={17} aria-hidden="true" />
                  <span className="sr-only">Search department people and teams</span>
                  <input
                    type="search"
                    value={departmentSearch}
                    onChange={(event) => setDepartmentSearch(event.target.value)}
                    placeholder="Search by team, employee, ID, designation or leader"
                  />
                  {departmentSearch && (
                    <button
                      type="button"
                      onClick={() => setDepartmentSearch("")}
                      aria-label="Clear department search"
                    >
                      <X size={15} aria-hidden="true" />
                    </button>
                  )}
                </label>
                <span className="department-directory-result">
                  {normalizedDepartmentSearch
                    ? `${visibleDepartmentTeams.length} matching ${visibleDepartmentTeams.length === 1 ? "team" : "teams"}`
                    : "Search the department directory"}
                </span>
              </div>

              <section className="department-teams-section" aria-labelledby="department-teams-title">
                <div className="department-section-heading">
                  <div>
                    <span className="ui-eyebrow">Team structure</span>
                    <h3 id="department-teams-title">Department teams</h3>
                    <p>Leadership assignments and employees grouped by team.</p>
                  </div>
                  <span className="ui-status ui-status--info">
                    <Network size={13} aria-hidden="true" />
                    {selectedDepartment.teams?.length || 0} teams
                  </span>
                </div>

                {visibleDepartmentTeams.length > 0 ? (
                  <div className="department-team-grid">
                    {visibleDepartmentTeams.map((team) => (
                      <article key={team._id} className="department-team-card">
                        <header className="department-team-header">
                          <div>
                            <span className="department-team-icon" aria-hidden="true">
                              <Network size={17} />
                            </span>
                            <div>
                              <span>Team</span>
                              <h4>{team.name}</h4>
                            </div>
                          </div>
                          <span className="ui-status ui-status--success">
                            {normalizedDepartmentSearch
                              ? `${team.employees?.length || 0} matched`
                              : `${team.employeeCount || 0} employees`}
                          </span>
                        </header>

                        <div className="department-leadership-grid">
                          <div>
                            <UserCog size={15} aria-hidden="true" />
                            <span>Manager</span>
                            <strong>
                              {team.managers?.length > 0
                                ? team.managers.map((manager) => manager.name).join(", ")
                                : "Not assigned"}
                            </strong>
                          </div>
                          <div>
                            <ShieldCheck size={15} aria-hidden="true" />
                            <span>HR partner</span>
                            <strong>
                              {team.hrs?.length > 0
                                ? team.hrs.map((hr) => hr.name).join(", ")
                                : "Not assigned"}
                            </strong>
                          </div>
                          <div>
                            <Crown size={15} aria-hidden="true" />
                            <span>Team leader</span>
                            <strong>{team.teamLeader?.name || "Not assigned"}</strong>
                          </div>
                        </div>

                        <div className="department-employee-list">
                          <div className="department-employee-list-heading">
                            <span>Team members</span>
                            <strong>{team.employees?.length || 0}</strong>
                          </div>

                          {team.employees?.length > 0 ? (
                            <div className="department-employee-grid">
                              {team.employees.map((employee) => (
                                <div className="department-employee" key={employee._id}>
                                  <UserAvatar
                                    name={employee.name}
                                    photoUrl={employee.profilePhoto?.url || ""}
                                    size="small"
                                  />
                                  <div>
                                    <strong>{employee.name}</strong>
                                    <span>
                                      {employee.employeeId || "No employee ID"}
                                      {employee.designation ? ` · ${employee.designation}` : ""}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <EmptyState
                              compact
                              title="No employees assigned"
                              description="Employees assigned to this team will appear here."
                            />
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title={normalizedDepartmentSearch ? "No matching people or teams" : "No teams in this department"}
                    description={normalizedDepartmentSearch
                      ? "Try a different name, employee ID, designation or leader."
                      : "Create a team and assign its leadership to see the hierarchy here."}
                    action={normalizedDepartmentSearch ? (
                      <button type="button" className="btn" onClick={() => setDepartmentSearch("")}>
                        Clear search
                      </button>
                    ) : undefined}
                  />
                )}
              </section>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div
            className="modal-card modern-department-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-department-title"
          >
            <div className="modal-header">
              <h3 id="create-department-title">Create Department</h3>
              <button
                type="button"
                onClick={() => {
                  if (isSubmitting) return;
                  setShowModal(false);
                  setFormError("");
                  setName("");
                }}
                disabled={isSubmitting}
                aria-label="Close create department dialog"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            {formError && <ErrorState title="Department not saved" description={formError} compact />}

            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="input-group">
                <label htmlFor="department-name">Department Name</label>

                <input
                  id="department-name"
                  type="text"
                  placeholder="Enter department name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>

              <button className="btn btn-primary" type="submit" disabled={isSubmitting || !name.trim()}>
                {isSubmitting ? "Creating..." : "Create Department"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminSubcategories;
