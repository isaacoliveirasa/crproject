import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const posts = await prisma.forumPost.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            username: true,
          },
        },
      },
    });
    return NextResponse.json(posts);
  } catch (error) {
    console.error('Failed to fetch forum posts:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Missing title or content' },
        { status: 400 }
      );
    }

    // Load or create sandbox user
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

    const post = await prisma.forumPost.create({
      data: {
        title,
        content,
        authorId: user.id,
      },
      include: {
        author: {
          select: {
            username: true,
          },
        },
      },
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error('Failed to create forum post:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
