export default function SectionIntro({ eyebrow, title, note, inverse = false }) {
  return (
    <div className={`section-intro${inverse ? " section-intro--inverse" : ""}`}>
      <span className="eyebrow">{eyebrow}</span>
      <div className="section-intro__row">
        <h2>{title}</h2>
        {note && <p>{note}</p>}
      </div>
    </div>
  );
}
