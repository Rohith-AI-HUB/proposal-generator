import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ProposaIQ — Proposal Generator for Freelancers",
  description: "Paste raw client requirements. Get a client-ready proposal in seconds.",
  verification: { google: "AASp5KSs1zzOm_fnICeF92SpkuIvG83Wkss3sGCc1D0" },
};

// Runs synchronously before any CSS or JS loads — prevents flash of wrong theme.
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
