'use client';

import React, { useState, useEffect } from 'react';
import { mockCards } from '@/data/mockData';
import { fetchMergedCards } from '@/lib/cards';
import { Card } from '@/types/game';
import { LayoutGrid, Share2, Trash2, ShieldAlert, Sparkles, Zap, Shield, HelpCircle, Loader2 } from 'lucide-react';

export default function DeckBuilder() {
  const [cards, setCards] = useState<Record<string, Card>>(mockCards);
  const [deck, setDeck] = useState<(Card | null)[]>(Array(8).fill(null));
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCards() {
      try {
        const merged = await fetchMergedCards();
        setCards(merged);
      } finally {
        setLoading(false);
      }
    }
    loadCards();
  }, []);

  // Add card to next empty deck slot
  const handleAddCard = (card: Card) => {
    if (deck.some((c) => c?.id === card.id)) return;

    const firstEmptyIndex = deck.indexOf(null);
    if (firstEmptyIndex !== -1) {
      const newDeck = [...deck];
      newDeck[firstEmptyIndex] = card;
      setDeck(newDeck);
    }
  };

  // Remove card from specific deck index
  const handleRemoveCard = (index: number) => {
    const newDeck = [...deck];
    newDeck[index] = null;
    setDeck(newDeck);
  };

  const clearDeck = () => {
    setDeck(Array(8).fill(null));
  };

  const activeCards = deck.filter((c): c is Card => c !== null);

  // 1. Average Elixir Cost
  const totalElixir = activeCards.reduce((acc, c) => acc + c.cost, 0);
  const averageElixir = activeCards.length > 0 ? (totalElixir / activeCards.length).toFixed(1) : '0.0';

  // 2. 4-Card Cycle Cost (Cheapest 4 cards)
  const getCycleCost = () => {
    if (activeCards.length < 4) return '0.0';
    const sortedCosts = activeCards.map((c) => c.cost).sort((a, b) => a - b);
    const cheapestFourSum = sortedCosts.slice(0, 4).reduce((acc, c) => acc + c, 0);
    return (cheapestFourSum / 4).toFixed(1);
  };

  // 3. Deck Synergies & Warnings
  const checkSynergies = () => {
    const alerts: string[] = [];
    if (activeCards.length === 0) return alerts;

    const hasBuilding = activeCards.some((c) => c.type === 'building');
    const hasSpell = activeCards.some((c) => c.type === 'spell');
    const airDefenseCards = activeCards.filter(
      (c) => c.id === 'musketeer' || c.id === 'ice-spirit' || c.id === 'tornado'
    );

    if (!hasBuilding) {
      alerts.push('No building cards. Vulnerable to direct target building attackers (e.g. Giant, Hog Rider).');
    }
    if (!hasSpell) {
      alerts.push('No spells included. Lacks utility or tower-finishing capability.');
    }
    if (airDefenseCards.length === 0) {
      alerts.push('No air-targeting units! Vulnerable to Balloon or Lava Hound pushes.');
    } else if (airDefenseCards.length < 2 && activeCards.length === 8) {
      alerts.push('Low air defense coverage. Consider adding another air counter.');
    }

    return alerts;
  };

  const getDeckArchetype = () => {
    const avg = parseFloat(averageElixir);
    if (activeCards.length < 8) return 'Incomplete Deck';
    if (avg < 2.9) return 'Fast Cycle ⚡';
    if (avg < 3.6) return 'Control / Balanced 🛡️';
    if (avg <= 4.2) return 'Medium Beatdown ⚔️';
    return 'Heavy Beatdown 🌋';
  };

  const handleShare = () => {
    if (activeCards.length < 8) {
      alert('Fill all 8 card slots to share your deck!');
      return;
    }
    const cardIds = activeCards.map((c) => c.id).join(',');
    const shareUrl = `${window.location.origin}/deck-builder?deck=${cardIds}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Page Title Header */}
      <section className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
          <LayoutGrid className="h-7 w-7 text-blue-400" /> Deck Builder
        </h1>
        <p className="text-sm text-gray-400 max-w-md mx-auto">
          Craft your deck with official high-resolution graphics, analyze elixir cycle ratios, and get direct kiting stats.
        </p>
      </section>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 text-elixir animate-spin mb-2" />
          <p className="text-sm text-gray-400">Loading cards pool...</p>
        </div>
      ) : (
        /* Main Panel Grid */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Active Deck Editor (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold tracking-wider uppercase text-gray-400">
                Active Deck ({activeCards.length} / 8)
              </h2>
              <button
                onClick={clearDeck}
                className="text-xs text-red-400 hover:text-red-300 font-semibold transition-all flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="h-3 w-3" /> Clear Deck
              </button>
            </div>

            {/* 8-Card Grid Slots */}
            <div className="grid grid-cols-4 gap-4">
              {deck.map((card, idx) => (
                <div
                  key={idx}
                  onClick={() => card && handleRemoveCard(idx)}
                  className={`relative flex flex-col items-center justify-center aspect-[3/4] rounded-xl border transition-all duration-200 ${
                    card
                      ? 'bg-card-dark border-white/10 hover:border-red-500/50 hover:scale-95 cursor-pointer shadow-lg p-2'
                      : 'bg-black/30 border-dashed border-white/5 text-gray-600'
                  }`}
                >
                  {card ? (
                    <>
                      <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-elixir text-[10px] font-extrabold text-white shadow-md">
                        {card.cost}
                      </span>
                      {card.icon.startsWith('http') ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={card.icon} alt={card.name} className="h-16 w-auto object-contain mb-1" />
                      ) : (
                        <span className="text-3xl mb-1">{card.icon}</span>
                      )}
                      <span className="text-[9px] font-semibold text-gray-300 truncate w-full text-center px-1">
                        {card.name}
                      </span>
                      <span className="absolute bottom-1 text-[8px] text-red-400 opacity-0 hover:opacity-100 transition-opacity">
                        Remove
                      </span>
                    </>
                  ) : (
                    <span className="text-xs font-semibold select-none">Slot {idx + 1}</span>
                  )}
                </div>
              ))}
            </div>

            {/* Cards pool selector */}
            <div className="space-y-4">
              <h2 className="text-sm font-bold tracking-wider uppercase text-gray-400">
                Available Cards Pool
              </h2>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                {Object.values(cards).map((card) => {
                  const inDeck = deck.some((c) => c?.id === card.id);
                  return (
                    <button
                      key={card.id}
                      onClick={() => handleAddCard(card)}
                      disabled={inDeck}
                      className={`relative flex flex-col items-center p-2.5 rounded-lg border transition-all select-none ${
                        inDeck
                          ? 'bg-black/20 border-white/5 opacity-40 cursor-not-allowed'
                          : 'bg-black/40 border-white/10 hover:border-blue-400 hover:scale-105 cursor-pointer shadow'
                      }`}
                    >
                      <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-elixir/80 text-[9px] font-extrabold text-white">
                        {card.cost}
                      </span>
                      {card.icon.startsWith('http') ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={card.icon} alt={card.name} className="h-10 w-auto object-contain my-1" />
                      ) : (
                        <span className="text-2xl my-1">{card.icon}</span>
                      )}
                      <span className="text-[9px] font-medium text-gray-400 truncate w-full text-center">
                        {card.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Deck Analytics & Sharing (1 Col) */}
          <div className="space-y-6">
            <section className="glass-panel p-6 rounded-xl border border-white/5 space-y-6">
              <h2 className="text-sm font-bold tracking-wider uppercase text-gray-400">
                Deck Analytics
              </h2>

              {/* Elixir Meter */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-gray-400 font-semibold flex items-center gap-1">
                      Average Elixir Cost:
                    </span>
                    <span className="text-3xl font-black text-elixir">{averageElixir}</span>
                  </div>
                  <div className="w-full bg-black/40 rounded-full h-2">
                    <div
                      className="bg-elixir h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((parseFloat(averageElixir) / 6.0) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-white/5">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-gray-400 font-semibold flex items-center gap-1">
                      <Zap className="h-3.5 w-3.5 text-yellow-400" /> 4-Card Cycle Cost:
                    </span>
                    <span className="text-lg font-extrabold text-white">{getCycleCost()}</span>
                  </div>
                </div>
              </div>

              {/* Archetype Card Info */}
              <div className="p-3 bg-black/20 border border-white/5 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-gray-500 font-semibold">Archetype Profile</p>
                  <p className="text-xs font-bold text-white mt-0.5">
                    {getDeckArchetype()}
                  </p>
                </div>
                <span className="text-lg">🛡️</span>
              </div>

              {/* Warnings if card count is low */}
              {activeCards.length > 0 && activeCards.length < 8 && (
                <div className="flex gap-2 items-start text-xs text-yellow-400/90 bg-yellow-500/10 p-3 rounded-lg border border-yellow-500/15">
                  <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                  <p>Add {8 - activeCards.length} more card(s) to finalize and analyze the synergy rating.</p>
                </div>
              )}

              {/* Advanced Synergy Alerts */}
              {activeCards.length === 8 && checkSynergies().length > 0 && (
                <div className="space-y-2 pt-2 border-t border-white/5">
                  <p className="text-xs font-semibold text-red-400">Coverage Vulnerabilities:</p>
                  <div className="space-y-1.5">
                    {checkSynergies().map((alertText, idx) => (
                      <div key={idx} className="flex gap-1.5 items-start text-[10px] text-gray-400 leading-normal bg-black/20 p-2 rounded border border-white/5">
                        <ShieldAlert className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
                        <p>{alertText}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Share Deck Button */}
              <button
                onClick={handleShare}
                disabled={activeCards.length < 8}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold text-sm transition-all shadow-md cursor-pointer"
              >
                <Share2 className="h-4 w-4" /> {copied ? 'Link Copied!' : 'Share Deck Link'}
              </button>
            </section>

            {/* Quick advice */}
            <div className="p-4 rounded-xl border border-white/5 bg-black/20 text-xs text-gray-400 space-y-2">
              <div className="flex items-center gap-1.5 text-white font-semibold">
                <Sparkles className="h-3.5 w-3.5 text-gold" /> Pro builder tip
              </div>
              <p className="leading-relaxed">
                Always ensure you have at least one building pull option (e.g. Cannon) and cycle skeletons to react to tank pushes. An average elixir between 3.0 and 3.8 is optimal for most meta cycles.
              </p>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
