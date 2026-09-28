import { ArrowUpRight, Building2, Tag } from "lucide-react";
import Link from "next/link";
import MotionReveal from "./MotionReveal";

export default function AudiencePathways() {
  return (
    <section className="audience-pathways section-pad" aria-label="Ways to work with Bardapure">
      <MotionReveal className="audience-pathways__item">
        <Link href="/contact?category=Brand%20partnership" className="audience-pathways__card">
          <Tag size={19} aria-hidden="true" />
          <span className="eyebrow">For brands</span>
          <strong>Build a creator-led<br />brand experience.</strong>
          <span className="text-link">Plan a brand collaboration <ArrowUpRight size={15} /></span>
        </Link>
      </MotionReveal>
      <MotionReveal className="audience-pathways__item" delay={0.12}>
        <Link href="/contact?category=Campus%20partnership" className="audience-pathways__card">
          <Building2 size={19} aria-hidden="true" />
          <span className="eyebrow">For campuses</span>
          <strong>Make campus<br />the main event.</strong>
          <span className="text-link">Plan a campus experience <ArrowUpRight size={15} /></span>
        </Link>
      </MotionReveal>
    </section>
  );
}
