import { Puzzle } from './types';

export function validatePlacement(
  puzzle: Puzzle,
  cardType: string,
  x: number,
  y: number
): { correct: boolean; distance: number } {
  if (cardType !== puzzle.solution.cardType) {
    return { correct: false, distance: Infinity };
  }
  
  const distances = puzzle.solution.validTiles.map(t => 
    Math.abs(t.x - x) + Math.abs(t.y - y) // Manhattan
  );
  const minDistance = Math.min(...distances);
  const tolerance = puzzle.tolerance ?? 0;
  
  return {
    correct: minDistance <= tolerance,
    distance: minDistance,
  };
}
