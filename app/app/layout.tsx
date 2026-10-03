import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import Header from "@/components/Header";

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh antialiased">
        <Providers>
          <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-[12px] focus:bg-surface focus:px-4 focus:py-3">
            Skip to content
          </a>
          <Header />
          <main id="main" className="mx-auto w-full max-w-[1400px] px-4 pb-16 pl-[max(16px,env(safe-area-inset-left))] pr-[max(16px,env(safe-area-inset-right))] md:px-6">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
