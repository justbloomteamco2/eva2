import { cities } from "../data/content";

export default function ReachStats() {
  return (
    <>
      <section className="reach-stats section-pad" aria-label="Bardapure network">
        <span className="eyebrow">A network that keeps growing</span>
        <div className="reach-stats__grid">
          <article><strong>10,000<sup>+</sup></strong><span>Creators &amp; influencers</span></article>
          <article><strong>150<sup>+</sup></strong><span>College connections</span></article>
          <article><strong>120<sup>+</sup></strong><span>Events &amp; activations</span></article>
          <article><strong>2018—<br />now</strong><span>Creative journey</span></article>
        </div>
        <p>Figures shared by Bardapure Productions®.</p>
      </section>
      <section className="reach-cities section-pad" aria-labelledby="reach-cities-title">
        <div><span className="eyebrow">Made local / Ready to travel</span><h2 id="reach-cities-title">From Bidar<br />to <em>everywhere.</em></h2></div>
        <div className="reach-cities__list">{cities.map((city) => <span key={city}>{city}</span>)}</div>
      </section>
    </>
  );
}
