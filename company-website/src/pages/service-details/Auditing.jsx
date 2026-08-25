import ServiceDetailLayout from "../../components/ServiceDetailLayout";
import usePageMeta from "../../hooks/usePageMeta";
import useStructuredData from "../../hooks/useStructuredData";
import { buildServiceSchema } from "../../data/schema";

function Auditing() {
  usePageMeta({
    title: "Audit & Assurance Support",
    description:
      "Outsourced audit support for CPA firms tie-outs, schedules, and documentation handled so your on-site team can focus on judgment calls and clients.",
    path: "/services/auditing-assurance",
  });
  useStructuredData(
    buildServiceSchema({
      name: "Audit & Assurance Support",
      description:
        "Outsourced audit support for CPA firms, including tie-outs, schedules, and documentation.",
      url: "/services/auditing-assurance",
    }),
    "service-schema"
  );

  return (
    <ServiceDetailLayout
      eyebrow="AUDIT SERVICES"
      title="Audit & Assurance Support"
      subtitle="Complete audit support services for CPA firms, from fieldwork documentation through final sign-off."
      intro="Our audit support team handles the production-heavy parts of an engagement tie-outs, schedules, and documentation so your on-site team can focus on judgment calls and client relationships."
      features={[
        "Trial balance tie-outs",
        "PBC list coordination and tracking",
        "Lead schedule preparation",
        "Internal control documentation",
        "Sample testing support",
        "Workpaper organization and referencing",
      ]}
      process={[
        {
          title: "Engagement Planning",
          description:
            "We review the engagement scope, PBC list, and existing workpapers to plan our support.",
        },
        {
          title: "Fieldwork Support",
          description:
            "Our team prepares schedules and documentation in parallel with your on-site fieldwork.",
        },
        {
          title: "Review Cycle",
          description:
            "Work is organized and referenced for a smooth handoff to your reviewing partner.",
        },
        {
          title: "Wrap-Up",
          description:
            "We support open-item tracking through to final sign-off.",
        },
      ]}
    />
  );
}

export default Auditing;
