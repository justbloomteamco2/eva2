"use client";

import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";

function RecognitionCard({ post, index }) {
  const reducedMotion = useReducedMotion();
  const rotateX = useSpring(useMotionValue(0), { stiffness: 180, damping: 18, mass: 0.45 });
  const rotateY = useSpring(useMotionValue(0), { stiffness: 180, damping: 18, mass: 0.45 });

  function tilt(event) {
    if (reducedMotion || event.pointerType !== "mouse") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;
    rotateX.set((0.5 - y) * 9);
    rotateY.set((x - 0.5) * 9);
  }

  function resetTilt() {
    rotateX.set(0);
    rotateY.set(0);
  }

  return (
    <motion.a
      className="about-post"
      href={post.href}
      target="_blank"
      rel="noreferrer"
      aria-label={`${post.title}. Open the pinned Instagram post.`}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      onPointerMove={tilt}
      onPointerLeave={resetTilt}
      initial={reducedMotion ? false : { opacity: 0, y: 28 }}
      whileInView={reducedMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: index * 0.1 }}
      whileHover={reducedMotion ? undefined : { y: -7, scale: 1.015 }}
    >
      <span className="about-post__frame">
        <span className="about-post__image">
          <Image src={post.image} alt={post.alt} fill sizes="(max-width: 640px) 85vw, 35vw" unoptimized />
          <span className="about-post__open">Open pinned post <ArrowUpRight size={16} /></span>
        </span>
        <span className="about-post__meta">
          <span className="eyebrow">{post.category}</span>
          <span>{post.title}<ArrowUpRight size={15} /></span>
        </span>
      </span>
    </motion.a>
  );
}

export default function RecognitionCards({ posts }) {
  return (
    <div className="about-social__grid recognition-grid">
      {posts.map((post, index) => <RecognitionCard key={post.href} post={post} index={index} />)}
    </div>
  );
}
