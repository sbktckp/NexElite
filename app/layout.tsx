import type { Metadata } from "next";
import { Fraunces, Space_Mono, Inter } from "next/font/google";
import "./globals.css";
import { SITE, SITE_URL, organizationJsonLd } from "@/lib/site";

/*
  The display face carries the editorial theme almost single-handedly.
  Fraunces is a high-contrast serif with a soft optical-size axis, which is
  what keeps a 86px headline from looking like a 16px one scaled up.
  Loaded at four weights because the headlines run from 600 to 900 and a
  variable request for the whole range costs more than the four we use.
*/
const disp = Fraunces({
  variable: "--font-disp",
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
  style: ["normal", "italic"],
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
    template: "%s | NexElite Media",
  },
  description: SITE.description,
  alternates: { canonical: "/" },
  /*
    Favicons are served from /public rather than app/icon.png so that one
    source file backs both the tab icon and the iOS home screen icon.
    The mark is the crowned N lifted out of the full lockup: the lockup
    itself is unreadable below about 64px, and a favicon is 16.
    Both sit on the paper cream so the black mark survives a dark tab bar.
  */
  icons: {
    icon: [{ url: "/icon.png", type: "image/png", sizes: "512x512" }],
    shortcut: [{ url: "/icon.png", type: "image/png" }],
    apple: [{ url: "/apple-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: SITE.title,
    description: SITE.description,
    url: SITE_URL,
    images: [
      { url: "/og.png", width: 1200, height: 630, alt: SITE.name },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.title,
    description: SITE.description,
    images: ["/og.png"],
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
  themeColor: "#fbf8f3",
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
