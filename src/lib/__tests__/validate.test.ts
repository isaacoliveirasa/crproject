import { describe, it, expect } from 'vitest';
import { validatePlacement } from '../puzzles/validate';
import { Puzzle } from '../puzzles/types';

describe('validatePlacement', () => {
  const mockPuzzle: Puzzle = {
    id: 'test-puzzle',
    title: 'Test',
    description: 'Test',
    difficulty: 'easy',
    rating: 1200,
    enemyTroops: [],
    playerHand: ['cannon'],
    solution: {
      cardType: 'cannon',
      validTiles: [{ x: 8, y: 16 }, { x: 9, y: 16 }],
    },
    tolerance: 1,
  };

  it('should return correct for exact matches', () => {
    const res = validatePlacement(mockPuzzle, 'cannon', 8, 16);
    expect(res.correct).toBe(true);
    expect(res.distance).toBe(0);
  });

  it('should return correct for placements within tolerance', () => {
    const res = validatePlacement(mockPuzzle, 'cannon', 8, 17);
    expect(res.correct).toBe(true);
    expect(res.distance).toBe(1);
  });

  it('should return wrong for incorrect card type', () => {
    const res = validatePlacement(mockPuzzle, 'giant', 8, 16);
    expect(res.correct).toBe(false);
  });

  it('should return wrong for placements outside tolerance', () => {
    const res = validatePlacement(mockPuzzle, 'cannon', 8, 19);
    expect(res.correct).toBe(false);
    expect(res.distance).toBe(3);
  });
});
