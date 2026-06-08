export interface CardStats {
  id: string;
  name: string;
  hp: number;
  damage: number;
  speed: number;        // grid movement tiles per second
  attackSpeed: number;  // attack cooldown duration in ms
  range: number;        // range in tiles
  sightRange: number;   // sight detection radius in tiles
  targets: 'ground' | 'air' | 'both' | 'buildings';
  movement: 'ground' | 'air' | 'none';
  projectileSpeed?: number;
  collisionRadius?: number;
}

export const OFFICIAL_CARD_STATS: Record<string, CardStats> = {
  giant: { 
    id: 'giant', 
    name: 'Giant', 
    hp: 2000, 
    damage: 120, 
    speed: 0.9, 
    attackSpeed: 1500, 
    range: 1.2, 
    sightRange: 6.5, 
    targets: 'buildings', 
    movement: 'ground',
    collisionRadius: 0.75
  },
  cannon: { 
    id: 'cannon', 
    name: 'Cannon', 
    hp: 742, 
    damage: 127, 
    speed: 0, 
    attackSpeed: 800, 
    range: 5.5, 
    sightRange: 5.5, 
    targets: 'ground', 
    movement: 'none', 
    projectileSpeed: 8.0,
    collisionRadius: 0.5
  },
  skeletons: { 
    id: 'skeletons', 
    name: 'Skeletons', 
    hp: 67, 
    damage: 67, 
    speed: 1.2, 
    attackSpeed: 1000, 
    range: 1.0, 
    sightRange: 5.0, 
    targets: 'ground', 
    movement: 'ground',
    collisionRadius: 0.4
  },
  'ice-spirit': { 
    id: 'ice-spirit', 
    name: 'Ice Spirit', 
    hp: 190, 
    damage: 95, 
    speed: 1.5, 
    attackSpeed: 1000, 
    range: 2.5, 
    sightRange: 5.0, 
    targets: 'both', 
    movement: 'ground',
    collisionRadius: 0.4
  },
  musketeer: { 
    id: 'musketeer', 
    name: 'Musketeer', 
    hp: 598, 
    damage: 181, 
    speed: 1.2, 
    attackSpeed: 1100, 
    range: 6.0, 
    sightRange: 6.5, 
    targets: 'both', 
    movement: 'ground', 
    projectileSpeed: 12.0,
    collisionRadius: 0.5
  },
  'mini-pekka': { 
    id: 'mini-pekka', 
    name: 'Mini P.E.K.K.A.', 
    hp: 1129, 
    damage: 598, 
    speed: 1.5, 
    attackSpeed: 1600, 
    range: 1.0, 
    sightRange: 5.0, 
    targets: 'ground', 
    movement: 'ground',
    collisionRadius: 0.5
  }
};
