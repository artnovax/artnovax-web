import type { Metadata } from "next";
import {
  Cormorant_Garamond,
  Montserrat,
} from "next/font/google";

import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";

import "./globals.css";


const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});


const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "ArtNovaX",
    template: "%s | ArtNovaX",
  },
  description:
    "ArtNovaX brings together creativity, mental wellbeing, community, research, and thoughtful technology.",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${montserrat.variable} ${cormorant.variable}`}
    >
      <body className="min-h-screen">
        <div className="flex min-h-screen flex-col">
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
