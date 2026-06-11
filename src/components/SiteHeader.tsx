'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Swords, MessageSquare, LayoutGrid, BookOpen, Trophy, User } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/puzzles', label: 'Puzzles', icon: Swords, accent: 'text-elixir' },
  { href: '/wiki', label: 'Wiki', icon: BookOpen, accent: 'text-gold' },
  { href: '/deck-builder', label: 'Deck Builder', icon: LayoutGrid, accent: 'text-blue-400' },
  { href: '/forums', label: 'Forums', icon: MessageSquare, accent: 'text-purple-400' },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy, accent: 'text-gold-accent' },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <header className="glass-panel sticky top-0 z-50 border-b border-white/5">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/CTLogo.webp"
              alt="Clash Tactics Logo"
              className="h-8 w-8 object-contain transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6"
            />
            <span className="font-display text-lg font-bold tracking-wide">
              <span className="text-gradient-gold">CLASH</span>
              <span className="text-white/90"> TACTICS</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-7 md:flex">
            {NAV_ITEMS.map(({ href, label, icon: Icon, accent }) => (
              <Link
                key={href}
                href={href}
                data-active={isActive(href)}
                className={`nav-link flex items-center gap-1.5 text-sm font-semibold transition-colors ${
                  isActive(href) ? 'text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Icon className={`h-4 w-4 ${accent}`} /> {label}
              </Link>
            ))}
          </nav>

          {/* Profile / Connect */}
          <div className="hidden items-center gap-2 sm:flex">
            <Link
              href="/profile"
              className="flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-gray-300 transition-all hover:border-white/25 hover:text-white"
            >
              <User className="h-3.5 w-3.5" /> Sandbox Profile
            </Link>
            <button className="btn-shine inline-flex items-center gap-1.5 rounded-lg bg-[#5865F2] px-3 py-1.5 text-xs font-bold text-white shadow-md transition-all hover:bg-[#4752C4]">
              🎮 Connect Discord
            </button>
          </div>

          {/* Mobile profile shortcut */}
          <div className="flex items-center sm:hidden">
            <Link href="/profile" className="p-2 text-gray-300 hover:text-white" title="Profile">
              <User className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-white/5 bg-[#0b0e1a]/92 shadow-2xl backdrop-blur-md md:hidden">
        {NAV_ITEMS.map(({ href, label, icon: Icon, accent }) => (
          <Link
            key={href}
            href={href}
            className={`flex h-full flex-1 flex-col items-center justify-center text-[10px] font-semibold transition-all ${
              isActive(href) ? 'text-white' : 'text-gray-500 hover:text-white'
            }`}
          >
            <Icon className={`mb-0.5 h-[18px] w-[18px] ${isActive(href) ? accent : ''}`} />
            <span>{label === 'Deck Builder' ? 'Decks' : label === 'Leaderboard' ? 'Ranks' : label}</span>
            {isActive(href) && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-gradient-to-r from-elixir to-gold" />}
          </Link>
        ))}
      </nav>
    </>
  );
}
