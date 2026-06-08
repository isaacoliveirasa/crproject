import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // 1. Fetch top 10 players based on rating
    const topPlayers = await prisma.user.findMany({
      orderBy: { glickoRating: 'desc' },
      take: 10,
      select: {
        id: true,
        username: true,
        glickoRating: true,
        _count: {
          select: { attempts: true },
        },
      },
    });

    // 2. Fetch top 10 hardest puzzles based on rating
    const topPuzzles = await prisma.puzzle.findMany({
      orderBy: { glickoRating: 'desc' },
      take: 10,
      select: {
        id: true,
        title: true,
        difficulty: true,
        glickoRating: true,
      },
    });

    return NextResponse.json({
      players: topPlayers.map((p) => ({
        id: p.id,
        username: p.username,
        rating: Math.round(p.glickoRating),
        attemptsCount: p._count.attempts,
      })),
      puzzles: topPuzzles.map((pz) => ({
        id: pz.id,
        title: pz.title,
        difficulty: pz.difficulty,
        rating: Math.round(pz.glickoRating),
      })),
    });
  } catch (error) {
    console.error('Failed to fetch leaderboard data:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
