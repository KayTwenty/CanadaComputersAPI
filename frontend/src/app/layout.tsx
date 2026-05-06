import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "./contexts/StoreContext";
import { FavoritesProvider } from "./contexts/FavoritesContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ccdeals.ca";
const DEFAULT_DESCRIPTION =
  "Track every on-sale deal at Canada Computers. Desktops, laptops, CPUs, GPUs, memory, motherboards, drives, PSUs, coolers and cases sorted by biggest savings. Updated automatically every 30 minutes.";

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "CCDeals | Canada Computers Deals Tracker",
    template: "%s | CCDeals",
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: "CCDeals",
  category: "shopping",
  keywords: [
    "Canada Computers",
    "Canada Computers deals",
    "Canada Computers sale",
    "Canada Computers price tracker",
    "computer deals Canada",
    "PC deals Canada",
    "desktop deals",
    "laptop deals",
    "RAM deals",
    "DDR5 deals",
    "CPU deals",
    "GPU deals",
    "graphics card deals",
    "motherboard deals",
    "SSD deals",
    "hard drive deals",
    "PSU deals",
    "PC case deals",
    "CPU cooler deals",
    "CCDeals",
  ],
  authors: [{ name: "Anton", url: "https://antton.ca" }],
  creator: "Anton",
  publisher: "Anton",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_CA",
    url: SITE_URL,
    siteName: "CCDeals",
    title: "CCDeals | Canada Computers Deals Tracker",
    description: DEFAULT_DESCRIPTION,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "CCDeals | Canada Computers Deals Tracker",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CCDeals | Canada Computers Deals Tracker",
    description: DEFAULT_DESCRIPTION,
    images: ["/opengraph-image"],
  },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "CCDeals",
  url: SITE_URL,
  description: DEFAULT_DESCRIPTION,
  inLanguage: "en-CA",
  author: { "@type": "Person", name: "Anton", url: "https://antton.ca" },
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "CCDeals",
  url: SITE_URL,
  logo: `${SITE_URL}/opengraph-image`,
  description: DEFAULT_DESCRIPTION,
  founder: { "@type": "Person", name: "Anton", url: "https://antton.ca" },
  sameAs: ["https://antton.ca"],
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
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2407505709493368"
          crossOrigin="anonymous"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-slate-50">
        <StoreProvider>
          <FavoritesProvider>
            <Navbar />
            {children}
            <Footer />
          </FavoritesProvider>
        </StoreProvider>
      </body>
    </html>
  );
}


