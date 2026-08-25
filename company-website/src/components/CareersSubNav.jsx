import { NavLink } from "react-router-dom";
import { LuChevronRight } from "react-icons/lu";

import "./CareersSubNav.css";

function CareersSubNav() {
  return (
    <nav className="careers-subnav" aria-label="Careers section">
      <div className="careers-subnav-container">
        <div className="careers-subnav-left">
          <NavLink to="/careers" end className="careers-subnav-root">
            Careers
          </NavLink>

          <LuChevronRight aria-hidden="true" className="careers-subnav-sep" />

          <NavLink to="/careers/about">About Us</NavLink>

          <NavLink to="/careers/the-upsilon-way">The Upsilon Way</NavLink>
        </div>

        <NavLink to="/careers/fake-job-alert" className="careers-subnav-alert">
          Fake Job Alert
        </NavLink>
      </div>
    </nav>
  );
}

export default CareersSubNav;
