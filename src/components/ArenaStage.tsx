'use client';

import React, { useEffect, useRef } from 'react';
import {
  Application,
  Assets,
  Container,
  Graphics,
  Sprite,
  Text,
  Texture,
  Ticker,
} from 'pixi.js';
import { Position, Card, SolutionQuality } from '@/types/game';
import { initSimulation, tickSimulation, Entity, Projectile } from '@/lib/simulatorEngine';
import { canDeployAt, PLAYER_SIDE_MIN_Y, PLAYER_TOWER_FOOTPRINTS } from '@/lib/arena/tilemap';

const GRID_W = 18;
const GRID_H = 32;
const TICK_MS = 100;
// Large base so `simTime - lastAttackTime(0) >= cooldown` on the very first tick,
// matching the old Date.now()-based behavior (instant first attack).
const SIM_TIME_BASE = 1_000_000;

const TOWER_SPRITES = {
  red_king: '/assets/sc/building_tower_out/building_tower_sprite_201.png',
  blue_king: '/assets/sc/building_tower_out/building_tower_sprite_203.png',
  red_princess: '/assets/sc/building_tower_out/building_tower_sprite_199.png',
  blue_princess: '/assets/sc/building_tower_out/building_tower_sprite_200.png',
};

const TEAM_COLORS = {
  blue: { fill: 0x3b82f6, ring: 0x2563eb, hp: 0x22c55e },
  red: { fill: 0xef4444, ring: 0xdc2626, hp: 0xef4444 },
} as const;

const QUALITY_COLORS: Record<SolutionQuality, { fill: number; alpha: number; line: number }> = {
  optimal: { fill: 0x22c55e, alpha: 0.28, line: 0x22c55e },
  good: { fill: 0x3b82f6, alpha: 0.28, line: 0x3b82f6 },
  acceptable: { fill: 0xeab308, alpha: 0.28, line: 0xeab308 },
  bad: { fill: 0xef4444, alpha: 0.16, line: 0xef4444 },
};

const STATIC_TOWERS = [
  { id: 'opp_l_tower', x: 3.5, y: 7.5, team: 'red' as const, king: false },
  { id: 'opp_r_tower', x: 14.5, y: 7.5, team: 'red' as const, king: false },
  { id: 'opp_k_tower', x: 8.5, y: 2.5, team: 'red' as const, king: true },
  { id: 'player_l_tower', x: 3.5, y: 24.5, team: 'blue' as const, king: false },
  { id: 'player_r_tower', x: 14.5, y: 24.5, team: 'blue' as const, king: false },
  { id: 'player_k_tower', x: 8.5, y: 29.5, team: 'blue' as const, king: true },
];

function radiusTiles(name: string): number {
  const n = name.toLowerCase();
  if (n.includes('giant')) return 0.85;
  if (n.includes('mini-pekka') || n.includes('mini p.e.k.k.a')) return 0.58;
  if (n.includes('cannon')) return 0.55;
  if (n.includes('skeleton')) return 0.35;
  return 0.45;
}

interface ArenaStageProps {
  selectedCard: Card | null;
  placedPosition: Position | null;
  onPlaceCard: (pos: Position) => void;
  enemyTroop: {
    name: string;
    icon: string;
    startPos: Position;
    path: Position[];
  };
  solutions: Record<string, SolutionQuality>;
  showSolutions: boolean;
  isPlaying: boolean;
  onAnimationEnd: (reachedTarget: boolean, towerDamaged: boolean) => void;
}

/** A unit to render this frame (already interpolated when simulating). */
interface RenderUnit {
  id: string;
  name: string;
  team: 'blue' | 'red';
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  isTower: boolean;
  isKing: boolean;
  icon: string;
  moving: boolean;
  showHp: boolean;
}

interface UnitNode {
  cont: Container;
  shadow: Graphics;
  body: Graphics;
  iconWrap: Container;
  iconSprite: Sprite | null;
  iconText: Text | null;
  iconUrl: string | null;
  hpBar: Graphics;
  alert: Container;
  towerSprite: Sprite | null;
  towerUrl: string | null;
  isTower: boolean;
  isKing: boolean;
  team: 'blue' | 'red';
  radiusPx: number;
  walkPhase: number;
  spawnAt: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: number;
  kind: 'spark' | 'puff' | 'ring';
}

interface SimSnapshot {
  entities: Entity[];
  projectiles: Projectile[];
}

export default function ArenaStage({
  selectedCard,
  placedPosition,
  onPlaceCard,
  enemyTroop,
  solutions,
  showSolutions,
  isPlaying,
  onAnimationEnd,
}: ArenaStageProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // Latest props readable inside the Pixi ticker without re-initializing.
  const propsRef = useRef({ selectedCard, placedPosition, onPlaceCard, enemyTroop, solutions, showSolutions, isPlaying, onAnimationEnd });
  useEffect(() => {
    propsRef.current = { selectedCard, placedPosition, onPlaceCard, enemyTroop, solutions, showSolutions, isPlaying, onAnimationEnd };
  });

  const hoverRef = useRef<Position | null>(null);
  const invalidClickRef = useRef<{ x: number; y: number; at: number } | null>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    let destroyed = false;
    let resizeObserver: ResizeObserver | null = null;
    const app = new Application();

    // ---- mutable renderer state (closure-scoped) ----
    let tw = 0; // tile width px
    let th = 0; // tile height px
    let elapsed = 0;

    const layers = {
      root: new Container(),
      bg: new Graphics(),
      water: new Graphics(),
      overlay: new Graphics(),
      units: new Container(),
      projectiles: new Graphics(),
      particles: new Graphics(),
      ambient: new Graphics(),
    };

    const texCache = new Map<string, Texture | 'loading' | 'failed'>();
    const unitNodes = new Map<string, UnitNode>();
    const particles: Particle[] = [];
    const projectileTrails = new Map<string, { x: number; y: number }[]>();
    const aggroAt = new Map<string, number>();
    const fireflies = Array.from({ length: 16 }, (_, i) => ({
      seed: i * 137.5,
      x: Math.random(),
      y: Math.random(),
    }));

    const sim = {
      running: false,
      ended: false,
      prev: null as SimSnapshot | null,
      curr: null as SimSnapshot | null,
      acc: 0,
      simTime: SIM_TIME_BASE,
      shake: 0,
    };

    function getTexture(url: string): Texture | null {
      const cached = texCache.get(url);
      if (cached instanceof Texture) return cached;
      if (cached) return null; // loading or failed
      texCache.set(url, 'loading');
      // Cross-origin images need CORS for WebGL textures; the Supercell CDN
      // doesn't send the headers, so remote icons go through our proxy.
      const src = /^https?:\/\//.test(url)
        ? `/api/image-proxy?url=${encodeURIComponent(url)}`
        : url;
      Assets.load<Texture>({ src, parser: 'loadTextures' })
        .then((t) => texCache.set(url, t))
        .catch(() => texCache.set(url, 'failed'));
      return null;
    }

    // ------------------------------------------------------------------
    // Background (rebuilt on resize)
    // ------------------------------------------------------------------
    function buildBackground() {
      const g = layers.bg;
      const w = GRID_W * tw;
      const h = GRID_H * th;
      g.clear();

      // Grass checkerboard
      for (let i = 0; i < GRID_W; i++) {
        for (let j = 0; j < GRID_H; j++) {
          if (j === 15 || j === 16) continue;
          g.rect(i * tw, j * th, tw + 0.5, th + 0.5).fill((i + j) % 2 === 0 ? 0x65a30d : 0x4d7c0f);
        }
      }

      // Grass blade details
      for (let i = 0; i < GRID_W; i++) {
        for (let j = 0; j < GRID_H; j++) {
          if (j === 15 || j === 16) continue;
          if ((i * 3 + j * 7) % 11 === 0) {
            g.moveTo((i + 0.3) * tw, (j + 0.7) * th)
              .lineTo((i + 0.4) * tw, (j + 0.4) * th)
              .lineTo((i + 0.5) * tw, (j + 0.8) * th)
              .stroke({ width: 1, color: 0xffffff, alpha: 0.12 });
          }
        }
      }

      // Dirt lanes
      const drawLane = (xc: number) => {
        g.rect((xc - 0.7) * tw, 0, 1.4 * tw, h).fill(0xd97706);
        g.rect((xc - 0.9) * tw, 0, 0.2 * tw, h).fill({ color: 0x000000, alpha: 0.1 });
        g.rect((xc + 0.7) * tw, 0, 0.2 * tw, h).fill({ color: 0x000000, alpha: 0.1 });
        g.rect((xc - 0.7) * tw, 0, 0.25 * tw, h).fill({ color: 0x9a3412, alpha: 0.45 });
        g.rect((xc + 0.45) * tw, 0, 0.25 * tw, h).fill({ color: 0x9a3412, alpha: 0.45 });
      };
      drawLane(3.5);
      drawLane(14.5);

      // Side forests
      g.rect(0, 0, 1.5 * tw, h).fill(0x14532d);
      g.rect(w - 1.5 * tw, 0, 1.5 * tw, h).fill(0x14532d);
      for (let y = 0; y < h + 24; y += 22) {
        const c1 = y % 3 === 0 ? 0x15803d : y % 3 === 1 ? 0x166534 : 0x14532d;
        const c2 = y % 3 === 0 ? 0x166534 : y % 3 === 1 ? 0x15803d : 0x14532d;
        g.circle(0.5 * tw + (y % 5), y, tw * 0.9).fill(c1);
        g.circle(w - 0.5 * tw - (y % 5), y, tw * 0.9).fill(c2);
      }

      // River basin
      g.rect(1.5 * tw, 15 * th, w - 3 * tw, 2 * th).fill(0x075985);
      g.rect(1.5 * tw, 15.45 * th, w - 3 * tw, 1.1 * th).fill(0x0c3a5e);
      g.rect(1.5 * tw, 15.75 * th, w - 3 * tw, 0.5 * th).fill(0x0b2b47);

      // Stone tower pads — ground the towers so they don't float on grass
      const drawTowerPad = (cx: number, cy: number, span: number) => {
        const x0 = (cx - span / 2) * tw;
        const y0 = (cy - span / 2) * th;
        const wPad = span * tw;
        const hPad = span * th;
        // contact shadow bleeding onto the grass
        g.roundRect(x0 - 3, y0 + 3, wPad + 6, hPad + 4, 10).fill({ color: 0x000000, alpha: 0.18 });
        // stone slab
        g.roundRect(x0, y0, wPad, hPad, 8).fill(0xb5ab94);
        g.roundRect(x0, y0, wPad, hPad, 8).stroke({ width: 2, color: 0x6b6353, alpha: 0.9 });
        // bevel highlight (top) and shade (bottom)
        g.roundRect(x0 + 2, y0 + 2, wPad - 4, hPad * 0.45, 6).fill({ color: 0xffffff, alpha: 0.10 });
        g.roundRect(x0 + 2, y0 + hPad * 0.6, wPad - 4, hPad * 0.4 - 2, 6).fill({ color: 0x000000, alpha: 0.10 });
        // flagstone joints
        for (let k = 1; k < span; k++) {
          g.moveTo(x0 + (k / span) * wPad, y0 + 3)
            .lineTo(x0 + (k / span) * wPad, y0 + hPad - 3)
            .stroke({ width: 1, color: 0x6b6353, alpha: 0.35 });
          g.moveTo(x0 + 3, y0 + (k / span) * hPad)
            .lineTo(x0 + wPad - 3, y0 + (k / span) * hPad)
            .stroke({ width: 1, color: 0x6b6353, alpha: 0.35 });
        }
      };
      STATIC_TOWERS.forEach((t) => drawTowerPad(t.x, t.y, t.king ? 4.2 : 3.2));

      // Bridges
      const drawBridge = (bx: number) => {
        g.rect(bx * tw, 14.6 * th, 2 * tw, 2.8 * th).fill(0x7c2d12);
        const numPlanks = 6;
        const plankH = (2.8 * th) / numPlanks;
        for (let p = 0; p <= numPlanks; p++) {
          g.moveTo(bx * tw, 14.6 * th + p * plankH)
            .lineTo((bx + 2) * tw, 14.6 * th + p * plankH)
            .stroke({ width: 2, color: 0x431407 });
        }
        g.rect(bx * tw, 14.6 * th, 0.15 * tw, 2.8 * th).fill(0x451a03);
        g.rect((bx + 1.85) * tw, 14.6 * th, 0.15 * tw, 2.8 * th).fill(0x451a03);
      };
      drawBridge(2.5);
      drawBridge(13.5);

      // Subtle grid
      for (let x = 0; x <= GRID_W; x++) {
        g.moveTo(x * tw, 0).lineTo(x * tw, h).stroke({ width: 0.5, color: 0xffffff, alpha: 0.07 });
      }
      for (let y = 0; y <= GRID_H; y++) {
        g.moveTo(0, y * th).lineTo(w, y * th).stroke({ width: 0.5, color: 0xffffff, alpha: 0.07 });
      }
    }

    // ------------------------------------------------------------------
    // Animated water + ambient fireflies
    // ------------------------------------------------------------------
    function drawWater(t: number) {
      const g = layers.water;
      const w = GRID_W * tw;
      g.clear();
      for (let k = 0; k < 4; k++) {
        const baseY = (15.3 + k * 0.38) * th;
        const x0 = 1.6 * tw;
        const x1 = w - 1.6 * tw;
        let first = true;
        for (let x = x0; x <= x1; x += 10) {
          const y = baseY + Math.sin(x * 0.045 + t * 0.0016 + k * 1.7) * th * 0.09;
          if (first) {
            g.moveTo(x, y);
            first = false;
          } else {
            g.lineTo(x, y);
          }
        }
        g.stroke({ width: 1.5, color: 0xbae6fd, alpha: 0.12 + 0.05 * Math.sin(t * 0.001 + k) });
      }
      // glints
      for (let k = 0; k < 6; k++) {
        const gx = (2.5 + ((k * 2.63 + t * 0.0004) % 13)) * tw;
        const gy = (15.4 + (k % 3) * 0.5) * th;
        const a = 0.10 + 0.10 * Math.sin(t * 0.004 + k * 2.1);
        if (a > 0.06) g.circle(gx, gy, 1.6).fill({ color: 0xe0f2fe, alpha: a });
      }
    }

    function drawAmbient(t: number) {
      const g = layers.ambient;
      const w = GRID_W * tw;
      const h = GRID_H * th;
      g.clear();
      fireflies.forEach((f) => {
        const x = ((f.x + Math.sin(t * 0.00012 + f.seed) * 0.06) % 1) * w;
        const y = ((f.y + ((t * 0.000016 * (1 + (f.seed % 3))) % 1)) % 1) * h;
        const a = 0.05 + 0.07 * (0.5 + 0.5 * Math.sin(t * 0.002 + f.seed));
        g.circle(x, y, 5).fill({ color: 0xfde68a, alpha: a * 0.4 });
        g.circle(x, y, 1.6).fill({ color: 0xfef9c3, alpha: a * 1.6 });
      });
    }

    // ------------------------------------------------------------------
    // Overlay: solution tiles, hover, range rings, spawn marker
    // ------------------------------------------------------------------
    function drawOverlay(t: number) {
      const g = layers.overlay;
      const p = propsRef.current;
      g.clear();

      const playing = p.isPlaying || sim.running || sim.ended;

      if (!playing && p.showSolutions) {
        Object.entries(p.solutions).forEach(([key, quality]) => {
          const [x, y] = key.split(',').map(Number);
          const c = QUALITY_COLORS[quality] ?? QUALITY_COLORS.bad;
          g.rect(x * tw, y * th, tw, th).fill({ color: c.fill, alpha: c.alpha });
          if (quality !== 'bad') {
            g.rect(x * tw + 0.5, y * th + 0.5, tw - 1, th - 1).stroke({ width: 1, color: c.line, alpha: 0.8 });
          }
        });
      }

      if (!playing) {
        // Enemy spawn pulse
        const ex = (p.enemyTroop.startPos.x + 0.5) * tw;
        const ey = (p.enemyTroop.startPos.y + 0.5) * th;
        const pulse = 0.5 + 0.5 * Math.sin(t * 0.004);
        g.circle(ex, ey, tw * (1.1 + pulse * 0.35)).stroke({ width: 2, color: 0xef4444, alpha: 0.5 - pulse * 0.3 });

        // Placed card range ring
        if (p.placedPosition && p.selectedCard) {
          const px = (p.placedPosition.x + 0.5) * tw;
          const py = (p.placedPosition.y + 0.5) * th;
          const radius = (p.selectedCard.id === 'cannon' ? 5.5 : 4) * tw;
          const breathe = 1 + 0.012 * Math.sin(t * 0.003);
          g.circle(px, py, radius * breathe).fill({ color: 0xe812a6, alpha: 0.07 });
          g.circle(px, py, radius * breathe).stroke({ width: 1.5, color: 0xe812a6, alpha: 0.85 });
          g.circle(px, py, radius * breathe - 4).stroke({ width: 4, color: 0xe812a6, alpha: 0.12 });
        }

        const hov = hoverRef.current;
        const isSpell = p.selectedCard?.type === 'spell';
        const w = GRID_W * tw;

        // While aiming a troop/building, gray out the forbidden zone (CR-style)
        if (hov && p.selectedCard && !isSpell) {
          const yB = PLAYER_SIDE_MIN_Y * th;
          g.rect(0, 0, w, yB).fill({ color: 0x111827, alpha: 0.30 });
          g.rect(0, 0, w, yB).fill({ color: 0x7f1d1d, alpha: 0.10 });
          // Dashed deploy boundary
          for (let x = 1.5 * tw; x < w - 1.5 * tw; x += 16) {
            g.moveTo(x, yB).lineTo(Math.min(x + 8, w - 1.5 * tw), yB).stroke({ width: 2, color: 0xffd700, alpha: 0.55 });
          }
          // Tower footprints are blocked too
          PLAYER_TOWER_FOOTPRINTS.forEach((f) => {
            g.rect(f.x0 * tw, f.y0 * th, (f.x1 - f.x0 + 1) * tw, (f.y1 - f.y0 + 1) * th)
              .fill({ color: 0x111827, alpha: 0.28 });
          });
        }

        // Hover tile — gold when legal, red when blocked
        if (hov && p.selectedCard) {
          const valid = canDeployAt(hov.x, hov.y, { spell: isSpell });
          if (valid) {
            const glow = 0.5 + 0.5 * Math.sin(t * 0.006);
            g.roundRect(hov.x * tw + 1, hov.y * th + 1, tw - 2, th - 2, 3).fill({ color: 0xffd700, alpha: 0.18 + glow * 0.08 });
            g.roundRect(hov.x * tw + 1, hov.y * th + 1, tw - 2, th - 2, 3).stroke({ width: 1.5, color: 0xffd700, alpha: 0.9 });
          } else {
            g.roundRect(hov.x * tw + 1, hov.y * th + 1, tw - 2, th - 2, 3).fill({ color: 0xef4444, alpha: 0.28 });
            g.roundRect(hov.x * tw + 1, hov.y * th + 1, tw - 2, th - 2, 3).stroke({ width: 1.5, color: 0xef4444, alpha: 0.95 });
            const cx = (hov.x + 0.5) * tw;
            const cy = (hov.y + 0.5) * th;
            const s = Math.min(tw, th) * 0.22;
            g.moveTo(cx - s, cy - s).lineTo(cx + s, cy + s).stroke({ width: 2.5, color: 0xfecaca, alpha: 0.95 });
            g.moveTo(cx + s, cy - s).lineTo(cx - s, cy + s).stroke({ width: 2.5, color: 0xfecaca, alpha: 0.95 });
          }
        }

        // Denied-placement flash
        const flash = invalidClickRef.current;
        if (flash) {
          const age = performance.now() - flash.at;
          if (age < 420) {
            const k = age / 420;
            g.roundRect(flash.x * tw + 1, flash.y * th + 1, tw - 2, th - 2, 3).fill({ color: 0xef4444, alpha: 0.35 * (1 - k) });
            g.circle((flash.x + 0.5) * tw, (flash.y + 0.5) * th, tw * (0.5 + k * 1.1))
              .stroke({ width: 2.5 * (1 - k) + 0.5, color: 0xef4444, alpha: 0.6 * (1 - k) });
          } else {
            invalidClickRef.current = null;
          }
        }
      }
    }

    // ------------------------------------------------------------------
    // Unit nodes
    // ------------------------------------------------------------------
    function makeUnitNode(u: RenderUnit): UnitNode {
      const cont = new Container();
      const shadow = new Graphics();
      const body = new Graphics();
      const iconWrap = new Container();
      const hpBar = new Graphics();
      const alert = new Container();

      cont.addChild(shadow);

      const node: UnitNode = {
        cont,
        shadow,
        body,
        iconWrap,
        iconSprite: null,
        iconText: null,
        iconUrl: null,
        hpBar,
        alert,
        towerSprite: null,
        towerUrl: null,
        isTower: u.isTower,
        isKing: u.isKing,
        team: u.team,
        radiusPx: radiusTiles(u.name) * tw,
        walkPhase: Math.random() * 10,
        spawnAt: elapsed,
      };

      if (u.isTower) {
        const key = `${u.team}_${u.isKing ? 'king' : 'princess'}` as keyof typeof TOWER_SPRITES;
        node.towerUrl = TOWER_SPRITES[key];
        const size = tw * (u.isKing ? 4.5 : 3.5);
        // Tight contact shadow — sits on the stone pad instead of hovering
        shadow.ellipse(0, size * 0.38, size * 0.33, size * 0.10).fill({ color: 0x000000, alpha: 0.22 });
        cont.addChild(iconWrap); // tower sprite goes in iconWrap
      } else {
        const r = node.radiusPx;
        shadow.ellipse(0, r * 0.75, r * 0.95, r * 0.38).fill({ color: 0x000000, alpha: 0.32 });

        const colors = TEAM_COLORS[u.team];
        body.circle(0, 0, r).fill(colors.fill);
        body.circle(0, 0, r).stroke({ width: Math.max(2.5, r * 0.16), color: colors.ring });
        body.circle(0, 0, r - 1).stroke({ width: 1, color: 0xfbbf24, alpha: 0.9 });

        iconWrap.addChild(body);

        if (u.icon && u.icon.includes('/')) {
          node.iconUrl = u.icon;
        } else {
          const txt = new Text({
            text: u.icon || u.name.substring(0, 3),
            style: { fontSize: r * 1.1, fill: 0xffffff, fontWeight: '700' },
          });
          txt.anchor.set(0.5);
          iconWrap.addChild(txt);
          node.iconText = txt;
        }
        cont.addChild(iconWrap);
      }

      cont.addChild(hpBar);

      // Aggro alert bubble
      const bubble = new Graphics();
      bubble.circle(0, 0, 9).fill(0xef4444);
      bubble.circle(0, 0, 9).stroke({ width: 1.5, color: 0xffffff, alpha: 0.9 });
      const mark = new Text({ text: '!', style: { fontSize: 13, fill: 0xffffff, fontWeight: '900' } });
      mark.anchor.set(0.5);
      alert.addChild(bubble, mark);
      alert.visible = false;
      cont.addChild(alert);

      layers.units.addChild(cont);
      return node;
    }

    function syncUnitIcon(node: UnitNode) {
      // Attach textures once loaded (troop portrait or tower sprite)
      if (node.isTower && node.towerUrl && !node.towerSprite) {
        const tex = getTexture(node.towerUrl);
        if (tex) {
          const size = tw * (node.isKing ? 4.5 : 3.5);
          const spr = new Sprite(tex);
          spr.anchor.set(0.5, 0.55);
          spr.width = size;
          spr.height = size * (node.isKing ? 1.2 : 1.1);
          node.iconWrap.addChild(spr);
          node.towerSprite = spr;
        } else if (texCache.get(node.towerUrl) === 'failed') {
          // Procedural fallback tower
          const size = tw * (node.isKing ? 4.5 : 3.5);
          const colors = TEAM_COLORS[node.team];
          const fb = new Graphics();
          fb.roundRect(-size * 0.45, -size * 0.3, size * 0.9, size * 0.9, 8).fill(0xa8a29e);
          fb.roundRect(-size * 0.45, -size * 0.3, size * 0.9, size * 0.9, 8).stroke({ width: 2, color: 0x57534e });
          fb.circle(0, -size * 0.1, size * 0.28).fill(colors.fill);
          node.iconWrap.addChild(fb);
          node.towerUrl = null; // done
        }
      }

      if (!node.isTower && node.iconUrl && !node.iconSprite) {
        const tex = getTexture(node.iconUrl);
        const r = node.radiusPx;
        if (tex) {
          const spr = new Sprite(tex);
          spr.anchor.set(0.5);
          const scale = (r * 2 * 0.92) / Math.max(tex.width, tex.height);
          spr.scale.set(scale * 1.25);
          const mask = new Graphics().circle(0, 0, r - 1.5).fill(0xffffff);
          node.iconWrap.addChild(mask, spr);
          spr.mask = mask;
          // Re-stroke rings above the portrait
          const rings = new Graphics();
          const colors = TEAM_COLORS[node.team];
          rings.circle(0, 0, r).stroke({ width: Math.max(2.5, r * 0.16), color: colors.ring });
          rings.circle(0, 0, r - 1).stroke({ width: 1, color: 0xfbbf24, alpha: 0.9 });
          node.iconWrap.addChild(rings);
          node.iconSprite = spr;
        } else if (texCache.get(node.iconUrl) === 'failed') {
          const txt = new Text({
            text: '⚔️',
            style: { fontSize: r * 1.0, fill: 0xffffff },
          });
          txt.anchor.set(0.5);
          node.iconWrap.addChild(txt);
          node.iconText = txt;
          node.iconUrl = null;
        }
      }
    }

    function drawUnits(units: RenderUnit[], dt: number) {
      const seen = new Set<string>();

      units.forEach((u) => {
        seen.add(u.id);
        let node = unitNodes.get(u.id);
        if (!node) {
          node = makeUnitNode(u);
          unitNodes.set(u.id, node);
        }
        syncUnitIcon(node);

        const px = u.x * tw;
        const py = u.y * th;
        node.cont.position.set(px, py);
        node.cont.zIndex = py;

        // Spawn pop-in
        const age = elapsed - node.spawnAt;
        const pop = age < 220 ? easeOutBack(Math.min(1, age / 220)) : 1;
        node.cont.scale.set(pop);

        // Walk bob (squash & stretch + lean)
        if (!u.isTower) {
          if (u.moving) {
            node.walkPhase += dt * 0.022;
            const s = Math.sin(node.walkPhase);
            node.iconWrap.scale.set(1 + Math.abs(s) * 0.015, 1 + s * 0.06);
            node.iconWrap.rotation = Math.sin(node.walkPhase * 0.5) * 0.05;
            node.iconWrap.y = -Math.abs(s) * th * 0.08;
          } else {
            const idle = Math.sin(elapsed * 0.003 + node.walkPhase);
            node.iconWrap.scale.set(1, 1 + idle * 0.012);
            node.iconWrap.rotation *= 0.85;
            node.iconWrap.y *= 0.8;
          }
        }

        // HP bar
        node.hpBar.clear();
        if (u.showHp) {
          const size = u.isTower ? tw * (u.isKing ? 4.5 : 3.5) : 0;
          const barW = u.isTower ? size * 0.8 : tw * 1.2;
          const barH = 4;
          const bx = -barW / 2;
          const by = u.isTower ? size * 0.62 : -th * 0.85 - node.radiusPx * 0.4;
          const pct = Math.max(0, Math.min(1, u.hp / u.maxHp));
          node.hpBar.roundRect(bx - 1, by - 1, barW + 2, barH + 2, 2).fill({ color: 0x0f172a, alpha: 0.85 });
          node.hpBar.roundRect(bx, by, barW * pct, barH, 2).fill(TEAM_COLORS[u.team].hp);
        }

        // Aggro alert
        const aggro = aggroAt.get(u.id);
        if (aggro !== undefined && elapsed - aggro < 900) {
          const a = (elapsed - aggro) / 900;
          node.alert.visible = true;
          node.alert.position.set(0, -th * 1.15 - node.radiusPx * 0.5 - Math.sin(a * Math.PI) * 4);
          node.alert.scale.set(easeOutBack(Math.min(1, a * 4)));
          node.alert.alpha = a > 0.75 ? 1 - (a - 0.75) / 0.25 : 1;
        } else {
          node.alert.visible = false;
        }
      });

      // Remove stale nodes
      unitNodes.forEach((node, id) => {
        if (!seen.has(id)) {
          node.cont.destroy({ children: true });
          unitNodes.delete(id);
        }
      });
    }

    // ------------------------------------------------------------------
    // Projectiles & particles
    // ------------------------------------------------------------------
    function drawProjectiles(projs: { id: string; x: number; y: number; speed: number; tx: number; ty: number }[]) {
      const g = layers.projectiles;
      g.clear();
      const liveIds = new Set<string>();

      projs.forEach((p) => {
        liveIds.add(p.id);
        const px = p.x * tw;
        const py = p.y * th;

        let trail = projectileTrails.get(p.id);
        if (!trail) {
          trail = [];
          projectileTrails.set(p.id, trail);
        }
        trail.push({ x: px, y: py });
        if (trail.length > 6) trail.shift();

        // Trail
        for (let i = 1; i < trail.length; i++) {
          g.moveTo(trail[i - 1].x, trail[i - 1].y)
            .lineTo(trail[i].x, trail[i].y)
            .stroke({ width: 2, color: 0xfde68a, alpha: (i / trail.length) * 0.35 });
        }

        if (p.speed > 8.0) {
          g.circle(px, py, 4.5).fill({ color: 0xfef08a, alpha: 0.35 });
          g.circle(px, py, 2.5).fill(0xfef9c3);
        } else if (p.speed > 7.0) {
          g.circle(px, py, 6).fill(0x4b5563);
          g.circle(px, py, 6).stroke({ width: 1, color: 0x1f2937 });
          g.circle(px - 2, py - 2, 2).fill({ color: 0xffffff, alpha: 0.35 });
        } else {
          const angle = Math.atan2(p.ty - p.y, p.tx - p.x);
          g.moveTo(px, py)
            .lineTo(px - Math.cos(angle) * 0.45 * tw, py - Math.sin(angle) * 0.45 * th)
            .stroke({ width: 2.5, color: 0xf59e0b });
          g.circle(px, py, 2).fill(0xfbbf24);
        }
      });

      projectileTrails.forEach((_, id) => {
        if (!liveIds.has(id)) projectileTrails.delete(id);
      });
    }

    function spawnBurst(x: number, y: number, color: number, count: number, big: boolean) {
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = (0.4 + Math.random() * 1.6) * (big ? 1.6 : 1);
        particles.push({
          x: x * tw,
          y: y * th,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp - 0.4,
          life: 0,
          maxLife: 280 + Math.random() * 320,
          size: (big ? 3.5 : 2.2) + Math.random() * 2,
          color: Math.random() < 0.4 ? 0xffffff : color,
          kind: Math.random() < 0.5 ? 'spark' : 'puff',
        });
      }
      particles.push({
        x: x * tw,
        y: y * th,
        vx: 0,
        vy: 0,
        life: 0,
        maxLife: big ? 450 : 300,
        size: big ? tw * 1.4 : tw * 0.8,
        color,
        kind: 'ring',
      });
    }

    function drawParticles(dt: number) {
      const g = layers.particles;
      g.clear();
      for (let i = particles.length - 1; i >= 0; i--) {
        const pt = particles[i];
        pt.life += dt;
        if (pt.life >= pt.maxLife) {
          particles.splice(i, 1);
          continue;
        }
        const k = pt.life / pt.maxLife;
        if (pt.kind === 'ring') {
          g.circle(pt.x, pt.y, pt.size * (0.3 + k * 0.9)).stroke({ width: 2.5 * (1 - k), color: pt.color, alpha: 0.5 * (1 - k) });
        } else {
          pt.x += pt.vx * dt * 0.06;
          pt.y += pt.vy * dt * 0.06;
          if (pt.kind === 'puff') {
            pt.vy -= 0.002 * dt;
            g.circle(pt.x, pt.y, pt.size * (1 + k * 1.4)).fill({ color: pt.color, alpha: 0.30 * (1 - k) });
          } else {
            pt.vy += 0.0035 * dt;
            g.circle(pt.x, pt.y, pt.size * (1 - k * 0.6)).fill({ color: pt.color, alpha: 0.9 * (1 - k) });
          }
        }
      }
    }

    // ------------------------------------------------------------------
    // Simulation lifecycle
    // ------------------------------------------------------------------
    function startSim() {
      const p = propsRef.current;
      const entities = initSimulation(p.enemyTroop, p.selectedCard, p.placedPosition);
      sim.curr = { entities, projectiles: [] };
      sim.prev = sim.curr;
      sim.acc = 0;
      sim.simTime = SIM_TIME_BASE;
      sim.running = true;
      sim.ended = false;
      aggroAt.clear();
      projectileTrails.clear();
    }

    function resetSim() {
      sim.running = false;
      sim.ended = false;
      sim.prev = null;
      sim.curr = null;
      sim.shake = 0;
      aggroAt.clear();
      projectileTrails.clear();
    }

    function stepSim(dt: number) {
      sim.acc += dt;

      while (sim.acc >= TICK_MS && sim.running && sim.curr) {
        sim.acc -= TICK_MS;
        sim.simTime += TICK_MS;
        const before = sim.curr;

        const { nextEntities, nextProjectiles, aggroTriggeredId } = tickSimulation(
          before.entities,
          before.projectiles,
          sim.simTime
        );

        if (aggroTriggeredId) aggroAt.set(aggroTriggeredId, elapsed);

        // Events: deaths, impacts, tower damage
        nextEntities.forEach((e) => {
          const prevE = before.entities.find((b) => b.id === e.id);
          if (!prevE) return;
          if (prevE.alive && !e.alive) {
            spawnBurst(e.x, e.y, TEAM_COLORS[e.team].fill, e.isTower ? 26 : 14, !!e.isTower);
            if (e.isTower) sim.shake = Math.max(sim.shake, 10);
          }
          if (e.isTower && e.alive && e.hp < prevE.hp) {
            sim.shake = Math.max(sim.shake, e.team === 'blue' ? 5 : 3);
          }
        });

        const nextIds = new Set(nextProjectiles.map((p) => p.id));
        before.projectiles.forEach((p) => {
          if (!nextIds.has(p.id)) {
            const target = nextEntities.find((e) => e.id === p.targetId);
            if (target) spawnBurst(target.x, target.y, 0xfbbf24, 6, false);
          }
        });

        sim.prev = before;
        sim.curr = { entities: nextEntities, projectiles: nextProjectiles };

        // End conditions (same rules as the legacy canvas renderer)
        const activeEnemy = nextEntities.find((e) => e.id === 'enemy_troop' && e.alive);
        if (!activeEnemy || activeEnemy.y > 29) {
          const lDead = !nextEntities.find((e) => e.id === 'player_l_tower')?.alive;
          const rDead = !nextEntities.find((e) => e.id === 'player_r_tower')?.alive;
          const reachedTarget = activeEnemy ? activeEnemy.y > 25 && !lDead && !rDead : false;

          const towers = ['player_l_tower', 'player_r_tower', 'player_k_tower'];
          const towerDamaged = towers.some((id) => {
            const t = nextEntities.find((e) => e.id === id);
            return t ? t.hp < t.maxHp : false;
          });

          sim.running = false;
          sim.ended = true;
          propsRef.current.onAnimationEnd(reachedTarget, towerDamaged);
          break;
        }
      }
    }

    // ------------------------------------------------------------------
    // Frame composition
    // ------------------------------------------------------------------
    function computeUnits(): { units: RenderUnit[]; projs: { id: string; x: number; y: number; speed: number; tx: number; ty: number }[] } {
      const p = propsRef.current;

      if ((sim.running || sim.ended) && sim.curr && sim.prev) {
        const alpha = sim.ended ? 1 : Math.max(0, Math.min(1, sim.acc / TICK_MS));
        const prevById = new Map(sim.prev.entities.map((e) => [e.id, e]));

        const units: RenderUnit[] = sim.curr.entities
          .filter((e) => e.alive)
          .map((e) => {
            const pe = prevById.get(e.id) ?? e;
            const x = pe.x + (e.x - pe.x) * alpha;
            const y = pe.y + (e.y - pe.y) * alpha;
            const moving = Math.hypot(e.x - pe.x, e.y - pe.y) > 0.01;
            return {
              id: e.id,
              name: e.name,
              team: e.team,
              x,
              y,
              hp: e.hp,
              maxHp: e.maxHp,
              isTower: !!e.isTower,
              isKing: !!e.isKing,
              icon: e.icon,
              moving,
              showHp: true,
            };
          });

        const prevProjById = new Map(sim.prev.projectiles.map((pr) => [pr.id, pr]));
        const entById = new Map(sim.curr.entities.map((e) => [e.id, e]));
        const projs = sim.curr.projectiles.map((pr) => {
          const pp = prevProjById.get(pr.id) ?? pr;
          const target = entById.get(pr.targetId);
          return {
            id: pr.id,
            x: pp.x + (pr.x - pp.x) * alpha,
            y: pp.y + (pr.y - pp.y) * alpha,
            speed: pr.speed,
            tx: target ? target.x : pr.x,
            ty: target ? target.y : pr.y,
          };
        });

        return { units, projs };
      }

      // ---- static / placement mode ----
      const units: RenderUnit[] = STATIC_TOWERS.map((t) => ({
        id: t.id,
        name: t.king ? 'King Tower' : 'Princess Tower',
        team: t.team,
        x: t.x,
        y: t.y,
        hp: 1,
        maxHp: 1,
        isTower: true,
        isKing: t.king,
        icon: '',
        moving: false,
        showHp: false,
      }));

      units.push({
        id: 'static_enemy',
        name: p.enemyTroop.name,
        team: 'red',
        x: p.enemyTroop.startPos.x + 0.5,
        y: p.enemyTroop.startPos.y + 0.5,
        hp: 1,
        maxHp: 1,
        isTower: false,
        isKing: false,
        icon: p.enemyTroop.icon,
        moving: false,
        showHp: false,
      });

      if (p.placedPosition && p.selectedCard) {
        units.push({
          id: `static_placed_${p.selectedCard.id}`,
          name: p.selectedCard.name,
          team: 'blue',
          x: p.placedPosition.x + 0.5,
          y: p.placedPosition.y + 0.5,
          hp: 1,
          maxHp: 1,
          isTower: false,
          isKing: false,
          icon: p.selectedCard.icon,
          moving: false,
          showHp: false,
        });
      }

      return { units, projs: [] };
    }

    function frame(ticker: Ticker) {
      const dt = ticker.deltaMS;
      elapsed += dt;
      const p = propsRef.current;

      // Sim lifecycle transitions driven by props
      if (p.isPlaying && !sim.running && !sim.ended) startSim();
      if (!p.isPlaying && (sim.running || sim.ended)) resetSim();
      if (sim.running) stepSim(dt);

      // Screen shake
      if (sim.shake > 0.1) {
        sim.shake *= Math.pow(0.88, dt / 16.7);
        layers.root.position.set((Math.random() - 0.5) * sim.shake, (Math.random() - 0.5) * sim.shake);
      } else {
        layers.root.position.set(0, 0);
      }

      drawWater(elapsed);
      drawAmbient(elapsed);
      drawOverlay(elapsed);

      const { units, projs } = computeUnits();
      drawUnits(units, dt);
      drawProjectiles(projs);
      drawParticles(dt);
    }

    function easeOutBack(x: number): number {
      const c1 = 1.70158;
      const c3 = c1 + 1;
      return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
    }

    function resize() {
      if (!wrapRef.current || destroyed) return;
      const w = wrapRef.current.clientWidth;
      const h = wrapRef.current.clientHeight;
      if (w === 0 || h === 0) return;
      app.renderer.resize(w, h);
      tw = w / GRID_W;
      th = h / GRID_H;
      buildBackground();
      // Rebuild unit nodes at the new scale
      unitNodes.forEach((n) => n.cont.destroy({ children: true }));
      unitNodes.clear();
    }

    (async () => {
      await app.init({
        backgroundAlpha: 1,
        background: 0x14532d,
        antialias: true,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
        autoDensity: true,
        width: Math.max(1, wrap.clientWidth),
        height: Math.max(1, wrap.clientHeight),
      });
      if (destroyed) {
        app.destroy(true, { children: true });
        return;
      }

      wrap.appendChild(app.canvas);
      app.canvas.style.position = 'absolute';
      app.canvas.style.inset = '0';

      app.stage.addChild(layers.root);
      layers.units.sortableChildren = true;
      layers.root.addChild(
        layers.bg,
        layers.water,
        layers.overlay,
        layers.units,
        layers.projectiles,
        layers.particles,
        layers.ambient
      );

      resize();
      resizeObserver = new ResizeObserver(() => resize());
      resizeObserver.observe(wrap);

      app.ticker.add(frame);
    })();

    return () => {
      destroyed = true;
      resizeObserver?.disconnect();
      try {
        app.destroy(true, { children: true });
      } catch {
        // app may not have finished init
      }
    };
    // The stage reads live props through propsRef; it must initialize exactly once.
  }, []);

  // ------------------------------------------------------------------
  // Pointer interaction
  // ------------------------------------------------------------------
  const tileFromEvent = (e: React.PointerEvent<HTMLDivElement>): Position | null => {
    const el = wrapRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * GRID_W);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * GRID_H);
    if (x >= 0 && x < GRID_W && y >= 0 && y < GRID_H) return { x, y };
    return null;
  };

  const canDropAt = (tile: Position) =>
    canDeployAt(tile.x, tile.y, { spell: selectedCard?.type === 'spell' });

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isPlaying) return;
    const tile = tileFromEvent(e);
    hoverRef.current = tile;
    if (tile && selectedCard && e.buttons > 0 && canDropAt(tile)) {
      onPlaceCard(tile);
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isPlaying) return;
    const tile = tileFromEvent(e);
    if (!tile || !selectedCard) return;
    if (canDropAt(tile)) {
      onPlaceCard(tile);
    } else {
      invalidClickRef.current = { x: tile.x, y: tile.y, at: performance.now() };
    }
  };

  const handlePointerLeave = () => {
    hoverRef.current = null;
  };

  return (
    <div className="relative aspect-[9/16] w-full max-w-[400px] select-none">
      {/* Ambient glow behind the arena */}
      <div className="pointer-events-none absolute -inset-4 rounded-[32px] bg-gradient-to-b from-elixir/25 via-transparent to-crown-blue/25 opacity-70 blur-2xl" />

      <div
        ref={wrapRef}
        className="relative h-full w-full cursor-crosshair overflow-hidden rounded-2xl border border-white/10 bg-[#14532d] shadow-2xl"
        style={{ touchAction: 'none' }}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        onPointerLeave={handlePointerLeave}
      />

      {/* Cinematic vignette */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_0_90px_rgba(0,0,0,0.5)]" />

      {/* Status pill */}
      <div className="pointer-events-none absolute left-3 right-3 top-3 flex items-center justify-between rounded-xl border border-white/10 bg-black/55 px-3 py-1.5 text-[11px] font-medium text-white backdrop-blur-md">
        <span className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${isPlaying ? 'animate-ping bg-red-500' : 'bg-green-400'}`} />
          {isPlaying ? 'Simulation Running' : `Enemy: ${enemyTroop.name}`}
        </span>
        <span className="font-mono text-[10px] tracking-wider text-white/50">18×32 · WebGL</span>
      </div>
    </div>
  );
}
