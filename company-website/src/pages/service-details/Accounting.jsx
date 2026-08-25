import ServiceDetailLayout from "../../components/ServiceDetailLayout";
import usePageMeta from "../../hooks/usePageMeta";
import useStructuredData from "../../hooks/useStructuredData";
import { buildServiceSchema } from "../../data/schema";

function Accounting() {
  usePageMeta({
    title: "Accounting & Bookkeeping",
    description:
      "Monthly outsourced bookkeeping and accounting production support for CPA firms, working directly inside QuickBooks, Xero, or your platform of choice.",
    path: "/services/accounting-bookkeeping",
  });
  useStructuredData(
    buildServiceSchema({
      name: "Accounting & Bookkeeping",
      description:
        "Monthly outsourced bookkeeping and accounting production support for CPA firms.",
      url: "/services/accounting-bookkeeping",
    }),
    "service-schema"
  );

  return (
    <ServiceDetailLayout
      eyebrow="ACCOUNTING SERVICES"
      title="Accounting & Bookkeeping"
      subtitle="Keep your clients' financial records accurate and up to date while your internal team focuses on advisory and client relationships."
      intro="We handle the recurring bookkeeping work that keeps your clients' financials accurate and current, working directly inside QuickBooks, Xero, or your platform of choice so your team can focus on review and advisory."
      features={[
        "Monthly bookkeeping and journal entries",
        "Bank and credit card reconciliations",
        "Accounts payable and receivable management",
        "General ledger maintenance and cleanup",
        "Financial statement preparation",
        "Month-end and year-end close support",
      ]}
      process={[
        {
          title: "Onboarding",
          description:
            "We map your client's chart of accounts and existing workflows before touching the books.",
        },
        {
          title: "Monthly Production",
          description:
            "Bookkeeping is completed on a fixed monthly schedule, with reconciliations flagged for review.",
        },
        {
          title: "Statement Prep",
          description:
            "Financial statements are prepared and formatted to your firm's templates.",
        },
        {
          title: "Handoff",
          description:
            "You receive a reviewer-ready package with notes on any open items.",
        },
      ]}
    />
  );
}

export default Accounting;
