'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Trophy, Clock, CheckCircle2, ChevronRight, Swords } from 'lucide-react';
import Link from 'next/link';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface AttemptData {
  id: string;
  puzzleId: string;
  quality: 'optimal' | 'good' | 'acceptable' | 'bad';
  solved: boolean;
  oldUserRating: number;
  newUserRating: number;
  createdAt: string;
  puzzle: {
    title: string;
    difficulty: string;
  };
}

interface UserProfile {
  id: string;
  username: string;
  email: string;
  glickoRating: number;
  glickoRD: number;
  createdAt: string;
  attempts: AttemptData[];
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch('/api/profile');
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 text-elixir animate-spin mb-2" />
        <p className="text-sm text-gray-400">Loading profile data...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="glass-panel text-center p-8 rounded-xl border border-white/5 max-w-md mx-auto">
        <p className="text-gray-400">No profile found. Solve a puzzle to generate your profile stats!</p>
        <Link href="/" className="mt-4 inline-flex items-center gap-1 text-sm text-elixir hover:text-elixir-hover font-semibold">
          Go to Puzzles <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  // Analytics helper metrics
  const totalSolved = profile.attempts.filter((a) => a.solved).length;
  const totalAttempts = profile.attempts.length;
  const successRate = totalAttempts > 0 ? ((totalSolved / totalAttempts) * 100).toFixed(0) : '0';
  const optimalPulls = profile.attempts.filter((a) => a.quality === 'optimal').length;

  // Build SVG Rating Path
  const ratingHistory = [...profile.attempts]
    .reverse()
    .map((a) => Math.round(a.newUserRating));
  const ratings = [1500, ...ratingHistory]; // include starting rating

  const minRating = Math.min(...ratings, 1400) - 20;
  const maxRating = Math.max(...ratings, 1600) + 20;
  const ratingRange = maxRating - minRating;

  // SVG dimensions
  const svgWidth = 500;
  const svgHeight = 120;
  const padding = 10;

  const points = ratings.map((r, i) => {
    const x = padding + (i / (ratings.length - 1 || 1)) * (svgWidth - padding * 2);
    const y = svgHeight - padding - ((r - minRating) / ratingRange) * (svgHeight - padding * 2);
    return { x, y, rating: r };
  });

  const pathD = points.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header Profile Info Banner */}
      <section className="relative overflow-hidden rounded-2xl glass-panel p-8 border border-white/5 shadow-2xl flex flex-col md:flex-row items-center gap-6 justify-between">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-elixir to-blue-500 flex items-center justify-center text-3xl shadow-lg border border-white/10">
            🎮
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white">@{profile.username}</h1>
            <p className="text-xs text-gray-400">Sandbox Playground Account</p>
          </div>
        </div>

        {/* Rating bubble */}
        <div className="flex gap-4">
          <div className="bg-black/30 border border-white/5 px-6 py-4 rounded-xl text-center shadow flex items-center gap-3">
            <Trophy className="h-6 w-6 text-gold" />
            <div className="text-left">
              <p className="text-[10px] text-gray-400 uppercase font-semibold">Glicko-2 Rating</p>
              <p className="text-2xl font-extrabold text-white">{Math.round(profile.glickoRating)}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Grid: Rating Graph and History Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Rating Trend (2 Cols) */}
        <div className="md:col-span-2 space-y-6">
          <div className="glass-panel p-6 rounded-xl border border-white/5 space-y-4">
            <h2 className="text-sm font-bold tracking-wider uppercase text-gray-400 flex items-center gap-1.5">
              📈 Rating Progression
            </h2>

            {ratings.length <= 1 ? (
              <p className="text-xs text-gray-400 text-center py-12">
                Complete a positioning puzzle to plot your rating trend chart.
              </p>
            ) : (
              <div className="w-full h-56 bg-black/20 p-2 rounded-lg border border-white/5 overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={ratings.map((r, idx) => ({
                      name: idx === 0 ? 'Start' : `#${idx}`,
                      rating: r,
                    }))}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorRating" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#e812a6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#e812a6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.03)" />
                    <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: 9 }} />
                    <YAxis domain={['dataMin - 30', 'dataMax + 30']} stroke="#6b7280" style={{ fontSize: 9 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#181d30',
                        borderColor: 'rgba(255,255,255,0.08)',
                        borderRadius: 8,
                      }}
                      labelStyle={{ color: '#9ca3af', fontSize: 10 }}
                      itemStyle={{ color: '#ffd700', fontSize: 11, fontWeight: 'bold' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="rating"
                      stroke="#e812a6"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorRating)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Puzzle Log History */}
          <div className="glass-panel p-6 rounded-xl border border-white/5 space-y-4">
            <h2 className="text-sm font-bold tracking-wider uppercase text-gray-400">
              Recent Attempts Log
            </h2>

            {profile.attempts.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-8">No attempts recorded yet.</p>
            ) : (
              <div className="divide-y divide-white/5">
                {profile.attempts.map((attempt) => {
                  const ratingDiff = Math.round(attempt.newUserRating - attempt.oldUserRating);
                  return (
                    <div key={attempt.id} className="py-3 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold text-white">{attempt.puzzle.title}</p>
                        <p className="text-[10px] text-gray-400 flex items-center gap-1.5 capitalize mt-0.5">
                          <span className={`inline-block h-1.5 w-1.5 rounded-full ${
                            attempt.quality === 'optimal'
                              ? 'bg-green-500'
                              : attempt.quality === 'good'
                              ? 'bg-blue-500'
                              : attempt.quality === 'acceptable'
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}></span>
                          {attempt.quality} Pull
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs font-extrabold px-1.5 py-0.5 rounded ${
                          ratingDiff >= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                        }`}>
                          {ratingDiff >= 0 ? `+${ratingDiff}` : ratingDiff} Glicko
                        </span>
                        <p className="text-[9px] text-gray-500 mt-0.5">
                          {new Date(attempt.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Stats Column (1 Col) */}
        <div className="space-y-6">
          <section className="glass-panel p-6 rounded-xl border border-white/5 space-y-4">
            <h2 className="text-sm font-bold tracking-wider uppercase text-gray-400">
              Performance Stats
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black/20 border border-white/5 p-3.5 rounded-lg text-center">
                <Clock className="h-5 w-5 text-purple-400 mx-auto mb-1" />
                <p className="text-[10px] text-gray-400 uppercase font-semibold">Attempts</p>
                <p className="text-lg font-bold text-white mt-0.5">{totalAttempts}</p>
              </div>

              <div className="bg-black/20 border border-white/5 p-3.5 rounded-lg text-center">
                <CheckCircle2 className="h-5 w-5 text-green-400 mx-auto mb-1" />
                <p className="text-[10px] text-gray-400 uppercase font-semibold">Success Rate</p>
                <p className="text-lg font-bold text-white mt-0.5">{successRate}%</p>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-white/5">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Optimal Solves:</span>
                <span className="font-semibold text-green-400">{optimalPulls}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Deviation (RD):</span>
                <span className="font-semibold text-gray-200">{Math.round(profile.glickoRD)}</span>
              </div>
            </div>
          </section>

          <Link
            href="/"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-elixir hover:bg-elixir-hover text-white font-semibold text-sm transition-all shadow-md"
          >
            <Swords className="h-4 w-4" /> Back to Arena Training
          </Link>
        </div>

      </div>
    </div>
  );
}
