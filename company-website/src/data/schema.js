// ============================================================
// Shared JSON-LD structured data builders.
// SITE_URL must match the deployed domain.
// ============================================================

const SITE_URL = "https://www.upsilonservices.com";

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": ["Organization", "ProfessionalService"],
  "@id": `${SITE_URL}/#organization`,
  name: "Upsilon Services",
  url: SITE_URL,
  logo: {
    "@type": "ImageObject",
    url: `${SITE_URL}/upsilonlogo.png`,
  },
  image: `${SITE_URL}/upsilonlogo.png`,
  description:
    "Upsilon Services provides outsourced accounting, tax preparation, bookkeeping, payroll, audit support, and back-office services for CPA firms, EAs, and accounting firms across the United States.",
  email: "YOUR_OFFICIAL_EMAIL",
  telephone: "YOUR_OFFICIAL_PHONE",
  areaServed: {
    "@type": "Country",
    name: "United States",
  },
  knowsAbout: [
    "Outsourced Accounting",
    "Tax Preparation Outsourcing",
    "Bookkeeping Outsourcing",
    "Payroll Support",
    "Audit Support",
    "CPA Firm Outsourcing",
  ],
  sameAs: [
    "https://www.linkedin.com/company/upsilon-services/",
  ],
};
export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  url: SITE_URL,
  name: "Upsilon Services",
  publisher: {
    "@id": `${SITE_URL}/#organization`,
  },
  inLanguage: "en-US",
};
export function buildServiceSchema({ name, description, url }) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${SITE_URL}${url}#service`,
    name,
    serviceType: name,
    description,
    url: `${SITE_URL}${url}`,
    provider: {
      "@id": `${SITE_URL}/#organization`,
    },
    areaServed: {
      "@type": "Country",
      name: "United States",
    },
    audience: {
      "@type": "BusinessAudience",
      audienceType:
        "CPA firms, enrolled agents, accounting firms, and tax professionals",
    },
  };
}

export function buildFaqSchema(faqs) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}
