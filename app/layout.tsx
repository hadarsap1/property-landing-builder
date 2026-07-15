import type { Metadata } from "next";
import { Geist, Geist_Mono, Frank_Ruhl_Libre, Assistant } from "next/font/google";
import Providers from "@/components/providers";
import CookieNotice from "@/components/CookieNotice";
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

export const metadata: Metadata = {
  title: "Property Landing Builder",
  description: "Build beautiful real estate landing pages",
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
        <script dangerouslySetInnerHTML={{ __html: `(function(){var t=localStorage.getItem('pb-theme')||'light';document.documentElement.setAttribute('data-theme',t);})()` }} />
      </head>
      <body className="min-h-full flex flex-col font-body">
        <Providers>{children}</Providers>
        <CookieNotice />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
