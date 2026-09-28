"use client";

import { motion, useReducedMotion } from "framer-motion";

export default function MotionReveal({
  as = "div",
  children,
  className,
  delay = 0,
  hoverLift = true,
  ...props
}) {
  const Component = motion[as];
  const reducedMotion = useReducedMotion();

  return (
    <Component
      className={className}
      initial={reducedMotion ? false : { opacity: 0, y: 24 }}
      whileInView={reducedMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.68, ease: [0.22, 1, 0.36, 1], delay }}
      whileHover={hoverLift && !reducedMotion ? { y: -7, scale: 1.01 } : undefined}
      {...props}
    >
      {children}
    </Component>
  );
}
