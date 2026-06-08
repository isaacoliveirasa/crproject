import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import PuzzleViewer from '@/components/PuzzleViewer';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PuzzleDetailPage({ params }: PageProps) {
  const { id } = await params;
  
  const puzzle = await prisma.puzzle.findUnique({
    where: { id },
  });

  if (!puzzle) {
    notFound();
  }

  const parsedPuzzle = {
    ...puzzle,
    glicko: Math.round(puzzle.glickoRating),
    hand: typeof puzzle.hand === 'string' ? JSON.parse(puzzle.hand) : puzzle.hand,
    enemyTroop: typeof puzzle.enemyTroop === 'string' ? JSON.parse(puzzle.enemyTroop) : puzzle.enemyTroop,
    solutions: typeof puzzle.solutions === 'string' ? JSON.parse(puzzle.solutions) : puzzle.solutions,
    hints: typeof puzzle.hints === 'string' ? JSON.parse(puzzle.hints) : puzzle.hints,
    author: 'Supercell',
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <Link href="/puzzles" className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-all">
        <ArrowLeft className="h-4 w-4" /> Back to Puzzles
      </Link>
      <PuzzleViewer puzzle={parsedPuzzle as any} />
    </div>
  );
}
