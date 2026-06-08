# Clash Tactics - Coding Guidelines for AI & Developers

This document defines architectural boundaries, coding styles, and guidelines for writing clean code in the Clash Tactics repository.

---

## 1. Tech Stack Overview
- **Framework**: Next.js (App Router)
- **Language**: TypeScript (strict type checking enabled)
- **Styling**: Tailwind CSS + Custom CSS Variables in `globals.css`
- **UI Components**: shadcn/ui components (radix-ui primitives)
- **State Management**: React `useState` & Custom Canvas State Hooks

---

## 2. Directory Structure

Ensure new modules conform to this standard directory structure:

```text
src/
├── app/                  # Next.js App Router (Routes & Layouts)
│   ├── deck-builder/     # Deck builder pages
│   ├── puzzles/          # Puzzle hub pages
│   └── globals.css       # Core styling & custom animations
├── components/           # Reusable UI component modules
│   ├── ui/               # shadcn/ui primitives
│   ├── ArenaCanvas.tsx   # Canvas puzzle renderer
│   └── PuzzleViewer.tsx  # Game player panel
├── lib/                  # Helper utilities and libraries
│   ├── glicko.ts         # Glicko-2 rating computations
│   └── utils.ts          # Tailwind merge & cn helper
└── types/                # Shared TypeScript models
    └── game.ts           # Puzzle, Card, and Grid types
```

---

## 3. Aesthetic & Design System

Always write UI with high-end premium aesthetics:
- **Colors**: Use the tailored HSL CSS variables for arena styling (`--arena-dark`, `--elixir-pink`, etc.) instead of default tailwind reds/blues.
- **Glassmorphism**: Use backdrop-blur containers (`bg-opacity-5 backdrop-blur-md border border-white/10`) for panels overlaid on top of game fields or dashboards.
- **Micro-animations**: Integrate subtle hover scales, card transition entry animations (`framer-motion` or standard Tailwind transition utilities).

---

## 4. Coding Practices & Rules

- **Client vs. Server Components**: 
  - Declare `"use client"` at the top of files that utilize browser APIs (such as the Canvas 2D puzzle player, drag-and-drop handles, or interactive state).
  - Use server components for data fetching or static layouts where possible.
- **No Placeholders**: Avoid writing placeholder layout blocks or text. If an image is missing, construct SVG templates or use canvas drawings instead of generic empty grey blocks.
- **Canvas Rendering Rules**:
  - Keep canvas animation frame loops inside standard `requestAnimationFrame` lifecycle hooks to avoid memory leaks.
  - Scale the canvas drawing context based on the device pixel ratio (`window.devicePixelRatio`) to ensure vector lines are sharp on retina screens.
