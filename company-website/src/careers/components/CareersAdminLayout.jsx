import {
  NavLink,
  useNavigate,
} from "react-router-dom";

import {
  LuLayoutDashboard,
  LuCirclePlus,
  LuBriefcaseBusiness,
  LuUsers,
  LuLogOut,
  LuExternalLink,
} from "react-icons/lu";

import "./CareersAdminLayout.css";

const navigationItems = [
  {
    path: "/admin/careers/dashboard",
    label: "Dashboard",
    icon: LuLayoutDashboard,
  },
  {
    path: "/admin/careers/add-job",
    label: "Add Job",
    icon: LuCirclePlus,
  },
  {
    path: "/admin/careers/manage-jobs",
    label: "Manage Jobs",
    icon: LuBriefcaseBusiness,
  },
  {
    path: "/admin/careers/applicants",
    label: "Applicants",
    icon: LuUsers,
  },
];

function CareersAdminLayout({
  title,
  description,
  actions,
  children,
}) {
  const navigate = useNavigate();

  const adminData = JSON.parse(
    localStorage.getItem("careersAdmin") ||
      "null"
  );

  const handleLogout = async () => {
    try {
      await fetch(
        "/api/admin/auth/logout",
        {
          method: "POST",
          credentials: "include",
        }
      );
    } catch (error) {
      console.error(
        "Careers admin logout error:",
        error
      );
    } finally {
      localStorage.removeItem(
        "careersAdmin"
      );

      navigate(
        "/admin/careers/login",
        {
          replace: true,
        }
      );
    }
  };

  return (
    <div className="careers-admin-shell">
      <aside className="careers-admin-sidebar">
        <div className="careers-admin-brand">
          <div className="careers-admin-brand-mark">
            U
          </div>

          <div>
            <strong>Upsilon</strong>
            <span>Careers Admin</span>
          </div>
        </div>

        <nav className="careers-admin-navigation">
          {navigationItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `careers-admin-navigation-link${
                    isActive ? " active" : ""
                  }`
                }
              >
                <Icon
                  size={19}
                  aria-hidden="true"
                />

                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="careers-admin-sidebar-bottom">
          <a
            href="/careers"
            className="careers-admin-navigation-link"
            target="_blank"
            rel="noreferrer"
          >
            <LuExternalLink
              size={19}
              aria-hidden="true"
            />

            <span>View Careers Page</span>
          </a>

          <button
            type="button"
            className="careers-admin-navigation-link careers-admin-logout"
            onClick={handleLogout}
          >
            <LuLogOut
              size={19}
              aria-hidden="true"
            />

            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="careers-admin-content">
        <header className="careers-admin-topbar">
          <div>
            <p>CAREERS MANAGEMENT</p>
            <h1>{title}</h1>

            {description && (
              <span>{description}</span>
            )}
          </div>

          <div className="careers-admin-topbar-right">
            {actions}

            <div className="careers-admin-user">
              <div>
                {(
                  adminData?.name ||
                  adminData?.fullName ||
                  "A"
                )
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <span>
                <strong>
                  {adminData?.name ||
                    adminData?.fullName ||
                    "Careers Admin"}
                </strong>

                <small>
                  {adminData?.email || ""}
                </small>
              </span>
            </div>
          </div>
        </header>

        <div className="careers-admin-page-content">
          {children}
        </div>
      </main>
    </div>
  );
}

export default CareersAdminLayout;