import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateRatings, GlickoRating } from '@/lib/glicko';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: puzzleId } = await params;
    const body = await request.json();
    const { x, y } = body;

    if (x === undefined || y === undefined) {
      return NextResponse.json({ error: 'Missing x and y coordinates' }, { status: 400 });
    }

    // 1. Get Sandbox User (fallback/mock auth)
    let user = await prisma.user.findUnique({
      where: { username: 'sandbox_player' },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          username: 'sandbox_player',
          email: 'sandbox@clashtactics.org',
        },
      });
    }

    // 2. Fetch the target Puzzle
    const puzzle = await prisma.puzzle.findUnique({
      where: { id: puzzleId },
    });

    if (!puzzle) {
      return NextResponse.json({ error: 'Puzzle not found' }, { status: 404 });
    }

    // 3. Determine solution quality
    const solutionsMap = puzzle.solutions as Record<string, string>;
    const coordKey = `${x},${y}`;
    const quality = solutionsMap[coordKey] || 'bad';

    // Map quality to Glicko score
    let score = 0.0;
    if (quality === 'optimal') score = 1.0;
    else if (quality === 'good') score = 0.75;
    else if (quality === 'acceptable') score = 0.5;

    const solved = quality !== 'bad';

    // 4. Calculate Glicko-2 Rating Adjustments
    const playerStats: GlickoRating = {
      rating: user.glickoRating,
      rd: user.glickoRD,
      volatility: user.glickoVolatility,
    };

    const puzzleStats: GlickoRating = {
      rating: puzzle.glickoRating,
      rd: puzzle.glickoRD,
      volatility: puzzle.glickoVolatility,
    };

    const { player: newPlayer, opponent: newPuzzle } = updateRatings(
      playerStats,
      puzzleStats,
      score
    );

    // 5. Update DB inside a transaction
    const [updatedUser, updatedPuzzle, attempt] = await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          glickoRating: newPlayer.rating,
          glickoRD: newPlayer.rd,
          glickoVolatility: newPlayer.volatility,
        },
      }),
      prisma.puzzle.update({
        where: { id: puzzle.id },
        data: {
          glickoRating: newPuzzle.rating,
          glickoRD: newPuzzle.rd,
          glickoVolatility: newPuzzle.volatility,
        },
      }),
      prisma.attempt.create({
        data: {
          userId: user.id,
          puzzleId: puzzle.id,
          quality,
          solved,
          oldUserRating: user.glickoRating,
          newUserRating: newPlayer.rating,
          oldPuzzleRating: puzzle.glickoRating,
          newPuzzleRating: newPuzzle.rating,
        },
      }),
    ]);

    const ratingDiff = Math.round(newPlayer.rating - user.glickoRating);

    return NextResponse.json({
      quality,
      solved,
      oldRating: Math.round(user.glickoRating),
      newRating: Math.round(newPlayer.rating),
      ratingDiff,
      puzzleRating: Math.round(newPuzzle.rating),
    });

  } catch (error) {
    console.error('Failed to submit puzzle attempt:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
