"use client";

import { useEffect, useMemo, useState } from "react";
import { Heart, MessageCircle } from "lucide-react";
import { readApiResponse } from "../lib/client-api";

const PREFERENCE_KEY = "bardapure-community-review-category";

function formatReviewTime(review) {
  if (review.isSample) return "Sample";
  const createdAt = new Date(review.createdAt);
  if (Date.now() - createdAt.getTime() < 60_000) return "Just Now";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(createdAt);
}

export default function CommunityReviews() {
  const [reviews, setReviews] = useState([]);
  const [likedIds, setLikedIds] = useState([]);
  const [pinnedId, setPinnedId] = useState("");
  const [preferredCategory, setPreferredCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pendingLikeId, setPendingLikeId] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    try {
      setPreferredCategory(window.localStorage.getItem(PREFERENCE_KEY) || "");
    } catch (error) {
      console.error("Community review preference could not be read:", error);
    }

    async function loadReviews() {
      try {
        const response = await fetch("/api/community-reviews", { cache: "no-store" });
        const result = await readApiResponse(response);
        if (!response.ok) throw new Error(result.error || "Reviews are temporarily unavailable.");
        setReviews(result.reviews);
        setLikedIds(result.likedIds);
        setPinnedId(result.likedIds[0] || "");
      } catch (error) {
        setStatus(error.message || "Reviews are temporarily unavailable.");
      } finally {
        setLoading(false);
      }
    }
    loadReviews();
  }, []);

  const sortedReviews = useMemo(() => [...reviews].sort((first, second) => {
    if (first.id === pinnedId) return -1;
    if (second.id === pinnedId) return 1;
    if (preferredCategory && first.category === preferredCategory && second.category !== preferredCategory) return -1;
    if (preferredCategory && second.category === preferredCategory && first.category !== preferredCategory) return 1;
    return second.createdAt.localeCompare(first.createdAt) || second.likes - first.likes;
  }), [pinnedId, preferredCategory, reviews]);

  async function submitReview(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const body = {
      name: String(formData.get("name") || ""),
      city: String(formData.get("city") || ""),
      category: String(formData.get("category") || ""),
      quote: String(formData.get("review") || "")
    };
    setSubmitting(true);
    setStatus("");

    try {
      const response = await fetch("/api/community-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const result = await readApiResponse(response);
      if (!response.ok) throw new Error(result.error || "We couldn’t save your review.");
      setReviews((current) => [result.review, ...current]);
      setPinnedId(result.review.id);
      setPreferredCategory(result.review.category);
      try {
        window.localStorage.setItem(PREFERENCE_KEY, result.review.category);
      } catch (error) {
        console.error("Community review preference could not be saved:", error);
      }
      setStatus("Thanks for sharing — your review is now at the top.");
      form.reset();
    } catch (error) {
      setStatus(error.message || "We couldn’t save your review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function likeReview(review) {
    if (likedIds.includes(review.id) || pendingLikeId) return;
    setPendingLikeId(review.id);
    setStatus("");
    try {
      const response = await fetch(`/api/community-reviews/${review.id}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}"
      });
      const result = await readApiResponse(response);
      if (!response.ok) throw new Error(result.error || "We couldn’t like this review.");
      setReviews((current) => current.map((item) => item.id === review.id
        ? { ...item, likes: result.likes }
        : item));
      setLikedIds((current) => current.includes(review.id) ? current : [...current, review.id]);
      setPinnedId(review.id);
      setPreferredCategory(review.category);
      try {
        window.localStorage.setItem(PREFERENCE_KEY, review.category);
      } catch (error) {
        console.error("Community review preference could not be saved:", error);
      }
    } catch (error) {
      setStatus(error.message || "We couldn’t like this review. Please try again.");
    } finally {
      setPendingLikeId("");
    }
  }

  return (
    <section className="testimonials section-pad" id="community-reviews" aria-labelledby="community-reviews-title">
      <div className="route-heading">
        <div>
          <span className="eyebrow">Community / Reviews</span>
          <h2 id="community-reviews-title">Stories from the<br /><em>creative community.</em></h2>
        </div>
      </div>
      <p className="community-reviews__notice">The five initial entries are sample reviews. New reviews and likes are shared with the community; category preferences are saved in this browser.</p>
      <form className="community-review-form" onSubmit={submitReview}>
        <h3>Share your experience</h3>
        <div className="community-review-form__fields">
          <label>Your name<input required name="name" minLength={2} maxLength={80} autoComplete="name" /></label>
          <label>City<input required name="city" minLength={2} maxLength={80} autoComplete="address-level2" /></label>
          <label>What is it about?<select name="category" defaultValue="Community">
            <option>Community</option>
            <option>Photography</option>
            <option>Events</option>
            <option>Talent</option>
          </select></label>
          <label className="community-review-form__wide">Your review<textarea required name="review" minLength={5} maxLength={500} rows={3} /></label>
        </div>
        <button className="button button--dark community-review-form__submit" type="submit" disabled={submitting}>
          {submitting ? "Posting…" : "Post review"}
        </button>
        <p className="community-review-form__status" aria-live="polite">{status}</p>
      </form>
      <div className="community-notes" aria-live="polite">
        {loading && <p className="community-reviews__loading">Loading community reviews…</p>}
        {!loading && sortedReviews.map((review, index) => (
          <article className={`community-note community-note--${index % 2 ? 2 : 1}`} key={review.id}>
            <span className="community-note__meta"><MessageCircle size={16} /> {review.name} · {review.city} · {formatReviewTime(review)}</span>
            <blockquote>{review.quote}</blockquote>
            <span className="community-note__category">{review.category}</span>
            <button
              className={`community-note__like${likedIds.includes(review.id) ? " is-liked" : ""}`}
              type="button"
              aria-pressed={likedIds.includes(review.id)}
              aria-label={`${likedIds.includes(review.id) ? "Liked" : "Like"} ${review.name}'s review`}
              disabled={likedIds.includes(review.id) || Boolean(pendingLikeId)}
              onClick={() => likeReview(review)}
            >
              <Heart size={16} fill={likedIds.includes(review.id) ? "currentColor" : "none"} />
              <span>{review.likes}</span>
            </button>
            <span className="community-note__tail" aria-hidden="true" />
          </article>
        ))}
      </div>
    </section>
  );
}
