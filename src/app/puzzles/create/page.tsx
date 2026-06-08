'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CreatorCanvas from '@/components/CreatorCanvas';
import { Position, SolutionQuality, Card } from '@/types/game';
import { mockCards } from '@/data/mockData';
import { fetchMergedCards } from '@/lib/cards';
import { ArrowLeft, Plus, X, UploadCloud, Brush, Grid, HelpCircle, UserCheck } from 'lucide-react';
import Link from 'next/link';

export default function CreatePuzzlePage() {
  const router = useRouter();
  const [cards, setCards] = useState<Record<string, Card>>(mockCards);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | 'pro'>('easy');
  const [enemyName, setEnemyName] = useState('Giant');
  const [enemyIcon, setEnemyIcon] = useState('👹');
  const [hints, setHints] = useState<string[]>([]);
  const [newHint, setNewHint] = useState('');
  const [hand, setHand] = useState<string[]>([]);

  useEffect(() => {
    async function loadCards() {
      const merged = await fetchMergedCards();
      setCards(merged);
    }
    loadCards();
  }, []);

  // Canvas Editor States
  const [brushType, setBrushType] = useState<'optimal' | 'good' | 'acceptable' | 'clear' | 'enemy-start' | 'enemy-path'>('optimal');
  const [solutions, setSolutions] = useState<Record<string, SolutionQuality>>({});
  const [enemyStart, setEnemyStart] = useState<Position | null>(null);
  const [enemyPath, setEnemyPath] = useState<Position[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Deck Hand selection helper
  const handleToggleCard = (cardId: string) => {
    if (hand.includes(cardId)) {
      setHand(hand.filter((id) => id !== cardId));
    } else {
      if (hand.length >= 4) {
        alert('Hands are limited to max 4 cards for optimal puzzle focus!');
        return;
      }
      setHand([...hand, cardId]);
    }
  };

  // Hints helper
  const handleAddHint = () => {
    if (newHint.trim()) {
      setHints([...hints, newHint.trim()]);
      setNewHint('');
    }
  };

  const handleRemoveHint = (idx: number) => {
    setHints(hints.filter((_, i) => i !== idx));
  };

  const handleResetPath = () => {
    setEnemyStart(null);
    setEnemyPath([]);
  };

  const handlePublish = async () => {
    setError(null);

    // Validation checks
    if (!title.trim() || !description.trim()) {
      setError('Please provide a Title and Description.');
      return;
    }
    if (hand.length === 0) {
      setError('Please select at least one card for your deck hand.');
      return;
    }
    if (!enemyStart) {
      setError('Please set the starting coordinate for the enemy troop on the arena.');
      return;
    }
    if (Object.keys(solutions).length === 0) {
      setError('Please paint at least one Solution tile (Green/Blue/Yellow) on the arena.');
      return;
    }

    setLoading(true);

    const payload = {
      title: title.trim(),
      description: description.trim(),
      difficulty,
      hand,
      enemyTroop: {
        name: enemyName,
        icon: enemyIcon,
        startPos: enemyStart,
        path: enemyPath,
      },
      solutions,
      hints,
    };

    try {
      const res = await fetch('/api/puzzles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.push('/'); // Redirect home on success
      } else {
        const errData = await res.json();
        setError(errData.error || 'Failed to submit puzzle.');
      }
    } catch (err) {
      console.error('Error publishing:', err);
      setError('Network error occurred. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-2 sm:px-4">
      {/* Go Back Link */}
      <div className="flex items-center gap-2">
        <Link href="/" className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-stretch">
        {/* Editor Column - Left */}
        <div className="flex justify-center items-center w-full lg:flex-1">
          <CreatorCanvas
            brushType={brushType}
            solutions={solutions}
            onUpdateSolutions={setSolutions}
            enemyStart={enemyStart}
            onUpdateEnemyStart={setEnemyStart}
            enemyPath={enemyPath}
            onUpdateEnemyPath={setEnemyPath}
          />
        </div>

        {/* Configuration Column - Right */}
        <div className="w-full lg:flex-1 glass-panel p-4 sm:p-6 rounded-xl border border-white/5 shadow-xl flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
              🛠️ Create a Positioning Puzzle
            </h1>

            {/* Error banner */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-xs font-semibold">
                ⚠️ {error}
              </div>
            )}

            {/* Brush settings category bar */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1">
                <Brush className="h-3.5 w-3.5" /> Select Brush Tool
              </h3>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setBrushType('optimal')}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all ${
                    brushType === 'optimal'
                      ? 'bg-green-500/25 border-green-500 text-green-400 shadow-md scale-105'
                      : 'bg-black/40 border-white/5 text-gray-400 hover:text-white'
                  }`}
                >
                  🟢 Paint Optimal
                </button>
                <button
                  onClick={() => setBrushType('good')}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all ${
                    brushType === 'good'
                      ? 'bg-blue-500/25 border-blue-500 text-blue-400 shadow-md scale-105'
                      : 'bg-black/40 border-white/5 text-gray-400 hover:text-white'
                  }`}
                >
                  🔵 Paint Good
                </button>
                <button
                  onClick={() => setBrushType('acceptable')}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all ${
                    brushType === 'acceptable'
                      ? 'bg-yellow-500/25 border-yellow-500 text-yellow-400 shadow-md scale-105'
                      : 'bg-black/40 border-white/5 text-gray-400 hover:text-white'
                  }`}
                >
                  🟡 Paint Acceptable
                </button>
                <button
                  onClick={() => setBrushType('clear')}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all ${
                    brushType === 'clear'
                      ? 'bg-red-500/25 border-red-500 text-red-400 shadow-md scale-105'
                      : 'bg-black/40 border-white/5 text-gray-400 hover:text-white'
                  }`}
                >
                  ❌ Eraser Tool
                </button>
                <button
                  onClick={() => setBrushType('enemy-start')}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all ${
                    brushType === 'enemy-start'
                      ? 'bg-purple-500/25 border-purple-500 text-purple-400 shadow-md scale-105'
                      : 'bg-black/40 border-white/5 text-gray-400 hover:text-white'
                  }`}
                >
                  🏁 Spawn Enemy
                </button>
                <button
                  onClick={() => setBrushType('enemy-path')}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all ${
                    brushType === 'enemy-path'
                      ? 'bg-purple-500/25 border-purple-500 text-purple-400 shadow-md scale-105'
                      : 'bg-black/40 border-white/5 text-gray-400 hover:text-white'
                  }`}
                >
                  ✏️ Draw Route
                </button>
              </div>
              {(enemyStart || enemyPath.length > 0) && (
                <button
                  onClick={handleResetPath}
                  className="text-[10px] text-purple-400 hover:text-purple-300 font-semibold"
                >
                  Reset Enemy Route
                </button>
              )}
            </div>

            {/* Input Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Puzzle Title</label>
                <input
                  type="text"
                  placeholder="e.g. Tornado Pull vs Hog"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-elixir"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-elixir"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                  <option value="pro">Pro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Enemy Unit Name</label>
                <input
                  type="text"
                  placeholder="e.g. Balloon"
                  value={enemyName}
                  onChange={(e) => setEnemyName(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-elixir"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Enemy Emoji Icon</label>
                <input
                  type="text"
                  placeholder="e.g. 🎈"
                  value={enemyIcon}
                  onChange={(e) => setEnemyIcon(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-elixir"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Description</label>
              <textarea
                placeholder="Briefly describe the scenario and puzzle target..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-elixir resize-none"
              />
            </div>

            {/* Hand Selection */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1">
                <Grid className="h-3.5 w-3.5 text-blue-400" /> Select hand cards ({hand.length} / 4)
              </h3>
              <div className="flex flex-wrap gap-2">
                {Object.values(cards).map((card) => {
                  const isSelected = hand.includes(card.id);
                  return (
                    <button
                      key={card.id}
                      onClick={() => handleToggleCard(card.id)}
                      className={`px-3 py-1.5 rounded-lg border text-[10px] font-semibold flex items-center gap-1.5 transition-all ${
                        isSelected
                          ? 'bg-blue-500/20 border-blue-500 text-blue-300 scale-105'
                          : 'bg-black/40 border-white/10 text-gray-400 hover:text-white'
                      }`}
                    >
                      {card.icon.startsWith('http') ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={card.icon} alt={card.name} className="h-5 w-auto object-contain" />
                      ) : (
                        <span>{card.icon}</span>
                      )}
                      <span>{card.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Hints manager */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1">
                <HelpCircle className="h-3.5 w-3.5 text-yellow-400" /> Hints
              </h3>
              {hints.length > 0 && (
                <ul className="space-y-1 bg-black/20 p-2 rounded-lg border border-white/5">
                  {hints.map((hint, idx) => (
                    <li key={idx} className="flex justify-between items-center text-[10px] text-gray-300">
                      <span>💡 {hint}</span>
                      <button onClick={() => handleRemoveHint(idx)} className="text-red-400 hover:text-red-300">
                        <X className="h-3 w-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Try kiting to the opposite lane..."
                  value={newHint}
                  onChange={(e) => setNewHint(e.target.value)}
                  className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-1 text-xs text-white focus:outline-none"
                />
                <button
                  onClick={handleAddHint}
                  className="px-3 py-1 rounded bg-white/5 border border-white/10 text-white text-xs hover:bg-white/10"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={handlePublish}
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-elixir hover:bg-elixir-hover disabled:opacity-50 text-white font-bold text-sm transition-all shadow-md mt-4"
          >
            {loading ? (
              <>Publishing...</>
            ) : (
              <>
                <UploadCloud className="h-4 w-4" /> Publish to Community Hub
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
