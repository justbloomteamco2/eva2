import { ArrowUpRight, Target, PartyPopper, Megaphone, Clapperboard, Users, Smartphone, Camera, Film } from "lucide-react";
import SectionIntro from "./SectionIntro";

const serviceIcons = [Target, PartyPopper, Megaphone, Clapperboard, Users, Smartphone, Camera, Film];

export default function ServicesSection({ items, compact = false }) {
  const visibleServices = compact ? items.slice(0, 4) : items;
  return (
    <section className="services section-pad" id="services">
      <SectionIntro eyebrow="What we do" title={<>Ideas into<br /><em>experience.</em></>} note="One creative partner. A connected mix of skills, people and production." />
      <div className="service-list">
        {visibleServices.map((service, index) => {
          const Icon = serviceIcons[index % serviceIcons.length];
          return (
            <article className="service-row" key={service.number} data-reveal>
              <span className="service-row__number">{service.number}</span>
              <Icon className="service-row__icon" aria-hidden="true" />
              <div className="service-row__copy"><h3>{service.title}</h3><p>{service.description.split(".")[0]}.</p></div>
              <ArrowUpRight className="service-row__arrow" aria-hidden="true" />
            </article>
          );
        })}
      </div>
      <div className="service-special"><span className="eyebrow">Specialist projects</span><p>Indian Air Force · UFO film distribution · Events</p></div>
    </section>
  );
}
