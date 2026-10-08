"use client";

import { motion, useReducedMotion } from "framer-motion";

const mistGradient = `radial-gradient(
  closest-side,
  color-mix(in oklab, var(--primary) 22%, transparent) 0%,
  color-mix(in oklab, var(--primary) 10%, transparent) 45%,
  transparent 100%
)`;

const mistBlobs = [
  { top: "5%", left: "10%", size: "55%" },
  { top: "45%", left: "55%", size: "50%" },
  { top: "60%", left: "5%", size: "40%" },
  { top: "0%", left: "60%", size: "35%" },
];

const MistLayer = ({
  duration,
  reverse = false,
  opacity = 1,
}: {
  duration: number;
  reverse?: boolean;
  opacity?: number;
}) => {
  const reduceMotion = useReducedMotion();

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <motion.div
        className="relative shrink-0 h-[150vmax] w-[150vmax]"
        style={{ opacity }}
        animate={reduceMotion ? undefined : { rotate: reverse ? -360 : 360 }}
        transition={{ duration, ease: "linear", repeat: Infinity }}
      >
        {mistBlobs.map((b, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              top: b.top,
              left: b.left,
              width: b.size,
              height: b.size,
              background: mistGradient,
            }}
            animate={reduceMotion ? undefined : { scale: [1, 1.25, 1] }}
            transition={{
              duration: 14 + i * 3,
              ease: "easeInOut",
              repeat: Infinity,
              delay: i * 2,
            }}
          />
        ))}
      </motion.div>
    </div>
  );
}

export const MistBackground = () => {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      <MistLayer duration={140} />
      <MistLayer duration={200} reverse opacity={0.7} />
    </div>
  );
}