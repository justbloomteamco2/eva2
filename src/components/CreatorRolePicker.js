"use client";

import { useState } from "react";
import CreatorRegistrationForm from "./CreatorRegistrationForm";
import { creatorCategories } from "../data/content";

export default function CreatorRolePicker() {
  const [selectedCategory, setSelectedCategory] = useState("");

  return (
    <>
      <section className="creator-role-picker" aria-labelledby="creator-role-picker-title">
        <p className="eyebrow" id="creator-role-picker-title">What do you do?</p>
        <div className="creator-page__roles">
          {creatorCategories.slice(0, 12).map((category) => (
            <button
              type="button"
              key={category}
              aria-pressed={selectedCategory === category}
              onClick={() => setSelectedCategory((current) => current === category ? "" : category)}
            >
              {category}
            </button>
          ))}
        </div>
      </section>
      <div id="creator-registration" className="creator-form-wrap">
        <CreatorRegistrationForm
          initialCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />
      </div>
    </>
  );
}
