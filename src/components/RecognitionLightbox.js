"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Image from "next/image";

export default function RecognitionLightbox({ items }) {
  const [selected, setSelected] = useState(null);

  function close() {
    setSelected(null);
  }

  function move(direction) {
    setSelected((current) => (current + direction + items.length) % items.length);
  }

  useEffect(() => {
    if (selected === null) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event) {
      if (event.key === "Escape") close();
      if (event.key === "ArrowLeft") setSelected((current) => (current - 1 + items.length) % items.length);
      if (event.key === "ArrowRight") setSelected((current) => (current + 1) % items.length);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [selected, items.length]);

  return (
    <>
      <div className="recognition-grid">
        {items.map((item, index) => (
          <button className="recognition-item" type="button" key={item.image} onClick={() => setSelected(index)}>
            <span className="recognition-item__image">
              <Image src={item.image} alt={item.alt} fill sizes="(max-width: 760px) 72vw, 32vw" />
              <span className="recognition-item__open">View recognition ↗</span>
            </span>
            <span className="recognition-item__caption">
              <strong>{item.title}</strong><small>{item.detail}</small>
            </span>
          </button>
        ))}
      </div>
      {selected !== null && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label={items[selected].title} onMouseDown={(event) => {
          if (event.target === event.currentTarget) close();
        }}>
          <button type="button" className="lightbox__close" aria-label="Close recognition image" onClick={close}><X /></button>
          <button type="button" className="lightbox__arrow lightbox__arrow--left" aria-label="Previous recognition image" onClick={() => move(-1)}><ChevronLeft /></button>
          <figure className="lightbox__figure">
            <Image src={items[selected].image} alt={items[selected].alt} width={800} height={1200} sizes="(max-width: 760px) 85vw, 74vw" />
            <figcaption>{items[selected].title}</figcaption>
          </figure>
          <button type="button" className="lightbox__arrow lightbox__arrow--right" aria-label="Next recognition image" onClick={() => move(1)}><ChevronRight /></button>
        </div>
      )}
    </>
  );
}
