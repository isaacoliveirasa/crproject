<div align="center">

# 🏰 Clash Tactics (CRHub)

### An Interactive Training Arena, Deck Builder, and Strategy Hub for Clash Royale

[![Next.js](https://img.shields.io/badge/Next.js-16.2-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7.8-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind--CSS-4.0-38B2AC?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-Upstash-FF4438?style=for-the-badge&logo=redis&logoColor=white)](https://upstash.com/)

**Clash Tactics** is an open-source, community-driven interactive simulator and strategic helper for Clash Royale. Created by a passionate Clash Royale player, the project is designed to help players sharpen their placement skills, practice defensive kiting maneuvers, analyze deck synergies, and collaborate on advanced strategy.

[🚀 Quick Start](#-quick-start) · [🛠️ System Architecture](#-system-architecture) · [⚙️ Configuration](#-step-by-step-setup-guide) · [🧪 Testing](#-testing)

---

</div>

---

## 🌟 What is Clash Tactics?

Instead of relying on passive video guides, **Clash Tactics** introduces an interactive 2D Arena Canvas where players can practice micro-positioning challenges in real-time. Place defensive cards (e.g. Cannon, Skeletons, Ice Spirit) on an 18x32 grid to pull and kite incoming enemy troops (e.g. Giant, Hog Rider, Mini P.E.K.K.A) into the princess towers' range.

Every solve attempt updates player and puzzle ratings dynamically using the Glicko-2 rating system, mirroring competitive skill levels.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🎮 **Interactive Arena Canvas** | An 18x32 grid mimicking the official Clash Royale field for real-time pull, kite, and king tower activation drills. |
| 🧠 **Glicko-2 Rating Engine** | Automatically computes player skill levels and puzzle difficulty changes after each attempt. |
| 🎴 **Deck Builder & Synergizer** | Design custom 8-card decks with detailed statistics (average elixir, damage type profiles, cycle speed). |
| 📖 **Card Wiki (Encyclopedia)** | Complete card catalog populated dynamically from the official Clash Royale API, listing movement speeds, ranges, and targeting fields. |
| 💬 **Strategy Forums** | A community board to discuss patch notes, clan wars decks, positioning guides, and recruitment. |
| 🏆 **Leaderboards** | Tracks player performance ratings based on positioning challenge solve rates. |

---

## 🛠️ System Architecture

Our hub separates client interactions, positioning calculations, database queries, and third-party APIs:

```mermaid
graph TD
    User([Clash Royale Player]) -->|Interacts| Client[Next.js Client]
    Client -->|Drag & Drop Placement| Canvas[Interactive 2D Arena Canvas]
    Client -->|API Requests / Page Navigation| Server[Next.js Server Actions & API Routes]
    
    Server -->|Calculates Rating Shifts| Glicko[Glicko-2 Math Engine]
    Server -->|Queries & Updates| Prisma[Prisma ORM Client]
    Prisma -->|Persists Data| Postgres[(PostgreSQL Database)]
    
    Server -->|Sync Card Data| CRAPI[Official Clash Royale API]
    Server -->|Rate Limiting & Cache| Redis[(Upstash Redis Cache)]
    Server -->|Static Asset Uploads| R2[(Cloudflare R2 Storage)]
```

---

## ⚙️ Step-by-Step Setup Guide

Follow these steps to configure, build, and run the project locally.

### Step 1: Install Dependencies
1. Clone the repository:
   ```bash
   git clone https://github.com/isaacoliveirasa/crproject.git
   cd crproject
   ```
2. Install the package dependencies:
   ```bash
   npm install
   ```

### Step 2: Configure PostgreSQL & Prisma ORM
1. Ensure you have a running PostgreSQL instance (local or hosted).
2. Set up your connection string inside the `.env` file (see [Step 5](#step-5-fill-your-env-file) below).
3. Apply schema migrations:
   ```bash
   npx prisma db push
   ```
4. Seed default puzzles and test sandbox users:
   ```bash
   npx prisma db seed
   ```

### Step 3: Fetch Official Cards (Supercell API)
1. Go to the [Clash Royale Developer API Portal](https://developer.clashroyale.com/).
2. Register an account and create a key matching your developer IP address.
3. Add `CLASH_ROYALE_API_KEY` to your `.env` file.
4. Execute the card sync script to populate the card database:
   ```bash
   npx tsx scratch/fetch_cards.ts
   ```

### Step 4: Configure Redis Cache & Cloudflare R2 (Optional)
1. Create a serverless database in the [Upstash Console](https://upstash.com) and obtain the REST URL and token for caching.
2. Set up a [Cloudflare R2 Bucket](https://www.cloudflare.com/products/r2/) to upload custom thumbnails or strategies.
3. Populate variables `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, and `R2_*` in `.env`.

### Step 5: Fill Your `.env` File
Create a `.env` file in the root of the workspace. Use `.env.example` as a template:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/clash_tactics?schema=public"
CLASH_ROYALE_API_KEY="your_clash_royale_developer_api_key"

# Upstash Redis (Optional fallback to local memory)
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."

# Cloudflare R2 Bucket (Optional fallback to local assets)
R2_ACCOUNT_ID="..."
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_BUCKET_NAME="clash-tactics-assets"
R2_CUSTOM_DOMAIN="https://..."
```

---

## 🚀 Quick Start

### 1. Compile and Run Locally
Start the Next.js development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

### 2. Build for Production
Create an optimized production build:
```bash
npm run build
```

---

## 🧪 Testing

We run unit and integration tests using Vitest to verify rating engine calculations and simulator grids.

Run the test suite:
```bash
npm test
```

Expected output:
```text
 ✓ src/lib/__tests__/validate.test.ts (4 tests)
 ✓ src/lib/glicko.test.ts (2 tests)
 ✓ src/lib/__tests__/simulatorEngine.test.ts (4 tests)

 Test Files  3 passed (3)
      Tests  10 passed (10)
```

---

## 🔒 Security & Git Checks

1. **`.env` Ignored**: Secrets and API tokens are never committed to GitHub (ensured by `.gitignore` with `.env*`).
2. **Template Variables**: A `.env.example` file is provided to replicate local settings without exposing actual credentials.
3. **Strict Git Validation**: Always verify untracked files before committing changes to avoid committing temporary data or test files.

---

## 👨‍💻 About the Author

<div align="center">  
  Hello, my name is <strong>Isaac Sa</strong>. I have been developing systems for over 20 years. This project is a practical application of the knowledge I acquired when completing Google's <strong>Agent Development Kit (ADK) course</strong>, which I highly recommend taking! You can check it out here: <a href="https://www.skills.google/paths?pathslistid=agents">Google ADK Course</a>.
</div>

Let's connect:
- **Personal Website:** [isaacsa.com](https://isaacsa.com)
- **Email:** hi@isaacsa.com
- **GitHub:** [github.com/isaacoliveirasa](https://github.com/isaacoliveirasa/)
- **Google Developer Community:** Join us on [Discord](https://discord.gg/9w9hEj3Z)

<div align="center">  
   <img src="https://isaacsa.com/avatar.png" alt="Isaac Sa Avatar" width="120" style="border-radius: 50%;" />
</div>

---

## 📄 License
This project is open-source and licensed under the MIT License.
