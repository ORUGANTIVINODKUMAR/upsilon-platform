import ServiceDetailLayout from "../../components/ServiceDetailLayout";

function Payroll() {
  return (
    <ServiceDetailLayout
      eyebrow="PAYROLL SERVICES"
      title="Payroll Processing"
      subtitle="Accurate, on-time payroll runs and filings for your clients, handled on your schedule."
      intro="We manage recurring payroll production for your clients -- runs, filings, and compliance tracking across multiple states -- so your firm can offer payroll as a service without adding headcount."
      features={[
        "Multi-state payroll processing",
        "Federal and state payroll tax filings",
        "New hire reporting",
        "Garnishments and benefits deductions",
        "Year-end W-2 and 1099 preparation",
        "Payroll compliance monitoring",
      ]}
      process={[
        {
          title: "Setup",
          description:
            "We configure client payroll schedules, deductions, and filing requirements.",
        },
        {
          title: "Run Processing",
          description:
            "Payroll is processed and reviewed ahead of each pay date, with an audit trail for every run.",
        },
        {
          title: "Filings",
          description:
            "Required federal and state filings are prepared and submitted on schedule.",
        },
        {
          title: "Reporting",
          description:
            "You get a clear summary after every cycle -- no surprises at quarter or year-end.",
        },
      ]}
    />
  );
}

export default Payroll;
