"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Check, Sparkles, Star, UsersRound } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

const projects = [
  {
    title: "Bardapure Creators Meet-Up",
    poster: "/images/bardapure-creators-meet-up-poster.jpg",
    posterAlt: "Poster announcing the Bidar Creators Meet-up",
    posterSource: "https://www.instagram.com/bardapure_production_official/p/DbfcpFYzj8t/",
    subtitle: "Connect • Collaborate • Create • Grow",
    description:
      "A creative networking platform bringing together Creators, Influencers, Models, Photographers, Filmmakers, Dancers, Artists and Entrepreneurs.",
    points: [
      "Creator networking",
      "Brand collaborations",
      "Photoshoots & content creation",
      "Reels & creative challenges",
      "Creator showcases",
      "Awards & recognition",
      "New opportunities and collaborations"
    ],
    category: "Bardapure Creators Meet-Up",
    action: "Join the creator community",
    Icon: UsersRound
  },
  {
    title: "India's Face Icon – IFI",
    poster: "/images/indias-face-icon-ifi-poster.jpg",
    posterAlt: "India's Face Icon national modeling audition poster",
    posterSource: "https://www.instagram.com/ifi_indiasfaceicon/p/DCLzww-NJBZ/",
    subtitle: "India's Platform for Emerging Faces & Talent",
    description:
      "A national talent and personality platform designed to discover, showcase and connect Models, Creators, Influencers, Actors and Emerging Talent from across India.",
    points: [
      "Talent registration",
      "Auditions & selection",
      "Professional photoshoots",
      "Brand opportunities",
      "Talent networking",
      "Recognition & awards",
      "National-level exposure"
    ],
    category: "India’s Face Icon – IFI",
    action: "Register your interest",
    Icon: Star
  }
];

export default function UpcomingProjects() {
  const reducedMotion = useReducedMotion();

  return (
    <section className="home-projects section-pad" aria-labelledby="home-projects-title">
      <header className="home-projects__heading">
        <span className="eyebrow">🚀 Upcoming Projects</span>
        <h2 id="home-projects-title">Explore Your<br /><em>Ambitions</em></h2>
      </header>
      <div className="home-projects__grid">
        {projects.map(({ title, poster, posterAlt, posterSource, subtitle, description, points, category, action, Icon }, index) => (
          <motion.article
            className="home-projects__card"
            key={title}
            initial={reducedMotion ? false : { opacity: 0, y: 24 }}
            whileInView={reducedMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.18 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: index * 0.1 }}
            whileHover={reducedMotion ? undefined : { y: -6 }}
          >
            <div className="home-projects__card-top">
              <span className="home-projects__icon"><Icon aria-hidden="true" /></span>
              <span className="home-projects__badge"><Sparkles aria-hidden="true" /> Coming soon</span>
            </div>
            <div className="home-projects__poster">
              <Image src={poster} alt={posterAlt} fill sizes="(max-width: 760px) 88vw, 42vw" />
            </div>
            <a className="home-projects__source" href={posterSource} target="_blank" rel="noreferrer">
              View original poster on Instagram <ArrowUpRight aria-hidden="true" />
            </a>
            <h3>{title}</h3>
            <p className="home-projects__subtitle">{subtitle}</p>
            <p className="home-projects__description">{description}</p>
            <ul className="home-projects__points">
              {points.map((point) => (
                <li key={point}><Check aria-hidden="true" />{point}</li>
              ))}
            </ul>
            <Link className="home-projects__cta" href={`/contact?category=${encodeURIComponent(category)}`}>
              {action}<ArrowUpRight aria-hidden="true" />
            </Link>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
