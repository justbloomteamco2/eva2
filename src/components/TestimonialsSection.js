import { ArrowUpRight, MessageCircle } from "lucide-react";
import MotionReveal from "./MotionReveal";

export default function TestimonialsSection({ items }) {
  return (
    <section className="testimonials section-pad" id="community-words" aria-labelledby="community-words-title">
      <div className="route-heading">
        <div>
          <span className="eyebrow">Instagram / Community notes</span>
          <h2 id="community-words-title">Words from the mass<br /><em>that stayed with us.</em></h2>
        </div>
        <a className="text-link" href="https://www.instagram.com/bardapure_production_official/" target="_blank" rel="noreferrer">
          Find us on Instagram <ArrowUpRight size={15} />
        </a>
      </div>
      <div className="community-notes">
        {items.map((item, index) => (
          <MotionReveal as="article" className={`community-note community-note--${index + 1}`} key={`${item.source}-${index}`} delay={index * 0.1}>
            <span className="community-note__meta"><MessageCircle size={16} /> {item.source}</span>
            <blockquote>{item.quote}</blockquote>
            <span className="community-note__tail" aria-hidden="true" />
          </MotionReveal>
        ))}
      </div>
    </section>
  );
}
