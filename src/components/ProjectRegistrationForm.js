"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, CheckCircle2, ShieldCheck, Upload } from "lucide-react";
import { readApiResponse } from "../lib/client-api";
import { useToast } from "./ToastProvider";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_ADDITIONAL_PHOTOS = 3;
const genderOptions = ["Female", "Male", "Non-binary", "Prefer not to say", "Other"];
const ifiCategories = ["Model", "Actor", "Creator", "Influencer", "Dancer", "Artist", "Performer", "Other"];
const meetupCategories = [
  "Content Creator", "Influencer", "Model", "Actor", "Dancer", "Singer", "Photographer",
  "Filmmaker", "Video Editor", "Graphic Designer", "Artist", "Host / Emcee",
  "Entrepreneur", "Other"
];
const collaborationOptions = [
  "Brand Collaborations", "Content Creation", "Photoshoots", "Reels", "Modelling",
  "Events", "Networking", "Film / Media Projects", "Influencer Campaigns", "Other"
];
const referralOptions = ["Instagram", "WhatsApp", "Friend / Creator", "Bardapure Productions", "Other"];

export default function ProjectRegistrationForm({ project }) {
  const isIfi = project === "ifi";
  const notify = useToast();
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [photoName, setPhotoName] = useState("");
  const [additionalPhotoNames, setAdditionalPhotoNames] = useState([]);
  const [registration, setRegistration] = useState(null);
  const latestIfiBirthDate = new Date();
  latestIfiBirthDate.setUTCFullYear(latestIfiBirthDate.getUTCFullYear() - 17);
  const maxIfiBirthDate = latestIfiBirthDate.toISOString().slice(0, 10);

  function validatePhoto(event, multiple = false) {
    const files = Array.from(event.target.files || []);
    const invalidSize = files.some((file) => file.size > MAX_IMAGE_BYTES);
    const tooMany = multiple && files.length > MAX_ADDITIONAL_PHOTOS;
    if (invalidSize || tooMany) {
      event.target.value = "";
      if (multiple) setAdditionalPhotoNames([]);
      else setPhotoName("");
      const error = tooMany
        ? `Choose no more than ${MAX_ADDITIONAL_PHOTOS} additional photos.`
        : "Each photo must be smaller than 5 MB.";
      notify(error, "error");
      return;
    }
    if (multiple) setAdditionalPhotoNames(files.map((file) => file.name));
    else setPhotoName(files[0]?.name || "");
  }

  async function submit(event) {
    event.preventDefault();
    if (status === "sending") return;
    setStatus("sending");
    setMessage("");
    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("project", project);
    formData.set("termsAccepted", formData.get("termsAccepted") ? "true" : "false");
    if (!isIfi && !formData.getAll("collaborationInterests").length) {
      const message = "Select at least one collaboration interest.";
      setStatus("error");
      setMessage(message);
      notify(message, "error");
      form.querySelector('[name="collaborationInterests"]')?.focus();
      return;
    }

    try {
      const response = await fetch("/api/project-registrations", { method: "POST", body: formData });
      const result = await readApiResponse(response);
      if (!response.ok) throw new Error(result.error || "We couldn’t save your registration.");
      setRegistration(result);
      setStatus("saved");
      if (isIfi) {
        setMessage(result.notificationPending
          ? "Your application is received. The fee is handled separately; its email notification is queued for retry."
          : "Your application is received. The registration fee is handled separately.");
        notify(result.notificationPending
          ? "IFI application received; email notification queued for retry."
          : "IFI application received.");
      } else {
        setMessage(result.notificationPending
          ? "Your registration is received. Keep your reference number; its email notification is queued for retry."
          : "Your Creator Meet-Up registration has been received. Keep your reference number for future updates.");
        notify(result.notificationPending
          ? "Creator Meet-Up registration received; email notification queued for retry."
          : "Creator Meet-Up registration received.");
      }
    } catch (error) {
      setStatus("error");
      setMessage(error.message || "We couldn’t save your registration. Please try again.");
      notify(error.message || "We couldn’t save your registration.", "error");
    }
  }

  const showForm = !registration;

  return (
    <div className="project-registration-wrap">
      <Link className="text-link project-registration__back" href="/creators"><ArrowLeft size={15} /> Back to creator projects</Link>
      {showForm ? (
        <form className="creator-form project-registration-form" onSubmit={submit} aria-describedby="project-registration-status">
          <div className="creator-form__intro">
            <h2>{isIfi ? "India’s Face Icon" : "Bardapure Creator"} <em>{isIfi ? "– IFI" : "Meet-Up"}</em></h2>
            <p>{isIfi
              ? "Your Face. Your Talent. Your Identity. A platform to discover and showcase emerging talent across India."
              : "Collaborate · Create · Grow. Meet creative people, find collaborators and make something together."}</p>
          </div>
          {isIfi && (
            <div className="registration-fee-note">
              <strong>Registration fee: ₹1,000</strong>
              <span>Payment is handled separately; it is not collected on this website.</span>
            </div>
          )}
          {isIfi ? (
            <section className="project-registration-benefits" aria-labelledby="ifi-benefits-title">
              <h3 id="ifi-benefits-title">What you get</h3>
              <ul>
                <li>Talent profile registration</li>
                <li>Opportunity to showcase your talent</li>
                <li>Networking opportunities</li>
                <li>Participation in IFI activities</li>
                <li>Potential shoots, events and brand collaborations</li>
                <li>Connection to a wider creative community</li>
              </ul>
            </section>
          ) : (
            <p className="project-registration-motto">No matter your follower count, your creativity matters.</p>
          )}
          <div className="creator-form__grid">
            <div className="creator-form__section-heading"><span>01 / Personal details</span><small>All fields marked required must be completed</small></div>
            <label>Full name <span className="form-field__meta">Required</span><input required name="fullName" autoComplete="name" minLength={2} maxLength={100} /></label>
            {isIfi && <label>Date of birth <span className="form-field__meta">Required · You must be older than 16</span><input required name="dateOfBirth" type="date" autoComplete="bday" max={maxIfiBirthDate} /></label>}
            {!isIfi && <label>Date of birth <span className="form-field__meta">Optional</span><input name="dateOfBirth" type="date" autoComplete="bday" /></label>}
            <label>Gender <span className="form-field__meta">Required</span><select required name="gender" defaultValue=""><option value="">Choose an option</option>{genderOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label>Mobile number <span className="form-field__meta">Required</span><input required name="phone" type="tel" autoComplete="tel" inputMode="tel" pattern="[0-9+() .-]{8,20}" maxLength={20} placeholder="+91 12345 67890" /></label>
            {!isIfi && <label>WhatsApp number <span className="form-field__meta">Required</span><input required name="whatsapp" type="tel" inputMode="tel" pattern="[0-9+() .-]{8,20}" maxLength={20} placeholder="+91 12345 67890" /></label>}
            <label>Email address <span className="form-field__meta">Required</span><input required name="email" type="email" autoComplete="email" maxLength={254} /></label>
            <label>City <span className="form-field__meta">Required</span><input required name="city" autoComplete="address-level2" minLength={2} maxLength={100} /></label>
            <label>State <span className="form-field__meta">Required</span><input required name="state" autoComplete="address-level1" minLength={2} maxLength={100} /></label>
            <div className="creator-form__section-heading"><span>02 / Your creative profile</span><small>Show us what makes your work yours</small></div>
            <label>Category <span className="form-field__meta">Required</span><select required name="category" defaultValue=""><option value="">Choose your category</option>{(isIfi ? ifiCategories : meetupCategories).map((item) => <option key={item}>{item}</option>)}</select></label>
            <label>Instagram {isIfi ? "profile" : "username / profile link"} <span className="form-field__meta">{isIfi ? "Optional" : "Required"}</span><input name="instagram" required={!isIfi} maxLength={300} placeholder="@yourhandle or profile URL" /></label>
            <label>{isIfi ? "YouTube / social profile" : "YouTube channel"} <span className="form-field__meta">Optional</span><input name="youtube" type="url" maxLength={500} placeholder="https://" /></label>
            {!isIfi && <label>Other social media links <span className="form-field__meta">Optional</span><input name="otherSocialMedia" maxLength={1000} placeholder="Add your other profile links" /></label>}
            <label className="creator-form__wide">Key skills / talent <span className="form-field__meta">Required</span><textarea required name="keySkills" minLength={2} maxLength={500} rows={3} placeholder="What do you create or do best?" /></label>
            <label className="creator-form__wide">{isIfi ? "About yourself" : "Tell us about yourself"} <span className="form-field__meta">{isIfi ? "Required · At least 30 characters" : "Optional"}</span><textarea name="about" required={isIfi} minLength={isIfi ? 30 : undefined} maxLength={2000} rows={4} placeholder="A little about you, your experience and what you’re looking for" /></label>
            {!isIfi && <label className="creator-form__wide">Portfolio / work link <span className="form-field__meta">Optional</span><input name="portfolio" type="url" maxLength={500} placeholder="https://" /></label>}

            <label className="creator-form__upload creator-form__wide">
              <span>Profile photo <span className="form-field__meta">Required · JPG, PNG or WebP · Up to 5 MB</span></span>
              <span className="creator-form__upload-control"><Upload size={17} /><span>{photoName || "Choose a clear profile photo"}</span></span>
              <input required name="profilePhoto" type="file" accept="image/jpeg,image/png,image/webp" aria-label="Profile photo" onChange={(event) => validatePhoto(event)} />
            </label>
            {isIfi && (
              <label className="creator-form__upload creator-form__wide">
                <span>Portfolio / additional photos <span className="form-field__meta">Optional · Up to 3 images · 5 MB each</span></span>
                <span className="creator-form__upload-control"><Upload size={17} /><span>{additionalPhotoNames.length ? additionalPhotoNames.join(", ") : "Choose up to 3 additional photos"}</span></span>
                <input name="additionalPhotos" type="file" accept="image/jpeg,image/png,image/webp" aria-label="Portfolio or additional photos" multiple onChange={(event) => validatePhoto(event, true)} />
              </label>
            )}
            {!isIfi && (
              <>
                <div className="creator-form__section-heading"><span>03 / Let’s collaborate</span><small>Help us shape a great meet-up</small></div>
                <label className="creator-form__wide">Creators you’d like to meet <span className="form-field__meta">Optional</span><textarea name="preferredCollaborators" maxLength={500} rows={2} placeholder="Who would you like to collaborate with?" /></label>
                <label>Preferred city <span className="form-field__meta">Required</span><input required name="preferredCity" minLength={2} maxLength={100} /></label>
                <label>Preferred meet-up date <span className="form-field__meta">Optional</span><input name="preferredMeetupDate" type="date" /></label>
                <label>How did you hear about us? <span className="form-field__meta">Optional</span><select name="heardFrom" defaultValue=""><option value="">Choose one</option>{referralOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
                <fieldset className="creator-interests creator-form__wide">
                  <legend>What are you interested in? <span>Required · Select at least one</span></legend>
                  <div className="creator-interests__options">
                    {collaborationOptions.map((item) => <label key={item}><input type="checkbox" name="collaborationInterests" value={item} /><span>{item}</span></label>)}
                  </div>
                </fieldset>
                <label className="creator-form__wide">Interested in future Bardapure projects? <span className="form-field__meta">Optional</span><select name="interestedInFuture" defaultValue=""><option value="">Choose one</option><option value="yes">Yes</option><option value="no">No</option></select></label>
              </>
            )}
          </div>
          <label className="honeypot" aria-hidden="true">Leave this field empty<input name="website" tabIndex={-1} autoComplete="off" /></label>
          <label className="project-registration__declaration">
            <input required name="termsAccepted" type="checkbox" />
            <span>{isIfi
                ? "I confirm that the information I provided is accurate and complete. I understand that the ₹1,000 registration fee is payable separately and is refundable subject to the IFI refund policy and eligibility conditions. I agree to the IFI Terms & Conditions and Privacy Policy."
              : "I confirm that the information provided is accurate. I agree to the Creator Meet-Up terms, event guidelines and privacy policy. I understand that registration does not guarantee brand collaborations, paid assignments, selection or other opportunities."}</span>
          </label>
          <div className="creator-form__submit">
            <button className="button-link button-link--dark" disabled={status === "sending"} type="submit">
              <span>{status === "sending" ? "Sending…" : isIfi ? "Save application" : "Register for Creator Meet-Up"}</span><ArrowUpRight size={17} />
            </button>
            <p id="project-registration-status" className={`creator-form__status creator-form__status--${status}`} role="status">{message}</p>
          </div>
          <p className="creator-form__privacy"><ShieldCheck size={14} aria-hidden="true" /> Your details and images are stored privately and used only to manage this project registration.</p>
        </form>
      ) : (
        <section className="project-registration-result" aria-live="polite">
          <CheckCircle2 size={36} aria-hidden="true" />
          <span className="eyebrow">{isIfi ? "IFI application received" : "You’re on the list"}</span>
          <h2>{isIfi ? "One step closer." : "See you there."}</h2>
          <p>{message}</p>
          <div className="project-registration-result__reference"><span>Application reference</span><strong>{registration.referenceNumber}</strong></div>
          {isIfi && <p className="registration-fee-note registration-fee-note--warning">Your application is recorded as awaiting payment. Payment is handled separately.</p>}
          <Link className="text-link" href="/creators">Explore the creator community <ArrowUpRight size={15} /></Link>
        </section>
      )}
    </div>
  );
}
