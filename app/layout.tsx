import type { Metadata } from "next";
import "./globals.css";

const SITE_URL = "https://proposal-generator-blond.vercel.app";
const SITE_NAME = "ProposaIQ";
const SITE_TITLE = "ProposaIQ | Trust-first proposal drafts for freelance developers";
const SITE_DESCRIPTION =
  "Paste a messy client brief and get a trust-first proposal draft with cited facts, assumptions, client costs, and clarification questions before you bluff.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s | ProposaIQ",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "proposal generator for freelancers",
    "freelance proposal software",
    "client proposal drafting tool",
    "software project proposal generator",
    "proposal writer for developers",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "ProposaIQ trust-first proposal drafting preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/opengraph-image"],
  },
  verification: { google: "AASp5KSs1zzOm_fnICeF92SpkuIvG83Wkss3sGCc1D0" },
};

// Runs synchronously before any CSS or JS loads - prevents flash of wrong theme.
const themeScript = `
  (function() {
    try {
      var saved = localStorage.getItem('proposaiq-theme');
      if (saved === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
      }
    } catch(e) {}
  })();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        {/* Anti-flash: read theme preference before first paint */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,500;1,9..144,300;1,9..144,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=DM+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
