export type TileType = 'grass' | 'river' | 'bridge' | 'tower' | 'king' | 'void';

export interface Tile {
  type: TileType;
  placeable: boolean;
  side: 'blue' | 'red' | 'neutral';
}

// 18 colunas x 32 linhas
export const ARENA_WIDTH = 18;
export const ARENA_HEIGHT = 32;
export const TILE_SIZE = 32; // pixels

// Rio fica nas linhas 15-16, pontes nas colunas 3-4 e 13-14
export function generateArena(): Tile[][] {
  const arena: Tile[][] = [];
  
  for (let y = 0; y < ARENA_HEIGHT; y++) {
    const row: Tile[] = [];
    for (let x = 0; x < ARENA_WIDTH; x++) {
      row.push(getTileAt(x, y));
    }
    arena.push(row);
  }
  return arena;
}

// ---------------------------------------------------------------------------
// Regras de deploy (Clash Royale): tropas e construções só podem ser colocadas
// na própria metade (linhas 17+), fora do rio e sem sobrepor as torres.
// Feitiços podem ser lançados em qualquer tile da arena.
// ---------------------------------------------------------------------------

export const PLAYER_SIDE_MIN_Y = 17;

// Footprints jogáveis das torres do jogador (tiles ocupados, inclusivos)
export const PLAYER_TOWER_FOOTPRINTS = [
  { x0: 2, x1: 4, y0: 23, y1: 25 },   // Torre da princesa esquerda
  { x0: 13, x1: 15, y0: 23, y1: 25 }, // Torre da princesa direita
  { x0: 7, x1: 10, y0: 28, y1: 31 },  // Torre do rei
];

export function isPlayerPlaceable(x: number, y: number): boolean {
  if (x < 0 || x >= ARENA_WIDTH || y < PLAYER_SIDE_MIN_Y || y >= ARENA_HEIGHT) {
    return false;
  }
  return !PLAYER_TOWER_FOOTPRINTS.some(
    (f) => x >= f.x0 && x <= f.x1 && y >= f.y0 && y <= f.y1
  );
}

export function canDeployAt(x: number, y: number, opts?: { spell?: boolean }): boolean {
  if (x < 0 || x >= ARENA_WIDTH || y < 0 || y >= ARENA_HEIGHT) return false;
  if (opts?.spell) return true;
  return isPlayerPlaceable(x, y);
}

function getTileAt(x: number, y: number): Tile {
  // Rio (linhas 15-16)
  if (y === 15 || y === 16) {
    const isBridge = (x >= 3 && x <= 4) || (x >= 13 && x <= 14);
    return {
      type: isBridge ? 'bridge' : 'river',
      placeable: false,
      side: 'neutral',
    };
  }
  
  // Lado vermelho = topo (y < 15), Lado azul = base (y > 16)
  const side = y < 15 ? 'red' : 'blue';
  
  return {
    type: 'grass',
    placeable: true,
    side,
  };
}
