import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AirbnbLens - Beast Engine | Style-Discovery Search",
  description:
    "Find Airbnb listings by vibe, aesthetic, or visual similarity. Search via photo, text, or teleport your style across cities.",
  openGraph: {
    title: "AirbnbLens Beast Engine",
    description:
      "Style-Discovery Search. Find listings by vibe, photo, or teleport aesthetics across 8 cities.",
    url: "https://airbnblens.com",
    siteName: "AirbnbLens",
    images: [
      {
        url: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=1200&h=630&fit=crop",
        width: 1200,
        height: 630,
        alt: "AirbnbLens Beast Engine - Style Discovery",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AirbnbLens Beast Engine",
    description: "Style-Discovery Search across 8 cities.",
    images: [
      "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=1200&h=630&fit=crop",
    ],
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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
