"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, CalendarDays, ImagePlus, LockKeyhole, LogOut, Pencil, Plus, Trash2, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { MAX_EVENT_POSTER_BYTES } from "../lib/upload-limits";

const EVENT_DRAFT_STORAGE_KEY = "bardapure-admin-event-draft";
const EVENT_DRAFT_EXPIRED_KEY = "bardapure-admin-event-draft-expired";
const blankEvent = {
  title: "",
  date: "",
  city: "",
  description: "",
  registration_type: "free",
  registration_link: "",
  status: "draft"
};

export default function AdminDashboard() {
  const [events, setEvents] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [values, setValues] = useState(blankEvent);
  const [poster, setPoster] = useState(null);
  const [posterPreview, setPosterPreview] = useState(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);

  const loadEvents = useCallback(async (requestedPage = 1) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/events?page=${requestedPage}`, { cache: "no-store" });
      const result = await response.json();
      if (response.status === 401) {
        try {
          sessionStorage.setItem(EVENT_DRAFT_EXPIRED_KEY, "1");
        } catch (storageError) {
          console.error("Could not preserve the admin draft expiry state:", storageError.message);
        }
        window.location.assign("/admin/login?expired=1");
        return;
      }
      if (!response.ok) throw new Error(result.error || "Could not load event plans.");
      setEvents(result.events || []);
      setTotal(result.total || 0);
      setTotalPages(Math.max(1, result.totalPages || 1));
      setPage(Math.min(requestedPage, Math.max(1, result.totalPages || 1)));
    } catch (err) {
      setError(err.message || "Could not load event plans.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let draft;
    try {
      draft = sessionStorage.getItem(EVENT_DRAFT_STORAGE_KEY);
      if (draft) {
        const parsed = JSON.parse(draft);
        if (parsed && typeof parsed === "object" && parsed.values && typeof parsed.values === "object") {
          const restoredValues = { ...blankEvent, ...parsed.values };
          const restoredEditing = typeof parsed.editing === "string" ? parsed.editing : null;
          if (restoredEditing || Object.values(restoredValues).some(Boolean)) {
            setValues(restoredValues);
            setEditing(restoredEditing);
            setNotice("Your unsaved event details were restored. Re-select any poster file before saving.");
          }
        }
      }
    } catch (storageError) {
      console.error("Could not restore the admin event draft:", storageError.message);
      setError("A saved event draft could not be restored.");
    }
    try {
      if (sessionStorage.getItem(EVENT_DRAFT_EXPIRED_KEY)) {
        sessionStorage.removeItem(EVENT_DRAFT_EXPIRED_KEY);
        setNotice("Your admin session expired. Sign in again to continue with the restored event details.");
      }
    } catch (storageError) {
      console.error("Could not read the admin session expiry state:", storageError.message);
    }
    setDraftRestored(true);
  }, []);

  useEffect(() => {
    if (!draftRestored) return;
    try {
      if (editing || Object.values(values).some(Boolean)) {
        sessionStorage.setItem(EVENT_DRAFT_STORAGE_KEY, JSON.stringify({ editing, values }));
      } else {
        sessionStorage.removeItem(EVENT_DRAFT_STORAGE_KEY);
      }
    } catch (storageError) {
      console.error("Could not save the admin event draft:", storageError.message);
      setError("Draft autosave is unavailable in this browser tab. Keep this page open until the event is saved.");
    }
  }, [draftRestored, editing, values]);

  useEffect(() => { loadEvents(page); }, [loadEvents, page]);

  useEffect(() => {
    if (!poster) {
      setPosterPreview(null);
      return undefined;
    }
    const previewUrl = URL.createObjectURL(poster);
    setPosterPreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [poster]);

  function startCreate() {
    setEditing(null);
    setValues({ ...blankEvent, date: "" });
    setPoster(null);
    try {
      sessionStorage.removeItem(EVENT_DRAFT_STORAGE_KEY);
    } catch (storageError) {
      console.error("Could not clear the saved admin event draft:", storageError.message);
    }
    setNotice("");
    setError("");
  }

  function startEdit(event) {
    setEditing(event.id);
    setValues({
      title: event.title,
      date: event.date,
      city: event.city,
      description: event.description,
      registration_type: event.registration_type,
      registration_link: event.registration_link || "",
      status: event.status
    });
    setPoster(null);
    setNotice("");
    setError("");
    document.getElementById("event-editor")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function update(event) {
    setValues((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function selectPoster(event) {
    const selected = event.target.files?.[0] || null;
    setError("");
    if (selected && selected.size > MAX_EVENT_POSTER_BYTES) {
      event.target.value = "";
      setPoster(null);
      setError("Choose an event poster smaller than 8 MB.");
      return;
    }
    setPoster(selected);
  }

  function preserveDraft() {
    try {
      sessionStorage.setItem(EVENT_DRAFT_STORAGE_KEY, JSON.stringify({ editing, values }));
    } catch (storageError) {
      console.error("Could not preserve the admin event draft:", storageError.message);
      setError("Draft autosave is unavailable in this browser tab. Keep this page open until the event is saved.");
    }
  }

  function redirectAfterSessionExpiry() {
    try {
      sessionStorage.setItem(EVENT_DRAFT_EXPIRED_KEY, "1");
    } catch (storageError) {
      console.error("Could not preserve the admin draft expiry state:", storageError.message);
    }
    window.location.assign("/admin/login?expired=1");
  }

  async function submit(event) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    setNotice("");
    preserveDraft();
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => formData.append(key, value));
    if (poster) formData.append("poster", poster);
    const url = editing ? `/api/admin/events/${editing}` : "/api/admin/events";
    const method = editing ? "PATCH" : "POST";
    try {
      const response = await fetch(url, { method, body: formData });
      const result = await response.json();
      if (response.status === 401) {
        redirectAfterSessionExpiry();
        return;
      }
      if (!response.ok) throw new Error(result.error || "Could not save this event.");
      const savedMessage = editing ? "Event plan updated." : "Event plan created.";
      startCreate();
      setNotice(savedMessage);
      await loadEvents(page);
    } catch (err) {
      setError(err.message || "Could not save this event.");
    } finally {
      setSaving(false);
    }
  }

  async function removeEvent(event) {
    if (!window.confirm(`Delete “${event.title}”? This action cannot be undone.`)) return;
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/admin/events/${event.id}`, { method: "DELETE" });
      const result = await response.json();
      if (response.status === 401) {
        redirectAfterSessionExpiry();
        return;
      }
      if (!response.ok) throw new Error(result.error || "Could not delete this event.");
      setNotice("Event plan deleted.");
      await loadEvents(page);
    } catch (err) {
      setError(err.message || "Could not delete this event.");
    }
  }

  async function logout() {
    try {
      sessionStorage.removeItem(EVENT_DRAFT_STORAGE_KEY);
      sessionStorage.removeItem(EVENT_DRAFT_EXPIRED_KEY);
      await fetch("/api/admin/logout", { method: "POST" });
    } finally {
      window.location.assign("/admin/login");
    }
  }

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <Link className="wordmark wordmark--footer" href="/"><span>BARDAPURE</span><span>PRODUCTIONS<sup>®</sup></span></Link>
        <span className="admin-header__label"><LockKeyhole size={15} /> Admin workspace</span>
        <button className="admin-logout" type="button" onClick={logout}>Log out <LogOut size={15} /></button>
      </header>
      <main className="admin-main">
        <div className="admin-heading">
          <div><span className="eyebrow">Private workspace / Event plans</span><h1>Make a date<br /><em>with the future.</em></h1></div>
          <button className="button-link button-link--dark" type="button" onClick={startCreate}><span>New event plan</span><Plus size={17} /></button>
        </div>
        {(notice || error) && <p className={`admin-notice${error ? " admin-notice--error" : ""}`} role={error ? "alert" : "status"}>{error || notice}</p>}
        <section className="admin-event-table" aria-labelledby="plans-title">
          <div className="admin-list-heading"><h2 id="plans-title"><CalendarDays size={18} /> Your event plans</h2><span>{total} total</span></div>
          {loading ? <p className="admin-empty" role="status">Loading plans…</p> : events.length === 0 ? <p className="admin-empty">No plans yet. Draft the next one below.</p> : (
            <div className="admin-events">
              {events.map((event) => (
                <article className="admin-event-row" key={event.id}>
                  <div className="admin-event-row__date"><span>{new Date(`${event.date}T12:00:00`).toLocaleDateString("en-IN", { day: "2-digit" })}</span><small>{new Date(`${event.date}T12:00:00`).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</small></div>
                  {event.poster_url ? <Image className="admin-event-row__poster" src={event.poster_url} alt="" width={54} height={54} unoptimized /> : <span className="admin-event-row__poster admin-event-row__placeholder"><CalendarDays size={19} /></span>}
                  <div className="admin-event-row__copy"><strong>{event.title}</strong><span>{event.city} · {event.registration_type}</span></div>
                  <span className={`admin-status admin-status--${event.status}`}>{event.status}</span>
                  <div className="admin-event-row__actions"><button type="button" aria-label={`Edit ${event.title}`} onClick={() => startEdit(event)}><Pencil size={16} /></button><button type="button" aria-label={`Delete ${event.title}`} onClick={() => removeEvent(event)}><Trash2 size={16} /></button></div>
                </article>
              ))}
            </div>
          )}
          {!loading && totalPages > 1 && <nav className="event-pagination admin-pagination" aria-label="Event plan pages">
            <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} aria-label="Previous event page"><ArrowLeft size={16} /> Previous</button>
            <span>Page {page} of {totalPages}</span>
            <button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page >= totalPages} aria-label="Next event page">Next <ArrowRight size={16} /></button>
          </nav>}
        </section>
        <section className="admin-editor" id="event-editor" aria-labelledby="editor-title">
          <div className="admin-editor__heading"><div><span className="eyebrow">{editing ? "Edit plan" : "Build a plan"}</span><h2 id="editor-title">{editing ? "Shape the details." : "What’s next?"}</h2></div>{editing && <button className="admin-cancel" type="button" onClick={startCreate}><X size={16} /> Cancel edit</button>}</div>
          <form className="admin-event-form" onSubmit={submit}>
            <div className="admin-event-form__section"><span>01 / The details</span><small>Set the scene for your event</small></div>
            <label>Event title <span className="form-field__meta">Required</span><input required name="title" minLength={2} maxLength={140} placeholder="Give your event a name" value={values.title} onChange={update} /></label>
            <label>Date <span className="form-field__meta">Required</span><input required type="date" name="date" value={values.date} onChange={update} /><span className="admin-field-note">Past events are kept in the archive.</span></label>
            <label>City <span className="form-field__meta">Required</span><input required name="city" minLength={2} maxLength={100} placeholder="Where it’s happening" value={values.city} onChange={update} /></label>
            <label className="admin-event-form__wide">Description <span className="form-field__meta">Required</span><textarea required name="description" minLength={5} maxLength={2000} rows={4} placeholder="A short description for guests. Include what they can expect." value={values.description} onChange={update} /></label>
            <label className="admin-event-form__wide admin-event-form__poster">Event poster <span className="form-field__meta">{editing ? "Optional · Replace the current poster" : "Required"}</span><span className="admin-field-note">JPG, PNG or WebP · Up to 8 MB</span><span className="admin-upload"><ImagePlus size={18} /><span>{poster ? `${poster.name} · ${(poster.size / (1024 * 1024)).toFixed(1)} MB` : editing ? "Choose a new poster" : "Choose a poster to upload"}</span><input aria-label="Event poster" required={!editing} type="file" accept="image/jpeg,image/png,image/webp" onChange={selectPoster} /></span>{(posterPreview || (editing && events.find((event) => event.id === editing)?.poster_url)) && <Image className="admin-poster-preview" src={posterPreview || events.find((event) => event.id === editing)?.poster_url} alt="Selected event poster preview" width={240} height={160} unoptimized />}</label>
            <div className="admin-event-form__section"><span>02 / Guest access</span><small>Make it easy to know how to join</small></div>
            <fieldset className="admin-choice"><legend>Registration</legend><label><input type="radio" name="registration_type" value="free" checked={values.registration_type === "free"} onChange={update} /> Free</label><label><input type="radio" name="registration_type" value="paid" checked={values.registration_type === "paid"} onChange={update} /> Paid</label></fieldset>
            <label>Registration link <span className="form-field__meta">{values.registration_type === "paid" ? "Required for paid events" : "Optional"}</span><input type="url" name="registration_link" required={values.registration_type === "paid"} placeholder="https://your-registration-page.com" maxLength={2048} value={values.registration_link} onChange={update} /></label>
            <div className="admin-event-form__section"><span>03 / Publishing</span><small>Keep a draft or share it with everyone</small></div>
            <fieldset className="admin-choice"><legend>Publishing</legend><label><input type="radio" name="status" value="draft" checked={values.status === "draft"} onChange={update} /> Draft</label><label><input type="radio" name="status" value="published" checked={values.status === "published"} onChange={update} /> Published</label></fieldset>
            <div className="admin-event-form__wide admin-save"><button className="button-link button-link--dark" type="submit" disabled={saving}><span>{saving ? "Saving…" : editing ? "Save changes" : "Create event plan"}</span><ArrowUpRight size={17} /></button>{editing && <button className="admin-cancel" type="button" onClick={startCreate}>Start a new plan</button>}</div>
          </form>
        </section>
      </main>
    </div>
  );
}
