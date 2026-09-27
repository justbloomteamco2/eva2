import "./globals.css";
import ToastProvider from "../components/ToastProvider";

export const metadata = {
  title: "Bardapure Productions® — We create experiences. We build connections.",
  description:
    "An independent creative production house working across brand activations, campus experiences, events, creators and content.",
  openGraph: {
    title: "Bardapure Productions®",
    description: "We create experiences. We build connections.",
    type: "website"
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body><ToastProvider>{children}</ToastProvider></body>
    </html>
  );
}
