import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

export function AboutStory({ content }) {
  const featuredCampaign = content.featuredCampaign;
  return (
    <>
      <section className="page-intro section-pad" id="about">
        <span className="eyebrow">01 / About Bardapure</span>
        <div className="about-layout">
          <div className="about-portrait"><Image src={content.portrait} alt="Bardapure founder at an event" fill sizes="(max-width: 760px) 85vw, 34vw" priority unoptimized /></div>
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
      <section className="about-social section-pad" aria-labelledby="about-posts-title">
        <div className="about-social__intro">
          <span className="eyebrow">People make the work</span>
          <h2 id="about-posts-title">{content.socialHeadline}<br /><em>{content.socialHighlight}</em></h2>
          <p>{content.socialDescription}</p>
        </div>
        <div className="about-social__grid">
          {content.posts.map((post) => (
            <a className="about-post" key={post.href} href={post.href} target="_blank" rel="noreferrer" data-reveal>
              <div className="about-post__image"><Image src={post.image} alt={post.alt} fill sizes="(max-width: 640px) 85vw, 35vw" unoptimized /></div>
              <div className="about-post__meta"><span className="eyebrow">{post.category}</span><span>{post.title}<ArrowUpRight size={15} /></span></div>
            </a>
          ))}
        </div>
      </section>
      <FeaturedCampaign content={featuredCampaign} />
    </>
  );
}

export function FeaturedCampaign({ content }) {
  return (
    <section className="featured-campaign section-pad" id="recognition" aria-labelledby="current-campaign-title" data-reveal>
      <div className="featured-campaign__image"><Image src={content.image} alt={content.alt} fill sizes="(max-width: 760px) 100vw, 58vw" unoptimized /></div>
      <div className="featured-campaign__copy">
        <span className="eyebrow">A fresh one from the field</span>
        <span className="featured-campaign__tag">{content.category}</span>
        <h2 id="current-campaign-title">{content.title}</h2>
        <p>{content.description}</p>
        <a className="text-link" href={content.href} target="_blank" rel="noreferrer">See the original post <ArrowUpRight size={16} /></a>
      </div>
    </section>
  );
}
