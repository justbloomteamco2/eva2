import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import MotionReveal from "./MotionReveal";
import RecognitionCards from "./RecognitionCards";

export function AboutStory({ content }) {
  const featuredCampaign = content.featuredCampaign;
  return (
    <>
      <section className="page-intro section-pad" id="about">
        <span className="eyebrow">01 / About Bardapure</span>
        <div className="about-layout">
          <div className="about-portrait"><Image src={content.portrait} alt="Bardapure founder at an event" fill sizes="(max-width: 760px) 85vw, 34vw" unoptimized /></div>
          <div className="intro__copy">
            <h1>{content.headline}<br /><em>{content.highlight}</em></h1>
            <p>{content.description}</p>
            <div className="about-pillars">
              <article><span className="eyebrow">Our vision</span><p>{content.vision}</p></article>
              <article><span className="eyebrow">Our mission</span><p>{content.mission}</p></article>
            </div>
          </div>
        </div>
      </section>
      <section className="about-social section-pad" id="moments-of-recognition" aria-labelledby="about-posts-title">
        <div className="about-social__intro">
          <span className="eyebrow">People make the work / Moments of recognition</span>
          <h2 id="about-posts-title">{content.socialHeadline}<br /><em>{content.socialHighlight}</em></h2>
          <p>{content.socialDescription}</p>
        </div>
        <RecognitionCards posts={content.posts} />
      </section>
      <FeaturedCampaign content={featuredCampaign} />
    </>
  );
}

export function FeaturedCampaign({ content, variant = "editorial" }) {
  const isEvent = variant === "event";
  return (
    <MotionReveal as="section" className={`featured-campaign section-pad featured-campaign--${variant}`} id={isEvent ? "upcoming-campaign" : "current-campaign"} aria-labelledby={`${variant}-campaign-title`} hoverLift={false}>
      <div className="featured-campaign__image"><Image src={content.image} alt={content.alt} fill sizes="(max-width: 760px) 100vw, 58vw" unoptimized /></div>
      <div className="featured-campaign__copy">
        <span className="eyebrow">A fresh one from the field</span>
        <span className="featured-campaign__tag">{content.category}</span>
        <h2 id={`${variant}-campaign-title`}>{content.title}</h2>
        <p>{content.description}</p>
        {isEvent && <span className="featured-campaign__live"><i aria-hidden="true" /> Currently active</span>}
        <div className="featured-campaign__actions">
          {isEvent && <Link className="button-link button-link--light" href="/contact?campaign=blackberrys-on-campus">Enquire <ArrowUpRight size={16} /></Link>}
          <a className="text-link" href={content.href} target="_blank" rel="noreferrer">See the original post <ArrowUpRight size={16} /></a>
        </div>
      </div>
    </MotionReveal>
  );
}
