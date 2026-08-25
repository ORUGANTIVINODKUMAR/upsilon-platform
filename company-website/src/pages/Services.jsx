import OurServicesSection from "../components/OurServicesSection";
import usePageMeta from "../hooks/usePageMeta";

function Services() {
  usePageMeta({
    title: "Our Services",
    description:
      "Outsourced tax compliance, accounting & bookkeeping,Audit & assurance, and administrative support - built specifically for CPA and accounting firms.",
    path: "/services",
  });

  return (
    <>
      <OurServicesSection />
    </>
  );
}

export default Services;
