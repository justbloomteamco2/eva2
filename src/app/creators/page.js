import SiteFrame from "../../components/SiteFrame";
import CreatorRegistrationForm from "../../components/CreatorRegistrationForm";
import { creatorCategories } from "../../data/content";

export const metadata = {
  title: "Join the Creator Network — Bardapure Productions®",
  description: "Join Bardapure Productions' creator and talent network to hear about relevant opportunities."
};

export default function CreatorsPage() {
  return (
    <SiteFrame>
      <section className="creator-page section-pad">
        <span className="eyebrow">Creators / Find your people</span>
        <div className="route-heading"><div><h1>Your next<br /><em>chapter starts here.</em></h1></div><p>Join free. Get considered for relevant brand campaigns, events and creative opportunities.</p></div>
        <div className="creator-page__roles">{creatorCategories.slice(0, 12).map((category) => <span key={category}>{category}</span>)}</div>
        <div id="creator-registration" className="creator-form-wrap"><CreatorRegistrationForm /></div>
      </section>
    </SiteFrame>
  );
}
