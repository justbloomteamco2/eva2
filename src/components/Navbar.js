"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const links = [
  ["About", "/about"],
  ["Work", "/work"],
  ["Events", "/events"],
  ["Creators", "/creators"],
  ["Recognition", "/about#recognition"],
  ["Contact", "/#contact"]
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 28);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("menu-open", open);
    return () => document.body.classList.remove("menu-open");
  }, [open]);

  useEffect(() => {
    const mobileLayout = window.matchMedia("(max-width: 1100px)");
    const closeOnDesktop = () => {
      if (!mobileLayout.matches) setOpen(false);
    };
    window.addEventListener("resize", closeOnDesktop);
    mobileLayout.addEventListener("change", closeOnDesktop);
    return () => {
      window.removeEventListener("resize", closeOnDesktop);
      mobileLayout.removeEventListener("change", closeOnDesktop);
    };
  }, []);

  return (
    <header className={`site-header site-header--global${scrolled ? " site-header--scrolled" : ""}`}>
      <Link className="wordmark" href="/" aria-label="Bardapure Productions home">
        <span>BARDAPURE</span>
        <span>PRODUCTIONS<sup>®</sup></span>
      </Link>
      <nav className="desktop-nav" aria-label="Main navigation">
        {links.map(([label, href]) => (
          <Link key={href} href={href}>{label}</Link>
        ))}
      </nav>
      <Link className="header-cta" href="/#contact">Partner with us <span>↗</span></Link>
      <button
        className="menu-toggle"
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen(!open)}
      >
        {open ? <X /> : <Menu />}
      </button>
      <nav id="mobile-menu" className={`mobile-menu${open ? " is-open" : ""}`} aria-label="Mobile navigation" inert={!open}>
        <div className="mobile-menu__links">
          {links.map(([label, href], index) => (
            <Link key={href} href={href} style={{ "--item-index": index }} onClick={() => setOpen(false)}>
              <span>0{index + 1}</span>{label}<span aria-hidden="true">↗</span>
            </Link>
          ))}
        </div>
        <p>Good things start with a conversation.</p>
      </nav>
    </header>
  );
}
