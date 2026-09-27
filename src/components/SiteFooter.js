import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <Link className="wordmark wordmark--footer" href="/"><span>BARDAPURE</span><span>PRODUCTIONS<sup>®</sup></span></Link>
      <div className="footer-links">
        <Link href="/about">About</Link><Link href="/work">Our work</Link><Link href="/events">Events</Link><Link href="/creators">Creators</Link><Link href="/#contact">Contact</Link>
      </div>
      <div className="footer-social">
        <a href="https://www.instagram.com/bardapure_production_official/" target="_blank" rel="noreferrer">Instagram ↗</a>
        <a href="https://www.instagram.com/sagar_bardapure_official/" target="_blank" rel="noreferrer">Sagar on Instagram ↗</a>
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
