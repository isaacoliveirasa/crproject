import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const grotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-grotesk",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: "Clash Tactics | Clash Royale Community Hub",
  description: "Lichess-inspired open-source platform for Clash Royale positioning puzzles, deck builders, and community forum.",
  icons: {
    icon: "/CTLogo.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${grotesk.variable} ${jetbrains.variable}`}>
      <body className="flex min-h-screen flex-col justify-between">
        <SiteHeader />

        {/* Page Content */}
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 pb-24 sm:px-6 md:pb-8 lg:px-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="glass-panel mt-12 hidden border-t border-white/5 py-8 md:block">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:px-6 md:flex-row lg:px-8">
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/CTLogo.webp" alt="Clash Tactics Logo" className="h-6 w-6 object-contain" />
              <span className="font-display text-sm font-bold text-gray-400">Clash Tactics Hub</span>
            </div>
            <p className="text-center text-xs text-gray-500 md:text-left">
              MIT License. Clash Royale assets and concepts are subject to Supercell Fan Content Policy. This site is community-driven and completely ad-free.
            </p>
            <div className="flex gap-4">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 transition-colors hover:text-white">
                GitHub Repo
              </a>
              <span className="text-gray-700">|</span>
              <a href="#" className="text-xs text-gray-400 transition-colors hover:text-white">
                Supercell Policy
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
