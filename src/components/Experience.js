"use client";

import { useEffect } from "react";

export default function Experience() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    let lenis;
    let gsapContext;
    let frame;
    let cancelled = false;

    async function initialize() {
      const [{ default: Lenis }, { default: gsap }, { ScrollTrigger }] = await Promise.all([
        import("lenis"),
        import("gsap"),
        import("gsap/ScrollTrigger")
      ]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);
      lenis = new Lenis({ duration: 1.05, smoothWheel: true });
      lenis.on("scroll", ScrollTrigger.update);
      const tick = (time) => {
        lenis.raf(time * 1000);
        frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
      gsapContext = gsap.context(() => {
        gsap.utils.toArray("[data-reveal]").forEach((element) => {
          gsap.fromTo(
            element,
            { y: 24, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.8,
              ease: "power2.out",
              scrollTrigger: { trigger: element, start: "top 88%", once: true }
            }
          );
        });
        gsap.utils.toArray("[data-parallax]").forEach((element) => {
          gsap.to(element, {
            yPercent: -5,
            ease: "none",
            scrollTrigger: { trigger: element, scrub: true }
          });
        });
      });
    }

    initialize();
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      gsapContext?.revert();
      lenis?.destroy();
    };
  }, []);

  return null;
}
