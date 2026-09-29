"use client";

import { useEffect, useMemo, useState } from "react";
import { Heart, MessageCircle } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { readApiResponse } from "../lib/client-api";

const PREFERENCE_KEY = "bardapure-community-review-category";
const reviewCategories = ["All", "Community", "Photography", "Events", "Talent"];

function formatReviewTime(review) {
  if (review.isSample) return "Sample";
  const createdAt = new Date(review.createdAt);
  if (Date.now() - createdAt.getTime() < 60_000) return "Just Now";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(createdAt);
}

function mapRealtimeReview(row) {
  return {
    id: row.id,
    name: row.name,
    city: row.city,
    category: row.category,
    quote: row.quote,
    likes: row.likes,
    createdAt: row.created_at,
    isSample: row.is_sample,
    replies: []
  };
}

function mapRealtimeReply(row) {
  return {
    id: row.id,
    reviewId: row.review_id,
    name: row.name,
    replyText: row.reply_text,
    createdAt: row.created_at
  };
}

export default function CommunityReviews() {
  const [reviews, setReviews] = useState([]);
  const [likedIds, setLikedIds] = useState([]);
  const [pinnedId, setPinnedId] = useState("");
  const [preferredCategory, setPreferredCategory] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pendingLikeId, setPendingLikeId] = useState("");
  const [status, setStatus] = useState("");
  const [liveStatus, setLiveStatus] = useState("Connecting to live reviews…");
  const [replyStatus, setReplyStatus] = useState({});
  const [pendingReplies, setPendingReplies] = useState({});

  useEffect(() => {
    let cancelled = false;
    let supabase;
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
    async function subscribeToLiveChanges() {
      try {
        const response = await fetch("/api/community-reviews/realtime-config", { cache: "no-store" });
        const config = await readApiResponse(response);
        if (!response.ok) throw new Error(config.error || "Live reviews are not configured.");
        if (cancelled) return;

        supabase = createClient(config.url, config.key);
        supabase.channel("community-review-feed")
          .on("postgres_changes", {
            event: "INSERT",
            schema: "public",
            table: "community_reviews"
          }, ({ new: row }) => {
            const incoming = mapRealtimeReview(row);
            setReviews((current) => {
              const optimisticMatch = current.find((item) =>
                item.optimistic
                && item.name === incoming.name
                && item.city === incoming.city
                && item.category === incoming.category
                && item.quote === incoming.quote);
              if (optimisticMatch) incoming.replies = optimisticMatch.replies || [];
              return [incoming, ...current.filter((item) =>
                item.id !== incoming.id && item.id !== optimisticMatch?.id
              )]
                .sort((first, second) => second.createdAt.localeCompare(first.createdAt))
                .slice(0, 6);
            });
          })
          .on("postgres_changes", {
            event: "UPDATE",
            schema: "public",
            table: "community_reviews"
          }, ({ new: row }) => {
            setReviews((current) => current.map((review) =>
              review.id === row.id ? { ...review, likes: row.likes } : review
            ));
          })
          .on("postgres_changes", {
            event: "INSERT",
            schema: "public",
            table: "review_replies"
          }, ({ new: row }) => {
            const incoming = mapRealtimeReply(row);
            setReviews((current) => current.map((review) => {
              if (review.id !== incoming.reviewId) return review;
              const pendingMatch = (review.replies || []).find((reply) =>
                reply.optimistic && reply.name === incoming.name && reply.replyText === incoming.replyText);
              if (pendingMatch) {
                setPendingReplies((pending) => ({
                  ...pending,
                  [review.id]: pending[review.id] === pendingMatch.id ? "" : pending[review.id]
                }));
              }
              return {
                ...review,
                replies: [...(review.replies || []).filter((reply) =>
                  reply.id !== incoming.id && reply.id !== pendingMatch?.id
                ), incoming].sort((first, second) => first.createdAt.localeCompare(second.createdAt))
              };
            }));
          })
          .subscribe((channelStatus) => {
            if (channelStatus === "SUBSCRIBED") setLiveStatus("Live");
            if (channelStatus === "CHANNEL_ERROR" || channelStatus === "TIMED_OUT") {
              setLiveStatus("Live updates unavailable — refresh to reconnect.");
            }
          });
      } catch (error) {
        console.error("Community review live updates could not be started:", error.message);
        if (!cancelled) setLiveStatus("Live updates unavailable — refresh to reconnect.");
      }
    }
    subscribeToLiveChanges();

    return () => {
      cancelled = true;
      if (supabase) supabase.removeAllChannels();
    };
  }, []);

  const sortedReviews = useMemo(() => [...reviews]
    .filter((review) => activeCategory === "All" || review.category === activeCategory)
    .sort((first, second) => {
    if (first.id === pinnedId) return -1;
    if (second.id === pinnedId) return 1;
    if (activeCategory === "All" && preferredCategory && first.category === preferredCategory && second.category !== preferredCategory) return -1;
    if (activeCategory === "All" && preferredCategory && second.category === preferredCategory && first.category !== preferredCategory) return 1;
    return second.createdAt.localeCompare(first.createdAt) || second.likes - first.likes;
  }), [activeCategory, pinnedId, preferredCategory, reviews]);

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
    const optimisticReview = {
      ...body,
      id: `pending-${crypto.randomUUID()}`,
      likes: 0,
      createdAt: new Date().toISOString(),
      isSample: false,
      optimistic: true,
      replies: []
    };
    setReviews((current) => [optimisticReview, ...current].slice(0, 6));
    setPinnedId(optimisticReview.id);
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
      setReviews((current) => [result.review, ...current.filter((item) =>
        item.id !== optimisticReview.id
        && item.id !== result.review.id
        && !(item.optimistic && item.name === result.review.name
          && item.city === result.review.city && item.category === result.review.category
          && item.quote === result.review.quote)
      )]
        .sort((first, second) => second.createdAt.localeCompare(first.createdAt))
        .slice(0, 6));
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
      setReviews((current) => current.filter((item) => item.id !== optimisticReview.id));
      setPinnedId("");
      setStatus(error.message || "We couldn’t save your review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitReply(event, review) {
    event.preventDefault();
    if (pendingReplies[review.id]) return;
    const form = event.currentTarget;
    const formData = new FormData(form);
    const body = {
      name: String(formData.get("replyName") || ""),
      replyText: String(formData.get("replyText") || "")
    };
    const optimisticReply = {
      ...body,
      id: `pending-${crypto.randomUUID()}`,
      reviewId: review.id,
      createdAt: new Date().toISOString(),
      optimistic: true
    };
    setPendingReplies((current) => ({ ...current, [review.id]: optimisticReply.id }));
    setReplyStatus((current) => ({ ...current, [review.id]: "" }));
    setReviews((current) => current.map((item) => item.id === review.id
      ? { ...item, replies: [...(item.replies || []), optimisticReply] }
      : item));
    form.reset();

    try {
      const response = await fetch(`/api/community-reviews/${review.id}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const result = await readApiResponse(response);
      if (!response.ok) throw new Error(result.error || "We couldn’t save your reply.");
      setReviews((current) => current.map((item) => item.id === review.id
        ? {
          ...item,
          replies: [...(item.replies || []).filter((reply) =>
            reply.id !== optimisticReply.id
            && reply.id !== result.reply.id
            && !(reply.optimistic && reply.name === result.reply.name && reply.replyText === result.reply.replyText)
          ), result.reply]
            .sort((first, second) => first.createdAt.localeCompare(second.createdAt))
        }
        : item));
      setReplyStatus((current) => ({ ...current, [review.id]: "Reply posted." }));
      form.reset();
    } catch (error) {
      setReviews((current) => current.map((item) => item.id === review.id
        ? { ...item, replies: (item.replies || []).filter((reply) => reply.id !== optimisticReply.id) }
        : item));
      setReplyStatus((current) => ({
        ...current,
        [review.id]: error.message || "We couldn’t save your reply. Please try again."
      }));
    } finally {
      setPendingReplies((current) => ({ ...current, [review.id]: "" }));
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
    <section className="testimonials section-pad community-reviews" id="community-reviews" aria-labelledby="community-reviews-title">
      <div className="route-heading">
        <div>
          <span className="eyebrow">The community / In their words</span>
          <h2 id="community-reviews-title">Notes from people<br /><em>we’ve worked with.</em></h2>
          <p className="community-reviews__live" aria-live="polite"><span className={liveStatus === "Live" ? "is-live" : ""} />{liveStatus}</p>
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
      <div className="community-review-feed">
        <div className="community-review-feed__heading">
          <h3>Community comments</h3>
          <span>{reviews.length} {reviews.length === 1 ? "review" : "reviews"}</span>
        </div>
        <div className="community-review-filters" role="group" aria-label="Filter reviews by category">
          {reviewCategories.map((category) => (
            <button
              className={activeCategory === category ? "is-active" : ""}
              key={category}
              type="button"
              aria-pressed={activeCategory === category}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
      <div className="community-notes community-notes--feed" aria-live="polite">
        {loading && <p className="community-reviews__loading">Loading community reviews…</p>}
        {!loading && sortedReviews.map((review) => (
          <article className="community-note community-note--feed" key={review.id}>
            <div className="community-note__avatar" aria-hidden="true">{review.name.trim().charAt(0).toUpperCase()}</div>
            <div className="community-note__content">
              <div className="community-note__byline">
                <strong>{review.name}</strong>
                <span>{review.city}</span>
                <span aria-hidden="true">·</span>
                <time dateTime={review.createdAt}>{formatReviewTime(review)}</time>
                {review.isSample && <span className="community-note__sample">Sample</span>}
              </div>
              <blockquote>{review.quote}</blockquote>
              <span className="community-note__category">{review.category}</span>
              {review.replies?.length > 0 && (
                <div className="community-note__replies" aria-label="Replies">
                  {review.replies.map((reply) => (
                    <div className="community-note__reply" key={reply.id}>
                      <div className="community-note__reply-avatar" aria-hidden="true">{reply.name.charAt(0).toUpperCase()}</div>
                      <div>
                        <p><strong>{reply.name}</strong>{reply.optimistic && <span> · Sending…</span>}</p>
                        <span>{reply.replyText}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <form className="community-note__reply-form" onSubmit={(event) => submitReply(event, review)}>
                <input required name="replyName" minLength={2} maxLength={80} aria-label="Your name for reply" placeholder="Your name" />
                <textarea required name="replyText" minLength={2} maxLength={500} rows={2} aria-label="Write a reply" placeholder="Write a reply…" />
                <button type="submit" disabled={Boolean(pendingReplies[review.id])}>
                  {pendingReplies[review.id] ? "Sending…" : "Reply"}
                </button>
                <span className="community-note__reply-status" aria-live="polite">{replyStatus[review.id]}</span>
              </form>
            </div>
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
          </article>
        ))}
        {!loading && sortedReviews.length === 0 && (
          <p className="community-reviews__empty">No reviews in this category yet. Choose another filter or share your experience.</p>
        )}
      </div>
    </section>
  );
}
