"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Image from "next/image";

export default function TestimonialSlider({ items }) {
  const [current, setCurrent] = useState(0);
  if (!items.length) return <p className="admin-empty">No testimonials have been published yet.</p>;
  const testimonial = items[current];
  const next = () => setCurrent((value) => (value + 1) % items.length);
  const previous = () => setCurrent((value) => (value - 1 + items.length) % items.length);

  return (
    <div className="testimonial">
      <div className="testimonial__text" aria-live="polite">
        <span className="quote-mark">“</span>
        <blockquote>{testimonial.quote}</blockquote>
        <div className="testimonial__attribution">
          <strong>{testimonial.name}</strong><span>{testimonial.role}</span>
        </div>
      </div>
      <div className="testimonial__image">
        <Image src={testimonial.image} alt={`Recognition artwork naming ${testimonial.name}`} fill sizes="(max-width: 760px) 40vw, 28vw" unoptimized />
      </div>
      <div className="testimonial__controls">
        <span className="testimonial__count">0{current + 1} <i /> 0{items.length}</span>
        <div className="testimonial__progress" aria-hidden="true">
          <span style={{ width: `${((current + 1) / items.length) * 100}%` }} />
        </div>
        <div className="testimonial__buttons">
          <button type="button" aria-label="Previous testimonial" onClick={previous}><ArrowLeft /></button>
          <button type="button" aria-label="Next testimonial" onClick={next}><ArrowRight /></button>
        </div>
      </div>
    </div>
  );
}
