'use client';

import React, { useState, useEffect } from 'react';
import { Flame, Trophy, Users, Star, ArrowRight, Newspaper, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const [news, setNews] = useState<any[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);

  useEffect(() => {
    async function loadNews() {
      try {
        const res = await fetch('/api/news');
        if (res.ok) {
          const data = await res.json();
          setNews(data);
        }
      } catch (err) {
        console.error('Failed to load Supercell news feed:', err);
      } finally {
        setLoadingNews(false);
      }
    }
    loadNews();
  }, []);

  return (
    <div className="space-y-12 max-w-6xl mx-auto px-4">
      {/* Hero Welcome / Banner */}
      <section className="relative overflow-hidden rounded-2xl glass-panel p-8 text-center md:text-left border border-white/5 shadow-2xl">
        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-elixir/10 blur-[100px] pointer-events-none"></div>
        <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-blue-500/10 blur-[100px] pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gold/15 text-gold border border-gold/25">
              ⭐ Premium Clash Hub
            </span>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white leading-tight">
              Master Clash Royale <br/>
              <span className="bg-gradient-to-r from-gold via-white to-gold-accent bg-clip-text text-transparent">Positioning Tactics</span>
            </h1>
            <p className="text-gray-300 text-sm md:text-base leading-relaxed">
              Improve your defensive kiting, pulls, and tower activations. Study our interactive encyclopedia, craft optimized decks, and practice rated community positioning challenges.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link 
                href="/puzzles"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-elixir hover:bg-elixir-hover text-white text-sm font-bold transition-all shadow-md"
              >
                Enter Training Arena <ArrowRight className="h-4 w-4" />
              </Link>
              <Link 
                href="/wiki"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm font-semibold border border-white/10 transition-all"
              >
                Read Card Wiki
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
            <div className="bg-black/40 border border-white/5 p-5 rounded-2xl text-center shadow-lg">
              <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Active Players</p>
              <p className="text-3xl font-black text-gold mt-1">4,124</p>
            </div>
            <div className="bg-black/40 border border-white/5 p-5 rounded-2xl text-center shadow-lg">
              <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Puzzles Solved</p>
              <p className="text-3xl font-black text-elixir mt-1">1,829</p>
            </div>
            <div className="bg-black/40 border border-white/5 p-5 rounded-2xl text-center shadow-lg col-span-2">
              <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Cards Catalogued</p>
              <p className="text-xl font-bold text-blue-400 mt-1">121 Official Cards</p>
            </div>
          </div>
        </div>
      </section>

      {/* Landing Page Content Grid: News Left, Sidebar Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* News and Updates Columns */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Newspaper className="h-5 w-5 text-gold" /> News & Balance Updates
          </h2>

          <div className="space-y-6">
            {loadingNews ? (
              <div className="flex flex-col items-center justify-center p-12 glass-panel rounded-2xl border border-white/5">
                <Loader2 className="h-6 w-6 text-gold animate-spin mb-2" />
                <p className="text-xs text-gray-500">Fetching Clash Royale blog feed...</p>
              </div>
            ) : news.length > 0 ? (
              news.map((item) => (
                <a 
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block glass-panel p-6 rounded-2xl border border-white/5 hover:border-gold/30 hover:-translate-y-0.5 transition-all duration-300 space-y-3 relative group"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="px-2.5 py-0.5 rounded-full font-bold bg-blue-500/10 text-blue-400 border border-blue-500/25">
                      {item.tag}
                    </span>
                    <span className="text-gray-500">{item.date}</span>
                  </div>
                  <h3 className="text-lg font-black text-white group-hover:text-gold transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    {item.description}
                  </p>
                  <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] text-gray-500">
                    <span>{item.readTime}</span>
                    <span className="text-elixir group-hover:translate-x-1 transition-transform inline-flex items-center gap-1 font-bold">
                      Read on Supercell Blog →
                    </span>
                  </div>
                </a>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-gray-500">
                Could not load news feed. Try again later.
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-8">
          
          {/* Quick Actions Shortcuts */}
          <section className="glass-panel p-6 rounded-xl border border-white/5 space-y-4">
            <h3 className="text-sm font-bold tracking-wider uppercase text-gray-400 flex items-center gap-2">
              <Flame className="h-4 w-4 text-elixir" /> Quick Navigation
            </h3>
            <div className="grid grid-cols-1 gap-2.5">
              <Link 
                href="/puzzles"
                className="p-3 bg-black/30 border border-white/5 hover:border-white/10 rounded-lg flex items-center justify-between group transition-all"
              >
                <div>
                  <p className="text-xs font-bold text-white">Solve Puzzles</p>
                  <p className="text-[10px] text-gray-500">Rated defense challenges</p>
                </div>
                <span className="text-xs text-elixir group-hover:translate-x-1 transition-transform">→</span>
              </Link>

              <Link 
                href="/deck-builder"
                className="p-3 bg-black/30 border border-white/5 hover:border-white/10 rounded-lg flex items-center justify-between group transition-all"
              >
                <div>
                  <p className="text-xs font-bold text-white">Deck Builder</p>
                  <p className="text-[10px] text-gray-500">Analyze cycle & synergies</p>
                </div>
                <span className="text-xs text-blue-400 group-hover:translate-x-1 transition-transform">→</span>
              </Link>

              <Link 
                href="/forums"
                className="p-3 bg-black/30 border border-white/5 hover:border-white/10 rounded-lg flex items-center justify-between group transition-all"
              >
                <div>
                  <p className="text-xs font-bold text-white">Strategy Forum</p>
                  <p className="text-[10px] text-gray-500">Discuss with community</p>
                </div>
                <span className="text-xs text-purple-400 group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </div>
          </section>

          {/* Active Discussions Widget */}
          <section className="glass-panel p-6 rounded-xl border border-white/5 space-y-4">
            <h3 className="text-sm font-bold tracking-wider uppercase text-gray-400 flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-400" /> Active Discussions
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-1 block cursor-pointer group">
                <p className="text-xs font-semibold text-gray-300 group-hover:text-white transition-colors line-clamp-1">
                  How to properly activate King Tower against Hog Rider + Fire Spirit?
                </p>
                <div className="flex items-center gap-2 text-[10px] text-gray-500">
                  <span>Strategy</span>
                  <span>•</span>
                  <span>14 replies</span>
                </div>
              </div>

              <div className="space-y-1 block cursor-pointer group border-t border-white/5 pt-3">
                <p className="text-xs font-semibold text-gray-300 group-hover:text-white transition-colors line-clamp-1">
                  Weekly Clan Wars Deck Archetypes - Post-Patch Meta Analysis
                </p>
                <div className="flex items-center gap-2 text-[10px] text-gray-500">
                  <span>Clan Wars</span>
                  <span>•</span>
                  <span>32 replies</span>
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
