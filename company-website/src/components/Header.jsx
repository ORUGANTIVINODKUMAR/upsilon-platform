import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { FaBars, FaChevronDown, FaTimes } from "react-icons/fa";
import "./Header.css";

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);

  const location = useLocation();

  useEffect(() => {
    setIsMenuOpen(false);
    setIsServicesOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  const closeMenu = () => {
    setIsMenuOpen(false);
    setIsServicesOpen(false);
  };

  const toggleServices = (e) => {
    e.preventDefault();
    setIsServicesOpen((prev) => !prev);
  };

  return (
    <header className="site-header">
      <div className="nav-container">
        <NavLink
          to="/"
          className="brand-logo"
          onClick={closeMenu}
        >
          <img src="/upsilonlogo.png" alt="Upsilon Services" />
        </NavLink>

        <button
          type="button"
          className="mobile-menu-toggle"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          aria-label={isMenuOpen ? "Close Menu" : "Open Menu"}
        >
          {isMenuOpen ? <FaTimes /> : <FaBars />}
        </button>

        <nav className={`main-nav ${isMenuOpen ? "is-open" : ""}`}>
          <NavLink to="/" onClick={closeMenu}>
            Home
          </NavLink>

          <NavLink to="/about" onClick={closeMenu}>
            About Us
          </NavLink>

          <div className={`dropdown ${isServicesOpen ? "is-open" : ""}`}>
            <div className="nav-dropdown-row">
              <NavLink
                to="/services"
                className="nav-dropdown"
                onClick={closeMenu}
              >
                Our Services
              </NavLink>

              <button
                type="button"
                className="dropdown-toggle"
                onClick={toggleServices}
                aria-label="Toggle Services"
              >
                <FaChevronDown />
              </button>
            </div>

            <div className="dropdown-menu">
              <NavLink
                to="/services/tax"
                onClick={closeMenu}
              >
                Tax Compliance
              </NavLink>

              <NavLink
                to="/services/accounting-bookkeeping"
                onClick={closeMenu}
              >
                Accounting &amp; Bookkeeping
              </NavLink>

              <NavLink
                to="/services/auditing-assurance"
                onClick={closeMenu}
              >
                Audit &amp; Assurance
              </NavLink>

              <NavLink
                to="/services/admin-support"
                onClick={closeMenu}
              >
                Admin Support
              </NavLink>
            </div>
          </div>


          <NavLink
            to="/resources"
            onClick={closeMenu}
          >
            Resources
          </NavLink>

          {/* Temporarily hidden while the Careers page is on hold.
          <NavLink
            to="/careers"
            onClick={closeMenu}
          >
            Careers
          </NavLink>
          */}

          <NavLink
            to="/contact"
            className="sales-btn"
            onClick={closeMenu}
          >
            Talk to Our Experts
          </NavLink>
        </nav>
      </div>
    </header>
  );
}

export default Header;
