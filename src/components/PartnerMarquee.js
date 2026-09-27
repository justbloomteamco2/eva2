import Image from "next/image";

function PartnerRun({ partners, labelled = true }) {
  return (
    <div className="partner-marquee__run" aria-hidden={!labelled}>
      {partners.map((partner, index) => (
        <span className={`partner-marquee__mark partner-marquee__mark--${index % 6}`} key={partner}>
          {partner}
          <i aria-hidden="true">✳</i>
        </span>
      ))}
      <span className="partner-marquee__banner">
        <Image src="/images/brand-collaborations.jpeg" alt="Bardapure Productions campaign partner artwork" width={220} height={78} />
      </span>
    </div>
  );
}

export default function PartnerMarquee({ partners }) {
  if (!partners.length) return null;
  return (
    <section className="partner-marquee" aria-label="Campaign partners">
      <div className="partner-marquee__label">Campaign <span>partners</span></div>
      <div className="partner-marquee__viewport">
        <div className="partner-marquee__track">
          <PartnerRun partners={partners} />
          <PartnerRun partners={partners} labelled={false} />
        </div>
      </div>
    </section>
  );
}
