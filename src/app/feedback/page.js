import SiteFrame from "../../components/SiteFrame";
import ClientFeedbackForm from "../../components/ClientFeedbackForm";
import CommunityReviews from "../../components/CommunityReviews";

export const metadata = {
  title: "Client Feedback — Bardapure Productions®",
  description: "Share feedback on your experience working with Bardapure Productions."
};

export default function ClientFeedbackPage() {
  return (
    <SiteFrame>
      <section className="client-feedback-page section-pad">
        <span className="eyebrow">Clients / Your experience</span>
        <div className="route-heading">
          <div><h1>Good work gets<br /><em>even better.</em></h1></div>
          <p>A quick note helps us keep improving. Share what worked and what we can do better.</p>
        </div>
        <ClientFeedbackForm />
      </section>
      <CommunityReviews />
    </SiteFrame>
  );
}
