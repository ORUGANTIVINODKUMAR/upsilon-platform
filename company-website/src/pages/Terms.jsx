import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import LegalSectionCard from "../components/LegalSectionCard";
import usePageMeta from "../hooks/usePageMeta";
import "./LegalPage.css";

const sections = [
  {
    title: "About Upsilon Services",
    body: (
      <>
        <p>
          Upsilon Services provides outsourced accounting, bookkeeping, tax
          support, audit support, payroll, administrative, and back-office
          services to CPA firms, accounting firms, and businesses.
        </p>
        <p>
          Information presented on this Website is provided for general
          informational purposes and does not constitute accounting, tax,
          legal, or financial advice.
        </p>
      </>
    ),
  },
  {
    title: "Permitted Use",
    body: (
      <>
        <p>
          You may use this Website solely for lawful business and
          informational purposes.
        </p>
        <p>You agree not to:</p>
        <ul>
          <li>Use the Website in violation of any applicable law or regulation.</li>
          <li>
            Attempt to gain unauthorized access to the Website, servers, or
            related systems.
          </li>
          <li>Interfere with the operation or security of the Website.</li>
          <li>
            Copy, reproduce, distribute, or exploit Website content without
            prior written permission.
          </li>
          <li>
            Use the Website in any manner that could damage, disable, or
            impair its functionality.
          </li>
        </ul>
      </>
    ),
  },
  {
    title: "Intellectual Property",
    body: (
      <>
        <p>
          Unless otherwise stated, all content on this Website including
          text, graphics, logos, icons, images, layouts, designs, software,
          and other materials is the property of Upsilon Services or its
          licensors and is protected by applicable intellectual property
          laws.
        </p>
        <p>
          No content may be copied, modified, distributed, published, or
          reused without prior written permission.
        </p>
      </>
    ),
  },
  {
    title: "Website Content",
    body: (
      <>
        <p>
          We strive to ensure that information presented on this Website is
          accurate and up to date.
        </p>
        <p>
          However, we do not guarantee that all information is complete,
          accurate, or current at all times.
        </p>
        <p>
          Upsilon Services reserves the right to modify, update, or remove
          Website content without prior notice.
        </p>
      </>
    ),
  },
  {
    title: "No Professional Advice",
    body: (
      <>
        <p>
          The information provided on this Website is intended solely for
          general informational purposes.
        </p>
        <p>
          Nothing on this Website should be interpreted as accounting, tax,
          legal, financial, or professional advice.
        </p>
        <p>
          Professional advice should always be obtained based on your
          specific circumstances before making business or financial
          decisions.
        </p>
      </>
    ),
  },
  {
    title: "Service Engagement",
    body: (
      <>
        <p>
          Information available on this Website does not create a client
          relationship with Upsilon Services.
        </p>
        <p>
          Any professional services will be governed exclusively by a
          separate written agreement executed between Upsilon Services and
          the client.
        </p>
      </>
    ),
  },
  {
    title: "Confidential Information",
    body: (
      <>
        <p>
          While we take reasonable measures to protect information
          submitted through our Website, visitors should avoid submitting
          confidential, proprietary, tax, financial, or other sensitive
          information through general contact forms unless specifically
          requested.
        </p>
        <p>
          If you become a client, secure methods of communication and
          document exchange will be established as part of the engagement.
        </p>
      </>
    ),
  },
  {
    title: "Third-Party Services",
    body: (
      <>
        <p>
          Our Website may include references to or integrations with
          third-party services for functionality such as communication,
          scheduling, or website hosting.
        </p>
        <p>
          Upsilon Services is not responsible for the content, availability,
          or practices of third-party services.
        </p>
      </>
    ),
  },
  {
    title: "Disclaimer of Warranties",
    body: (
      <>
        <p>This Website is provided on an "as is" and "as available" basis.</p>
        <p>
          To the fullest extent permitted by law, Upsilon Services disclaims
          all warranties, whether express or implied, including warranties
          of merchantability, fitness for a particular purpose,
          non-infringement, and uninterrupted availability.
        </p>
        <p>
          We do not warrant that the Website will always be error-free,
          secure, or continuously available.
        </p>
      </>
    ),
  },
  {
    title: "Limitation of Liability",
    body: (
      <>
        <p>
          To the fullest extent permitted by applicable law, Upsilon
          Services shall not be liable for any indirect, incidental,
          consequential, special, or punitive damages arising from or
          relating to your use of this Website.
        </p>
        <p>
          This includes, without limitation, loss of data, business
          interruption, loss of profits, or reliance on Website content.
        </p>
        <p>
          Nothing in these Terms excludes liability that cannot legally be
          excluded under applicable law.
        </p>
      </>
    ),
  },
  {
    title: "Indemnification",
    body: (
      <p>
        You agree to indemnify and hold harmless Upsilon Services, its
        directors, officers, employees, contractors, and affiliates from
        any claims, liabilities, damages, losses, or expenses arising out
        of your misuse of the Website or violation of these Terms.
      </p>
    ),
  },
  {
    title: "Privacy",
    body: (
      <p>
        Your use of this Website is also governed by our{" "}
        <Link to="/privacy-policy">Privacy Policy</Link>, which explains how
        we collect, use, and protect information.
      </p>
    ),
  },
  {
    title: "Changes to These Terms",
    body: (
      <>
        <p>
          We may update these Terms of Use from time to time to reflect
          changes in our business, legal requirements, or Website
          functionality.
        </p>
        <p>
          Updated versions will be posted on this page with a revised "Last
          Updated" date.
        </p>
        <p>
          Continued use of the Website after changes become effective
          constitutes acceptance of the revised Terms.
        </p>
      </>
    ),
  },
  {
    title: "Governing Law",
    body: (
      <>
        <p>
          These Terms shall be governed by and interpreted in accordance
          with the laws applicable to Upsilon Services, without regard to
          conflict of law principles.
        </p>
        <p>
          Any disputes arising from these Terms or the use of this Website
          shall be resolved in the courts having appropriate jurisdiction.
        </p>
      </>
    ),
  },
  
  {
    title: "Contact Us",
    body: (
      <>
        <p>
          If you have any questions regarding these Terms of Use, please
          contact us.
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

function Terms() {
  usePageMeta({
    title: "Terms of Use",
    description:
      "Read the terms of use governing your access to and use of the Upsilon Services website and the services described on it.",
    path: "/terms-of-use",
  });

  return (
    <>
      <PageHeader
        eyebrow="LEGAL"
        title="Terms of Use"
        
        backgroundImage="/pic.png"
      />

      <section className="legal-section">
        <div className="legal-container">
          {/*
            DEV NOTE (not rendered to visitors): this is a general-purpose
            terms template and has not been reviewed by counsel. Have it
            reviewed by a qualified attorney licensed in your jurisdiction
            before treating it as your actual terms of use.
          */}

          <p className="legal-intro">
            Welcome to the Upsilon Services website ("Website"). These Terms
            of Use ("Terms") govern your access to and use of our Website
            and any information, content, or services made available
            through it. By accessing or using this Website, you acknowledge
            that you have read, understood, and agree to be bound by these
            Terms. If you do not agree with these Terms, please discontinue
            use of the Website.
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

export default Terms;
