import { ArrowUpRight } from "lucide-react";

export default function ButtonLink({ href, children, variant = "dark", ...props }) {
  return (
    <a className={`button-link button-link--${variant}`} href={href} {...props}>
      <span>{children}</span>
      <ArrowUpRight aria-hidden="true" size={17} strokeWidth={1.6} />
    </a>
  );
}
