import { useEffect, useRef, useState } from "react";

function CountUpNumber({ end, suffix = "", duration = 1300 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || started.current) return;

      started.current = true;
      let startTime = null;

      const animate = (time) => {
        if (!startTime) startTime = time;

        const progress = Math.min((time - startTime) / duration, 1);
        const currentValue = Math.floor(progress * end);

        setCount(currentValue);

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    });

    if (ref.current) observer.observe(ref.current);

    return () => observer.disconnect();
  }, [end, duration]);

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
}

export default CountUpNumber;