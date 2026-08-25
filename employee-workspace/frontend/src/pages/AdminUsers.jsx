import {
  useEffect,
  useMemo,
  useState,
} from "react";


import {
  KeyRound,
  Pencil,
  Plus,
  Trash2,
  Users,
  X,
} from "lucide-react";

import api from "../api/api";
import useConfirm from "../components/ui/useConfirm";

const USERS_PER_PAGE = 10;

const EMPTY_FORM_DATA = {
  name: "",
  firstName: "",
  lastName: "",
  employeeId: "",
  designation: "",
  phone: "",
  dateOfJoining: "",
  dateOfBirth: "",
  email: "",
  password: "",
  role: "Employee",
  subcategoryId: "",
  teamId: "",
  managerId: "",
  hrId: "",
  teamLeaderId: "",
  assignedTeamIds: [],
  isActive: true,
};

const AdminUsers = () => {
  const confirmAction = useConfirm();
  const [users, setUsers] =
    useState([]);

  const [
    subcategories,
    setSubcategories,
  ] = useState([]);

  const [teams, setTeams] =
    useState([]);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    activeFilter,
    setActiveFilter,
  ] = useState("All");

  const [
    searchTerm,
    setSearchTerm,
  ] = useState("");

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);

  const [
    showModal,
    setShowModal,
  ] = useState(false);

  const [
    editingUser,
    setEditingUser,
  ] = useState(null);

  const [error, setError] =
    useState("");

  const [
    formData,
    setFormData,
  ] = useState({
    ...EMPTY_FORM_DATA,
  });

  const [
    showResetPasswordModal,
    setShowResetPasswordModal,
  ] = useState(false);

  const [
    selectedResetUser,
    setSelectedResetUser,
  ] = useState(null);

  const [
    temporaryPassword,
    setTemporaryPassword,
  ] = useState("");

  const [
    confirmTemporaryPassword,
    setConfirmTemporaryPassword,
  ] = useState("");

  const [
    resetPasswordError,
    setResetPasswordError,
  ] = useState("");

  const [
    resetPasswordSuccess,
    setResetPasswordSuccess,
  ] = useState("");

  const fetchSubcategories =
    async () => {
      const { data } =
        await api.get(
          "/admin/subcategories"
        );

      setSubcategories(
        Array.isArray(
          data.subcategories
        )
          ? data.subcategories
          : []
      );
    };

  const fetchTeams = async () => {
    const { data } =
      await api.get(
        "/admin/teams"
      );

    setTeams(
      Array.isArray(data.teams)
        ? data.teams
        : []
    );
  };

  const fetchUsers = async () => {
    const { data } =
      await api.get(
        "/admin/users"
      );

    setUsers(
      Array.isArray(data.users)
        ? data.users
        : []
    );
  };

  const loadAllData = async () => {
    try {
      setIsLoading(true);
      setError("");

      await Promise.all([
        fetchUsers(),
        fetchSubcategories(),
        fetchTeams(),
      ]);
    } catch (error) {
      console.error(
        "LOAD ADMIN USERS DATA ERROR:",
        error.response?.data ||
          error.message
      );

      setError(
        error.response?.data
          ?.message ||
          "Unable to load user-management data."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Synchronize user-management data and subscribe to related updates.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAllData();

    const handleTeamsUpdated =
      async () => {
        try {
          await Promise.all([
            fetchTeams(),
            fetchUsers(),
          ]);
        } catch (error) {
          console.error(
            "REFRESH TEAMS ERROR:",
            error.response?.data ||
              error.message
          );
        }
      };

    const handleUsersUpdated =
      async () => {
        try {
          await fetchUsers();
        } catch (error) {
          console.error(
            "REFRESH USERS ERROR:",
            error.response?.data ||
              error.message
          );
        }
      };

    window.addEventListener(
      "teams-updated",
      handleTeamsUpdated
    );

    window.addEventListener(
      "users-updated",
      handleUsersUpdated
    );

    return () => {
      window.removeEventListener(
        "teams-updated",
        handleTeamsUpdated
      );

      window.removeEventListener(
        "users-updated",
        handleUsersUpdated
      );
    };
    // The loader is intentionally captured for this mounted page lifecycle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeManagers =
    useMemo(
      () =>
        users.filter(
          (user) =>
            user.role ===
              "Manager" &&
            user.isActive !==
              false
        ),
      [users]
    );

  const activeHrs = useMemo(
    () =>
      users.filter(
        (user) =>
          user.role === "HR" &&
          user.isActive !==
            false
      ),
    [users]
  );

  const filteredUsers =
    useMemo(() => {
      const normalizedSearch =
        searchTerm
          .trim()
          .toLowerCase();

      return users.filter(
        (user) => {
          const matchesRole =
            activeFilter ===
              "All" ||
            user.role ===
              activeFilter;

          const matchesSearch =
            !normalizedSearch ||
            user.name
              ?.toLowerCase()
              .includes(
                normalizedSearch
              ) ||
            user.email
              ?.toLowerCase()
              .includes(
                normalizedSearch
              ) ||
            user.employeeId
              ?.toLowerCase()
              .includes(
                normalizedSearch
              ) ||
            user.phone
              ?.toLowerCase()
              .includes(
                normalizedSearch
              ) ||
            user.designation
              ?.toLowerCase()
              .includes(
                normalizedSearch
              );

          return (
            matchesRole &&
            matchesSearch
          );
        }
      );
    }, [
      users,
      activeFilter,
      searchTerm,
    ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredUsers.length /
        USERS_PER_PAGE
    )
  );

  const paginatedUsers =
    useMemo(() => {
      const startIndex =
        (currentPage - 1) *
        USERS_PER_PAGE;

      return filteredUsers.slice(
        startIndex,
        startIndex +
          USERS_PER_PAGE
      );
    }, [
      filteredUsers,
      currentPage,
    ]);

  useEffect(() => {
    if (
      currentPage > totalPages
    ) {
      // Keep pagination inside the current filtered result set.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const employeeCount =
    useMemo(
      () =>
        users.filter(
          (user) =>
            user.role ===
            "Employee"
        ).length,
      [users]
    );

  const managerCount =
    useMemo(
      () =>
        users.filter(
          (user) =>
            user.role ===
            "Manager"
        ).length,
      [users]
    );

  const hrCount = useMemo(
    () =>
      users.filter(
        (user) =>
          user.role === "HR"
      ).length,
    [users]
  );

  const activeUsersCount =
    useMemo(
      () =>
        users.filter(
          (user) =>
            user.isActive !==
            false
        ).length,
      [users]
    );

  const selectedTeam =
    useMemo(
      () =>
        teams.find(
          (team) =>
            team._id ===
            formData.teamId
        ) || null,
      [
        teams,
        formData.teamId,
      ]
    );

  const filteredTeams =
    useMemo(
      () =>
        teams.filter(
          (team) =>
            team.departmentId
              ?._id ===
              formData.subcategoryId &&
            team.isActive !==
              false
        ),
      [
        teams,
        formData.subcategoryId,
      ]
    );

  const selectedTeamLeader =
    selectedTeam?.teamLeaderId ||
    null;

  const selectedTeamManager =
    selectedTeam
      ?.managerIds?.[0] || null;

  const selectedTeamHr =
    selectedTeam?.hrIds?.[0] ||
    null;

  const departmentManagers =
    useMemo(() => {
      if (
        !formData.subcategoryId
      ) {
        return activeManagers;
      }

      return activeManagers.filter(
        (manager) =>
          manager.subcategoryId
            ?._id ===
            formData.subcategoryId ||
          manager.assignedTeamIds
            ?.some(
              (team) =>
                team.departmentId
                  ?._id ===
                formData.subcategoryId
            )
      );
    }, [
      activeManagers,
      formData.subcategoryId,
    ]);

  const departmentHrs =
    useMemo(() => {
      if (
        !formData.subcategoryId
      ) {
        return activeHrs;
      }

      return activeHrs.filter(
        (hr) =>
          hr.subcategoryId?._id ===
            formData.subcategoryId ||
          hr.assignedTeamIds?.some(
            (team) =>
              team.departmentId
                ?._id ===
              formData.subcategoryId
          )
      );
    }, [
      activeHrs,
      formData.subcategoryId,
    ]);

  const exportUsersToExcel =
    async () => {
      const [XLSX, fileSaver] = await Promise.all([import("xlsx"), import("file-saver")]);
      const saveAs = fileSaver.saveAs || fileSaver.default;
      const exportData =
        filteredUsers.map(
          (user) => ({
            Name:
              user.name || "",

            EmployeeID:
              user.employeeId ||
              "N/A",

            Email:
              user.email || "",

            Phone:
              user.phone || "N/A",

            Designation:
              user.designation ||
              "N/A",

            Role:
              user.role || "N/A",

            Department:
              user.subcategoryId
                ?.name || "N/A",

            Team:
              user.teamId?.name ||
              "N/A",

            Manager:
              user.managerId?.name ||
              "N/A",

            HR:
              user.hrId?.name ||
              "N/A",

            TeamLeader:
              user.teamLeaderId
                ?.name || "N/A",

            Status:
              user.isActive !==
              false
                ? "Active"
                : "Inactive",

            DateOfJoining:
              user.dateOfJoining
                ? new Date(
                    user.dateOfJoining
                  ).toLocaleDateString()
                : "N/A",

            DateOfBirth:
              user.dateOfBirth
                ? new Date(
                    user.dateOfBirth
                  ).toLocaleDateString()
                : "N/A",
          })
        );

      const worksheet =
        XLSX.utils.json_to_sheet(
          exportData
        );

      const workbook =
        XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Users"
      );

      const excelBuffer =
        XLSX.write(workbook, {
          bookType: "xlsx",
          type: "array",
        });

      const fileData =
        new Blob(
          [excelBuffer],
          {
            type:
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
          }
        );

      saveAs(
        fileData,
        "Users_Report.xlsx"
      );
    };

  const resetForm = () => {
    setFormData({
      ...EMPTY_FORM_DATA,
    });
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setError("");
    setIsSubmitting(false);
    resetForm();
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setError("");
    resetForm();
    setShowModal(true);
  };

  const openResetPasswordModal =
    (user) => {
      setSelectedResetUser(
        user
      );

      setTemporaryPassword("");
      setConfirmTemporaryPassword(
        ""
      );

      setResetPasswordError("");
      setResetPasswordSuccess("");

      setShowResetPasswordModal(
        true
      );
    };

  const closeResetPasswordModal =
    () => {
      if (isSubmitting) {
        return;
      }

      setShowResetPasswordModal(
        false
      );

      setSelectedResetUser(
        null
      );

      setTemporaryPassword("");
      setConfirmTemporaryPassword(
        ""
      );

      setResetPasswordError("");
      setResetPasswordSuccess("");
    };

  useEffect(() => {
    if (!showModal && !showResetPasswordModal) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event) => {
      if (event.key !== "Escape" || isSubmitting) return;

      if (showModal) {
        setShowModal(false);
        setEditingUser(null);
        setError("");
        setFormData({ ...EMPTY_FORM_DATA });
      }

      if (showResetPasswordModal) {
        setShowResetPasswordModal(false);
        setSelectedResetUser(null);
        setTemporaryPassword("");
        setConfirmTemporaryPassword("");
        setResetPasswordError("");
        setResetPasswordSuccess("");
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showModal, showResetPasswordModal, isSubmitting]);

      const handleResetPassword = async (
    event
  ) => {
    event.preventDefault();

    if (!selectedResetUser) {
      setResetPasswordError(
        "No user selected."
      );
      return;
    }

    if (
      temporaryPassword.length < 8
    ) {
      setResetPasswordError(
        "Temporary password must contain at least 8 characters."
      );
      return;
    }

    if (
      temporaryPassword !==
      confirmTemporaryPassword
    ) {
      setResetPasswordError(
        "Temporary password and confirmation do not match."
      );
      return;
    }

    const confirmed = await confirmAction({
      title: `Reset ${selectedResetUser.name}'s password?`,
      description: "Their existing password will stop working and they will be required to use the temporary password.",
      confirmLabel: "Reset password",
      tone: "warning",
    });

    if (!confirmed) {
      return;
    }

    try {
      setIsSubmitting(true);
      setResetPasswordError("");
      setResetPasswordSuccess("");

      const { data } =
        await api.put(
          `/admin/users/${selectedResetUser._id}/reset-password`,
          {
            newPassword:
              temporaryPassword,
          }
        );

      setResetPasswordSuccess(
        data.message ||
          "Password reset successfully."
      );

      setTemporaryPassword("");
      setConfirmTemporaryPassword(
        ""
      );

      await fetchUsers();
    } catch (error) {
      console.error(
        "RESET PASSWORD ERROR:",
        error.response?.data ||
          error.message
      );

      setResetPasswordError(
        error.response?.data
          ?.message ||
          "Unable to reset password."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    event
  ) => {
    const { name, value } =
      event.target;

    if (name === "phone") {
      const digitsOnly =
        value
          .replace(/\D/g, "")
          .slice(0, 10);

      setFormData(
        (previousData) => ({
          ...previousData,
          phone: digitsOnly,
        })
      );

      setError("");
      return;
    }

    setFormData(
      (previousData) => {
        const updatedData = {
          ...previousData,
          [name]: value,
        };

        if (
          name === "firstName" ||
          name === "lastName"
        ) {
          updatedData.name =
            `${updatedData.firstName || ""} ${
              updatedData.lastName || ""
            }`
              .trim()
              .replace(/\s+/g, " ");
        }

        return updatedData;
      }
    );

    setError("");
  };

  const handleRoleChange = (
    event
  ) => {
    const nextRole =
      event.target.value;

    setFormData(
      (previousData) => {
        const nextData = {
          ...previousData,
          role: nextRole,
        };

        if (
          nextRole === "Admin" ||
          nextRole === "Finance"
        ) {
          return {
            ...nextData,
            subcategoryId: "",
            teamId: "",
            managerId: "",
            hrId: "",
            teamLeaderId: "",
            assignedTeamIds: [],
          };
        }

        if (
          nextRole === "Employee"
        ) {
          return {
            ...nextData,
            assignedTeamIds: [],
          };
        }

        if (
          nextRole ===
          "TeamLeader"
        ) {
          return {
            ...nextData,
            teamLeaderId: "",
            assignedTeamIds: [],
          };
        }

        if (
          nextRole === "Manager" ||
          nextRole === "HR"
        ) {
          return {
            ...nextData,
            teamId: "",
            managerId: "",
            hrId: "",
            teamLeaderId: "",
          };
        }

        return nextData;
      }
    );

    setError("");
  };

  const handleDepartmentChange =
    (event) => {
      const nextDepartmentId =
        event.target.value;

      setFormData(
        (previousData) => ({
          ...previousData,
          subcategoryId:
            nextDepartmentId,
          teamId: "",
          managerId: "",
          hrId: "",
          teamLeaderId: "",
          assignedTeamIds: [],
        })
      );

      setError("");
    };

  const handleEmployeeTeamChange =
    (event) => {
      const nextTeamId =
        event.target.value;

      const nextTeam =
        teams.find(
          (team) =>
            team._id === nextTeamId
        ) || null;

      setFormData(
        (previousData) => ({
          ...previousData,
          teamId: nextTeamId,

          teamLeaderId:
            nextTeam?.teamLeaderId
              ?._id || "",

          managerId:
            nextTeam
              ?.managerIds?.[0]?._id ||
            "",

          hrId:
            nextTeam
              ?.hrIds?.[0]?._id ||
            "",
        })
      );

      setError("");
    };

  const handleTeamLeaderTeamChange =
    (event) => {
      const nextTeamId =
        event.target.value;

      const nextTeam =
        teams.find(
          (team) =>
            team._id === nextTeamId
        ) || null;

      setFormData(
        (previousData) => ({
          ...previousData,
          teamId: nextTeamId,

          managerId:
            nextTeam
              ?.managerIds?.[0]?._id ||
            "",

          hrId:
            nextTeam
              ?.hrIds?.[0]?._id ||
            "",

          teamLeaderId: "",
        })
      );

      setError("");
    };

  const handleAssignedTeamChange =
    (teamId, checked) => {
      setFormData(
        (previousData) => {
          const currentIds =
            previousData
              .assignedTeamIds || [];

          if (checked) {
            return {
              ...previousData,

              assignedTeamIds: [
                ...new Set([
                  ...currentIds,
                  teamId,
                ]),
              ],
            };
          }

          return {
            ...previousData,

            assignedTeamIds:
              currentIds.filter(
                (id) =>
                  id !== teamId
              ),
          };
        }
      );

      setError("");
    };

  const validateForm = () => {
    const normalizedEmail =
      formData.email
        .trim()
        .toLowerCase();

    const emailPattern =
      /^[a-zA-Z0-9._%+-]+@upsilonservices\.com$/;

    if (
      !formData.firstName.trim()
    ) {
      return "First name is required.";
    }

    if (
      !formData.lastName.trim()
    ) {
      return "Last name is required.";
    }

    if (
      !formData.employeeId.trim()
    ) {
      return "Employee ID is required.";
    }

    if (
      !formData.designation.trim()
    ) {
      return "Designation is required.";
    }

    if (
      !/^[6-9]\d{9}$/.test(
        formData.phone
      )
    ) {
      return "Enter a valid 10-digit Indian mobile number.";
    }

    if (
      !emailPattern.test(
        normalizedEmail
      )
    ) {
      return "Enter a valid @upsilonservices.com email address.";
    }

    if (
      !editingUser &&
      formData.password.length < 8
    ) {
      return "Password must contain at least 8 characters.";
    }

    const today = new Date()
      .toISOString()
      .split("T")[0];

    if (
      formData.dateOfJoining &&
      formData.dateOfJoining >
        today
    ) {
      return "Date of joining cannot be a future date.";
    }

    if (
      formData.dateOfBirth &&
      formData.dateOfBirth >
        today
    ) {
      return "Date of birth cannot be a future date.";
    }

    const rolesRequiringDepartment =
      [
        "Employee",
        "TeamLeader",
        "Manager",
        "HR",
      ];

    if (
      rolesRequiringDepartment.includes(
        formData.role
      ) &&
      !formData.subcategoryId
    ) {
      return "Department is required for the selected role.";
    }

    if (
      formData.role ===
        "Employee" &&
      !formData.teamId
    ) {
      return "Team is required for Employee role.";
    }

    if (
      formData.role ===
        "TeamLeader" &&
      !formData.teamId
    ) {
      return "Team is required for Team Leader role.";
    }

    if (formData.role === "HR" && !formData.managerId) {
      return "Reporting Manager is required for HR leave approval.";
    }

    if (
      ["Manager", "HR"].includes(
        formData.role
      ) &&
      formData.assignedTeamIds
        .length === 0
    ) {
      return "Select at least one team for the selected role.";
    }

    return "";
  };

  const buildPayload = () => {
    const payload = {
      name:
        `${formData.firstName} ${formData.lastName}`
          .trim()
          .replace(/\s+/g, " "),

      firstName:
        formData.firstName.trim(),

      lastName:
        formData.lastName.trim(),

      employeeId:
        formData.employeeId.trim(),

      designation:
        formData.designation.trim(),

      phone:
        `+91${formData.phone}`,

      dateOfJoining:
        formData.dateOfJoining ||
        null,

      dateOfBirth:
        formData.dateOfBirth ||
        null,

      email:
        formData.email
          .trim()
          .toLowerCase(),

      role: formData.role,

      subcategoryId:
        [
          "Employee",
          "TeamLeader",
          "Manager",
          "HR",
        ].includes(formData.role)
          ? formData.subcategoryId
          : "",

      teamId:
        [
          "Employee",
          "TeamLeader",
        ].includes(formData.role)
          ? formData.teamId
          : "",

      managerId:
        [
          "Employee",
          "TeamLeader",
          "HR",
        ].includes(formData.role)
          ? formData.managerId
          : "",

      hrId:
        [
          "Employee",
          "TeamLeader",
        ].includes(formData.role)
          ? formData.hrId
          : "",

      teamLeaderId:
        formData.role ===
        "Employee"
          ? formData.teamLeaderId
          : "",

      assignedTeamIds:
        ["Manager", "HR"].includes(
          formData.role
        )
          ? formData.assignedTeamIds
          : [],

      isActive:
        formData.isActive,
    };

    if (!editingUser) {
      payload.password =
        formData.password;
    }

    return payload;
  };

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    const validationMessage =
      validateForm();

    if (validationMessage) {
      setError(
        validationMessage
      );
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      const payload =
        buildPayload();

      if (editingUser) {
        await api.put(
          `/admin/users/${editingUser._id}`,
          payload
        );
      } else {
        await api.post(
          "/admin/users",
          payload
        );
      }

      window.dispatchEvent(
        new CustomEvent(
          "users-updated"
        )
      );

      await Promise.all([
        fetchUsers(),
        fetchTeams(),
      ]);

      setCurrentPage(1);
      closeModal();
    } catch (error) {
      console.error(
        "UPDATE USER STATUS:",
        error.response?.status
      );

      console.error(
        "UPDATE USER RESPONSE:",
        JSON.stringify(
          error.response?.data,
          null,
          2
        )
      );

      setError(
        error.response?.data
          ?.message ||
          (editingUser
            ? "Unable to update user."
            : "Unable to create user.")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate =
    async (user) => {
      const confirmed = await confirmAction({
        title: `Deactivate ${user.name}?`,
        description: "They will lose workspace access. Their leave and reimbursement records will remain available for audit purposes.",
        confirmLabel: "Deactivate user",
      });

      if (!confirmed) {
        return;
      }

      try {
        await api.delete(
          `/admin/users/${user._id}`
        );

        window.dispatchEvent(
          new CustomEvent(
            "users-updated"
          )
        );

        await Promise.all([
          fetchUsers(),
          fetchTeams(),
        ]);
      } catch (error) {
        console.error(
          "DEACTIVATE USER ERROR:",
          error.response?.data ||
            error.message
        );

        window.alert(
          error.response?.data
            ?.message ||
            "Unable to deactivate user."
        );
      }
    };

  const handleEdit = (
    user
  ) => {
    setEditingUser(user);
    setError("");

    setFormData({
      name: user.name || "",

      firstName:
        user.firstName ||
        user.name
          ?.trim()
          .split(/\s+/)
          .slice(0, 1)
          .join(" ") ||
        "",

      lastName:
        user.lastName ||
        user.name
          ?.trim()
          .split(/\s+/)
          .slice(1)
          .join(" ") ||
        "",

      employeeId:
        user.employeeId || "",

      designation:
        user.designation || "",

      phone:
        (user.phone || "")
          .replace(/^\+91/, "")
          .replace(/\D/g, "")
          .slice(-10),

      dateOfJoining:
        user.dateOfJoining
          ? user.dateOfJoining.split(
              "T"
            )[0]
          : "",

      dateOfBirth:
        user.dateOfBirth
          ? user.dateOfBirth.split(
              "T"
            )[0]
          : "",

      email:
        user.email || "",

      password: "",

      role:
        user.role || "Employee",

      subcategoryId:
        user.subcategoryId?._id ||
        "",

      teamId:
        user.teamId?._id ||
        "",

      managerId:
        user.managerId?._id ||
        "",

      hrId:
        user.hrId?._id ||
        "",

      teamLeaderId:
        user.teamLeaderId?._id ||
        "",

      assignedTeamIds:
        user.assignedTeamIds
          ?.map((team) =>
            typeof team === "string"
              ? team
              : team._id
          ) || [],

      isActive:
        user.isActive !== false,
    });

    setShowModal(true);
  };
    return (
    <>
      <div className="section-header">
        <div>
          <h2 className="card-title">
            User Management
          </h2>

          <p className="section-subtitle">
            Create, edit, reset passwords, activate, and deactivate employees,
            managers, HR users, Team Leaders, and Finance users.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            className="btn btn-primary"
            onClick={exportUsersToExcel}
            disabled={
              filteredUsers.length === 0
            }
          >
            Export Excel
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={openCreateModal}
          >
            <Plus size={18} />
            Add User
          </button>
        </div>
      </div>

      {error &&
        !showModal &&
        !showResetPasswordModal && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

      <div className="reimbursement-summary-grid">
        <div className="reimbursement-summary-card">
          <span>Total Users</span>

          <h3>{users.length}</h3>

          <p>registered users</p>
        </div>

        <div className="reimbursement-summary-card">
          <span>Employees</span>

          <h3>{employeeCount}</h3>

          <p>staff users</p>
        </div>

        <div className="reimbursement-summary-card">
          <span>Managers / HR</span>

          <h3>
            {managerCount + hrCount}
          </h3>

          <p>approval roles</p>
        </div>

        <div className="reimbursement-summary-card">
          <span>Active Users</span>

          <h3>{activeUsersCount}</h3>

          <p>currently active</p>
        </div>
      </div>

      <div
        style={{
          marginBottom: "18px",
        }}
      >
        <input
          type="text"
          placeholder="Search by name, email, employee ID, phone, or designation..."
          value={searchTerm}
          onChange={(event) => {
            setSearchTerm(
              event.target.value
            );

            setCurrentPage(1);
          }}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: "12px",
            border:
              "1px solid #d1d5db",
            fontSize: "14px",
          }}
        />
      </div>

      <div className="leave-filter-tabs">
        {[
          "All",
          "Employee",
          "TeamLeader",
          "Manager",
          "HR",
          "Finance",
          "Admin",
        ].map((filter) => (
          <button
            type="button"
            key={filter}
            className={
              activeFilter === filter
                ? "active-filter"
                : ""
            }
            onClick={() => {
              setActiveFilter(filter);
              setCurrentPage(1);
            }}
          >
            {filter === "All"
              ? "All Users"
              : filter ===
                  "TeamLeader"
                ? "Team Leaders"
                : filter}
          </button>
        ))}
      </div>

      <div className="table-wrapper modern-table-wrapper">
        <table className="custom-table responsive-card-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Employee ID</th>
              <th>Email</th>
              <th>Designation</th>
              <th>Role</th>
              <th>Department</th>
              <th>Team</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {isLoading && (
              <tr>
                <td
                  colSpan="9"
                  style={{
                    textAlign:
                      "center",
                    padding: "24px",
                  }}
                >
                  Loading users...
                </td>
              </tr>
            )}

            {!isLoading &&
              paginatedUsers.map(
                (user) => (
                  <tr key={user._id}>
                    <td data-label="User">
                      <div className="user-cell">
                        <div className="avatar-circle">
                          {user.profilePhoto
                            ?.url ? (
                            <img
                              src={
                                user
                                  .profilePhoto
                                  .url
                              }
                              alt={
                                user.name ||
                                "User"
                              }
                              style={{
                                width:
                                  "100%",
                                height:
                                  "100%",
                                objectFit:
                                  "cover",
                                borderRadius:
                                  "50%",
                              }}
                            />
                          ) : (
                            <Users
                              size={16}
                            />
                          )}
                        </div>

                        <div>
                          <strong>
                            {user.name ||
                              "Unnamed User"}
                          </strong>

                          {user.phone && (
                            <div
                              style={{
                                marginTop:
                                  "4px",
                                fontSize:
                                  "12px",
                                color:
                                  "#64748b",
                              }}
                            >
                              {user.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td data-label="Employee ID">
                      {user.employeeId ||
                        "N/A"}
                    </td>

                    <td data-label="Email">
                      {user.email || "N/A"}
                    </td>

                    <td data-label="Designation">
                      {user.designation ||
                        "N/A"}
                    </td>

                    <td data-label="Role">
                      <span
                        className={
                          user.role ===
                          "HR"
                            ? "approval-approved"
                            : user.role ===
                                "Manager"
                              ? "approval-pending"
                              : user.role ===
                                  "Admin"
                                ? "badge badge-danger"
                                : "badge badge-success"
                        }
                      >
                        {user.role ===
                        "TeamLeader"
                          ? "Team Leader"
                          : user.role}
                      </span>
                    </td>

                    <td data-label="Department">
                      {user
                        .subcategoryId
                        ?.name || "N/A"}
                    </td>

                    <td data-label="Team">
                      {user.teamId?.name ||
                        (user
                          .assignedTeamIds
                          ?.length
                          ? `${user.assignedTeamIds.length} team(s)`
                          : "N/A")}
                    </td>

                    <td data-label="Status">
                      <span
                        className={
                          user.isActive !==
                          false
                            ? "badge badge-success"
                            : "badge badge-danger"
                        }
                      >
                        {user.isActive !==
                        false
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </td>

                    <td data-label="Actions">
                      <div
                        className="admin-user-actions"
                        style={{
                          display:
                            "flex",
                          gap: "8px",
                          alignItems:
                            "center",
                          flexWrap:
                            "wrap",
                        }}
                      >
                        <button
                          type="button"
                          className="btn"
                          onClick={() =>
                            handleEdit(user)
                          }
                          disabled={
                            isSubmitting
                          }
                        >
                          <Pencil
                            size={14}
                          />
                          Edit
                        </button>

                        {user.role !==
                          "Admin" && (
                          <button
                            type="button"
                            className="btn"
                            onClick={() =>
                              openResetPasswordModal(
                                user
                              )
                            }
                            disabled={
                              isSubmitting
                            }
                          >
                            <KeyRound
                              size={14}
                            />
                            Reset Password
                          </button>
                        )}

                        {user.role !==
                        "Admin" ? (
                          user.isActive !==
                          false ? (
                            <button
                              type="button"
                              className="delete-icon-btn"
                              onClick={() =>
                                handleDeactivate(
                                  user
                                )
                              }
                              disabled={
                                isSubmitting
                              }
                            >
                              <Trash2
                                size={16}
                              />
                              Deactivate
                            </button>
                          ) : (
                            <span className="badge badge-danger">
                              Deactivated
                            </span>
                          )
                        ) : (
                          <span className="badge badge-success">
                            Protected
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              )}

            {!isLoading &&
              filteredUsers.length ===
                0 && (
                <tr>
                  <td
                    colSpan="9"
                    style={{
                      textAlign:
                        "center",
                      padding: "24px",
                    }}
                  >
                    No users found.
                  </td>
                </tr>
              )}
          </tbody>
        </table>
      </div>

      {filteredUsers.length >
        USERS_PER_PAGE && (
        <div
          style={{
            display: "flex",
            justifyContent:
              "center",
            alignItems: "center",
            gap: "10px",
            marginTop: "24px",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            className="btn btn-primary"
            disabled={
              currentPage === 1
            }
            onClick={() =>
              setCurrentPage(
                (previousPage) =>
                  Math.max(
                    1,
                    previousPage - 1
                  )
              )
            }
            style={{
              opacity:
                currentPage === 1
                  ? 0.6
                  : 1,

              cursor:
                currentPage === 1
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            Previous
          </button>

          {Array.from(
            {
              length: totalPages,
            },
            (_, index) =>
              index + 1
          ).map(
            (pageNumber) => (
              <button
                type="button"
                key={pageNumber}
                className={
                  currentPage ===
                  pageNumber
                    ? "btn btn-primary"
                    : "btn"
                }
                onClick={() =>
                  setCurrentPage(
                    pageNumber
                  )
                }
              >
                {pageNumber}
              </button>
            )
          )}

          <button
            type="button"
            className="btn btn-primary"
            disabled={
              currentPage ===
              totalPages
            }
            onClick={() =>
              setCurrentPage(
                (previousPage) =>
                  Math.min(
                    totalPages,
                    previousPage + 1
                  )
              )
            }
            style={{
              opacity:
                currentPage ===
                totalPages
                  ? 0.6
                  : 1,

              cursor:
                currentPage ===
                totalPages
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            Next
          </button>
        </div>
      )}
            {showModal && (
        <div className="modal-overlay">
          <div className="modal-card user-modal modern-user-modal">
            <div className="modal-header">
              <h3>
                {editingUser
                  ? "Edit Employee Details"
                  : "Create New User"}
              </h3>

              <button
                type="button"
                onClick={closeModal}
                disabled={isSubmitting}
              >
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="alert alert-error">
                {error}
              </div>
            )}

            <form
              className="auth-form user-editor-form"
              onSubmit={handleSubmit}
            >
              <div className="user-form-progress" aria-label="User form sections">
                <a href="#user-profile-fields"><span>1</span>Profile</a>
                <a href="#user-access-fields"><span>2</span>Access</a>
                <a href="#user-reporting-fields"><span>3</span>Reporting</a>
              </div>

              <div className="user-form-section-heading" id="user-profile-fields">
                <div>
                  <span>Profile details</span>
                  <p>Identity and contact information used across the workspace.</p>
                </div>
                <small>* Required fields</small>
              </div>

              <div className="grid-2">
                <div className="input-group">
                  <label>First Name</label>

                  <input
                    name="firstName"
                    placeholder="Enter first name"
                    value={formData.firstName}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Last Name</label>

                  <input
                    name="lastName"
                    placeholder="Enter last name"
                    value={formData.lastName}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    required
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="input-group">
                  <label>Employee ID</label>

                  <input
                    name="employeeId"
                    placeholder="EMP001"
                    value={formData.employeeId}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Designation / Post</label>

                  <input
                    name="designation"
                    placeholder="Software Engineer"
                    value={formData.designation}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    required
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="input-group">
                  <label>Date of Joining</label>

                  <input
                    type="date"
                    name="dateOfJoining"
                    value={formData.dateOfJoining}
                    onChange={handleChange}
                    max={new Date()
                      .toISOString()
                      .split("T")[0]}
                    disabled={isSubmitting}
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Date of Birth</label>

                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    max={new Date()
                      .toISOString()
                      .split("T")[0]}
                    disabled={isSubmitting}
                    required
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="input-group">
                  <label>Email Address</label>

                  <input
                    type="email"
                    name="email"
                    placeholder="employee@upsilonservices.com"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Phone Number</label>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span
                      style={{
                        padding: "12px",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                        background: "#f8fafc",
                        fontWeight: 600,
                      }}
                    >
                      +91
                    </span>

                    <input
                      type="text"
                      name="phone"
                      placeholder="9876543210"
                      value={formData.phone}
                      onChange={handleChange}
                      maxLength={10}
                      inputMode="numeric"
                      pattern="[6-9][0-9]{9}"
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                </div>
              </div>

              {!editingUser && (
                <div className="grid-2">
                  <div className="input-group">
                    <label>Password</label>

                    <input
                      type="password"
                      name="password"
                      placeholder="Minimum 8 characters"
                      value={formData.password}
                      onChange={handleChange}
                      minLength={8}
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                </div>
              )}

              <div className="user-form-section-heading" id="user-access-fields">
                <div>
                  <span>Role and access</span>
                  <p>Choose the employee's workspace role and department.</p>
                </div>
              </div>

              <div className="grid-2">
                <div className="input-group">
                  <label>Role</label>

                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleRoleChange}
                    disabled={isSubmitting}
                    required
                  >
                    <option value="Employee">
                      Employee
                    </option>

                    <option value="TeamLeader">
                      Team Leader
                    </option>

                    <option value="Manager">
                      Manager
                    </option>

                    <option value="HR">
                      HR
                    </option>

                    <option value="Finance">
                      Finance
                    </option>
                  </select>
                </div>

                {[
                  "Employee",
                  "TeamLeader",
                  "Manager",
                  "HR",
                ].includes(formData.role) && (
                  <div className="input-group">
                    <label>Department</label>

                    <select
                      name="subcategoryId"
                      value={formData.subcategoryId}
                      onChange={handleDepartmentChange}
                      disabled={isSubmitting}
                      required
                    >
                      <option value="">
                        Select Department
                      </option>

                      {subcategories.map(
                        (department) => (
                          <option
                            key={department._id}
                            value={department._id}
                          >
                            {department.name}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                )}
              </div>

              {editingUser && (
                <div className="grid-2">
                  <div className="input-group">
                    <label>
                      Employment Status
                    </label>

                    <select
                      name="isActive"
                      value={
                        formData.isActive
                          ? "active"
                          : "inactive"
                      }
                      onChange={(event) =>
                        setFormData(
                          (previousData) => ({
                            ...previousData,
                            isActive:
                              event.target
                                .value ===
                              "active",
                          })
                        )
                      }
                      disabled={isSubmitting}
                    >
                      <option value="active">
                        Active
                      </option>

                      <option value="inactive">
                        Inactive
                      </option>
                    </select>

                    {!formData.isActive && (
                      <p
                        style={{
                          marginTop: "6px",
                          fontSize: "12px",
                          color: "#b45309",
                        }}
                      >
                        The user will be inactive, but their attendance, leave,
                        and reimbursement records will remain available.
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="user-form-section-heading" id="user-reporting-fields">
                <div>
                  <span>Reporting structure</span>
                  <p>Assign the relevant team and reporting relationships.</p>
                </div>
              </div>

              {formData.role ===
                "Employee" && (
                <div className="grid-2">
                  <div className="input-group">
                    <label>Team</label>

                    <select
                      name="teamId"
                      value={formData.teamId}
                      onChange={
                        handleEmployeeTeamChange
                      }
                      disabled={
                        !formData.subcategoryId ||
                        isSubmitting
                      }
                      required
                    >
                      <option value="">
                        {formData.subcategoryId
                          ? "Select Team"
                          : "Select Department First"}
                      </option>

                      {filteredTeams.map(
                        (team) => (
                          <option
                            key={team._id}
                            value={team._id}
                          >
                            {team.name}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div className="input-group">
                    <label>Team Leader</label>

                    <input
                      value={
                        selectedTeamLeader?.name ||
                        "No Team Leader assigned"
                      }
                      disabled
                    />
                  </div>

                  <div className="input-group">
                    <label>
                      Reporting Manager
                    </label>

                    <input
                      value={
                        selectedTeamManager?.name ||
                        "No Manager assigned"
                      }
                      disabled
                    />
                  </div>

                  <div className="input-group">
                    <label>Reporting HR</label>

                    <input
                      value={
                        selectedTeamHr?.name ||
                        "No HR assigned"
                      }
                      disabled
                    />
                  </div>
                </div>
              )}

              {formData.role ===
                "TeamLeader" && (
                <div className="grid-2">
                  <div className="input-group">
                    <label>Team</label>

                    <select
                      name="teamId"
                      value={formData.teamId}
                      onChange={
                        handleTeamLeaderTeamChange
                      }
                      disabled={
                        !formData.subcategoryId ||
                        isSubmitting
                      }
                      required
                    >
                      <option value="">
                        {formData.subcategoryId
                          ? "Select Team"
                          : "Select Department First"}
                      </option>

                      {filteredTeams.map(
                        (team) => (
                          <option
                            key={team._id}
                            value={team._id}
                          >
                            {team.name}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div className="input-group">
                    <label>
                      Reporting Manager
                    </label>

                    <select
                      name="managerId"
                      value={formData.managerId}
                      onChange={handleChange}
                      disabled={isSubmitting}
                    >
                      <option value="">
                        Select Manager
                      </option>

                      {departmentManagers.map(
                        (manager) => (
                          <option
                            key={manager._id}
                            value={manager._id}
                          >
                            {manager.name}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div className="input-group">
                    <label>Reporting HR</label>

                    <select
                      name="hrId"
                      value={formData.hrId}
                      onChange={handleChange}
                      disabled={isSubmitting}
                    >
                      <option value="">
                        Select HR
                      </option>

                      {departmentHrs.map(
                        (hr) => (
                          <option
                            key={hr._id}
                            value={hr._id}
                          >
                            {hr.name}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                </div>
              )}

              {["Manager", "HR"].includes(
                formData.role
              ) && (
                <>
                  {formData.role === "HR" && (
                    <div className="input-group">
                      <label>Reporting Manager</label>

                      <select
                        name="managerId"
                        value={formData.managerId}
                        onChange={handleChange}
                        disabled={!formData.subcategoryId || isSubmitting}
                        required
                      >
                        <option value="">
                          {formData.subcategoryId
                            ? "Select Manager"
                            : "Select Department First"}
                        </option>

                        {departmentManagers.map((manager) => (
                          <option key={manager._id} value={manager._id}>
                            {manager.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="input-group">
                    <label>Assign Teams</label>

                  <div
                    style={{
                      border: "1px solid #d1d5db",
                      borderRadius: "12px",
                      padding: "12px",
                      maxHeight: "220px",
                      overflowY: "auto",
                    }}
                  >
                    {!formData.subcategoryId && (
                      <p
                        style={{
                          margin: 0,
                          color: "#64748b",
                        }}
                      >
                        Select a department first.
                      </p>
                    )}

                    {formData.subcategoryId &&
                      filteredTeams.length ===
                        0 && (
                        <p
                          style={{
                            margin: 0,
                            color: "#64748b",
                          }}
                        >
                          No active teams are available for this department.
                        </p>
                      )}

                    {filteredTeams.map(
                      (team) => (
                        <label
                          key={team._id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            marginBottom: "10px",
                            cursor: "pointer",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={formData.assignedTeamIds.includes(
                              team._id
                            )}
                            onChange={(event) =>
                              handleAssignedTeamChange(
                                team._id,
                                event.target.checked
                              )
                            }
                            disabled={isSubmitting}
                          />

                          {team.name}
                        </label>
                      )
                    )}
                  </div>
                  </div>
                </>
              )}

              <div className="user-form-actions">
                <button
                  type="button"
                  className="btn"
                  onClick={closeModal}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                  style={{
                    opacity: isSubmitting
                      ? 0.7
                      : 1,
                    cursor: isSubmitting
                      ? "not-allowed"
                      : "pointer",
                  }}
                >
                  {isSubmitting
                    ? editingUser
                      ? "Updating..."
                      : "Creating..."
                    : editingUser
                      ? "Update User"
                      : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showResetPasswordModal &&
        selectedResetUser && (
          <div className="modal-overlay">
            <div
              className="modal-card"
              style={{
                maxWidth: "520px",
                width: "92%",
              }}
            >
              <div className="modal-header">
                <div>
                  <h3>
                    Reset User Password
                  </h3>

                  <p
                    style={{
                      marginTop: "5px",
                      color: "#64748b",
                      fontSize: "13px",
                    }}
                  >
                    Set a temporary password for{" "}
                    <strong>
                      {selectedResetUser.name}
                    </strong>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    closeResetPasswordModal
                  }
                  disabled={isSubmitting}
                >
                  <X size={18} />
                </button>
              </div>

              <form
                className="auth-form"
                onSubmit={
                  handleResetPassword
                }
              >
                {resetPasswordError && (
                  <div className="alert alert-error">
                    {resetPasswordError}
                  </div>
                )}

                {resetPasswordSuccess && (
                  <div className="alert alert-success">
                    {resetPasswordSuccess}
                  </div>
                )}

                <div
                  style={{
                    padding: "12px 14px",
                    marginBottom: "14px",
                    borderRadius: "10px",
                    background: "#f8fafc",
                    border:
                      "1px solid #e2e8f0",
                    fontSize: "13px",
                    color: "#475569",
                  }}
                >
                  <strong>
                    {selectedResetUser.name}
                  </strong>

                  <div
                    style={{
                      marginTop: "4px",
                    }}
                  >
                    {selectedResetUser.email}
                  </div>

                  <div
                    style={{
                      marginTop: "4px",
                    }}
                  >
                    Role:{" "}
                    {selectedResetUser.role ===
                    "TeamLeader"
                      ? "Team Leader"
                      : selectedResetUser.role}
                  </div>
                </div>

                <div className="input-group">
                  <label>
                    Temporary Password
                  </label>

                  <input
                    type="password"
                    value={
                      temporaryPassword
                    }
                    onChange={(event) => {
                      setTemporaryPassword(
                        event.target.value
                      );

                      setResetPasswordError(
                        ""
                      );

                      setResetPasswordSuccess(
                        ""
                      );
                    }}
                    placeholder="Minimum 8 characters"
                    minLength={8}
                    disabled={isSubmitting}
                    required
                  />
                </div>

                <div className="input-group">
                  <label>
                    Confirm Temporary Password
                  </label>

                  <input
                    type="password"
                    value={
                      confirmTemporaryPassword
                    }
                    onChange={(event) => {
                      setConfirmTemporaryPassword(
                        event.target.value
                      );

                      setResetPasswordError(
                        ""
                      );

                      setResetPasswordSuccess(
                        ""
                      );
                    }}
                    placeholder="Re-enter temporary password"
                    minLength={8}
                    disabled={isSubmitting}
                    required
                  />
                </div>

                <p
                  style={{
                    marginTop: "8px",
                    color: "#64748b",
                    fontSize: "12px",
                    lineHeight: 1.6,
                  }}
                >
                  The user must change this temporary password after their next
                  login.
                </p>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "10px",
                    marginTop: "20px",
                  }}
                >
                  <button
                    type="button"
                    className="btn"
                    onClick={
                      closeResetPasswordModal
                    }
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSubmitting}
                  >
                    <KeyRound size={15} />

                    {isSubmitting
                      ? "Resetting..."
                      : "Reset Password"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </>
  );
};

export default AdminUsers;
