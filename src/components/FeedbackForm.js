"use client";

import { useState } from "react";
import { ArrowUpRight, Star } from "lucide-react";
import { useToast } from "./ToastProvider";
import { readApiResponse } from "../lib/client-api";
import FeedbackAttachments from "./FeedbackAttachments";

export default function FeedbackForm() {
  const notify = useToast();
  const [rating, setRating] = useState(0);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  async function submit(event) {
    event.preventDefault();
    if (status === "sending") return;
    const form = event.currentTarget;
    const formData = new FormData(form);
    const values = Object.fromEntries(formData.entries());
    if (String(values.what_went_well || "").trim().length < 10
      && String(values.what_to_improve || "").trim().length < 10) {
      setStatus("error");
      setMessage("Please share at least one note of 10 characters or more.");
      notify("Please share at least one note of 10 characters or more.", "error");
      return;
    }
    setStatus("sending");
    setMessage("");
    try {
      formData.set("rating", String(rating));
      const response = await fetch("/api/feedback", {
        method: "POST",
        body: formData
      });
      const result = await readApiResponse(response);
      if (!response.ok) throw new Error(result.error || "We couldn’t send your feedback.");
      form.reset();
      setRating(0);
      setStatus("success");
      setMessage(result.notificationPending
        ? "Thanks for your feedback. It was saved, and its email notification is queued for retry."
        : "Thanks for being there. Your feedback has been received.");
      notify(result.notificationPending
        ? "Feedback saved. Email delivery is queued for retry."
        : "Thanks—your event feedback was received.");
    } catch (error) {
      setStatus("error");
      const errorMessage = error.message || "We couldn’t send your feedback. Please try again.";
      setMessage(errorMessage);
      notify(errorMessage, "error");
    }
  }

  return (
    <form className="feedback-form" onSubmit={submit} aria-describedby="feedback-status">
      <div className="feedback-form__fields">
        <label>Event name <span className="form-field__meta">Required</span><input name="event" required minLength={2} maxLength={200} placeholder="Which Bardapure event did you attend?" /></label>
        <label>When did you attend? <span className="form-field__meta">Optional</span><input name="event_date" type="date" /></label>
        <label>Your name <span className="form-field__meta">Optional</span><input name="name" minLength={2} maxLength={100} autoComplete="name" placeholder="Leave blank to share anonymously" /></label>
        <label>Email for a follow-up <span className="form-field__meta">Optional</span><input name="attendee_email" type="email" maxLength={254} autoComplete="email" placeholder="Only if you’d like us to get back to you" /></label>
        <fieldset className="feedback-rating">
          <legend>How was the event? <span className="form-field__meta">Required</span></legend>
          <div role="group" aria-label="Rating from 1 to 5 stars" aria-describedby="rating-help">
            {[1, 2, 3, 4, 5].map((value) => (
              <button key={value} type="button" aria-pressed={rating === value} aria-label={`${value} ${value === 1 ? "star" : "stars"}`} onClick={() => setRating(value)}>
                <Star size={22} fill={value <= rating ? "currentColor" : "none"} />
              </button>
            ))}
          </div>
          <span id="rating-help" className="feedback-rating__hint">{rating ? `${rating} out of 5 selected` : "Choose a rating"}</span>
        </fieldset>
        <label>Would you attend another? <span className="form-field__meta">Required</span>
          <select name="would_attend_again" required defaultValue="">
            <option value="" disabled>Choose one</option>
            <option value="yes">Yes, definitely</option>
            <option value="maybe">Maybe</option>
            <option value="no">Not this kind of event</option>
          </select>
        </label>
        <label>What did you enjoy most? <span className="form-field__meta">Optional</span><textarea name="what_went_well" maxLength={900} rows={3} placeholder="The moments, people or details that stood out." /></label>
        <label className="feedback-form__message">What could we improve? <span className="form-field__meta">Share at least one note · 10 characters minimum</span><textarea name="what_to_improve" maxLength={900} rows={3} placeholder="Tell us how we could make a future event better." /></label>
        <FeedbackAttachments />
        <label className="honeypot" aria-hidden="true">Leave empty<input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <div className="feedback-form__submit">
        <button className="button-link button-link--dark" disabled={status === "sending" || rating === 0} type="submit"><span>{status === "sending" ? "Sending…" : "Send event feedback"}</span><ArrowUpRight size={17} /></button>
        <p id="feedback-status" className={`feedback-form__status feedback-form__status--${status}`} role="status">{message}</p>
      </div>
      <p className="feedback-form__privacy">Your name and email are optional. Feedback is shared privately with the Bardapure team to help improve future events.</p>
    </form>
  );
}
