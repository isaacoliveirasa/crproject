'use client';

import React, { useState, useEffect } from 'react';
import PuzzleViewer from '@/components/PuzzleViewer';
import { Puzzle } from '@/types/game';
import { Swords, Loader2, ArrowLeft, Plus } from 'lucide-react';
import Link from 'next/link';

export default function PuzzlesPage() {
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePuzzleIndex, setActivePuzzleIndex] = useState(0);

  useEffect(() => {
    async function loadPuzzles() {
      try {
        const res = await fetch('/api/puzzles');
        const data = await res.json();
        
        const parsedPuzzles = data.map((p: any) => ({
          ...p,
          glicko: Math.round(p.glickoRating),
          hand: typeof p.hand === 'string' ? JSON.parse(p.hand) : p.hand,
          enemyTroop: typeof p.enemyTroop === 'string' ? JSON.parse(p.enemyTroop) : p.enemyTroop,
          solutions: typeof p.solutions === 'string' ? JSON.parse(p.solutions) : p.solutions,
          hints: typeof p.hints === 'string' ? JSON.parse(p.hints) : p.hints,
          author: p.author || 'Supercell',
        }));

        setPuzzles(parsedPuzzles);
      } catch (err) {
        console.error('Failed to load puzzles:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPuzzles();
  }, []);

  const activePuzzle = puzzles[activePuzzleIndex];

  const handleNextPuzzle = () => {
    if (puzzles.length > 0) {
      setActivePuzzleIndex((prev) => (prev + 1) % puzzles.length);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto px-4">
      {/* Header and Create Button */}
      <section className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-purple-900/10 to-transparent p-6 rounded-2xl border border-white/5 shadow-lg">
        <div className="space-y-1 text-center sm:text-left">
          <h1 className="text-3xl font-black text-white flex items-center justify-center sm:justify-start gap-2">
            <Swords className="h-7 w-7 text-elixir" /> Position Training Arena
          </h1>
          <p className="text-sm text-gray-300">
            Select a rated positioning puzzle to practice your kiting, pulling, and defense tactics!
          </p>
        </div>
        <Link 
          href="/puzzles/create"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-elixir hover:bg-elixir-hover text-white text-sm font-bold transition-all shadow-md shrink-0"
        >
          <Plus className="h-4 w-4" /> Create Custom Puzzle
        </Link>
      </section>

      {/* Main Grid: Puzzle Player */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold tracking-wider uppercase text-gray-400">
            Available Puzzles ({puzzles.length})
          </h2>
          
          {/* Puzzle Selector Tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 max-w-[200px] sm:max-w-md">
            {!loading && puzzles.map((p, idx) => (
              <button
                key={p.id}
                onClick={() => setActivePuzzleIndex(idx)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all shrink-0 ${
                  activePuzzleIndex === idx
                    ? 'bg-elixir text-white shadow-md'
                    : 'bg-black/40 text-gray-400 hover:text-white border border-white/5'
                }`}
              >
                #{idx + 1}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="glass-panel flex flex-col items-center justify-center min-h-[500px] rounded-xl border border-white/5">
            <Loader2 className="h-8 w-8 text-elixir animate-spin mb-2" />
            <p className="text-sm text-gray-400">Loading arena puzzles...</p>
          </div>
        ) : activePuzzle ? (
          <PuzzleViewer 
            puzzle={activePuzzle} 
            onNextPuzzle={handleNextPuzzle}
          />
        ) : (
          <div className="glass-panel flex flex-col items-center justify-center min-h-[500px] rounded-xl border border-white/5">
            <p className="text-sm text-gray-400">No puzzles found in database.</p>
          </div>
        )}
      </div>
    </div>
  );
}
