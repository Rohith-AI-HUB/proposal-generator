import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ProposaIQ — AI Proposal Generator for Freelancers",
  description:
    "Paste raw client requirements. Get a client-ready proposal in seconds.",
  verification: {
    google: "AASp5KSs1zzOm_fnICeF92SpkuIvG83Wkss3sGCc1D0",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gradient-mesh min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
