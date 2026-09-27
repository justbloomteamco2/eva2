import SiteFrame from "../../components/SiteFrame";
import CreatorRolePicker from "../../components/CreatorRolePicker";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Join the Creator Network — Bardapure Productions®",
  description: "Join Bardapure Productions' creator and talent network to hear about relevant opportunities."
};

export default function CreatorsPage() {
  return (
    <SiteFrame>
      <section className="creator-page section-pad">
        <span className="eyebrow">02 / Job &amp; creator applications</span>
        <div className="route-heading"><div><h1>Your next<br /><em>chapter starts here.</em></h1></div><div className="route-heading__aside"><p>Apply to join our creator and event talent network. Share your skills and the opportunities you’re looking for; our team will reach out when there’s a fit.</p><Link className="text-link" href="/events#feedback">Attended an event? Share attendee feedback <ArrowUpRight size={15} /></Link></div></div>
        <CreatorRolePicker />
      </section>
    </SiteFrame>
  );
}
