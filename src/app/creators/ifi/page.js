import SiteFrame from "../../../components/SiteFrame";
import ProjectRegistrationForm from "../../../components/ProjectRegistrationForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "India’s Face Icon – IFI Registration — Bardapure Productions®",
  description: "Register your interest in India’s Face Icon, a platform for emerging faces and talent across India."
};

export default function IndiaFaceIconRegistrationPage() {
  return (
    <SiteFrame>
      <section className="project-registration-page section-pad">
        <span className="eyebrow">India’s Face Icon / Talent registration</span>
        <div className="route-heading">
          <div><h1>Your face.<br /><em>Your identity.</em></h1></div>
          <p>Discover · Connect · Create · Grow</p>
        </div>
        <ProjectRegistrationForm project="ifi" />
      </section>
    </SiteFrame>
  );
}
