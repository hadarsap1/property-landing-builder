import type { Metadata } from "next";
import { Geist, Geist_Mono, Frank_Ruhl_Libre, Assistant } from "next/font/google";
import Providers from "@/components/providers";
import ToastContainer from "@/components/ui/ToastContainer";
import ConsentBanner from "@/components/consent-banner";
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
  title: "PropBuilder",
  description: "Build beautiful real estate landing pages",
  icons: { icon: '/icon.svg', shortcut: '/icon.svg' },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="he"
      // The whole product is Hebrew. Individual pages set dir on inner
      // wrappers, but the document itself was left LTR, so anything outside
      // those wrappers (and assistive tech reading the page as a whole) got
      // the wrong base direction.
      dir="rtl"
      className={`${geistSans.variable} ${geistMono.variable} ${frankRuhl.variable} ${assistant.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){var t=localStorage.getItem('pb-theme')||'light';document.documentElement.setAttribute('data-theme',t);})()` }} />
      </head>
      <body className="min-h-full flex flex-col font-body">
        {/* First stop for keyboard and screen-reader users, so they can reach
            the content without tabbing through the whole header. */}
        <a href="#main-content" className="pb-skip-link">דלג לתוכן הראשי</a>
        {/* A plain focus target rather than a <main>: several pages declare
            their own main landmark, and nesting them would be its own defect.
            tabIndex -1 lets the skip link move focus here, not just scroll. */}
        <div id="main-content" tabIndex={-1} className="contents">
          <Providers>{children}</Providers>
        </div>
        <ToastContainer />
        <ConsentBanner />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
