import Experience from "./Experience";
import Navbar from "./Navbar";
import SiteFooter from "./SiteFooter";
import { getPublicSiteContent } from "../lib/site-content";

export default async function SiteFrame({ children }) {
  const content = await getPublicSiteContent();
  return (
    <>
      <Experience />
      <Navbar />
      <main>{children}</main>
      <SiteFooter settings={content.site_settings} />
    </>
  );
}
