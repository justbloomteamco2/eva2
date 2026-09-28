import { cities } from "../data/content";
import MotionReveal from "./MotionReveal";

export default function ReachStats({ content }) {
  return (
    <>
      <section className="reach-stats section-pad" aria-label="Bardapure network">
        <span className="eyebrow">A connected creative practice</span>
        <div className="reach-stats__grid">
          {content.items.map((item, index) => (
            <MotionReveal as="article" key={`${item.value}-${item.label}`} delay={index * 0.08}>
              <strong>{item.value}</strong><span>{item.label}</span>
            </MotionReveal>
          ))}
        </div>
        <p>{content.note}</p>
      </section>
      <section className="reach-cities section-pad" aria-labelledby="reach-cities-title">
        <div><span className="eyebrow">Made local / Ready to travel</span><h2 id="reach-cities-title">From Bidar<br />to <em>everywhere.</em></h2></div>
        <div className="reach-cities__list">{cities.map((city) => <span key={city}>{city}</span>)}</div>
      </section>
    </>
  );
}
