export interface Position {
  x: number; // 0 to 17 (standard CR half-width is 18 tiles)
  y: number; // 0 to 31 (standard CR half-height is 32 tiles)
}

export type SolutionQuality = 'optimal' | 'good' | 'acceptable' | 'bad';

export interface Card {
  id: string;
  name: string;
  cost: number;
  type: 'troop' | 'building' | 'spell';
  icon: string; // URL or emoji icon placeholder
  color: string; // hex color for card theme
  speed?: number; // movespeed multiplier
  movement?: 'ground' | 'air' | 'none';
  targets?: 'ground' | 'air' | 'both' | 'buildings';
  range?: number; // target sight/attack range radius in tiles
}

export interface Puzzle {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'pro';
  glicko: number;
  author: string;
  hand: string[]; // Card IDs
  enemyTroop: {
    name: string;
    icon: string;
    path: Position[]; // Path coordinates the enemy will traverse
    startPos: Position;
  };
  // Map of "x,y" to SolutionQuality
  solutions: Record<string, SolutionQuality>;
  hints: string[];
}
