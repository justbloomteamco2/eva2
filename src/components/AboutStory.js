import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { aboutInstagramPosts, featuredCampaign } from "../data/content";

export function AboutStory() {
  return (
    <>
      <section className="page-intro section-pad" id="about">
        <span className="eyebrow">01 / About Bardapure</span>
        <div className="about-layout">
          <div className="about-portrait"><Image src="/images/founder-portrait-light.jpeg" alt="Bardapure founder at a public event" fill sizes="(max-width: 760px) 85vw, 34vw" /></div>
          <div className="intro__copy">
            <h1>Good work<br />starts with<br /><em>people.</em></h1>
            <p>Bardapure brings brands, creators and communities together to make meaningful experiences and campaigns.</p>
            <div className="about-pillars">
              <article><span className="eyebrow">Our vision</span><p>A trusted home for talent, brands and opportunity.</p></article>
              <article><span className="eyebrow">Our mission</span><p>Bring great people together to make memorable work.</p></article>
            </div>
          </div>
        </div>
      </section>
      <section className="about-social section-pad" aria-labelledby="about-posts-title">
        <div className="about-social__intro">
          <span className="eyebrow">People make the work</span>
          <h2 id="about-posts-title">Good energy.<br /><em>Real relationships.</em></h2>
          <p>Moments of appreciation shared by the team.</p>
        </div>
        <div className="about-social__grid">
          {aboutInstagramPosts.map((post) => (
            <a className="about-post" key={post.href} href={post.href} target="_blank" rel="noreferrer">
              <div className="about-post__image"><Image src={post.image} alt={post.alt} fill sizes="(max-width: 640px) 85vw, 35vw" /></div>
              <div className="about-post__meta"><span className="eyebrow">{post.category}</span><span>{post.title}<ArrowUpRight size={15} /></span></div>
            </a>
          ))}
        </div>
      </section>
      <FeaturedCampaign />
    </>
  );
}

export function FeaturedCampaign() {
  return (
    <section className="featured-campaign section-pad" id="recognition" aria-labelledby="current-campaign-title">
      <div className="featured-campaign__image"><Image src={featuredCampaign.image} alt={featuredCampaign.alt} fill sizes="(max-width: 760px) 100vw, 58vw" /></div>
      <div className="featured-campaign__copy">
        <span className="eyebrow">A fresh one from the field</span>
        <span className="featured-campaign__tag">{featuredCampaign.category}</span>
        <h2 id="current-campaign-title">{featuredCampaign.title}</h2>
        <p>{featuredCampaign.description}</p>
        <a className="text-link" href={featuredCampaign.href} target="_blank" rel="noreferrer">See the original post <ArrowUpRight size={16} /></a>
      </div>
    </section>
  );
}
