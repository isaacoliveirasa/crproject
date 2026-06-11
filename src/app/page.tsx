'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  Swords, Trophy, Users, ArrowRight, Newspaper, Loader2,
  LayoutGrid, BookOpen, MessageSquare, Crosshair, Zap,
} from 'lucide-react';
import Link from 'next/link';

interface NewsItem {
  id: string;
  url: string;
  tag: string;
  date: string;
  title: string;
  description: string;
  readTime: string;
}

const MARQUEE_CARDS = [
  '/assets/cards/giant.png',
  '/assets/cards/musketeer.png',
  '/assets/cards/mini-pekka.png',
  '/assets/cards/cannon.png',
  '/assets/cards/skeletons.png',
  '/assets/cards/ice-spirit.png',
  '/assets/cards/tornado.png',
];

const FEATURES = [
  {
    href: '/puzzles',
    icon: Crosshair,
    accent: 'text-elixir',
    glow: 'from-elixir/20',
    title: 'Positioning Puzzles',
    desc: 'Rated kiting & pull challenges on a real-time WebGL arena. Glicko-2 tracks your skill like chess.',
    cta: 'Train now',
  },
  {
    href: '/deck-builder',
    icon: LayoutGrid,
    accent: 'text-blue-400',
    glow: 'from-blue-500/20',
    title: 'Deck Builder',
    desc: 'Craft 8-card decks with elixir curves, damage profiles and cycle speed analysis.',
    cta: 'Build a deck',
  },
  {
    href: '/wiki',
    icon: BookOpen,
    accent: 'text-gold',
    glow: 'from-gold/20',
    title: 'Card Encyclopedia',
    desc: 'Every stat that matters — ranges, speeds, targeting — synced from the official API.',
    cta: 'Open the wiki',
  },
  {
    href: '/forums',
    icon: MessageSquare,
    accent: 'text-purple-400',
    glow: 'from-purple-500/20',
    title: 'Strategy Forums',
    desc: 'Patch discussions, clan wars decks and positioning guides from the community.',
    cta: 'Join the talk',
  },
];

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 1400;
    const start = performance.now();
    let raf: number;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, target]);

  return (
    <span ref={ref}>
      {value.toLocaleString()}
      {suffix}
    </span>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function Home() {
  const [news, setNews] = useState<NewsItem[]>([]);
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
    <div className="mx-auto max-w-6xl space-y-20 px-4">
      {/* ============ HERO ============ */}
      <section className="relative pt-10 md:pt-16">
        {/* Gradient orbs */}
        <div className="pointer-events-none absolute -right-32 -top-24 h-96 w-96 rounded-full bg-elixir/15 blur-[120px]" />
        <div className="pointer-events-none absolute -left-32 top-40 h-96 w-96 rounded-full bg-crown-blue/15 blur-[120px]" />

        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <motion.p custom={0} variants={fadeUp} initial="hidden" animate="show" className="eyebrow mb-6">
            The open-source training ground · lichess for clash royale
          </motion.p>

          <motion.h1
            custom={1}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="font-display text-5xl font-bold leading-[1.02] tracking-tight text-white md:text-7xl"
          >
            Every tile
            <br />
            <span className="text-gradient-gold">wins or loses</span>
            <br />
            <span className="text-gradient-elixir">the game.</span>
          </motion.h1>

          <motion.p
            custom={2}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-gray-400 md:text-base"
          >
            Master defensive kiting, pulls and king-tower activations on an interactive
            WebGL arena. Solve rated puzzles, climb the Glicko-2 ladder, and study the
            meta with the community.
          </motion.p>

          <motion.div
            custom={3}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            <Link
              href="/puzzles"
              className="btn-shine group inline-flex items-center gap-2 rounded-xl bg-elixir px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-elixir/25 transition-all hover:bg-elixir-hover hover:shadow-elixir/40"
            >
              <Swords className="h-4 w-4" />
              Enter Training Arena
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/wiki"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white transition-all hover:border-white/25 hover:bg-white/10"
            >
              Read Card Wiki
            </Link>
          </motion.div>

          {/* Stats strip */}
          <motion.div
            custom={4}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mx-auto mt-14 grid max-w-2xl grid-cols-3 divide-x divide-white/5 rounded-2xl border border-white/5 bg-black/30 backdrop-blur-sm"
          >
            {[
              { label: 'Active Players', value: 4124, color: 'text-gold' },
              { label: 'Puzzles Solved', value: 1829, color: 'text-elixir' },
              { label: 'Cards Catalogued', value: 121, color: 'text-blue-400' },
            ].map((s) => (
              <div key={s.label} className="px-4 py-5 text-center">
                <p className={`font-display text-2xl font-bold md:text-3xl ${s.color}`}>
                  <AnimatedCounter target={s.value} />
                </p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-500">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Card marquee */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 1 }}
          className="relative mt-16 overflow-hidden py-4 [mask-image:linear-gradient(90deg,transparent,black_15%,black_85%,transparent)]"
        >
          <div className="animate-marquee flex w-max gap-10">
            {[...MARQUEE_CARDS, ...MARQUEE_CARDS, ...MARQUEE_CARDS, ...MARQUEE_CARDS].map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={src}
                alt=""
                className="h-20 w-auto object-contain opacity-70 transition-all duration-300 hover:scale-110 hover:opacity-100 md:h-24"
                style={{ transform: `rotate(${(i % 2 === 0 ? -1 : 1) * 3}deg)` }}
              />
            ))}
          </div>
        </motion.div>
      </section>

      {/* ============ FEATURES ============ */}
      <section className="space-y-8">
        <div className="flex items-end justify-between">
          <div>
            <p className="eyebrow mb-2">What&apos;s inside</p>
            <h2 className="font-display text-2xl font-bold tracking-tight text-white md:text-3xl">
              Built to make you <span className="text-gradient-gold">unbeatable on defense</span>
            </h2>
          </div>
          <Zap className="hidden h-8 w-8 text-gold/40 md:block" />
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.href}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-60px' }}
            >
              <Link
                href={f.href}
                className="card-interactive glass-panel group relative block h-full overflow-hidden rounded-2xl border border-white/5 p-6"
              >
                <div className={`pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br ${f.glow} to-transparent blur-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100`} />
                <f.icon className={`h-7 w-7 ${f.accent}`} />
                <h3 className="font-display mt-4 text-base font-bold text-white">{f.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-gray-400">{f.desc}</p>
                <span className={`mt-4 inline-flex items-center gap-1 text-xs font-bold ${f.accent}`}>
                  {f.cta}
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ============ NEWS + SIDEBAR ============ */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div>
            <p className="eyebrow mb-2">Straight from Supercell</p>
            <h2 className="font-display flex items-center gap-2 text-xl font-bold tracking-tight text-white">
              <Newspaper className="h-5 w-5 text-gold" /> News &amp; Balance Updates
            </h2>
          </div>

          <div className="space-y-5">
            {loadingNews ? (
              <div className="glass-panel flex flex-col items-center justify-center rounded-2xl border border-white/5 p-12">
                <Loader2 className="mb-2 h-6 w-6 animate-spin text-gold" />
                <p className="text-xs text-gray-500">Fetching Clash Royale blog feed...</p>
              </div>
            ) : news.length > 0 ? (
              news.map((item, i) => (
                <motion.a
                  key={item.id}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, margin: '-40px' }}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card-interactive glass-panel group relative block space-y-3 rounded-2xl border border-white/5 p-6"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="rounded-full border border-blue-500/25 bg-blue-500/10 px-2.5 py-0.5 font-bold text-blue-400">
                      {item.tag}
                    </span>
                    <span className="font-mono text-[10px] text-gray-500">{item.date}</span>
                  </div>
                  <h3 className="font-display text-lg font-bold text-white transition-colors group-hover:text-gold">
                    {item.title}
                  </h3>
                  <p className="text-xs leading-relaxed text-gray-400">{item.description}</p>
                  <div className="flex items-center justify-between border-t border-white/5 pt-2 text-[11px] text-gray-500">
                    <span>{item.readTime}</span>
                    <span className="inline-flex items-center gap-1 font-bold text-elixir transition-transform group-hover:translate-x-1">
                      Read on Supercell Blog →
                    </span>
                  </div>
                </motion.a>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-gray-500">
                Could not load news feed. Try again later.
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <section className="glass-panel space-y-4 rounded-2xl border border-white/5 p-6">
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-400">
              <Trophy className="h-4 w-4 text-gold" /> Quick Navigation
            </h3>
            <div className="grid grid-cols-1 gap-2.5">
              {[
                { href: '/puzzles', title: 'Solve Puzzles', sub: 'Rated defense challenges', accent: 'text-elixir' },
                { href: '/deck-builder', title: 'Deck Builder', sub: 'Analyze cycle & synergies', accent: 'text-blue-400' },
                { href: '/leaderboard', title: 'Leaderboard', sub: 'Top rated tacticians', accent: 'text-gold' },
              ].map((q) => (
                <Link
                  key={q.href}
                  href={q.href}
                  className="group flex items-center justify-between rounded-xl border border-white/5 bg-black/30 p-3 transition-all hover:border-white/15"
                >
                  <div>
                    <p className="text-xs font-bold text-white">{q.title}</p>
                    <p className="text-[10px] text-gray-500">{q.sub}</p>
                  </div>
                  <span className={`text-xs ${q.accent} transition-transform group-hover:translate-x-1`}>→</span>
                </Link>
              ))}
            </div>
          </section>

          <section className="glass-panel space-y-4 rounded-2xl border border-white/5 p-6">
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-400">
              <Users className="h-4 w-4 text-blue-400" /> Active Discussions
            </h3>
            <div className="space-y-4">
              <Link href="/forums" className="group block cursor-pointer space-y-1">
                <p className="line-clamp-1 text-xs font-semibold text-gray-300 transition-colors group-hover:text-white">
                  How to properly activate King Tower against Hog Rider + Fire Spirit?
                </p>
                <div className="flex items-center gap-2 text-[10px] text-gray-500">
                  <span>Strategy</span>
                  <span>•</span>
                  <span>14 replies</span>
                </div>
              </Link>
              <Link href="/forums" className="group block cursor-pointer space-y-1 border-t border-white/5 pt-3">
                <p className="line-clamp-1 text-xs font-semibold text-gray-300 transition-colors group-hover:text-white">
                  Weekly Clan Wars Deck Archetypes - Post-Patch Meta Analysis
                </p>
                <div className="flex items-center gap-2 text-[10px] text-gray-500">
                  <span>Clan Wars</span>
                  <span>•</span>
                  <span>32 replies</span>
                </div>
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
