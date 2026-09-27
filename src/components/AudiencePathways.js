import { ArrowUpRight, Building2, Tag } from "lucide-react";
import Link from "next/link";

export default function AudiencePathways() {
  return (
    <section className="audience-pathways section-pad" aria-label="Ways to work with Bardapure">
      <Link href="/#contact" className="audience-pathways__card">
        <Tag size={19} aria-hidden="true" />
        <span className="eyebrow">For brands</span>
        <strong>Looking for<br />the right people?</strong>
        <span className="text-link">Start a project <ArrowUpRight size={15} /></span>
      </Link>
      <Link href="/#contact" className="audience-pathways__card">
        <Building2 size={19} aria-hidden="true" />
        <span className="eyebrow">For colleges</span>
        <strong>Let’s bring<br />campus to life.</strong>
        <span className="text-link">Partner with us <ArrowUpRight size={15} /></span>
      </Link>
    </section>
  );
}
