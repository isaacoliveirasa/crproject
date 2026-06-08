import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const cards = await prisma.cardIntelligence.findMany({
      orderBy: { cost: 'asc' },
    });
    return NextResponse.json(cards);
  } catch (error) {
    console.error('Failed to get cards intelligence:', error);
    return NextResponse.json({ error: 'Failed to retrieve card data' }, { status: 500 });
  }
}
