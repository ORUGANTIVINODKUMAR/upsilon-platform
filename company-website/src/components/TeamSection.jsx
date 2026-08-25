// =========================================================
// OUR TEAM SECTION — Upsilon Services
// Paste this file at: src/components/TeamSection.jsx
// Requires: react-icons (already in your dependencies)
//
// Uses initials-based avatar placeholders so the section looks
// complete before real headshots are added. To use a real photo,
// replace the <div className="team-avatar"> block with:
//   <img src="/team/name.jpg" alt="Full Name" className="team-avatar-img" />
// =========================================================
import { FaLinkedinIn, FaEnvelope } from "react-icons/fa";
import "./TeamSection.css";

const team = [
  {
    name: "Sarah Mitchell",
    role: "Engagement Director",
    bio: "Oversees onboarding and quality standards across every client engagement.",
    initials: "SM",
  },
  {
    name: "David Chen",
    role: "Tax Team Lead",
    bio: "15+ years in U.S. individual and business tax compliance.",
    initials: "DC",
  },
  {
    name: "Priya Nair",
    role: "Senior Bookkeeping Manager",
    bio: "Leads reconciliation and financial statement workflows for client accounts.",
    initials: "PN",
  },
  {
    name: "James Okafor",
    role: "Audit Support Manager",
    bio: "Coordinates PBC lists, lead schedules, and workpaper review cycles.",
    initials: "JO",
  },
  {
    name: "Maria Santos",
    role: "Payroll Specialist",
    bio: "Manages multi-state payroll runs and compliance filings.",
    initials: "MS",
  },
  {
    name: "Alex Turner",
    role: "Client Success Lead",
    bio: "Primary point of contact for firm onboarding and ongoing support.",
    initials: "AT",
  },
];

function TeamSection() {
  return (
    <section className="team-pro-section" id="team">
      <div className="team-pro-container">
        <span className="team-pro-eyebrow">OUR TEAM</span>
        <h2>Experienced Professionals, Embedded in Your Workflow</h2>
        <p className="team-pro-subtitle">
          A dedicated bench of accounting professionals trained on U.S.
          standards, ready to plug into your firm.
        </p>

        <div className="team-pro-grid">
          {team.map((member, index) => (
            <div
              className="team-pro-card"
              key={member.name}
              data-aos="fade-up"
              data-aos-delay={index * 80}
            >
              <div className="team-avatar">
                <span>{member.initials}</span>
              </div>

              <h3>{member.name}</h3>
              <span className="team-role">{member.role}</span>
              <p>{member.bio}</p>

              <div className="team-social">
                <a href="#" aria-label={`${member.name} on LinkedIn`}>
                  <FaLinkedinIn />
                </a>
                <a href="#" aria-label={`Email ${member.name}`}>
                  <FaEnvelope />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default TeamSection;
