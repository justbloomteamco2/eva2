import Image from "next/image";
import { ArrowUpRight, Layers, Play } from "lucide-react";

export default function WorkGrid({ items, compact = false }) {
  const projects = compact ? items.slice(0, 4) : items;
  return (
    <div className={`campaign-grid${compact ? " campaign-grid--compact" : ""}`}>
      {projects.map((post, index) => {
        const FormatIcon = post.format === "Reel" ? Play : Layers;
        return (
          <a className={`campaign-tile campaign-tile--${index + 1}`} key={post.href} href={post.href} target="_blank" rel="noreferrer" aria-label={`${post.title}, ${post.format}. Open original Instagram ${post.format.toLowerCase()}.`}>
            <div className="campaign-tile__visual">
              <Image src={post.image} alt={post.alt} fill sizes="(max-width: 640px) 48vw, (max-width: 1000px) 32vw, 24vw" />
              <span className="campaign-tile__format"><FormatIcon aria-hidden="true" /><span className="sr-only">{post.format}</span></span>
              <span className="campaign-tile__overlay"><span>{post.category} · {post.location}</span><strong>{post.title}</strong><span>Watch on Instagram <ArrowUpRight size={13} /></span></span>
            </div>
            <span className="campaign-tile__caption"><strong>{post.title}</strong><span>{post.category} · {post.location}</span></span>
          </a>
        );
      })}
    </div>
  );
}
