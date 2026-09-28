import SiteFrame from "../../components/SiteFrame";
import { AboutStory } from "../../components/AboutStory";
import ServicesSection from "../../components/ServicesSection";
import TestimonialsSection from "../../components/TestimonialsSection";
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
      <TestimonialsSection items={content.testimonials} />
    </SiteFrame>
  );
}
