import { CalendarDays, MapPin } from "lucide-react";
import SiteFrame from "../../components/SiteFrame";
import UpcomingEvents from "../../components/UpcomingEvents";
import FeedbackForm from "../../components/FeedbackForm";
import { FeaturedCampaign } from "../../components/AboutStory";
import { getPublicSiteContent } from "../../lib/site-content";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Events — Bardapure Productions®",
  description: "Upcoming creator meet-ups, campus moments and events from Bardapure Productions."
};

export default async function EventsPage() {
  const content = await getPublicSiteContent();
  return (
    <SiteFrame>
      <section className="events-page section-pad">
        <span className="eyebrow">Upcoming / Bardapure events</span>
        <div className="route-heading"><div><h1>Meet us<br /><em>in person.</em></h1></div><p>Creator meet-ups, campus activations and live experiences. Confirmed plans appear here first.</p></div>
        <div className="event-page-meta"><span><CalendarDays size={16} /> Upcoming plans</span><span><MapPin size={16} /> Across India</span></div>
        <FeaturedCampaign content={content.about.featuredCampaign} variant="event" />
        <UpcomingEvents />
      </section>
      <section className="events-archive section-pad" aria-labelledby="events-archive-title">
        <span className="eyebrow">Past events</span>
        <div className="route-heading"><div><h2 id="events-archive-title">Past, on<br /><em>record.</em></h2></div><p>Events move here after their dates have passed.</p></div>
        <UpcomingEvents archived />
      </section>
      <section className="feedback-section section-pad" id="feedback">
        <div className="feedback-section__heading"><span className="eyebrow">01 / Event attendees</span><h2>Help shape<br /><em>what’s next.</em></h2><p>Tell us which event you attended, what worked, and what we can improve. Your name and email are optional.</p></div>
        <FeedbackForm />
      </section>
    </SiteFrame>
  );
}
