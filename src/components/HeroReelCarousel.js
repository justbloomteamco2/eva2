"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Pause, Play } from "lucide-react";

const clips = [
  {
    title: "Flying Flea",
    detail: "Royal Enfield · Bengaluru",
    src: "/videos/bardapure-flying-flea.mp4",
    poster: "/images/instagram/flying-flea-ride-reel.jpg",
    href: "https://www.instagram.com/sagar_bardapure_official/reel/DXHJQW0j90S/"
  },
  {
    title: "Air Force Station",
    detail: "Event production · Bidar",
    src: "/videos/bardapure-air-force-bidar.mp4",
    poster: "/images/instagram/indian-air-force-event.jpg",
    href: "https://www.instagram.com/sagar_bardapure_official/reel/DT78widDyu9/"
  }
];

export default function HeroReelCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [playbackError, setPlaybackError] = useState("");
  const videoRef = useRef(null);
  const activeClip = clips[activeIndex];
  const isPlaying = !paused && pageVisible;

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setPaused(preference.matches);
    updatePreference();
    preference.addEventListener("change", updatePreference);
    return () => preference.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    const updateVisibility = () => setPageVisible(document.visibilityState === "visible");
    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);
    return () => document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

  useEffect(() => {
    if (!isPlaying) return undefined;
    const timer = window.setTimeout(() => {
      setActiveIndex((current) => (current + 1) % clips.length);
    }, 9000);
    return () => window.clearTimeout(timer);
  }, [activeIndex, isPlaying]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (!isPlaying) {
      video.pause();
      return;
    }
    video.play().then(() => {
      setPlaybackError("");
    }).catch((error) => {
      if (error.name !== "AbortError") {
        setPaused(true);
        setPlaybackError("Clip playback is unavailable. Open the original on Instagram.");
      }
    });
  }, [activeIndex, isPlaying]);

  function moveClip(direction) {
    setActiveIndex((current) => (current + direction + clips.length) % clips.length);
  }

  return (
    <div className="hero-reel" role="region" aria-roledescription="carousel" aria-label="Campaign video highlights">
      <div className="hero-reel__frame">
        <video
          key={activeClip.src}
          ref={videoRef}
          className="hero-reel__video"
          src={activeClip.src}
          poster={activeClip.poster}
          autoPlay={isPlaying}
          muted
          playsInline
          preload="metadata"
          aria-label={`${activeClip.title}: ${activeClip.detail}`}
          onEnded={() => isPlaying && moveClip(1)}
          onError={() => {
            setPaused(true);
            setPlaybackError("This clip could not be played. Open the original on Instagram.");
          }}
        />
      </div>
      <div className="hero-reel__veil" aria-hidden="true" />
      <span className="hero-reel__live"><i /> Bardapure / on the ground</span>
      <div className="hero-reel__caption" aria-live="polite">
        <span>{String(activeIndex + 1).padStart(2, "0")} <i>/</i> {String(clips.length).padStart(2, "0")}</span>
        <a className="hero-reel__source" href={activeClip.href} target="_blank" rel="noreferrer">
          <strong>{activeClip.title}</strong><small>{activeClip.detail} <ArrowUpRight size={13} /></small>
        </a>
      </div>
      <div className="hero-reel__controls" role="group" aria-label="Campaign carousel controls">
        <button type="button" onClick={() => moveClip(-1)} aria-label="Previous campaign clip"><ArrowLeft size={17} /></button>
        <button type="button" onClick={() => setPaused((current) => !current)} aria-label={paused ? "Play campaign carousel" : "Pause campaign carousel"}>{paused ? <Play size={16} /> : <Pause size={16} />}</button>
        <button type="button" onClick={() => moveClip(1)} aria-label="Next campaign clip"><ArrowRight size={17} /></button>
      </div>
      {playbackError && <p className="hero-reel__error" role="status">{playbackError}</p>}
    </div>
  );
}
