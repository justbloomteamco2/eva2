import { ArrowRight, ArrowUpRight, Camera, Mic2, Target, Users } from "lucide-react";
import HeroSection from "../components/HeroSection";
import SiteFrame from "../components/SiteFrame";
import PartnerMarquee from "../components/PartnerMarquee";
import WorkGrid from "../components/WorkGrid";
import UpcomingEvents from "../components/UpcomingEvents";
import ButtonLink from "../components/ButtonLink";
import AudiencePathways from "../components/AudiencePathways";
import Link from "next/link";
import { getPublicSiteContent } from "../lib/site-content";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const content = await getPublicSiteContent();
  return (
    <SiteFrame>
      <HeroSection content={content.hero} />
      <section className="home-intro section-pad" id="intro">
        <span className="eyebrow">{content.home_intro.eyebrow}</span>
        <div><h2>{content.home_intro.title}<br /><em>{content.home_intro.highlight}</em></h2><p>{content.home_intro.description}</p><Link className="text-link" href="/about">Meet Bardapure <ArrowUpRight size={15} /></Link></div>
      </section>
      <PartnerMarquee partners={content.partners} />
      <section className="home-work section-pad" aria-labelledby="home-work-title">
        <div className="route-heading"><div><span className="eyebrow">Campaigns / Events / Production</span><h2 id="home-work-title">Work in<br /><em>motion.</em></h2></div><Link className="text-link" href="/work">Explore the work <ArrowRight size={16} /></Link></div>
        <WorkGrid items={content.portfolio} compact />
      </section>
      <section className="home-services section-pad">
        <span className="eyebrow">From the first idea to the final frame</span>
        <div className="home-services__grid">
          <article><Target /><strong>Brand activations</strong></article>
          <article><Mic2 /><strong>Events &amp; experiences</strong></article>
          <article><Camera /><strong>Content &amp; production</strong></article>
          <article><Users /><strong>Talent &amp; creators</strong></article>
        </div>
        <Link className="text-link" href="/about#services">See what we do <ArrowUpRight size={15} /></Link>
      </section>
      <section className="home-events section-pad">
        <div className="route-heading"><div><span className="eyebrow">Upcoming / Archive</span><h2>Events, in<br /><em>good company.</em></h2></div><Link className="text-link" href="/events">Event calendar <ArrowRight size={16} /></Link></div>
        <UpcomingEvents compact />
      </section>
      <AudiencePathways />
      <section className="home-invite section-pad">
        <div><span className="eyebrow">Creators / Brands / Campuses</span><h2>Let’s make<br />something<br /><em>together.</em></h2></div>
        <div className="home-invite__links"><ButtonLink href="/creators" variant="light">Join creator network</ButtonLink><ButtonLink href="/contact" variant="dark">Partner with us</ButtonLink></div>
      </section>
      <section className="home-contact-cta section-pad">
        <span className="eyebrow">Projects / Partnerships / Production</span>
        <div className="home-contact-cta__row"><h2>Ready to make<br /><em>something real?</em></h2><ButtonLink href="/contact" variant="light">Start a conversation</ButtonLink></div>
      </section>
    </SiteFrame>
  );
}
