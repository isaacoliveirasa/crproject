'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, Swords, Medal, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface RankedPlayer {
  id: string;
  username: string;
  rating: number;
  attemptsCount: number;
}

interface RankedPuzzle {
  id: string;
  title: string;
  difficulty: string;
  rating: number;
}

export default function LeaderboardPage() {
  const [data, setData] = useState<{ players: RankedPlayer[]; puzzles: RankedPuzzle[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'players' | 'puzzles'>('players');

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        const res = await fetch('/api/leaderboard');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error('Failed to load leaderboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadLeaderboard();
  }, []);

  const getRankBadge = (rank: number) => {
    if (rank === 0) return '🥇';
    if (rank === 1) return '🥈';
    if (rank === 2) return '🥉';
    return `#${rank + 1}`;
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header Info */}
      <section className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
          <Trophy className="h-7 w-7 text-gold" /> Clash Leaderboards
        </h1>
        <p className="text-sm text-gray-400 max-w-md mx-auto">
          Track the top defensive players in the community and the most challenging positioning puzzles.
        </p>
      </section>

      {/* Tabs Control */}
      <div className="flex justify-center">
        <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
          <button
            onClick={() => setActiveTab('players')}
            className={`px-6 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'players'
                ? 'bg-gold text-black shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Medal className="h-4 w-4" /> Top Players
          </button>
          <button
            onClick={() => setActiveTab('puzzles')}
            className={`px-6 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'puzzles'
                ? 'bg-gold text-black shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Swords className="h-4 w-4" /> Hardest Puzzles
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-gold animate-spin mb-2" />
          <p className="text-sm text-gray-400">Loading standings...</p>
        </div>
      ) : !data ? (
        <div className="glass-panel text-center p-8 rounded-xl border border-white/5">
          <p className="text-gray-400 text-sm">Failed to load standings. Try refreshing.</p>
        </div>
      ) : (
        <div className="glass-panel p-6 rounded-xl border border-white/5 shadow-2xl">
          {activeTab === 'players' ? (
            <div className="space-y-4">
              <h2 className="text-sm font-bold tracking-wider uppercase text-gray-400 mb-2">
                Top Defense Specialists
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-gray-500 font-semibold">
                      <th className="py-3 px-4 w-16">Rank</th>
                      <th className="py-3 px-4">Player</th>
                      <th className="py-3 px-4 text-center">Puzzles Attempted</th>
                      <th className="py-3 px-4 text-right">Glicko-2 Rating</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {data.players.map((player, idx) => (
                      <tr key={player.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4 font-bold text-sm">
                          <span className={idx < 3 ? 'text-lg' : 'text-gray-400'}>
                            {getRankBadge(idx)}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-white">
                          @{player.username}
                        </td>
                        <td className="py-3 px-4 text-center text-gray-300">
                          {player.attemptsCount}
                        </td>
                        <td className="py-3 px-4 text-right text-gold font-bold">
                          {player.rating}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-sm font-bold tracking-wider uppercase text-gray-400 mb-2">
                Top Hardest Puzzles
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-gray-500 font-semibold">
                      <th className="py-3 px-4 w-16">Rank</th>
                      <th className="py-3 px-4">Puzzle Title</th>
                      <th className="py-3 px-4 text-center">Difficulty</th>
                      <th className="py-3 px-4 text-right">Puzzle Glicko</th>
                      <th className="py-3 px-4 w-20">Play</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {data.puzzles.map((pz, idx) => (
                      <tr key={pz.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4 font-bold text-sm">
                          <span className={idx < 3 ? 'text-lg' : 'text-gray-400'}>
                            {getRankBadge(idx)}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-white">
                          {pz.title}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 uppercase">
                            {pz.difficulty}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-elixir font-bold">
                          {pz.rating}
                        </td>
                        <td className="py-3 px-4">
                          <Link href="/" className="inline-flex items-center text-purple-400 hover:text-purple-300 font-bold transition-all gap-0.5">
                            Play <ArrowRight className="h-3 w-3" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
