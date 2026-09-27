"use client";

import { useState } from "react";
import { ArrowUpRight } from "lucide-react";

const initialState = { name: "", email: "", organisation: "", message: "", category: "Brand partnership", website: "" };

export default function ContactForm({ category = "Brand partnership" }) {
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
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Something went wrong. Please try again.");
      setStatus("success");
      setMessage("Thank you. We’ll be in touch soon.");
      setValues({ ...initialState, category });
    } catch (error) {
      setStatus("error");
      setMessage(error.message || "We couldn’t send that just now. Please try again.");
    }
  }

  return (
    <form className="contact-form" onSubmit={submit} aria-describedby="form-status">
      <div className="form-row">
        <label>Your name<input required name="name" autoComplete="name" minLength={2} maxLength={100} value={values.name} onChange={update} /></label>
        <label>Email address<input required type="email" name="email" autoComplete="email" maxLength={254} value={values.email} onChange={update} /></label>
      </div>
      <div className="form-row">
        <label>Brand / organisation<input name="organisation" autoComplete="organization" maxLength={160} value={values.organisation} onChange={update} /></label>
        <label>I’m interested in
          <select name="category" value={values.category} onChange={update}>
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
      <label>Tell us a little about it<textarea required name="message" rows={4} minLength={10} maxLength={4000} value={values.message} onChange={update} /></label>
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
