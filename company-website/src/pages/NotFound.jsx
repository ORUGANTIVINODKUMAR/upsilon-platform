import { Link } from "react-router-dom";
import usePageMeta from "../hooks/usePageMeta";
import "./NotFound.css";

function NotFound() {
  usePageMeta({
    title: "Page Not Found",
    description:
      "The page you requested could not be found. Return to the Upsilon Services homepage or explore our accounting outsourcing services.",
    path: window.location.pathname,
    noIndex: true,
  });

  return (
    <section className="not-found-page">
      <div className="not-found-content">
        <p className="not-found-code">404</p>

        <h1>Page Not Found</h1>

        <p>
          The page you are looking for may have been moved, renamed, or no
          longer exists.
        </p>

        <div className="not-found-actions">
          <Link to="/" className="not-found-primary">
            Return to Home
          </Link>

          <Link to="/services" className="not-found-secondary">
            View Our Services
          </Link>
        </div>
      </div>
    </section>
  );
}

export default NotFound;