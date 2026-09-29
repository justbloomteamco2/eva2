import Link from "next/link";
import Image from "next/image";

export default function SiteFooter({ settings }) {
  const social = settings || {};
  return (
    <footer className="site-footer">
      <Link className="wordmark wordmark--footer" href="/" aria-label="Bardapure Productions home">
        <Image className="wordmark__logo" src="/images/bardapure-logo.png" alt="" width={48} height={48} />
        <span className="wordmark__text"><span>BARDAPURE</span><span>PRODUCTIONS<sup>®</sup></span></span>
      </Link>
      <div className="footer-links">
        <Link href="/about">About</Link><Link href="/work">Our work</Link><Link href="/events">Events</Link><Link href="/creators">Creators</Link><Link href="/feedback">Feedback</Link><Link href="/creators/ifi">IFI</Link><Link href="/contact">Contact</Link>
      </div>
      <div className="footer-social">
        {social.instagram && <a href={social.instagram} target="_blank" rel="noreferrer">Instagram ↗</a>}
        {social.founderInstagram && <a href={social.founderInstagram} target="_blank" rel="noreferrer">Sagar on Instagram ↗</a>}
        {social.email && <a href={`mailto:${social.email}`}>{social.email}</a>}
        {social.phone && <a href={`tel:${social.phone.replaceAll(/[^\d+]/g, "")}`}>{social.phone}</a>}
        {social.address && <span>{social.address}</span>}
        <Link href="/creators">Join the creator network ↗</Link>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Bardapure Productions®</span>
        <span>Explore your ambitions.</span>
        <Link href="/">Back to top ↑</Link>
      </div>
    </footer>
  );
}
