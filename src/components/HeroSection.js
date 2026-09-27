"use client";

import { ArrowDown } from "lucide-react";
import ButtonLink from "./ButtonLink";
import HeroReelCarousel from "./HeroReelCarousel";

export default function HeroSection() {
  return (
    <section className="festival-hero" id="home" aria-labelledby="hero-title">
      <HeroReelCarousel />
      <div className="festival-hero__grain" aria-hidden="true" />
      <div className="festival-hero__content">
        <p className="festival-hero__eyebrow"><span>Independent creative production</span><span>Made for the main character energy</span></p>
        <h1 id="hero-title">BARDAPURE<br /><em>PRODUCTIONS<sup>®</sup></em></h1>
        <div className="festival-hero__bottom">
          <p>Explore your ambitions.<br /><span>We make culture move.</span></p>
          <div className="festival-hero__actions">
            <ButtonLink href="/creators" variant="light">Join creator network</ButtonLink>
            <ButtonLink href="/#contact" variant="dark">Partner with us</ButtonLink>
          </div>
        </div>
      </div>
      <a className="festival-hero__scroll" href="#intro">Scroll to explore <ArrowDown size={15} /></a>
      <span className="festival-hero__stamp" aria-hidden="true">CREATE<br />CONNECT<br />CULTURE</span>
    </section>
  );
}
