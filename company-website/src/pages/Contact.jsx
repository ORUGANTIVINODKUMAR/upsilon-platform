import { useState } from "react";
import { Link } from "react-router-dom";
import ReactPhoneInput from "react-phone-input-2";

const PhoneInput = ReactPhoneInput.default || ReactPhoneInput;
import { parsePhoneNumberFromString } from "libphonenumber-js";

import "react-phone-input-2/lib/style.css";
import usePageMeta from "../hooks/usePageMeta";
import "./Contact.css";

const countryOptions = [
  "United States",
  "Canada",
  "United Kingdom",
  "Australia",
  "India",
  "Other",
];

function Contact() {
  usePageMeta({
    title: "Talk to Our Experts",
    description:
      "Get in touch with Upsilon Services to discuss outsourced tax, accounting, bookkeeping, or audit support for your CPA firm. We respond within 1 business day.",
    path: "/contact",
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [phoneCountry, setPhoneCountry] = useState("US");
  const [phoneError, setPhoneError] = useState("");
  const [agreed, setAgreed] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    firmName: "",
    email: "",
    phone: "",
    service: "",
    country: "United States",
    message: "",
  });

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const validatePhone = () => {
    const phoneNumber = parsePhoneNumberFromString(`+${formData.phone}`);

    if (!formData.phone || !phoneNumber || !phoneNumber.isValid()) {
      setPhoneError("Please enter a valid phone number.");
      return false;
    }

    if (phoneNumber.country !== phoneCountry) {
      setPhoneError("Phone number does not match selected country.");
      return false;
    }

    setPhoneError("");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validatePhone()) return;

    if (!agreed) {
      alert("Please agree to the Privacy Policy before submitting.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          phone: `+${formData.phone}`,
        }),
      });

      const text = await response.text();
      const data = text ? JSON.parse(text) : {};

      if (!response.ok) {
        throw new Error(data.message || `Server error: ${response.status}`);
      }

      if (data.success) {
        setSubmitted(true);
        setFormData({
          fullName: "",
          firmName: "",
          email: "",
          phone: "",
          service: "",
          country: "",
          message: "",
        });
        setAgreed(false);
      } else {
        alert(data.message || "Something went wrong.");
      }
    } catch (err) {
      console.error(err);
      alert("Unable to send message.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="contact-section">
      <div className="contact-container">
        <div className="contact-intro">
          <h1>Let's Discuss Your Firm's Needs</h1>
          
          <p>
            Tell us about your firm's current needs, challenges, or growth plans. We'll schedule a conversation to understand your requirements, discuss potential solutions, and explore how Upsilon can best support your team.
          </p>
        </div>

        {submitted ? (
          <div className="contact-success">
            <h3>Thank you!</h3>
            <p>
              Your message has been sent successfully. Our team will contact
              you within one business day.
            </p>
          </div>
        ) : (
          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="contact-form-row">
              <div className="contact-field">
                <label>Full Name*</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="contact-field">
                <label>Firm Name*</label>
                <input
                  type="text"
                  name="firmName"
                  value={formData.firmName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="contact-form-row">
              <div className="contact-field">
                <label>Email*</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="contact-field">
                <label>Phone Number*</label>

                <PhoneInput
                  country="us"
                  value={formData.phone}
                  onChange={(value, country) => {
                    const maxDigits = country?.format
                      ? (country.format.match(/\./g) || []).length
                      : 15;

                    if (value.length > maxDigits) return;

                    setFormData((prev) => ({
                      ...prev,
                      phone: value || "",
                    }));

                    setPhoneCountry(
                      country?.countryCode
                        ? country.countryCode.toUpperCase()
                        : "US"
                    );

                    setPhoneError("");
                  }}
                  enableSearch={true}
                  autoFormat={true}
                  countryCodeEditable={false}
                  inputClass="phone-input-field"
                  buttonClass="phone-country-button"
                  containerClass="phone-input-container"
                  inputProps={{
                    name: "phone",
                    required: true,
                  }}
                />

                {phoneError && (
                  <span className="phone-error">{phoneError}</span>
                )}
              </div>
            </div>

            <div className="contact-form-row">
              <div className="contact-field">
                <label>What can we help you with?*</label>

                <select
                  name="service"
                  value={formData.service}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select a service</option>
                  <option>Tax Compliance</option>
                  <option>Accounting & Bookkeeping</option>
                  <option>Audit & Assurance</option>
                  <option>Administrative Support</option>
                  <option>Something else</option>
                </select>
              </div>

              <div className="contact-field">
                <label>Country / Region*</label>

                <select
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select country</option>
                  {countryOptions.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="contact-field contact-field-full">
              <label>Message*</label>

              <textarea
                rows="5"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
              />
            </div>

            <label className="contact-agreement">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                required
              />
              <span>
                I understand and agree that the information submitted in
                this form will be processed according to Upsilon
                Services&rsquo; <Link to="/privacy-policy">Privacy Policy</Link>.
              </span>
            </label>

            <button className="contact-submit" disabled={loading}>
              {loading ? "Sending..." : "Submit"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

export default Contact;
