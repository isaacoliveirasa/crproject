'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Loader2, Search, Zap, Swords, Heart, ShieldAlert } from 'lucide-react';
import { Card } from '@/types/game';
import { fetchMergedCards } from '@/lib/cards';

interface CardIntel {
  id: string;
  name: string;
  cost: number;
  type: string;
  movement: string;
  targets: string;
  range: number;
  description: string;
}

export default function WikiPage() {
  const [cardsApi, setCardsApi] = useState<Record<string, Card>>({});
  const [cardsIntel, setCardsIntel] = useState<CardIntel[]>([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const merged = await fetchMergedCards();
        setCardsApi(merged);

        const res = await fetch('/api/cards/intelligence');
        if (res.ok) {
          const data = await res.json();
          setCardsIntel(data);
        }
      } catch (err) {
        console.error('Failed to load wiki data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredCards = cardsIntel.filter((card) => {
    const matchesSearch = card.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filterType === 'all' || card.type === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto px-4">
      {/* Header section with accessible description */}
      <section className="text-center space-y-3 py-6 bg-gradient-to-b from-blue-600/10 to-transparent rounded-2xl border border-white/5 p-6 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-gold/10 rounded-full blur-[60px] pointer-events-none"></div>
        <h1 className="text-3xl sm:text-4xl font-black text-white flex items-center justify-center gap-2 tracking-tight">
          📖 Clash Royale Encyclopedia 📖
        </h1>
        <p className="text-sm sm:text-base text-gray-300 max-w-xl mx-auto">
          Explore how each card works in a simple and direct way! Learn intuitively which cards fly, walk, or target specific defenses on the arena! 🚀
        </p>
      </section>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-black/30 border border-white/5 p-4 rounded-xl">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search card by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-black/50 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-gold placeholder:text-gray-500"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {['all', 'troop', 'building', 'spell'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all border ${
                filterType === type
                  ? 'bg-gold text-black border-gold'
                  : 'bg-black/40 border-white/10 text-gray-400 hover:text-white'
              }`}
            >
              {type === 'all' ? 'All' : type === 'troop' ? 'Troops 🏃‍♂️' : type === 'building' ? 'Buildings 🏰' : 'Spells 🌀'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px]">
          <Loader2 className="h-8 w-8 text-gold animate-spin mb-2" />
          <p className="text-sm text-gray-400">Loading the royal encyclopedia...</p>
        </div>
      ) : (
        /* Cards List Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCards.map((card) => {
            const apiCard = cardsApi[card.id];
            const iconUrl = apiCard?.icon || '🃏';

            return (
              <div
                key={card.id}
                className="glass-panel p-5 rounded-2xl border border-white/5 hover:border-gold/30 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative shadow-xl overflow-hidden group"
              >
                {/* Cost Elixir Bubble */}
                <div className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-full bg-elixir text-sm font-black text-white shadow-lg border border-white/20">
                  {card.cost}
                </div>

                <div className="flex gap-4 items-start">
                  {/* Card graphic */}
                  <div className="w-18 h-22 bg-black/40 rounded-xl border border-white/10 flex items-center justify-center p-1 shrink-0 bg-gradient-to-br from-white/5 to-transparent">
                    {iconUrl.startsWith('http') ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={iconUrl}
                        alt={card.name}
                        className="h-full w-auto object-contain group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <span className="text-4xl">{iconUrl}</span>
                    )}
                  </div>

                  {/* General info */}
                  <div className="space-y-1.5">
                    <h3 className="text-lg font-black text-white group-hover:text-gold transition-colors">
                      {card.name}
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="px-2 py-0.5 text-[9px] font-extrabold tracking-wider uppercase rounded-full bg-white/5 text-gray-300 border border-white/5">
                        {card.type === 'troop' ? 'Troop 🏃‍♂️' : card.type === 'building' ? 'Building 🏰' : 'Spell 🌀'}
                      </span>
                      <span className="px-2 py-0.5 text-[9px] font-extrabold tracking-wider uppercase rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/10">
                        {card.movement === 'air' ? 'Flies 🎈' : card.movement === 'ground' ? 'Walks 🚶‍♂️' : 'Stationary 📍'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Friendly description */}
                <div className="text-xs text-gray-300 mt-4 leading-relaxed bg-black/20 p-3 rounded-xl border border-white/5 space-y-1.5">
                  <p>
                    {card.type === 'spell' ? (
                      <>🎯 <strong>Spell:</strong> Cast anywhere on the arena to activate special area effects!</>
                    ) : card.type === 'building' ? (
                      <>🧱 <strong>Building:</strong> Stationary defense structure that distracts enemies to protect your towers!</>
                    ) : (
                      <>
                        ⚔️ <strong>Target:</strong> Attacks units on the {card.targets === 'buildings' ? 'Buildings 🏰' : card.targets === 'both' ? 'Ground and Air 🦅' : 'Ground 🪓'}!
                      </>
                    )}
                  </p>
                  <p className="text-gray-400 border-t border-white/5 pt-1.5">
                    💡 {card.description || 'A highly versatile card to bring into your custom decks!'}
                  </p>
                </div>

                {/* Target Type badges bottom summary */}
                <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center text-[10px] text-gray-400 font-semibold">
                  <span className="flex items-center gap-1">
                    <Zap className="h-3 w-3 text-gold" /> Range: {card.range} tiles
                  </span>
                  <span className="flex items-center gap-1 capitalize">
                    🎯 Targets: {card.targets === 'both' ? 'all' : card.targets === 'buildings' ? 'buildings' : 'ground'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
