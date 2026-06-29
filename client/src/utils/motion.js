// Shared Framer Motion variants. Springs for interactive bits, easing for reveals.

export const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.18 } },
};

// Parent container that staggers its children in.
export const staggerContainer = {
  animate: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};

export const fadeUpItem = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
};

export const cardHover = {
  rest: { y: 0 },
  hover: { y: -4, transition: { type: "spring", stiffness: 300, damping: 20 } },
};

export const modalSpring = {
  initial: { opacity: 0, scale: 0.96, y: 14 },
  animate: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 320, damping: 26 } },
  exit: { opacity: 0, scale: 0.97, y: 8, transition: { duration: 0.14 } },
};
