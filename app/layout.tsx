import type { Metadata } from "next";
import { Geist, Geist_Mono, Frank_Ruhl_Libre, Assistant } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const frankRuhl = Frank_Ruhl_Libre({
  variable: "--font-frank",
  subsets: ["hebrew", "latin"],
  weight: ["400", "700", "900"],
});

const assistant = Assistant({
  variable: "--font-assistant",
  subsets: ["hebrew", "latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const BASE = 'https://property-landing-builder.vercel.app';
const TITLE = 'Property Landing Builder — דף נחיתה לנכס תוך דקות';
const DESC =
  'צרו דף נחיתה מקצועי לנכס שלכם תוך דקות. ייבוא ממודעה, AI לכתיבת הסיפור, 5 תבניות עיצוב, קישור לשיתוף. חינמי לחלוטין.';

export const metadata: Metadata = {
  metadataBase: new URL(BASE),
  title: {
    default: TITLE,
    template: '%s | Property Landing Builder',
  },
  description: DESC,
  keywords: [
    'דף נחיתה לנכס',
    'דף נחיתה לדירה',
    'דף נחיתה למכירת דירה',
    'שיווק נכס וואטסאפ',
    'למכור דירה בלי מתווך',
    'דף נחיתה לדירה למכירה',
    'property landing page',
    'real estate landing page israel',
  ],
  authors: [{ name: 'Property Landing Builder' }],
  creator: 'Property Landing Builder',
  openGraph: {
    type: 'website',
    locale: 'he_IL',
    url: BASE,
    siteName: 'Property Landing Builder',
    title: TITLE,
    description: DESC,
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Property Landing Builder — צרו דף נחיתה לנכס',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESC,
    images: ['/opengraph-image'],
  },
  alternates: {
    canonical: BASE,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="he"
      className={`${geistSans.variable} ${geistMono.variable} ${frankRuhl.variable} ${assistant.variable} h-full antialiased`}
    >
      <head>
        {/* Prevent flash of wrong theme */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){var t=localStorage.getItem('pb-theme')||'light';document.documentElement.setAttribute('data-theme',t);})()` }} />
      </head>
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'Property Landing Builder',
              url: BASE,
              description: DESC,
              applicationCategory: 'BusinessApplication',
              operatingSystem: 'Web',
              inLanguage: 'he',
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'ILS' },
            }),
          }}
        />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
