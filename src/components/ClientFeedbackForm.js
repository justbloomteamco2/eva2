"use client";

import { useState } from "react";
import { ArrowUpRight, CheckCircle2, Star } from "lucide-react";
import { readApiResponse } from "../lib/client-api";
import { useToast } from "./ToastProvider";
import FeedbackAttachments from "./FeedbackAttachments";

export default function ClientFeedbackForm() {
  const notify = useToast();
  const [rating, setRating] = useState(0);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  async function submit(event) {
    event.preventDefault();
    if (status === "sending") return;
    if (!rating) {
      setStatus("error");
      setMessage("Choose a rating before sending your feedback.");
      notify("Choose a rating before sending your feedback.", "error");
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("type", "client");
    formData.set("rating", String(rating));
    setStatus("sending");
    setMessage("");
    try {
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
        ? "Thank you—your feedback is saved and its notification is queued."
        : "Thank you—your feedback has been received.");
      notify("Your feedback has been received.");
    } catch (error) {
      setStatus("error");
      setMessage(error.message || "We couldn’t send your feedback. Please try again.");
      notify(error.message || "We couldn’t send your feedback.", "error");
    }
  }

  return (
    <form className="feedback-form client-feedback-form" onSubmit={submit} aria-describedby="client-feedback-status">
      <div className="feedback-form__fields">
        <label>Your name <span className="form-field__meta">Required</span><input name="name" required minLength={2} maxLength={100} autoComplete="name" /></label>
        <label>Project / service <span className="form-field__meta">Required</span><input name="client_project" required minLength={2} maxLength={160} placeholder="What did we work on together?" /></label>
        <label>Email <span className="form-field__meta">Add email or phone</span><input name="attendee_email" type="email" maxLength={254} autoComplete="email" /></label>
        <label>Phone <span className="form-field__meta">Add email or phone</span><input name="attendee_phone" type="tel" inputMode="tel" autoComplete="tel" maxLength={20} placeholder="+91 12345 67890" /></label>
        <fieldset className="feedback-rating">
          <legend>How was working with us? <span className="form-field__meta">Required</span></legend>
          <div role="group" aria-label="Rating from 1 to 5 stars" aria-describedby="client-rating-help">
            {[1, 2, 3, 4, 5].map((value) => (
              <button key={value} type="button" aria-pressed={rating === value} aria-label={`${value} ${value === 1 ? "star" : "stars"}`} onClick={() => setRating(value)}>
                <Star size={22} fill={value <= rating ? "currentColor" : "none"} />
              </button>
            ))}
          </div>
          <span id="client-rating-help" className="feedback-rating__hint">{rating ? `${rating} out of 5 selected` : "Choose a rating"}</span>
        </fieldset>
        <label className="feedback-form__message">Your feedback <span className="form-field__meta">Required · 10 characters minimum</span><textarea name="client_feedback" required minLength={10} maxLength={2000} rows={5} placeholder="What worked well, and what could we do better?" /></label>
        <FeedbackAttachments />
        <label className="honeypot" aria-hidden="true">Leave empty<input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <div className="feedback-form__submit">
        <button className="button-link button-link--dark" disabled={status === "sending"} type="submit">
          <span>{status === "sending" ? "Sending…" : "Send client feedback"}</span><ArrowUpRight size={17} />
        </button>
        <p id="client-feedback-status" className={`feedback-form__status feedback-form__status--${status}`} role="status">
          {status === "success" && <CheckCircle2 size={15} aria-hidden="true" />} {message}
        </p>
      </div>
      <p className="feedback-form__privacy">We only ask for one contact method so our team can follow up if needed. Your feedback is shared privately with Bardapure.</p>
    </form>
  );
}
