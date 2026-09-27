"use client";

import { useState } from "react";
import { ArrowUpRight, Star } from "lucide-react";

export default function FeedbackForm() {
  const [rating, setRating] = useState(0);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  async function submit(event) {
    event.preventDefault();
    if (status === "sending") return;
    const form = event.currentTarget;
    const formData = new FormData(form);
    const values = Object.fromEntries(formData.entries());
    setStatus("sending");
    setMessage("");
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, rating })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "We couldn’t send your feedback.");
      form.reset();
      setRating(0);
      setStatus("success");
      setMessage("Thanks for being there. Your feedback has been received.");
    } catch (error) {
      setStatus("error");
      setMessage(error.message || "We couldn’t send your feedback. Please try again.");
    }
  }

  return (
    <form className="feedback-form" onSubmit={submit} aria-describedby="feedback-status">
      <div className="feedback-form__fields">
        <label>Your name <span className="form-field__meta">Required</span><input name="name" required minLength={2} maxLength={100} autoComplete="name" placeholder="Your name" /></label>
        <label>Event attended <span className="form-field__meta">Required</span><input name="event" required minLength={2} maxLength={200} placeholder="Event or campaign name" /></label>
        <fieldset className="feedback-rating">
          <legend>Your rating <span className="form-field__meta">Required</span></legend>
          <div role="group" aria-label="Rating from 1 to 5 stars" aria-describedby="rating-help">
            {[1, 2, 3, 4, 5].map((value) => (
              <button key={value} type="button" aria-pressed={rating === value} aria-label={`${value} ${value === 1 ? "star" : "stars"}`} onClick={() => setRating(value)}>
                <Star size={22} fill={value <= rating ? "currentColor" : "none"} />
              </button>
            ))}
          </div>
          <span id="rating-help" className="feedback-rating__hint">{rating ? `${rating} out of 5 selected` : "Choose a rating"}</span>
        </fieldset>
        <label className="feedback-form__message">A quick note <span className="form-field__meta">Required · At least 10 characters</span><textarea name="message" required minLength={10} maxLength={2000} rows={3} placeholder="What stood out? Your note helps us make the next one even better." /></label>
        <label className="honeypot" aria-hidden="true">Leave empty<input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <div className="feedback-form__submit">
        <button className="button-link button-link--dark" disabled={status === "sending" || rating === 0} type="submit"><span>{status === "sending" ? "Sending…" : "Share feedback"}</span><ArrowUpRight size={17} /></button>
        <p id="feedback-status" className={`feedback-form__status feedback-form__status--${status}`} role="status">{message}</p>
      </div>
    </form>
  );
}
