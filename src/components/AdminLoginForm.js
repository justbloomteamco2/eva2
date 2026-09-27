"use client";

import { useState } from "react";
import { ArrowUpRight, LockKeyhole } from "lucide-react";

export default function AdminLoginForm({ configured, sessionExpired = false }) {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    if (status === "sending") return;
    setStatus("sending");
    setError("");
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Sign-in failed.");
      window.location.assign("/admin/dashboard");
    } catch (err) {
      setStatus("error");
      setError(err.message || "Sign-in failed. Please try again.");
    }
  }

  return (
    <form className="admin-login" onSubmit={submit}>
      <div className="admin-login__mark"><LockKeyhole size={22} /></div>
      <span className="eyebrow">Private workspace</span>
      <h1>Welcome<br /><em>back.</em></h1>
      {sessionExpired && <p className="admin-form-hint" role="status">Your session expired. Sign in to continue; your event details are saved in this tab.</p>}
      <label>Admin username<input name="username" autoComplete="username" required maxLength={100} /></label>
      <label>Password<input name="password" type="password" autoComplete="current-password" required maxLength={256} /></label>
      {!configured && <p className="admin-form-hint" role="status">Admin sign-in is not configured on this server yet.</p>}
      {error && <p role="alert" className="admin-form-error">{error}</p>}
      <button className="button-link button-link--dark" type="submit" disabled={!configured || status === "sending"}><span>{status === "sending" ? "Signing in…" : "Sign in securely"}</span><ArrowUpRight size={17} /></button>
    </form>
  );
}
