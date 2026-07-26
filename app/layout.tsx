import type { Metadata } from "next";
import { Bricolage_Grotesque, Space_Mono, Inter } from "next/font/google";
import "./globals.css";

const disp = Bricolage_Grotesque({
  variable: "--font-disp",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  display: "swap",
});

const body = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const mono = Space_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "NexElite Media — Creative Media Agency",
  description:
    "NexElite Media. A creative media agency. Influence. Create. Elevate.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${disp.variable} ${body.variable} ${mono.variable}`}
    >
      <body className="tex">{children}</body>
    </html>
  );
}
