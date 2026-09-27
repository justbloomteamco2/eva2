"use client";

import { useState } from "react";
import { ArrowUpRight, Upload } from "lucide-react";
import { creatorCategories, creatorInterests } from "../data/content";
import { MAX_CREATOR_PHOTO_BYTES } from "../lib/upload-limits";

const emptyForm = {
  name: "",
  phone: "",
  email: "",
  city: "",
  age: "",
  category: "",
  instagram: "",
  portfolio: "",
  audienceSize: "",
  languages: "",
  skills: "",
  interests: [],
  website: ""
};

export default function CreatorRegistrationForm() {
  const [values, setValues] = useState(emptyForm);
  const [photo, setPhoto] = useState(null);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  function selectPhoto(event) {
    const selected = event.target.files?.[0] || null;
    setMessage("");
    if (selected && selected.size > MAX_CREATOR_PHOTO_BYTES) {
      event.target.value = "";
      setPhoto(null);
      setStatus("error");
      setMessage("Choose a profile photo smaller than 5 MB.");
      return;
    }
    setStatus("idle");
    setPhoto(selected);
  }

  function update(event) {
    const { name, value, checked } = event.target;
    setValues((previous) => {
      if (name === "interests") {
        const interests = checked
          ? [...previous.interests, value]
          : previous.interests.filter((interest) => interest !== value);
        return { ...previous, interests };
      }
      return { ...previous, [name]: value };
    });
  }

  async function submit(event) {
    event.preventDefault();
    if (status === "sending") return;
    const formElement = event.currentTarget;
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      if (key !== "interests") formData.append(key, value);
    });
    values.interests.forEach((interest) => formData.append("interests", interest));
    if (photo) formData.append("photo", photo);

    setStatus("sending");
    setMessage("");
    try {
      const response = await fetch("/api/creators", { method: "POST", body: formData });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "We couldn’t send your application.");
      setValues(emptyForm);
      setPhoto(null);
      formElement.reset();
      setStatus("success");
      setMessage("Welcome to the Bardapure Productions® Network! Your profile is in. We’ll reach out when relevant opportunities come up.");
    } catch (error) {
      setStatus("error");
      setMessage(error.message || "We couldn’t send your application. Please try again.");
    }
  }

  return (
    <form className="creator-form" onSubmit={submit} aria-describedby="creator-form-status">
      <div className="creator-form__intro">
        <h3>Tell us about <em>you.</em></h3>
        <p>Join free. Share a few details and the kinds of opportunities you’d like to hear about. Creator registration is for ages 18 and up.</p>
      </div>
      <div className="creator-form__grid">
        <label>Full name<input required name="name" autoComplete="name" minLength={2} maxLength={100} value={values.name} onChange={update} /></label>
        <label>Phone number<input required name="phone" type="tel" autoComplete="tel" pattern="[+0-9() .-]{8,20}" maxLength={20} value={values.phone} onChange={update} /></label>
        <label>Email address<input required name="email" type="email" autoComplete="email" maxLength={254} value={values.email} onChange={update} /></label>
        <label>City<input required name="city" autoComplete="address-level2" minLength={2} maxLength={100} value={values.city} onChange={update} /></label>
        <label>Age (18+)<input required name="age" type="number" min={18} max={100} inputMode="numeric" value={values.age} onChange={update} /></label>
        <label>Profession / category<select required name="category" value={values.category} onChange={update}><option value="">Choose your category</option>{creatorCategories.map((category) => <option key={category}>{category}</option>)}</select></label>
        <label>Instagram handle<input name="instagram" placeholder="@yourhandle" maxLength={80} value={values.instagram} onChange={update} /></label>
        <label>YouTube / portfolio link<input name="portfolio" type="url" placeholder="https://" maxLength={500} value={values.portfolio} onChange={update} /></label>
        <label>Followers / audience size<input name="audienceSize" placeholder="e.g. 12k or just getting started" maxLength={80} value={values.audienceSize} onChange={update} /></label>
        <label>Languages<input required name="languages" placeholder="e.g. Kannada, English, Hindi" maxLength={200} value={values.languages} onChange={update} /></label>
        <label className="creator-form__wide">Skills<input required name="skills" placeholder="What do you love to create?" maxLength={500} value={values.skills} onChange={update} /></label>
        <label className="creator-form__upload creator-form__wide">
          <span>Profile photo <small>JPG, PNG or WebP · Up to 5 MB</small></span>
          <span className="creator-form__upload-control"><Upload size={17} /><span>{photo ? photo.name : "Choose a photo"}</span></span>
          <input required name="photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={selectPhoto} />
        </label>
      </div>
      <fieldset className="creator-interests">
        <legend>I’m interested in <span>Select all that apply</span></legend>
        <div className="creator-interests__options">
          {creatorInterests.map((interest) => (
            <label key={interest}>
              <input type="checkbox" name="interests" value={interest} checked={values.interests.includes(interest)} onChange={update} />
              <span>{interest}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <label className="honeypot" aria-hidden="true">Leave this field empty<input name="website" tabIndex={-1} autoComplete="off" value={values.website} onChange={update} /></label>
      <div className="creator-form__submit">
        <button className="button-link button-link--dark" disabled={status === "sending"} type="submit"><span>{status === "sending" ? "Sending…" : "Submit & join"}</span><ArrowUpRight size={17} /></button>
        <p id="creator-form-status" className={`creator-form__status creator-form__status--${status}`} role="status">{message}</p>
      </div>
      <p className="creator-form__privacy">Your details and profile photo are stored privately. They’re only for Bardapure’s team to consider creator opportunities.</p>
    </form>
  );
}
