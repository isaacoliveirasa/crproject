'use client';

import React, { useState, useEffect } from 'react';
import { Puzzle, Card, Position, SolutionQuality } from '@/types/game';
import { mockCards } from '@/data/mockData';
import { fetchMergedCards } from '@/lib/cards';
import ArenaStage from './ArenaStage';
import { canDeployAt } from '@/lib/arena/tilemap';
import { HelpCircle, RefreshCw, Play, CheckCircle } from 'lucide-react';

interface PuzzleViewerProps {
  puzzle: Puzzle;
  onNextPuzzle?: () => void;
}

export default function PuzzleViewer({ puzzle, onNextPuzzle }: PuzzleViewerProps) {
  const [cards, setCards] = useState<Record<string, Card>>(mockCards);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(puzzle.hand[0] || null);
  const [placedPosition, setPlacedPosition] = useState<Position | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSolutions, setShowSolutions] = useState(false);
  const [result, setResult] = useState<SolutionQuality | null>(null);
  const [hintIndex, setHintIndex] = useState(-1);
  const [glickoChange, setGlickoChange] = useState<number | null>(null);
  const [towerDamaged, setTowerDamaged] = useState<boolean | null>(null);

  useEffect(() => {
    async function loadCards() {
      const merged = await fetchMergedCards();
      setCards(merged);
    }
    loadCards();
  }, []);

  // Reset all states when a new puzzle is loaded
  useEffect(() => {
    setSelectedCardId(puzzle.hand[0] || null);
    setPlacedPosition(null);
    setIsPlaying(false);
    setShowSolutions(false);
    setResult(null);
    setHintIndex(-1);
    setGlickoChange(null);
    setTowerDamaged(null);
  }, [puzzle.id, puzzle.hand]);

  const selectedCard = selectedCardId ? cards[selectedCardId] : null;

  const handlePlaceCard = (pos: Position) => {
    if (isPlaying) return;
    // Regra do Clash Royale: tropas/construções só na própria metade
    if (!canDeployAt(pos.x, pos.y, { spell: selectedCard?.type === 'spell' })) return;
    setPlacedPosition(pos);
    setResult(null);
  };

  const handleStartSimulation = () => {
    if (!placedPosition) return;
    setIsPlaying(true);
    setResult(null);
  };

  const handleAnimationEnd = async (reachedTarget: boolean, tookDamage: boolean) => {
    setIsPlaying(false);
    setTowerDamaged(tookDamage);
    if (!placedPosition) return;

    try {
      const res = await fetch(`/api/puzzles/${puzzle.id}/attempt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          x: placedPosition.x,
          y: placedPosition.y,
        }),
      });
      
      const data = await res.json();
      if (res.ok) {
        setResult(data.quality);
        setGlickoChange(data.ratingDiff);
      } else {
        console.error('Failed to submit attempt:', data.error);
      }
    } catch (err) {
      console.error('Error submitting attempt:', err);
    }
  };

  const handleReset = () => {
    setPlacedPosition(null);
    setResult(null);
    setIsPlaying(false);
    setGlickoChange(null);
    setTowerDamaged(null);
  };

  const currentHint = hintIndex >= 0 ? puzzle.hints[hintIndex % puzzle.hints.length] : null;

  // Enrich the enemy troop with its official card database icon if available
  const enemyCardId = puzzle.enemyTroop.name
    .toLowerCase()
    .replace(/[\s\.\-]+/g, '-')
    .replace(/[^a-z0-9\-]/g, '')
    .replace(/\-+$/, '')
    .replace(/^\-+/, '');
  const enemyCard = cards[enemyCardId];
  const enrichedEnemyTroop = {
    ...puzzle.enemyTroop,
    icon: enemyCard ? enemyCard.icon : puzzle.enemyTroop.icon,
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-stretch w-full max-w-5xl mx-auto p-2 sm:p-4">
      {/* Interactive Arena Column */}
      <div className="flex justify-center items-center w-full lg:flex-1">
        <ArenaStage
          selectedCard={selectedCard}
          placedPosition={placedPosition}
          onPlaceCard={handlePlaceCard}
          enemyTroop={enrichedEnemyTroop}
          solutions={puzzle.solutions}
          showSolutions={showSolutions}
          isPlaying={isPlaying}
          onAnimationEnd={handleAnimationEnd}
        />
      </div>

      {/* Info & Control Column */}
      <div className="w-full lg:flex-1 flex flex-col justify-between glass-panel p-4 sm:p-6 rounded-xl border border-white/5 shadow-xl min-h-[450px]">
        <div>
          {/* Header metadata */}
          <div className="flex items-center justify-between mb-4">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20 capitalize">
              {puzzle.difficulty}
            </span>
            <span className="text-xs text-gray-400">
              Rating: <span className="text-gold font-bold">{puzzle.glicko}</span> Glicko-2
            </span>
          </div>

          <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white mb-2">{puzzle.title}</h2>
          <p className="text-xs text-gray-400 mb-2">Created by <span className="text-gold-accent font-semibold">@{puzzle.author}</span></p>
          <p className="text-gray-300 text-xs sm:text-sm leading-relaxed mb-6 bg-black/30 p-3 sm:p-4 rounded-lg border border-white/5">
            {puzzle.description}
          </p>

          {/* Cards hand selector */}
          <div className="mb-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Your Deck Hand</h3>
            <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 pt-2 px-2">
              {puzzle.hand.map((cardId) => {
                const card = cards[cardId];
                if (!card) return null;
                const isCurrent = selectedCardId === cardId;

                return (
                  <button
                    key={cardId}
                    onClick={() => setSelectedCardId(cardId)}
                    disabled={isPlaying}
                    className={`relative flex flex-col items-center justify-between p-2.5 sm:p-3 w-16 sm:w-20 h-24 sm:h-28 rounded-lg transition-all duration-200 cursor-pointer shrink-0 ${
                      isCurrent
                        ? 'bg-card-dark border-2 border-elixir shadow-lg scale-105 -translate-y-1'
                        : 'bg-black/40 border border-white/10 hover:border-white/20'
                    }`}
                  >
                    {/* Elixir cost bubble */}
                    <span className="absolute -top-2 -right-2 flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-elixir text-[10px] sm:text-[11px] font-extrabold text-white shadow-md z-10">
                      {card.cost}
                    </span>
                    {card.icon.startsWith('http') ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={card.icon} alt={card.name} className="h-10 sm:h-14 w-auto object-contain mt-1" />
                    ) : (
                      <span className="text-2xl sm:text-3xl mt-1.5 sm:mt-2">{card.icon}</span>
                    )}
                    <span className="text-[8px] sm:text-[10px] font-medium text-gray-300 truncate w-full text-center mt-1 sm:mt-2">
                      {card.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Solution hints */}
          {currentHint && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 p-3 rounded-lg text-xs flex gap-2 items-start mb-6">
              <HelpCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <p>{currentHint}</p>
            </div>
          )}
        </div>

        {/* Buttons & Action Bar */}
        <div>
          {/* Status Display Area */}
          {result && (
            <div
              className={`mb-4 p-4 rounded-lg flex items-center justify-between border ${
                result === 'optimal'
                  ? 'bg-green-500/10 border-green-500/20 text-green-400'
                  : result === 'good'
                  ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                  : result === 'acceptable'
                  ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                  : 'bg-red-500/10 border-red-500/20 text-red-400'
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                <div>
                  <p className="font-bold text-sm capitalize">
                    {result === 'optimal' ? 'Optimal Solution!' : result === 'good' ? 'Good Play!' : result === 'acceptable' ? 'Acceptable Play' : 'Inaccurate Placement'}
                  </p>
                  <p className="text-xs opacity-90">
                    {result === 'optimal'
                      ? 'Perfect pulling. No tower damage taken.'
                      : result === 'good'
                      ? (towerDamaged === false ? 'Good play! No tower damage taken.' : 'Pushed defender out, but path was slightly sub-optimal.')
                      : result === 'acceptable'
                      ? (towerDamaged === false ? 'Acceptable play, no tower damage taken.' : 'Unit pulled, but towers took hits.')
                      : (towerDamaged === false ? 'Giant died at construction, but placement is sub-optimal. Check hints and retry.' : 'Tower took heavy hits. Check hints and retry.')}
                  </p>
                </div>
              </div>
              {glickoChange !== null && (
                <span className={`text-sm font-extrabold px-2 py-1 rounded bg-black/40 ${glickoChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {glickoChange > 0 ? `+${glickoChange}` : glickoChange} Glicko
                </span>
              )}
            </div>
          )}

          {/* Action Row */}
          <div className="flex flex-wrap gap-3">
            {!placedPosition ? (
              <p className="text-xs text-gray-400 w-full mb-1">
                Select a card above, then click on the arena canvas to place it.
              </p>
            ) : (
              <>
                <button
                  onClick={handleStartSimulation}
                  disabled={isPlaying}
                  className="btn-shine flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-elixir hover:bg-elixir-hover disabled:opacity-50 text-white font-semibold text-sm transition-all shadow-lg shadow-elixir/25"
                >
                  <Play className="h-4 w-4" /> Start Arena Simulation
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-2.5 rounded-lg border border-white/10 hover:bg-white/5 text-gray-300 font-semibold text-sm transition-all"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </>
            )}
          </div>

          <div className="flex gap-2 mt-4 pt-4 border-t border-white/5">
            <button
              onClick={() => setHintIndex((prev) => prev + 1)}
              className="text-xs text-gray-400 hover:text-white transition-all flex items-center gap-1"
            >
              💡 Get Hint
            </button>
            <span className="text-gray-600 text-xs">|</span>
            <button
              onClick={() => setShowSolutions(!showSolutions)}
              className={`text-xs transition-all flex items-center gap-1 ${
                showSolutions ? 'text-gold font-semibold' : 'text-gray-400 hover:text-white'
              }`}
            >
              👁️ Show Ideal Tiles
            </button>
            {onNextPuzzle && (
              <>
                <span className="text-gray-600 text-xs ml-auto">|</span>
                <button
                  onClick={onNextPuzzle}
                  className="text-xs text-purple-400 hover:text-purple-300 font-semibold transition-all"
                >
                  Next Puzzle →
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
