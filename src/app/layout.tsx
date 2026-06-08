import type { Metadata } from "next";
import Link from 'next/link';
import "./globals.css";
import { Swords, MessageSquare, LineChart, Cpu, LayoutGrid } from 'lucide-react';

export const metadata: Metadata = {
  title: "Clash Tactics | Clash Royale Community Hub",
  description: "Lichess-inspired open-source platform for Clash Royale positioning puzzles, deck builders, and community forum.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col justify-between">
        {/* Navigation Header */}
        <header className="sticky top-0 z-50 glass-panel border-b border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <span className="text-2xl group-hover:scale-110 transition-transform duration-200">👑</span>
              <span className="font-extrabold text-lg tracking-wider bg-gradient-to-r from-gold via-white to-gold-accent bg-clip-text text-transparent">
                CLASH TACTICS
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/puzzles" className="text-sm font-semibold text-gray-300 hover:text-white transition-colors flex items-center gap-1.5">
                <Swords className="h-4 w-4 text-elixir" /> Puzzles
              </Link>
              <Link href="/wiki" className="text-sm font-semibold text-gray-300 hover:text-white transition-colors flex items-center gap-1.5">
                <span>📖</span> Wiki
              </Link>
              <Link href="/deck-builder" className="text-sm font-semibold text-gray-300 hover:text-white transition-colors flex items-center gap-1.5">
                <LayoutGrid className="h-4 w-4 text-blue-400" /> Deck Builder
              </Link>
              <Link href="/forums" className="text-sm font-semibold text-gray-300 hover:text-white transition-colors flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4 text-purple-400" /> Forums
              </Link>
              <Link href="/leaderboard" className="text-sm font-semibold text-gray-300 hover:text-white transition-colors flex items-center gap-1.5">
                <span>🏆</span> Leaderboard
              </Link>
            </nav>

            {/* Connect & Profile Buttons */}
            <div className="hidden sm:flex items-center gap-2">
              <Link href="/profile" className="text-xs font-semibold text-gray-300 hover:text-white transition-colors bg-white/5 border border-white/10 px-2 py-1.5 rounded-lg whitespace-nowrap">
                👤 Sandbox Profile
              </Link>
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold transition-all shadow-md">
                <span>🎮</span> Connect Discord
              </button>
            </div>
            
            {/* Mobile Connect Icon Profile trigger */}
            <div className="flex sm:hidden items-center gap-1.5">
              <Link href="/profile" className="p-2 text-gray-300 hover:text-white" title="Profile">
                👤
              </Link>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#131726]/90 border-t border-white/5 backdrop-blur-md flex justify-around items-center h-16 shadow-2xl">
          <Link href="/puzzles" className="flex flex-col items-center justify-center flex-1 h-full text-[10px] font-semibold text-gray-400 hover:text-white transition-all">
            <Swords className="h-4.5 w-4.5 mb-0.5 text-elixir" />
            <span>Puzzles</span>
          </Link>
          <Link href="/wiki" className="flex flex-col items-center justify-center flex-1 h-full text-[10px] font-semibold text-gray-400 hover:text-white transition-all">
            <span className="text-sm mb-0.5">📖</span>
            <span>Wiki</span>
          </Link>
          <Link href="/deck-builder" className="flex flex-col items-center justify-center flex-1 h-full text-[10px] font-semibold text-gray-400 hover:text-white transition-all">
            <LayoutGrid className="h-4.5 w-4.5 mb-0.5 text-blue-400" />
            <span>Decks</span>
          </Link>
          <Link href="/forums" className="flex flex-col items-center justify-center flex-1 h-full text-[10px] font-semibold text-gray-400 hover:text-white transition-all">
            <MessageSquare className="h-4.5 w-4.5 mb-0.5 text-purple-400" />
            <span>Forums</span>
          </Link>
          <Link href="/leaderboard" className="flex flex-col items-center justify-center flex-1 h-full text-[10px] font-semibold text-gray-400 hover:text-white transition-all">
            <span className="text-base mb-0.5">🏆</span>
            <span>Ranks</span>
          </Link>
        </nav>

        {/* Footer */}
        <footer className="glass-panel border-t border-white/5 py-8 mt-12 hidden md:block">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">👑</span>
              <span className="text-sm font-bold text-gray-400">Clash Tactics Hub</span>
            </div>
            <p className="text-xs text-gray-500 text-center md:text-left">
              MIT License. Clash Royale assets and concepts are subject to Supercell Fan Content Policy. This site is community-driven and completely ad-free.
            </p>
            <div className="flex gap-4">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:text-white transition-colors">
                GitHub Repo
              </a>
              <span className="text-gray-700">|</span>
              <a href="#" className="text-xs text-gray-400 hover:text-white transition-colors">
                Supercell Policy
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}

