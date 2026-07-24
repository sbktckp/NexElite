import type { Metadata } from "next";
import { Bricolage_Grotesque, Space_Mono } from "next/font/google";
import "./globals.css";

const disp = Bricolage_Grotesque({
  variable: "--font-disp",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const mono = Space_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
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
    <html lang="en" className={`${disp.variable} ${mono.variable}`}>
      <body className="crt-lines">
        <div className="grain" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
