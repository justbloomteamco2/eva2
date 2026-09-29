import Link from "next/link";
import { ArrowUpRight, Camera, Handshake, Medal, Rocket, Sparkles, Users } from "lucide-react";

const projects = [
  {
    number: "01",
    eyebrow: "For creators",
    title: "Bardapure Creators Meet-Up",
    subtitle: "Connect · Collaborate · Create · Grow",
    description: "A creative networking platform for creators, influencers, models, photographers, filmmakers, dancers, artists and entrepreneurs.",
    highlights: [
      ["Creator networking", Users],
      ["Brand collaborations", Handshake],
      ["Photoshoots & content", Camera],
      ["Reels & creative challenges", Sparkles],
      ["Creator showcases", Camera],
      ["Awards & recognition", Medal],
      ["New opportunities & collaborations", ArrowUpRight]
    ],
    audience: "Connect · Collaborate · Create · Grow",
    action: "Join the creator community",
    href: "/creators/meetup"
  },
  {
    number: "02",
    eyebrow: "For emerging talent",
    title: "India’s Face Icon – IFI",
    subtitle: "India’s platform for emerging faces & talent",
    description: "Your Face · Your Talent · Your Identity. A national platform to discover, showcase and connect emerging talent across India.",
    highlights: [
      ["Talent registration", Users],
      ["Auditions & selection", Sparkles],
      ["Professional photoshoots", Camera],
      ["Brand opportunities", Handshake],
      ["Talent networking", Users],
      ["Recognition & awards", Medal],
      ["National-level exposure", ArrowUpRight]
    ],
    audience: "Models · Creators · Influencers · Actors · Emerging talent",
    action: "Register your interest",
    href: "/creators/ifi"
  }
];

export default function UpcomingProjects() {
  return (
    <section className="upcoming-projects" aria-labelledby="upcoming-projects-title">
      <div className="upcoming-projects__heading">
        <span className="eyebrow"><Rocket size={14} aria-hidden="true" /> Upcoming projects</span>
        <h2 id="upcoming-projects-title">Explore your <em>ambitions.</em></h2>
      </div>
      <div className="upcoming-projects__grid">
        {projects.map((project) => (
          <article className="project-card" key={project.number}>
            <div className="project-card__top">
              <span className="project-card__number">{project.number} / {project.eyebrow}</span>
              <span className="project-card__status"><i aria-hidden="true" /> Coming soon</span>
            </div>
            <h3>{project.title}</h3>
            <p className="project-card__subtitle">{project.subtitle}</p>
            <p className="project-card__description">{project.description}</p>
            <ul className="project-card__highlights">
              {project.highlights.map(([label, Icon]) => (
                <li key={label}><Icon size={16} aria-hidden="true" /><span>{label}</span></li>
              ))}
            </ul>
            <p className="project-card__audience">{project.audience}</p>
            <Link className="button-link button-link--dark project-card__action" href={project.href}>
              <span>{project.action}</span><ArrowUpRight size={17} aria-hidden="true" />
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
