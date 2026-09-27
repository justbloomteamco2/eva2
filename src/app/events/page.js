import { CalendarDays, MapPin } from "lucide-react";
import SiteFrame from "../../components/SiteFrame";
import UpcomingEvents from "../../components/UpcomingEvents";
import FeedbackForm from "../../components/FeedbackForm";

export const metadata = {
  title: "Events — Bardapure Productions®",
  description: "Upcoming creator meet-ups, campus moments and events from Bardapure Productions."
};

export default function EventsPage() {
  return (
    <SiteFrame>
      <section className="events-page section-pad">
        <span className="eyebrow">Good people / Good plans</span>
        <div className="route-heading"><div><h1>Meet us<br /><em>out there.</em></h1></div><p>Creator meet-ups, campus moments and live experiences—announced as soon as they’re confirmed.</p></div>
        <div className="event-page-meta"><span><CalendarDays size={16} /> Upcoming plans</span><span><MapPin size={16} /> Across India</span></div>
        <UpcomingEvents />
      </section>
      <section className="events-archive section-pad" aria-labelledby="events-archive-title">
        <span className="eyebrow">The good times we made</span>
        <div className="route-heading"><div><h2 id="events-archive-title">From the<br /><em>archive.</em></h2></div><p>Campaigns and gatherings we’ve already shared with our community.</p></div>
        <UpcomingEvents archived />
      </section>
      <section className="feedback-section section-pad" id="feedback">
        <div className="feedback-section__heading"><span className="eyebrow">Been to one of our events?</span><h2>Tell us how<br /><em>it felt.</em></h2><p>Your feedback helps us make the next one better.</p></div>
        <FeedbackForm />
      </section>
    </SiteFrame>
  );
}
