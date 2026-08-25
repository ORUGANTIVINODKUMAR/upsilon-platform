import PageHeader from "../components/PageHeader";
import LegalSectionCard from "../components/LegalSectionCard";
import usePageMeta from "../hooks/usePageMeta";
import "./LegalPage.css";

const sections = [
  {
    title: "Information We Collect",
    body: (
      <>
        <p>
          We may collect information that you voluntarily provide when you
          interact with our website or communicate with our team.
        </p>

        <h3>Information You Provide</h3>
        <p>This may include:</p>
        <ul>
          <li>Full name</li>
          <li>Company name</li>
          <li>Email address</li>
          <li>Phone number</li>
          <li>Job title</li>
          <li>Business information</li>
          <li>Information submitted through contact forms</li>
          <li>Information provided during consultations or business discussions</li>
        </ul>
        <p>
          You are not required to provide personal information simply to
          browse our website. However, certain services or inquiries may
          require you to provide contact details.
        </p>

        <h3>Information Collected Automatically</h3>
        <p>
          When you visit our website, certain technical information may be
          collected automatically, including:
        </p>
        <ul>
          <li>IP address</li>
          <li>Browser type</li>
          <li>Operating system</li>
          <li>Device information</li>
          <li>Pages visited</li>
          <li>Time spent on pages</li>
          <li>Referring website</li>
          <li>Date and time of access</li>
        </ul>
        <p>
          This information helps us improve website performance and user
          experience.
        </p>
      </>
    ),
  },
  {
    title: "How We Use Your Information",
    body: (
      <>
        <p>We use collected information to:</p>
        <ul>
          <li>Respond to inquiries and consultation requests</li>
          <li>Communicate regarding our services</li>
          <li>Provide requested information</li>
          <li>Improve our website and user experience</li>
          <li>Analyze website usage and performance</li>
          <li>Maintain security and prevent unauthorized activity</li>
          <li>Comply with applicable legal and regulatory obligations</li>
        </ul>
        <p>
          We only collect information that is reasonably necessary for
          these purposes.
        </p>
      </>
    ),
  },
  {
    title: "Confidentiality & Data Security",
    body: (
      <>
        <p>Security is an integral part of our delivery model.</p>
        <p>
          We implement administrative, technical, and organizational
          safeguards designed to protect the confidentiality, integrity,
          and availability of information entrusted to us.
        </p>
        <p>Our security practices may include:</p>
        <ul>
          <li>Confidentiality agreements (NDAs)</li>
          <li>Controlled access to business information</li>
          <li>Role-based access permissions</li>
          <li>Secure file sharing practices</li>
          <li>Documented internal procedures</li>
          <li>Employee confidentiality obligations</li>
          <li>Security awareness practices</li>
        </ul>
        <p>
          While we strive to protect information using commercially
          reasonable measures, no method of electronic transmission or
          storage can be guaranteed to be completely secure.
        </p>
      </>
    ),
  },
  {
    title: "How We Share Information",
    body: (
      <>
        <p>We respect your privacy.</p>
        <p>
          We do not sell, rent, or trade personal information to third
          parties.
        </p>
        <p>Information may only be shared:</p>
        <ul>
          <li>
            With trusted service providers assisting in website operations
            or business services
          </li>
          <li>When required by applicable law, regulation, or legal process</li>
          <li>To protect our legal rights or property</li>
          <li>With your consent</li>
        </ul>
        <p>
          Third-party providers are expected to maintain appropriate
          confidentiality and security measures.
        </p>
      </>
    ),
  },
  {
    title: "Cookies",
    body: (
      <>
        <p>Our website may use cookies and similar technologies to:</p>
        <ul>
          <li>Improve website functionality</li>
          <li>Remember user preferences</li>
          <li>Analyze website traffic</li>
          <li>Enhance overall user experience</li>
        </ul>
        <p>
          Most web browsers allow you to control cookie settings. Disabling
          cookies may affect certain website functionality.
        </p>
      </>
    ),
  },
  {
    title: "Third-Party Services",
    body: (
      <>
        <p>Our website may use trusted third-party services including:</p>
        <ul>
          <li>Website hosting providers</li>
          <li>Analytics services</li>
          <li>Email communication platforms</li>
          <li>Security monitoring services</li>
        </ul>
        <p>
          These providers maintain their own privacy policies governing
          their use of information.
        </p>
      </>
    ),
  },
  {
    title: "Data Retention",
    body: (
      <>
        <p>
          We retain personal information only for as long as reasonably
          necessary to:
        </p>
        <ul>
          <li>Respond to inquiries</li>
          <li>Provide requested services</li>
          <li>Meet contractual obligations</li>
          <li>Comply with applicable legal requirements</li>
          <li>Resolve disputes</li>
          <li>Enforce our agreements</li>
        </ul>
        <p>
          Information that is no longer required will be securely deleted
          or anonymized where appropriate.
        </p>
      </>
    ),
  },
  {
    title: "International Data Transfers",
    body: (
      <>
        <p>
          Depending on the nature of our engagement, information may be
          processed by authorized personnel working from different office
          locations.
        </p>
        <p>
          Where information is transferred across jurisdictions, we take
          reasonable measures designed to protect that information in
          accordance with applicable legal requirements and our internal
          security practices.
        </p>
      </>
    ),
  },
  {
    title: "Your Privacy Rights",
    body: (
      <>
        <p>
          Depending on your jurisdiction and applicable law, you may have
          the right to:
        </p>
        <ul>
          <li>Request access to your personal information</li>
          <li>Request correction of inaccurate information</li>
          <li>Request deletion of certain information</li>
          <li>Withdraw consent where applicable</li>
          <li>Request information regarding how your data is processed</li>
        </ul>
        <p>
          To exercise these rights, please contact us using the information
          below.
        </p>
      </>
    ),
  },
  {
    title: "Third-Party Links",
    body: (
      <>
        <p>Our website may contain links to third-party websites.</p>
        <p>
          We are not responsible for the privacy practices, content, or
          security of external websites. We encourage users to review the
          privacy policies of any third-party sites they visit.
        </p>
      </>
    ),
  },
  {
    title: "Children's Privacy",
    body: (
      <>
        <p>
          Our website and services are intended for businesses and
          professionals.
        </p>
        <p>
          We do not knowingly collect personal information from individuals
          under the age of 18.
        </p>
        <p>
          If we become aware that such information has been collected
          unintentionally, we will take reasonable steps to remove it.
        </p>
      </>
    ),
  },
  {
    title: "Changes to This Privacy Policy",
    body: (
      <>
        <p>
          We may update this Privacy Policy periodically to reflect changes
          in our business practices, legal requirements, or website
          functionality.
        </p>
        <p>
          The updated version will be posted on this page with a revised
          "Last Updated" date.
        </p>
        <p>We encourage visitors to review this Privacy Policy periodically.</p>
      </>
    ),
  },
  {
    title: "Contact Us",
    body: (
      <>
        <p>
          If you have questions regarding this Privacy Policy or our
          privacy practices, please contact us.
        </p>
        <p>
          Upsilon Services
          <br />
          Email:{" "}
          <a href="mailto:info@upsilonservices.com">
            info@upsilonservices.com
          </a>
          <br />
          Website:{" "}
          <a href="https://upsilonservices.com">upsilonservices.com</a>
        </p>
      </>
    ),
  },
];

function PrivacyPolicy() {
  usePageMeta({
    title: "Privacy Policy",
    description:
      "Read Upsilon Services' privacy policy to understand what information we collect, how we use it, and how we protect it.",
    path: "/privacy-policy",
  });

  return (
    <>
      <PageHeader
        eyebrow="LEGAL"
        title="Privacy Policy"
        subtitle=" Last Updated: [06-01-2026]"
        backgroundImage="/security.jpg"
      />

      <section className="legal-section">
        <div className="legal-container">
          {/*
            DEV NOTE (not rendered to visitors): replace the [Insert Date]
            placeholders below with real dates before publishing, and have
            this reviewed by a qualified attorney licensed in your
            jurisdiction before treating it as final.
          */}

          <p className="legal-intro">
            At Upsilon Services, we value the trust our clients place in us.
            Protecting the confidentiality and security of personal and
            business information is fundamental to the way we operate. This
            Privacy Policy explains how we collect, use, disclose, and
            safeguard information when you visit our website, submit an
            inquiry, or communicate with us regarding our accounting, tax,
            bookkeeping, audit support, and outsourcing services. By using
            this website, you agree to the practices described in this
            Privacy Policy.
          </p>

          {sections.map((section) => (
            <LegalSectionCard key={section.title} title={section.title}>
              {section.body}
            </LegalSectionCard>
          ))}
        </div>
      </section>
    </>
  );
}

export default PrivacyPolicy;
