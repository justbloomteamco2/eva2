import Image from "next/image";
import { ArrowUpRight, CalendarDays, MapPin, Ticket } from "lucide-react";
import MotionReveal from "./MotionReveal";

function EventCard({ event }) {
  const date = new Date(`${event.date}T12:00:00`);
  return (
    <MotionReveal as="article" className="public-event">
      <div className="public-event__poster">
        {event.poster_url ? <Image src={event.poster_url} alt={`${event.title} event poster`} fill sizes="(max-width: 680px) 88vw, 30vw" unoptimized /> : <div className="public-event__poster-placeholder"><CalendarDays size={44} /><span>BARDAPURE<br />LIVE</span></div>}
        <span>{event.registration_type === "free" ? "Free entry" : "Paid registration"}</span>
      </div>
      <div className="public-event__details">
        <span className="eyebrow">{date.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span>
        <h3>{event.title}</h3>
        <p className="public-event__city"><MapPin size={14} />{event.city}</p>
        <p>{event.description}</p>
        {event.registration_link && <a className="text-link" href={event.registration_link} target="_blank" rel="noreferrer">Register <ArrowUpRight size={15} /></a>}
      </div>
    </MotionReveal>
  );
}

export default function EventsBoard({
  events = [],
  emptyTitle = <>Nothing on the calendar.<br /><em>Yet.</em></>,
  emptyMessage = "New events will show up here as soon as they’re announced."
}) {
  return (
    <div className="events-board">
      {events.length ? events.map((event) => <EventCard key={event.id} event={event} />) : (
        <div className="events-empty">
          <span className="events-empty__icon"><Ticket size={23} /></span>
          <h3>{emptyTitle}</h3>
          <p>{emptyMessage}</p>
          <a className="text-link" href="https://www.instagram.com/bardapure_production_official/" target="_blank" rel="noreferrer">Follow for announcements <ArrowUpRight size={15} /></a>
        </div>
      )}
    </div>
  );
}
