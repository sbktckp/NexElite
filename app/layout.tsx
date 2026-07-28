import type { Metadata } from "next";
import { Bricolage_Grotesque, Space_Mono, Inter } from "next/font/google";
import "./globals.css";
import { SITE, SITE_URL, organizationJsonLd } from "@/lib/site";

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
  // Without metadataBase every relative Open Graph and canonical URL
  // resolves against localhost in production.
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE.title,
    template: "%s — NexElite Media",
  },
  description: SITE.description,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: SITE.title,
    description: SITE.description,
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.title,
    description: SITE.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

// Colours the browser chrome on mobile so the page does not sit inside a
// mismatched system bar.
export const viewport = {
  themeColor: "#ffffff",
  colorScheme: "light" as const,
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
      <body className="tex">
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd()),
          }}
        />
      </body>
    </html>
  );
}
