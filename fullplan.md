# Clash Tactics - Full Project Roadmap

This document outlines all development phases for **Clash Tactics**, an open-source, community-driven hub for Clash Royale.

---

## Phase 1: Foundation & Core Canvas Arena Player (Current)
- **Objective**: Establish the development workspace, theme layout, and create the core interactive feature (positioning puzzle player).
- **Deliverables**:
  - Next.js 15, TypeScript, Tailwind CSS, and shadcn/ui initial setup.
  - **Premium Dark Theme**: Clash Royale themed styling (Elixir pink, Crown blue/red, Gold accents).
  - **Interactive 2D Canvas Arena**: A responsive 18x32 grid canvas simulating the Clash Royale arena (bridges, river, towers, drag-and-drop mechanics).
  - **Static JSON Assets**: Card metadata and images sourced from static data templates for offline validation.
  - **Core Game Loop Mock**: Ability to place a card, trigger a simple enemy pathing simulation (e.g. Hog Rider), and see tile feedback ratings (Optimal, Good, Bad).
  - **Deck Builder UI Shell**: Layout for displaying and calculating average elixir cost.

---

## Phase 2: Authentication & Database Architecture
- **Objective**: Introduce persistence, user profiles, and Glicko-2 rating integration.
- **Deliverables**:
  - **PostgreSQL Database Schema**: Models for `User`, `Puzzle`, `Attempt`, `RatingHistory`, and `ForumPost`.
  - **Discord OAuth integration**: Enable login via Discord using Auth.js (NextAuth).
  - **Glicko-2 Engine**: Implementation of the rating calculations for both players and puzzles after puzzle attempts.
  - **User Profiles**: Dashboard showing solved puzzles, historical rating changes, and preferred decks.

---

## Phase 3: Community Curation & Puzzle Builder
- **Objective**: Allow users to create, submit, and rate positioning puzzles.
- **Deliverables**:
  - **Interactive Puzzle Creator**: An editor where creators place enemy units, set target routes, select the user's hand options, and draw color-coded solution tiles (Optimal/Good/Acceptable/Bad).
  - **Curation Dashboard**: A queue for newly submitted puzzles awaiting community voting.
  - **Solution Quality Voting**: Community upvote/downvote mechanics on alternative solution solutions.
  - **Puzzle Search & Filters**: Tags based on cards used, archetype (beatdown, cycle), and Glicko difficulty.

---

## Phase 4: Deck Builder & Supercell API Integration
- **Objective**: Enable full deck creation, stats breakdown, and meta-game statistics.
- **Deliverables**:
  - **Drag-and-Drop Deck Builder**: Grid for 8-card slots with advanced stats (average elixir, damage profiles, air defense capability).
  - **Deck Sharing**: Generates unique share links and social media card previews.
  - **Supercell API Sync**: Worker or serverless route that fetches Clash Royale top-tier meta card pick/win-rates and updates them daily.
  - **Meta Tier List**: Dynamic display of trending decks based on API-ingested game statistics.

---

## Phase 5: Community Forums & Production Readiness
- **Objective**: Add social engagement features and scale infrastructure.
- **Deliverables**:
  - **Topic-based Forums**: Threaded discussions covering strategy, patch notes, clan recruitment, and weekly challenges.
  - **Upstash Redis Cache**: Cache for frequent API queries (Supercell meta statistics) and rate limiting on API endpoints.
  - **Cloudflare R2 Storage**: Bucket storage for custom profile pictures or static puzzle thumbnails.
  - **Observability**: Setup Sentry error monitoring and privacy-friendly Plausible analytics.
  - **Production Deployment**: Railway configuration (Postgres, Next.js host) and Cloudflare DNS configuration.
