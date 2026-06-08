export interface Puzzle {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  rating: number; // Glicko-2
  
  // Estado inicial
  enemyTroops: { x: number; y: number; type: string }[];
  playerHand: string[]; // ['cannon', 'giant', ...]
  
  // Solução
  solution: {
    cardType: string;
    validTiles: { x: number; y: number }[]; // tiles aceitos como corretos
  };
  
  // Tolerância: pode aceitar tiles "próximos" também
  tolerance?: number; // ex: 1 = aceita 1 tile de distância
}
