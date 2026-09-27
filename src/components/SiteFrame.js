import Experience from "./Experience";
import Navbar from "./Navbar";
import SiteFooter from "./SiteFooter";

export default function SiteFrame({ children }) {
  return (
    <>
      <Experience />
      <Navbar />
      <main>{children}</main>
      <SiteFooter />
    </>
  );
}
