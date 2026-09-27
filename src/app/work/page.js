import { ArrowUpRight } from "lucide-react";
import SiteFrame from "../../components/SiteFrame";
import PartnerMarquee from "../../components/PartnerMarquee";
import WorkGrid from "../../components/WorkGrid";
import { instagramPosts } from "../../data/content";

export const metadata = {
  title: "Work — Bardapure Productions®",
  description: "Campaigns, brand activations and event moments from Bardapure Productions."
};

export default function WorkPage() {
  return (
    <SiteFrame>
      <section className="work-page section-pad">
        <span className="eyebrow">Work / Straight from the feed</span>
        <div className="route-heading"><div><h1>Out there<br /><em>doing things.</em></h1></div><p>Campaigns, Reels and behind-the-scenes moments from the people who made them.</p></div>
        <WorkGrid items={instagramPosts} />
        <a className="instagram-follow" href="https://www.instagram.com/bardapure_production_official/" target="_blank" rel="noreferrer"><ArrowUpRight size={16} /> Follow the next one on Instagram</a>
      </section>
      <PartnerMarquee />
    </SiteFrame>
  );
}
