import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Manrope } from "next/font/google";

import SiteChrome from "@/components/SiteChrome";
import { SITE_ORIGIN } from "@/lib/site";
import "./globals.css";
import "./enquiry.css";

const instrumentSerif = Instrument_Serif({ variable: "--font-instrument-serif", subsets: ["latin"], weight: "400", style: ["normal", "italic"], display: "swap" });
const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: { default: "Sukoona — A little pause. A world within.", template: "%s | Sukoona" },
  description: "Discover the Sukoona Gummy Vati jar and thoughtful reads on everyday rituals, packaging and making room for yourself.",
  alternates: { canonical: SITE_ORIGIN },
};
export const viewport: Viewport = { themeColor: "#080b0b", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: "try{document.documentElement.dataset.theme=localStorage.getItem('sukoona-theme')==='light'?'light':'dark'}catch(e){}" }} /></head>
      <body className={`${instrumentSerif.variable} ${manrope.variable} antialiased`}>
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
