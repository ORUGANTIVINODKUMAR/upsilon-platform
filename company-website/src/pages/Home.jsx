import Hero from "../components/Hero";
import WhyUpsilon from "../components/WhyUpsilon";
import SecuritySection from "../components/SecuritySection";
import ServicesSection from "../components/ServicesSection";
import SoftwareSection from "../components/SoftwareSection";
import FAQSection from "../components/FAQSection";

import usePageMeta from "../hooks/usePageMeta";
import useStructuredData from "../hooks/useStructuredData";

import {
  organizationSchema,
  websiteSchema,
} from "../data/schema";

function Home() {
  usePageMeta({
    title: "CPA Outsourcing Services | Accounting, Tax & Audit Support",
    description:
      "Upsilon Services provides accounting outsourcing, bookkeeping, tax preparation, audit support, payroll, and back-office services for CPA firms. Secure, scalable, and built for CPA firms.",
    path: "/",
    image: "/upsilonlogo.png",
    imageAlt: "Upsilon Services CPA accounting and tax outsourcing",
  });

  useStructuredData("organization-schema", organizationSchema);
  useStructuredData("website-schema", websiteSchema);

  return (
    <>
      <Hero />
      <WhyUpsilon />
      <SecuritySection />
      <ServicesSection />
      <SoftwareSection />
      <FAQSection />
    </>
  );
}

export default Home;