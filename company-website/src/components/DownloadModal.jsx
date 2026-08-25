import { useEffect, useRef, useState } from "react";
import { FaTimes, FaSyncAlt } from "react-icons/fa";
import "./DownloadModal.css";

const CAPTCHA_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function generateCaptchaText(length = 6) {
  let text = "";
  for (let i = 0; i < length; i++) {
    text += CAPTCHA_CHARS[Math.floor(Math.random() * CAPTCHA_CHARS.length)];
  }
  return text;
}

function DownloadModal({ resource, onClose }) {
  const canvasRef = useRef(null);
  const dialogRef = useRef(null);
  const firstFieldRef = useRef(null);
  const [captchaText, setCaptchaText] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    captchaInput: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const drawCaptcha = (text) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const { width, height } = canvas;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#eef2f1";
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < 5; i++) {
      ctx.strokeStyle = `rgba(15, 60, 25, ${0.15 + Math.random() * 0.2})`;
      ctx.beginPath();
      ctx.moveTo(Math.random() * width, Math.random() * height);
      ctx.lineTo(Math.random() * width, Math.random() * height);
      ctx.stroke();
    }

    const charWidth = width / text.length;

    text.split("").forEach((char, i) => {
      ctx.save();
      const x = charWidth * i + charWidth / 2;
      const y = height / 2 + (Math.random() * 8 - 4);
      ctx.translate(x, y);
      ctx.rotate(((Math.random() * 30 - 15) * Math.PI) / 180);
      ctx.font = "bold 22px monospace";
      ctx.fillStyle = "#0f3c19";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(char, 0, 0);
      ctx.restore();
    });
  };

  const refreshCaptcha = () => {
    const next = generateCaptchaText();
    setCaptchaText(next);
    setFormData((prev) => ({ ...prev, captchaInput: "" }));
    drawCaptcha(next);
  };

  useEffect(() => {
    refreshCaptcha();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    firstFieldRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = dialogRef.current.querySelectorAll(
        'button:not(:disabled), input:not(:disabled), [href], [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.captchaInput.trim().toUpperCase() !== captchaText) {
      setError("Captcha does not match. Please try again.");
      refreshCaptcha();
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/download-resource", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          company: formData.company,
          phone: formData.phone,
          resource: resource.key,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSubmitted(true);
      } else {
        setError(data.message || "Something went wrong. Please try again.");
        refreshCaptcha();
      }
    } catch (err) {
      console.error(err);
      setError("Unable to send the PDF right now. Please try again.");
      refreshCaptcha();
    } finally {
      setLoading(false);
    }
  };

  if (!resource) return null;

  return (
    <div className="download-modal-overlay" onClick={onClose}>
      <div
        ref={dialogRef}
        className="download-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="download-modal-title"
        aria-describedby="download-modal-description"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="download-modal-close"
          onClick={onClose}
          aria-label="Close"
        >
          <FaTimes />
        </button>

        <div className="download-modal-form">
          <h2 id="download-modal-title">Download resource</h2>
          <p id="download-modal-description" className="download-modal-description">
            Enter your details and we will send the resource to your inbox.
          </p>

          {submitted ? (
            <div className="download-modal-success">
              <p>
                Thanks{formData.name ? `, ${formData.name.split(" ")[0]}` : ""}!
                We&rsquo;ve sent <strong>{resource.title}</strong> to{" "}
                {formData.email}.
              </p>
              <button
                type="button"
                className="download-modal-submit"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <label className="sr-only" htmlFor="download-name">Name</label>
              <input
                ref={firstFieldRef}
                id="download-name"
                type="text"
                name="name"
                placeholder="Name *"
                value={formData.name}
                onChange={handleChange}
                required
              />
              <label className="sr-only" htmlFor="download-email">Email address</label>
              <input
                id="download-email"
                type="email"
                name="email"
                placeholder="Email Address *"
                value={formData.email}
                onChange={handleChange}
                required
              />
              <label className="sr-only" htmlFor="download-company">Company name</label>
              <input
                id="download-company"
                type="text"
                name="company"
                placeholder="Company Name *"
                value={formData.company}
                onChange={handleChange}
                required
              />
              <label className="sr-only" htmlFor="download-phone">Phone number</label>
              <input
                id="download-phone"
                type="tel"
                name="phone"
                placeholder="Phone Number *"
                value={formData.phone}
                onChange={handleChange}
                required
              />

              <div className="download-modal-captcha">
                <canvas
                  ref={canvasRef}
                  width={140}
                  height={48}
                  role="img"
                  aria-label="Verification code image"
                />
                <button
                  type="button"
                  className="download-modal-captcha-refresh"
                  onClick={refreshCaptcha}
                  aria-label="Refresh captcha"
                >
                  <FaSyncAlt />
                </button>
              </div>

              <label className="sr-only" htmlFor="download-captcha">
                Verification code
              </label>
              <input
                id="download-captcha"
                type="text"
                name="captchaInput"
                placeholder="Enter Captcha *"
                value={formData.captchaInput}
                onChange={handleChange}
                required
              />

              {error && <p className="download-modal-error" role="alert">{error}</p>}

              <button
                type="submit"
                className="download-modal-submit"
                disabled={loading}
              >
                {loading ? "Sending..." : "Get Now"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default DownloadModal;
