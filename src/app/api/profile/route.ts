import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const user = await prisma.user.findUnique({
      where: { username: 'sandbox_player' },
      include: {
        attempts: {
          orderBy: { createdAt: 'desc' },
          include: {
            puzzle: {
              select: {
                title: true,
                difficulty: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Failed to fetch profile:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
