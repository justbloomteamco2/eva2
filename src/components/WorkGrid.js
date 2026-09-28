"use client";

import Image from "next/image";
import { ArrowUpRight, Layers, Play } from "lucide-react";
import { useState } from "react";
import MotionReveal from "./MotionReveal";

function CampaignTile({ post, index, compact }) {
  function playVideo(event) {
    const player = event.currentTarget.querySelector("video");
    if (!player) return;
    const playback = player.play();
    if (playback) {
      playback.catch((error) => {
        if (error.name !== "NotAllowedError" && error.name !== "AbortError") {
          console.error("Campaign preview could not be played.", error);
        }
      });
    }
  }

  function pauseVideo(event) {
    const player = event.currentTarget.querySelector("video");
    if (!player) return;
    player.pause();
    player.currentTime = 0;
  }

  const FormatIcon = post.format === "Reel" ? Play : Layers;
  return (
    <MotionReveal
      as="a"
      className={`campaign-tile campaign-tile--${index + 1}`}
      href={post.href}
      target="_blank"
      rel="noreferrer"
      style={{ "--card-index": index }}
      aria-label={`${post.title}, ${post.format}. Open original Instagram ${post.format.toLowerCase()}.`}
      onPointerEnter={playVideo}
      onPointerLeave={pauseVideo}
      onFocus={playVideo}
      onBlur={pauseVideo}
      delay={(index % 5) * 0.06}
    >
      <div className="campaign-tile__visual">
        <Image
          src={post.image}
          alt={post.alt}
          fill
          sizes="(max-width: 640px) 88vw, (max-width: 1000px) 48vw, 30vw"
          priority={index === 0 && !compact}
        />
        {post.video && (
          <video className="campaign-tile__video" muted playsInline loop preload="none" aria-hidden="true">
            <source src={post.video} type="video/mp4" />
          </video>
        )}
        <span className="campaign-tile__format"><FormatIcon aria-hidden="true" /><span className="sr-only">{post.format}</span></span>
        <span className="campaign-tile__overlay"><span>{post.category} · {post.location}</span><strong>{post.title}</strong><span>Watch on Instagram <ArrowUpRight size={13} /></span></span>
      </div>
      <span className="campaign-tile__caption"><strong>{post.title}</strong><span>{post.category} · {post.location}</span></span>
    </MotionReveal>
  );
}

export default function WorkGrid({ items, compact = false }) {
  const projects = compact ? items.slice(0, 4) : items;
  const categories = ["All work", ...new Set(projects.map((post) => post.category))];
  const [activeCategory, setActiveCategory] = useState("All work");
  const filteredProjects = activeCategory === "All work"
    ? projects
    : projects.filter((project) => project.category === activeCategory);

  return (
    <>
      {!compact && (
        <div className="campaign-filters" role="group" aria-label="Filter campaigns by category">
          {categories.map((category) => (
            <button
              type="button"
              key={category}
              aria-pressed={activeCategory === category}
              onClick={() => setActiveCategory(category)}
            >
              {category}
              <span>{category === "All work" ? projects.length : projects.filter((project) => project.category === category).length}</span>
            </button>
          ))}
        </div>
      )}
      {!compact && (
        <p className="campaign-results" role="status" aria-live="polite">
          Showing {filteredProjects.length} {filteredProjects.length === 1 ? "project" : "projects"}
          {activeCategory !== "All work" ? ` in ${activeCategory}` : ""}
        </p>
      )}
      <div className={`campaign-grid${compact ? " campaign-grid--compact" : ""}`}>
        {filteredProjects.length ? filteredProjects.map((post, index) => (
          <CampaignTile key={post.href} post={post} index={index} compact={compact} />
        )) : (
          <p className="campaign-empty">No projects in this category yet. Try another filter.</p>
        )}
      </div>
    </>
  );
}
