import { ArrowUpRight } from "lucide-react";
import SiteFrame from "../../components/SiteFrame";
import PartnerMarquee from "../../components/PartnerMarquee";
import WorkGrid from "../../components/WorkGrid";
import { getPublicSiteContent } from "../../lib/site-content";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Work — Bardapure Productions®",
  description: "Campaigns, brand activations and event moments from Bardapure Productions."
};

export default async function WorkPage() {
  const content = await getPublicSiteContent();
  return (
    <SiteFrame>
      <section className="work-page section-pad">
        <span className="eyebrow">Selected campaigns / From the feed</span>
        <div className="route-heading"><div><h1>Work in<br /><em>motion.</em></h1></div><p>Brand activations, event production and campaign moments—shared by the people who made them.</p></div>
        <WorkGrid items={content.portfolio} />
        <a className="instagram-follow" href="https://www.instagram.com/bardapure_production_official/" target="_blank" rel="noreferrer"><ArrowUpRight size={16} /> See more from Bardapure on Instagram</a>
      </section>
      <PartnerMarquee partners={content.partners} />
    </SiteFrame>
  );
}
