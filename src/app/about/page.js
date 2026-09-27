import { ArrowUpRight } from "lucide-react";
import SiteFrame from "../../components/SiteFrame";
import { AboutStory } from "../../components/AboutStory";
import ServicesSection from "../../components/ServicesSection";
import TestimonialSlider from "../../components/TestimonialSlider";
import RecognitionLightbox from "../../components/RecognitionLightbox";
import { recognitions, testimonials } from "../../data/content";
import PartnerMarquee from "../../components/PartnerMarquee";
import ReachStats from "../../components/ReachStats";

export const metadata = {
  title: "About Bardapure Productions®",
  description: "Meet the people and creative network behind Bardapure Productions."
};

export default function AboutPage() {
  return (
    <SiteFrame>
      <AboutStory />
      <PartnerMarquee />
      <ServicesSection />
      <ReachStats />
      <section className="testimonials section-pad" id="testimonials">
        <div className="route-heading"><div><span className="eyebrow">Words that stay with us</span><h2>What they<br /><em>say.</em></h2></div><span className="testimonial-source">Shared in appreciation posts</span></div>
        <TestimonialSlider items={testimonials} />
        <p className="testimonial-note">Quotes transcribed from appreciation posts and artwork.</p>
        <div className="recognition-inline"><span>Moments of recognition</span><RecognitionLightbox items={recognitions} /></div>
        <a className="text-link" href="https://www.instagram.com/bardapure_production_official/" target="_blank" rel="noreferrer">More from the team <ArrowUpRight size={15} /></a>
      </section>
    </SiteFrame>
  );
}
