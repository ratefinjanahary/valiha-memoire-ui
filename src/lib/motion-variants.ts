import type { Transition, Variants } from "framer-motion";

const spring = (stiffness = 300, damping = 24): Transition => ({
  type: "spring",
  stiffness,
  damping,
});

/** Parent : n'anime rien lui-même, il orchestre ses enfants */
export const stagger = (staggerChildren = 0.08, delayChildren = 0): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren, delayChildren } },
  exit: { opacity: 0, y: -10 },
});

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: spring() },
};

export const fadeUpSm: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: spring() },
};

export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -12 },
  visible: { opacity: 1, x: 0, transition: spring() },
};

export const pop: Variants = {
  hidden: { opacity: 0, scale: 0.85, y: 10 },
  visible: { opacity: 1, scale: 1, y: 0, transition: spring(400, 22) },
};

export const iconPop: Variants = {
  hidden: { opacity: 0, scale: 0.8, y: -10 },
  visible: { opacity: 1, scale: 1, y: 0, transition: spring(350, 22) },
};

export const card: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

/** `custom` = pourcentage de pertinence */
export const relevanceBar: Variants = {
  hidden: { width: 0 },
  visible: (percent: number) => ({
    width: `${percent}%`,
    transition: { duration: 0.6, ease: "easeOut" },
  }),
};