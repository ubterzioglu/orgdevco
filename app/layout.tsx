import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import NavBar from "@/components/layout/NavBar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    template: "%s | OrgDev",
    default: "OrgDev | Organizational & Career Development Platform",
  },
  description:
    "OrgDev connects organizations with vetted coaches and consultants worldwide, backed by intelligent matching.",
  openGraph: {
    title: "OrgDev | Organizational & Career Development Platform",
    description:
      "OrgDev connects organizations with vetted coaches and consultants worldwide, backed by intelligent matching.",
    type: "website",
    locale: "en_US",
    siteName: "OrgDev",
  },
  twitter: {
    card: "summary_large_image",
    title: "OrgDev | Organizational & Career Development Platform",
    description:
      "OrgDev connects organizations with vetted coaches and consultants worldwide, backed by intelligent matching.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NavBar />
        {children}
      </body>
    </html>
  );
}
