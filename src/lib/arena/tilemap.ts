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
