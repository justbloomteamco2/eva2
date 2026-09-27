"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import EventsBoard from "./EventsBoard";

export default function UpcomingEvents({ compact = false, archived = false }) {
  const [events, setEvents] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let active = true;
    setStatus("loading");
    const view = archived ? "archive" : "upcoming";
    fetch(`/api/events?view=${view}&page=${page}`, { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Events are temporarily unavailable.");
        return result;
      })
      .then((result) => {
        if (!active) return;
        setEvents(Array.isArray(result.events) ? result.events : []);
        setTotal(result.total || 0);
        setTotalPages(result.totalPages || 1);
        setStatus("ready");
      })
      .catch(() => {
        if (active) setStatus("error");
      });
    return () => { active = false; };
  }, [archived, page]);

  if (status === "loading") return <div className="events-loading" role="status">Finding the next good thing…</div>;
  if (status === "error") return <p className="events-load-error" role="status">{archived ? "The event archive is temporarily unavailable. Please check back soon." : "Upcoming events are temporarily unavailable. Please check back soon."}</p>;
  return (
    <>
      <EventsBoard
        events={compact ? events.slice(0, 2) : events}
        emptyTitle={archived ? <>The archive is<br /><em>just getting started.</em></> : undefined}
        emptyMessage={archived ? "Past events will live here after their dates have passed." : undefined}
      />
      {compact && total > 2 && <Link className="text-link events-see-all" href="/events">All upcoming events <ArrowUpRight size={15} /></Link>}
      {!compact && totalPages > 1 && (
        <nav className="event-pagination" aria-label={`${archived ? "Past" : "Upcoming"} event pages`}>
          <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} aria-label="Previous event page"><ArrowLeft size={16} /> Previous</button>
          <span>Page {page} of {totalPages} · {total} events</span>
          <button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page >= totalPages} aria-label="Next event page">Next <ArrowRight size={16} /></button>
        </nav>
      )}
    </>
  );
}
