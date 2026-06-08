import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const puzzles = await prisma.puzzle.findMany({
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json(puzzles);
  } catch (error) {
    console.error('Failed to fetch puzzles:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, difficulty, hand, enemyTroop, solutions, hints } = body;

    // Simple validation
    if (!title || !description || !difficulty || !hand || !enemyTroop || !solutions || !hints) {
      return NextResponse.json(
        { error: 'Missing required puzzle configuration fields' },
        { status: 400 }
      );
    }

    const puzzle = await prisma.puzzle.create({
      data: {
        title,
        description,
        difficulty,
        glickoRating: 1200.0, // default rating for community submissions
        glickoRD: 350.0,
        glickoVolatility: 0.06,
        hand,
        enemyTroop,
        solutions,
        hints,
      },
    });

    return NextResponse.json(puzzle, { status: 201 });
  } catch (error) {
    console.error('Failed to create community puzzle:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
