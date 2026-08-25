import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { LuArrowRight } from "react-icons/lu";
import "./Hero.css";

const container = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.15,
    },
  },
};

const item = {
  hidden: {
    opacity: 0,
    y: 26,
  },

  visible: {
    opacity: 1,
    y: 0,

    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

function Hero() {
  return (
    <section
      className="hero-section"
      aria-labelledby="hero-heading"
    >
      <div
        className="hero-overlay"
        aria-hidden="true"
      />

      <div className="hero-container">
        <motion.div
          className="hero-content"
          variants={container}
          initial="hidden"
          animate="visible"
        >
          <motion.p
            className="hero-label"
            variants={item}
          >
            Your Partner for People, Process &amp; Technology
          </motion.p>

          <motion.h1
            id="hero-heading"
            variants={item}
          >
            Expand Your Firpos;s Capabilities with Trusted Global Talent
          </motion.h1>

          <motion.p
            className="hero-description"
            variants={item}
          >
            Upsilon helps CPA firms expand capacity with dedicated offshore
            professionals who become an extension of your team. From bookkeeping
            and tax preparation to audit support and back-office operations, we
            deliver reviewer-ready work through secure workflows, signed NDAs,
            controlled access, and transparent communication.
          </motion.p>

          <motion.div
            className="hero-buttons"
            variants={item}
          >
            <Link
              to="/contact"
              className="hero-btn hero-btn-primary"
            >
              Talk to Our Experts
              <LuArrowRight aria-hidden="true" />
            </Link>

            <Link
              to="/services"
              className="hero-btn hero-btn-secondary"
            >
              Explore Services
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

export default Hero;
