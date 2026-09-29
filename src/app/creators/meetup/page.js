import SiteFrame from "../../../components/SiteFrame";
import ProjectRegistrationForm from "../../../components/ProjectRegistrationForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Bardapure Creator Meet-Up Registration — Bardapure Productions®",
  description: "Register for the Bardapure Creator Meet-Up and find your creative community."
};

export default function CreatorMeetupRegistrationPage() {
  return (
    <SiteFrame>
      <section className="project-registration-page section-pad">
        <span className="eyebrow">Bardapure Creators Meet-Up / Community registration</span>
        <div className="route-heading">
          <div><h1>Find your<br /><em>creative people.</em></h1></div>
          <p>Collaborate · Create · Grow</p>
        </div>
        <ProjectRegistrationForm project="creators_meetup" />
      </section>
    </SiteFrame>
  );
}
