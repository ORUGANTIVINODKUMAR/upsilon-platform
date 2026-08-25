// ============================================================
// STICKY "TALK TO OUR EXPERTS" BUTTON -- desktop only
// Appears after the visitor scrolls past the hero.
// ============================================================
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "./StickyContactButton.css";

function StickyContactButton() {
  const [visible, setVisible] = useState(false);
  const location = useLocation();

  useEffect(() => {
    function handleScroll() {
      setVisible(window.scrollY > 480);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Don't show it on the Contact page itself.
  if (location.pathname === "/contact") return null;

  return (
    <Link
      to="/contact"
      className={`sticky-contact-btn ${visible ? "is-visible" : ""}`}
    >
      Talk to Our Experts
    </Link>
  );
}

export default StickyContactButton;
