import Image from "next/image";
import { partnerNames } from "../data/content";

function PartnerRun({ labelled = true }) {
  return (
    <div className="partner-marquee__run" aria-hidden={!labelled}>
      {partnerNames.map((partner, index) => (
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

export default function PartnerMarquee() {
  return (
    <section className="partner-marquee" aria-label="Campaign partners">
      <div className="partner-marquee__label">Good company <span>we keep</span></div>
      <div className="partner-marquee__viewport">
        <div className="partner-marquee__track">
          <PartnerRun />
          <PartnerRun labelled={false} />
        </div>
      </div>
    </section>
  );
}
