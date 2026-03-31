import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "./contexts/StoreContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import TopBanner from "./components/TopBanner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ccdeals.ca";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "CCDeals | Canada Computers Deals Tracker",
    template: "%s | CCDeals",
  },
  description:
    "Track the best on-sale deals at Canada Computers. Browse prebuilt desktops, RAM, CPUs, and GPUs sorted by biggest dollar savings. Updated automatically every 30 minutes.",
  keywords: [
    "Canada Computers",
    "Canada Computers deals",
    "Canada Computers sale",
    "computer deals Canada",
    "desktop deals",
    "RAM deals",
    "CPU deals",
    "GPU deals",
    "CCDeals",
    "PC deals Canada",
  ],
  authors: [{ name: "Anton", url: "https://antton.ca" }],
  creator: "Anton",
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_CA",
    url: "/",
    siteName: "CCDeals",
    title: "CCDeals | Canada Computers Deals Tracker",
    description:
      "Track the best on-sale deals at Canada Computers. Desktops, RAM, CPUs, and GPUs sorted by biggest savings.",
  },
  twitter: {
    card: "summary",
    title: "CCDeals | Canada Computers Deals Tracker",
    description:
      "Track the best on-sale deals at Canada Computers. Desktops, RAM, CPUs, and GPUs sorted by biggest savings.",
  },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "CCDeals",
  url: SITE_URL,
  description:
    "Track the best on-sale deals at Canada Computers. Updated automatically every 30 minutes.",
  author: { "@type": "Person", name: "Anton", url: "https://antton.ca" },
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
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-slate-50">
        <StoreProvider>
          <TopBanner />
          <Navbar />
          {children}
          <Footer />
        </StoreProvider>
      </body>
    </html>
  );
}

