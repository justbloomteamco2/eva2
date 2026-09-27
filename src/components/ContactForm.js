"use client";

import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { useToast } from "./ToastProvider";
import { readApiResponse } from "../lib/client-api";

const initialState = { name: "", email: "", organisation: "", message: "", category: "Brand partnership", website: "" };

export default function ContactForm({ category = "Brand partnership" }) {
  const notify = useToast();
  const [values, setValues] = useState({ ...initialState, category });
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  function update(event) {
    setValues((previous) => ({ ...previous, [event.target.name]: event.target.value }));
  }

  async function submit(event) {
    event.preventDefault();
    if (status === "sending") return;
    setStatus("sending");
    setMessage("");
    try {
      const response = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      });
      const result = await readApiResponse(response);
      if (!response.ok) throw new Error(result.error || "Something went wrong. Please try again.");
      setStatus("success");
      setMessage("Thank you. We’ll be in touch soon.");
      setValues({ ...initialState, category });
      notify("Your enquiry was sent. We’ll be in touch soon.");
    } catch (error) {
      const errorMessage = error.message || "We couldn’t send that just now. Please try again.";
      setStatus("error");
      setMessage(errorMessage);
      notify(errorMessage, "error");
    }
  }

  return (
    <form className="contact-form" onSubmit={submit} aria-describedby="form-status">
      <p className="contact-form__note">A few details to get the conversation started. We usually reply within two working days.</p>
      <div className="form-row">
        <label>Your name <span className="form-field__meta">Required</span><input required name="name" autoComplete="name" minLength={2} maxLength={100} placeholder="How should we address you?" value={values.name} onChange={update} /></label>
        <label>Email address <span className="form-field__meta">Required</span><input required type="email" name="email" autoComplete="email" maxLength={254} placeholder="you@company.com" value={values.email} onChange={update} /></label>
      </div>
      <div className="form-row">
        <label>Brand / organisation <span className="form-field__meta">Optional</span><input name="organisation" autoComplete="organization" maxLength={160} placeholder="Company, college or team" value={values.organisation} onChange={update} /></label>
        <label>I’m interested in <span className="form-field__meta">Required</span>
          <select required name="category" value={values.category} onChange={update}>
            <option>Brand partnership</option>
            <option>Event production</option>
            <option>Creator campaign</option>
            <option>Campus partnership</option>
            <option>Film / production enquiry</option>
            <option>Joining the network</option>
            <option>Something else</option>
          </select>
        </label>
      </div>
      <label>Tell us a little about it <span className="form-field__meta">Required · 10 characters minimum</span><textarea required name="message" rows={4} minLength={10} maxLength={4000} placeholder="What are you planning, and how can we help?" value={values.message} onChange={update} /></label>
      <label className="honeypot" aria-hidden="true">Leave this field empty<input name="website" tabIndex={-1} autoComplete="off" value={values.website} onChange={update} /></label>
      <div className="form-submit">
        <button className="button-link button-link--light" disabled={status === "sending"} type="submit">
          <span>{status === "sending" ? "Sending…" : "Send your enquiry"}</span><ArrowUpRight aria-hidden="true" size={17} />
        </button>
        <p id="form-status" role="status" className={`form-status form-status--${status}`}>{message}</p>
      </div>
    </form>
  );
}
