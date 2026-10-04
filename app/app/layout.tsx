import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import Header from "@/components/Header";
import DataFooter from "@/components/DataFooter";

// self-hosted at build time by next/font: no request to Google at runtime (CSP stays closed)
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: "Constellate",
  description: "An evidence-graded map of rare diseases, organised by shared genes and phenotypes instead of names.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f5f8" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1020" },
  ],
};

// set the stored theme before first paint, so a dark choice never flashes light
const themeScript = `try{var t=localStorage.getItem("constellate.theme");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh antialiased">
        <Providers>
          <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-[12px] focus:bg-surface focus:px-4 focus:py-3">
            Skip to content
          </a>
          <Header />
          <main id="main" className="mx-auto w-full max-w-[1400px] px-4 pb-8 pl-[max(16px,env(safe-area-inset-left))] pr-[max(16px,env(safe-area-inset-right))] md:px-6">
            {children}
          </main>
          <DataFooter />
        </Providers>
      </body>
    </html>
  );
}
