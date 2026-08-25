// ============================================================
// ScrollRevealHeading
// A heading whose LETTERS "colour in" one by one as the section
// scrolls into view. Each character fades from a light tint of its
// own colour to the full colour, so the sweep reads as a smooth
// left-to-right wave across the words (inspired by the zig.ai
// reference).
//
// Usage:
//   <ScrollRevealHeading
//     id="services-heading"
//     className="my-heading"
//     words={[
//       ...toWords("Plain navy part", "navy"),
//       ...toWords("Highlighted green part", "green", { breakBefore: true }),
//     ]}
//   />
// ============================================================

import { Fragment, useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from "framer-motion";

// Shared palette. `faded` is a light tint of `full` so each letter
// reveals within its own colour family.
export const TONES = {
  navy: { faded: "#c8cdd6", full: "#0f172a" },
  green: { faded: "#bcdcc1", full: "#1e740d" },
};

// Split a phrase into word tokens tagged with a tone. Options let the
// first word start a new line (breakBefore) when a phrase should wrap.
export function toWords(text, tone = "navy", { breakBefore = false } = {}) {
  return text
    .trim()
    .split(/\s+/)
    .map((word, index) => ({
      text: word,
      tone,
      breakBefore: breakBefore && index === 0,
    }));
}

// A single letter whose colour is driven by scroll progress.
function RevealLetter({ char, tone, progress, range, disabled }) {
  const color = useTransform(progress, range, [tone.faded, tone.full]);

  return (
    <motion.span style={{ color: disabled ? tone.full : color }}>
      {char}
    </motion.span>
  );
}

function ScrollRevealHeading({
  as: Tag = "h2",
  words,
  id,
  className,
  // When the heading enters this band of the viewport the sweep runs.
  offset = ["start 0.85", "start 0.4"],
  // How many letters overlap in their fade — higher = smoother wave.
  spread = 3,
}) {
  const prefersReducedMotion = useReducedMotion();
  const ref = useRef(null);

  const { scrollYProgress } = useScroll({ target: ref, offset });

  // Total letters across every word drive the timeline slices.
  const totalLetters = words.reduce((sum, word) => sum + word.text.length, 0);
  const step = 1 / Math.max(totalLetters, 1);

  // Running index so each letter (across all words) owns the next slice.
  let letterIndex = 0;

  return (
    <Tag id={id} className={className} ref={ref}>
      {words.map((word, wordIndex) => {
        const tone = TONES[word.tone] || TONES.navy;
        const letters = word.text.split("");

        return (
          <Fragment key={`${word.text}-${wordIndex}`}>
            {word.breakBefore && <br />}

            {/* Keep a word intact so it never wraps mid-letter. */}
            <span
              className="reveal-word"
              style={{ display: "inline-block", whiteSpace: "nowrap" }}
            >
              {letters.map((char, charIndex) => {
                const start = letterIndex * step;
                const end = Math.min(1, start + step * spread);
                letterIndex += 1;

                return (
                  <RevealLetter
                    key={charIndex}
                    char={char}
                    tone={tone}
                    progress={scrollYProgress}
                    range={[start, end]}
                    disabled={prefersReducedMotion}
                  />
                );
              })}
            </span>{" "}
          </Fragment>
        );
      })}
    </Tag>
  );
}

export default ScrollRevealHeading;
