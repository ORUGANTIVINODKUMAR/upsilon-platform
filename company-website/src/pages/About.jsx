import AboutHero from "../components/AboutHero";
import OurStory from "../components/OurStory";
import MissionVision from "../components/MissionVision";
import WhyDifferent from "../components/WhyDifferent";
import OurApproach from "../components/OurApproach";
import WhyPartner from "../components/WhyPartner";
import IndustriesSection from "../components/IndustriesSection";
import AboutLeadership from "../components/AboutLeadership";
import AboutStats from "../components/AboutStats";
import usePageMeta from "../hooks/usePageMeta";

function About() {
  usePageMeta({
    title: "About Upsilon Services | CPA Outsourcing Partner",
    description:
      "Learn how Upsilon Services supports US CPA firms with secure, scalable accounting, tax, audit, bookkeeping, and back-office outsourcing services.",
    path: "/about",
  });

  return (
    <>
      <AboutHero />
      <OurStory />
      <MissionVision />
      <WhyDifferent />
      <OurApproach />
      <WhyPartner />
      <IndustriesSection />
      <AboutLeadership />
      <AboutStats />
    </>
  );
}

export default About;