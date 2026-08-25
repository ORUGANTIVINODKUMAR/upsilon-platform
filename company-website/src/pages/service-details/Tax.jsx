import ServiceDetailLayout from "../../components/ServiceDetailLayout";
import usePageMeta from "../../hooks/usePageMeta";
import useStructuredData from "../../hooks/useStructuredData";
import { buildServiceSchema } from "../../data/schema";

function Tax() {
  usePageMeta({
    title: "Tax Compliance & Preparation",
    description:
      "Outsourced tax preparation for CPA firms  individual, business, and fiduciary returns handled to your checklist, software, and review standards.",
    path: "/services/tax",
  });
  useStructuredData(
    buildServiceSchema({
      name: "Tax Compliance & Preparation",
      description:
        "Outsourced tax preparation for CPA firms across individual, business, and fiduciary returns.",
      url: "/services/tax",
    }),
    "service-schema"
  );

  return (
    <ServiceDetailLayout
      eyebrow="TAX SERVICES"
      title="Tax Compliance & Preparation"
      subtitle="Reduce tax season pressure with experienced professionals supporting individual, business, partnership, and fiduciary returns."
      intro="Our tax team supports CPA firms through every part of the compliance cycle  from first-draft preparation to notice response following your firm's checklist, software, and review standards so returns come back ready for partner sign-off."
      features={[
        "Individual returns (Form 1040)",
        "Business returns (1120, 1120S, 1065)",
        "Nonprofit and fiduciary returns (990, 1041)",
        "Estimated payments and extensions",
        "Notice and amendment response",
        "Tax research memos",
      ]}
      process={[
        {
          title: "Scope & Access",
          description:
            "We align on software, checklists, and file-sharing protocols before any work begins.",
        },
        {
          title: "Preparation",
          description:
            "Returns are prepared to your firm's standards and documented for easy review.",
        },
        {
          title: "Internal QA",
          description:
            "A reviewer checks every return before it reaches your team.",
        },
        {
          title: "Delivery & Revisions",
          description:
            "You review, we revise turnaround times are agreed upfront per engagement.",
        },
      ]}
    />
  );
}

export default Tax;
