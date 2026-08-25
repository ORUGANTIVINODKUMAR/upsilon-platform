import { Link } from "react-router-dom";
import { FaPhoneAlt, FaEnvelope, FaLinkedinIn } from "react-icons/fa";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Company */}
        <div>
          <h3>Upsilon Services</h3>

          <p>
            Outsourced accounting, tax, bookkeeping, audit support and
            back-office services for CPA firms across the USA.
          </p>

          <div className="footer-social">
            <a
              href="https://www.linkedin.com/company/upsilon-services/?viewAsMember=true"
              aria-label="Upsilon Services on LinkedIn"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaLinkedinIn />
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4>Quick Links</h4>

          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
          <Link to="/services">Services</Link>
          <Link to="/resources">Resources</Link>
          <Link to="/contact">Contact</Link>
        </div>

        {/* Services */}
        <div>
          <h4>Services</h4>

          <Link to="/services/tax">Tax Services</Link>

          <Link to="/services/accounting-bookkeeping">
            Accounting
          </Link>

          <Link to="/services/auditing-assurance">
            Auditing
          </Link>

          <Link to="/services/admin-support">
            Admin Support
          </Link>
        </div>

        {/* Contact */}
        <div>
          <h4>Contact</h4>

          <p>
            <a
              href="tel:+12098774566"
              className="footer-contact-link"
            >
              <FaPhoneAlt />
              <span>+1 209 877 4566</span>
            </a>
          </p>

          <p>
            <a
              href="mailto:info@upsilonservices.com"
              className="footer-contact-link"
            >
              <FaEnvelope />
              <span>info@upsilonservices.com</span>
            </a>
          </p>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="footer-bottom">
        <p>© 2026 Upsilon Services. All rights reserved.</p>

        <div>
          <Link to="/privacy-policy">Privacy Policy</Link>

          <Link to="/terms-of-use">Terms of Use</Link>
        </div>
      </div>
    </footer>
  );
}

export default Footer;