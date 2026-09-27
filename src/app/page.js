import { ArrowRight, ArrowUpRight, Camera, Mic2, Target, Users } from "lucide-react";
import HeroSection from "../components/HeroSection";
import SiteFrame from "../components/SiteFrame";
import PartnerMarquee from "../components/PartnerMarquee";
import WorkGrid from "../components/WorkGrid";
import UpcomingEvents from "../components/UpcomingEvents";
import ContactForm from "../components/ContactForm";
import ButtonLink from "../components/ButtonLink";
import { instagramPosts } from "../data/content";
import AudiencePathways from "../components/AudiencePathways";
import Link from "next/link";

export default function HomePage() {
  return (
    <SiteFrame>
      <HeroSection />
      <section className="home-intro section-pad" id="intro">
        <span className="eyebrow">Bardapure Productions® / Since 2018</span>
        <div><h2>For the ones who<br /><em>make things happen.</em></h2><p>Brand experiences, events and creative campaigns brought to life with good people and big energy.</p><Link className="text-link" href="/about">Meet Bardapure <ArrowUpRight size={15} /></Link></div>
      </section>
      <PartnerMarquee />
      <section className="home-work section-pad" aria-labelledby="home-work-title">
        <div className="route-heading"><div><span className="eyebrow">Real work / Real moments</span><h2 id="home-work-title">Out there<br /><em>doing things.</em></h2></div><Link className="text-link" href="/work">All the work <ArrowRight size={16} /></Link></div>
        <WorkGrid items={instagramPosts} compact />
      </section>
      <section className="home-services section-pad">
        <span className="eyebrow">One connected creative network</span>
        <div className="home-services__grid">
          <article><Target /><strong>Brand activations</strong></article>
          <article><Mic2 /><strong>Events &amp; experiences</strong></article>
          <article><Camera /><strong>Content &amp; production</strong></article>
          <article><Users /><strong>Talent &amp; creators</strong></article>
        </div>
        <Link className="text-link" href="/about#services">See what we do <ArrowUpRight size={15} /></Link>
      </section>
      <section className="home-events section-pad">
        <div className="route-heading"><div><span className="eyebrow">The next good thing</span><h2>See you<br /><em>out there.</em></h2></div><Link className="text-link" href="/events">All events <ArrowRight size={16} /></Link></div>
        <UpcomingEvents compact />
      </section>
      <AudiencePathways />
      <section className="home-invite section-pad">
        <div><span className="eyebrow">Creators, brands, campuses</span><h2>Good things<br />happen when<br /><em>we connect.</em></h2></div>
        <div className="home-invite__links"><ButtonLink href="/creators" variant="light">Join creator network</ButtonLink><ButtonLink href="/#contact" variant="dark">Partner with us</ButtonLink></div>
      </section>
      <section className="contact section-pad" id="contact">
        <span className="eyebrow">Say hello / Let’s make it happen</span>
        <div className="contact__intro"><h2>Have a good<br /><em>one in mind?</em></h2><p>Brand collaborations, campus partnerships, event production, creator and casting enquiries.</p></div>
        <div className="contact__form">
          <div className="contact__details"><span>Start a conversation.</span><a href="https://www.instagram.com/bardapure_production_official/" target="_blank" rel="noreferrer">Connect on Instagram <ArrowUpRight size={16} /></a><p>Tell us a little about the project and the right person will get back to you.</p></div>
          <ContactForm />
        </div>
      </section>
    </SiteFrame>
  );
}
