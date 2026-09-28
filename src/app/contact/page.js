import { ArrowUpRight } from "lucide-react";
import SiteFrame from "../../components/SiteFrame";
import ContactForm from "../../components/ContactForm";
import { getPublicSiteContent } from "../../lib/site-content";
import { isEnquiryCategory } from "../../lib/enquiry-categories";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Contact Bardapure Productions®",
  description: "Start a conversation about brand partnerships, events, creator campaigns and production."
};

export default async function ContactPage({ searchParams }) {
  const content = await getPublicSiteContent();
  const settings = content.site_settings;
  const params = await searchParams;
  const category = isEnquiryCategory(params?.category) ? params.category : "Brand partnership";

  return (
    <SiteFrame>
      <section className="contact-page section-pad">
        <span className="eyebrow">06 / Start a conversation</span>
        <div className="route-heading">
          <div><h1>Make it<br /><em>happen.</em></h1></div>
          <p>Tell us what you’re planning. We’ll connect you with the right production, campaign or talent support.</p>
        </div>
        <div className="contact-page__grid">
          <aside className="contact__details">
            <span>Reach the team.</span>
            {settings.email && <a href={`mailto:${settings.email}`}>{settings.email} <ArrowUpRight size={16} /></a>}
            {settings.phone && <a href={`tel:${settings.phone.replaceAll(/[^\d+]/g, "")}`}>{settings.phone} <ArrowUpRight size={16} /></a>}
            {settings.instagram && <a href={settings.instagram} target="_blank" rel="noreferrer">Instagram <ArrowUpRight size={16} /></a>}
            {settings.address && <p>{settings.address}</p>}
            <p>Brand partnerships · Event production · Creator campaigns</p>
          </aside>
          <ContactForm category={category} />
        </div>
      </section>
    </SiteFrame>
  );
}
