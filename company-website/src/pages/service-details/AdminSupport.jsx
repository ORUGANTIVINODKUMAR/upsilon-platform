import ServiceDetailLayout from "../../components/ServiceDetailLayout";
import usePageMeta from "../../hooks/usePageMeta";
import useStructuredData from "../../hooks/useStructuredData";
import { buildServiceSchema } from "../../data/schema";

function AdminSupport() {
  usePageMeta({
    title: "Administrative Support",
    description:
      "Outsourced back-office and administrative support for CPA firms engagement letters, billing, and workpaper compilation handled off your plate.",
    path: "/services/admin-support",
  });
  useStructuredData(
    buildServiceSchema({
      name: "Administrative Support",
      description:
        "Outsourced back-office and administrative support for CPA firms.",
      url: "/services/admin-support",
    }),
    "service-schema"
  );

  return (
    <ServiceDetailLayout
      eyebrow="ADMIN SUPPORT"
      title="Administrative Support"
      subtitle="Free up billable hours by handing off the recurring back-office work."
      intro="From engagement letters to workpaper compilation, our admin support team takes on the non-billable tasks that quietly eat into partner and staff time so your firm runs leaner without adding overhead."
      features={[
        "Engagement letter preparation",
        "Client billing and invoicing support",
        "Client communication and scheduling",
        "Workpaper compilation and filing",
        "Document management and organization",
        "General back-office coordination",
      ]}
      process={[
        {
          title: "Task Mapping",
          description:
            "We identify which recurring admin tasks make sense to hand off first.",
        },
        {
          title: "Workflow Setup",
          description:
            "We build simple, documented processes around your existing tools and templates.",
        },
        {
          title: "Ongoing Support",
          description:
            "Our team handles the task queue on an agreed cadence, task-based or dedicated.",
        },
        {
          title: "Check-Ins",
          description:
            "Regular check-ins keep the scope aligned as your firm's needs change.",
        },
      ]}
    />
  );
}

export default AdminSupport;
