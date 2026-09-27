import { ArrowUpRight } from "lucide-react";
import SiteFrame from "../../components/SiteFrame";
import { AboutStory } from "../../components/AboutStory";
import ServicesSection from "../../components/ServicesSection";
import TestimonialSlider from "../../components/TestimonialSlider";
import RecognitionLightbox from "../../components/RecognitionLightbox";
import PartnerMarquee from "../../components/PartnerMarquee";
import ReachStats from "../../components/ReachStats";
import { getPublicSiteContent } from "../../lib/site-content";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "About Bardapure Productions®",
  description: "Meet the people and creative network behind Bardapure Productions."
};

export default async function AboutPage() {
  const content = await getPublicSiteContent();
  return (
    <SiteFrame>
      <AboutStory content={content.about} />
      <PartnerMarquee partners={content.partners} />
      <ServicesSection items={content.services} />
      <ReachStats content={content.achievements} />
      <section className="testimonials section-pad" id="testimonials">
        <div className="route-heading"><div><span className="eyebrow">Words that stay with us</span><h2>What they<br /><em>say.</em></h2></div><span className="testimonial-source">Shared in appreciation posts</span></div>
        <TestimonialSlider items={content.testimonials} />
        <p className="testimonial-note">Quotes transcribed from appreciation posts and artwork.</p>
        <div className="recognition-inline"><span>Moments of recognition</span><RecognitionLightbox items={content.recognition} /></div>
        {content.site_settings.instagram && <a className="text-link" href={content.site_settings.instagram} target="_blank" rel="noreferrer">More from the team <ArrowUpRight size={15} /></a>}
      </section>
    </SiteFrame>
  );
}
