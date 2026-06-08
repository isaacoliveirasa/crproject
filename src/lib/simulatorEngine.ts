import { Position, Card } from '@/types/game';
import { OFFICIAL_CARD_STATS, CardStats } from './arena/cards';

export interface Entity {
  id: string;
  name: string;
  team: 'blue' | 'red';
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  type: 'troop' | 'building' | string;
  targets: 'ground' | 'air' | 'both' | 'buildings';
  movement: 'ground' | 'air' | 'none';
  range: number;
  sightRange: number;
  icon: string;
  targetId: string | null;
  lastAttackTime: number;
  alive: boolean;
  isTower?: boolean;
  isKing?: boolean;
  direction?: 'up' | 'down' | 'left' | 'right' | 'idle';
  attackSpeed?: number;
  damage?: number;
  projectileSpeed?: number;
  collisionRadius?: number;
}

export function getCollisionRadius(entity: { name: string; isTower?: boolean; isKing?: boolean; type?: string; collisionRadius?: number }): number {
  if (entity.collisionRadius !== undefined) return entity.collisionRadius;
  if (entity.isTower) {
    return entity.isKing ? 1.5 : 1.0;
  }
  if (entity.type === 'building') return 0.75;
  const nameLower = entity.name.toLowerCase();
  if (nameLower.includes('giant')) return 0.6;
  if (nameLower.includes('mini-pekka') || nameLower.includes('mini p.e.k.k.a')) return 0.4;
  if (nameLower.includes('skeleton')) return 0.25;
  return 0.4;
}

export interface Projectile {
  id: string;
  startX: number;
  startY: number;
  x: number;
  y: number;
  targetId: string;
  speed: number;
  damage: number;
}

export function normalizeCardKey(name: string): string {
  const key = name.toLowerCase()
    .replace(/[\s\.\-]+/g, '-')
    .replace(/[^a-z0-9\-]/g, '')
    .replace(/\-+$/, '')
    .replace(/^\-+/, '');
  if (key === 'mini-p-e-k-k-a' || key === 'mini-p-e-k-k-a-') return 'mini-pekka';
  return key;
}

export function initSimulation(
  enemyTroop: { name: string; icon: string; startPos: Position },
  selectedCard: Card | null,
  placedPosition: Position | null
): Entity[] {
  // Try mapping stats for enemy
  const enemyKey = normalizeCardKey(enemyTroop.name);
  const enemyStats = OFFICIAL_CARD_STATS[enemyKey];

  const initialEntities: Entity[] = [
    // Opponent Princess Towers (Top)
    { id: 'opp_l_tower', name: 'Princess Tower', team: 'red', x: 3.5, y: 7.5, hp: 1400, maxHp: 1400, speed: 0, type: 'building', targets: 'both', movement: 'none', range: 7.5, sightRange: 7.5, icon: '🏰', targetId: null, lastAttackTime: 0, alive: true, isTower: true, direction: 'idle', attackSpeed: 800, damage: 50, projectileSpeed: 6.0, collisionRadius: 1.0 },
    { id: 'opp_r_tower', name: 'Princess Tower', team: 'red', x: 14.5, y: 7.5, hp: 1400, maxHp: 1400, speed: 0, type: 'building', targets: 'both', movement: 'none', range: 7.5, sightRange: 7.5, icon: '🏰', targetId: null, lastAttackTime: 0, alive: true, isTower: true, direction: 'idle', attackSpeed: 800, damage: 50, projectileSpeed: 6.0, collisionRadius: 1.0 },
    { id: 'opp_k_tower', name: 'King Tower', team: 'red', x: 8.5, y: 2.5, hp: 2400, maxHp: 2400, speed: 0, type: 'building', targets: 'both', movement: 'none', range: 7.0, sightRange: 7.0, icon: '👑', targetId: null, lastAttackTime: 0, alive: true, isTower: true, isKing: true, direction: 'idle', attackSpeed: 1000, damage: 70, projectileSpeed: 6.0, collisionRadius: 1.5 },

    // Player Princess Towers (Bottom)
    { id: 'player_l_tower', name: 'Princess Tower', team: 'blue', x: 3.5, y: 24.5, hp: 1400, maxHp: 1400, speed: 0, type: 'building', targets: 'both', movement: 'none', range: 7.5, sightRange: 7.5, icon: '🏰', targetId: null, lastAttackTime: 0, alive: true, isTower: true, direction: 'idle', attackSpeed: 800, damage: 50, projectileSpeed: 6.0, collisionRadius: 1.0 },
    { id: 'player_r_tower', name: 'Princess Tower', team: 'blue', x: 14.5, y: 24.5, hp: 1400, maxHp: 1400, speed: 0, type: 'building', targets: 'both', movement: 'none', range: 7.5, sightRange: 7.5, icon: '🏰', targetId: null, lastAttackTime: 0, alive: true, isTower: true, direction: 'idle', attackSpeed: 800, damage: 50, projectileSpeed: 6.0, collisionRadius: 1.0 },
    { id: 'player_k_tower', name: 'King Tower', team: 'blue', x: 8.5, y: 29.5, hp: 2400, maxHp: 2400, speed: 0, type: 'building', targets: 'both', movement: 'none', range: 7.0, sightRange: 7.0, icon: '👑', targetId: null, lastAttackTime: 0, alive: true, isTower: true, isKing: true, direction: 'idle', attackSpeed: 1000, damage: 70, projectileSpeed: 6.0, collisionRadius: 1.5 },

    // Enemy Troop (Red team)
    {
      id: 'enemy_troop',
      name: enemyTroop.name,
      team: 'red',
      x: enemyTroop.startPos.x + 0.5,
      y: enemyTroop.startPos.y + 0.5,
      hp: enemyStats ? enemyStats.hp : 800,
      maxHp: enemyStats ? enemyStats.hp : 800,
      speed: enemyStats ? enemyStats.speed : 1.2,
      type: 'troop',
      targets: enemyStats ? enemyStats.targets : 'both',
      movement: enemyStats ? enemyStats.movement : 'ground',
      range: enemyStats ? enemyStats.range : 1.5,
      sightRange: enemyStats ? enemyStats.sightRange : 6.5,
      icon: enemyTroop.icon,
      targetId: null,
      lastAttackTime: 0,
      alive: true,
      direction: 'down',
      attackSpeed: enemyStats ? enemyStats.attackSpeed : 1200,
      damage: enemyStats ? enemyStats.damage : 120,
      projectileSpeed: enemyStats?.projectileSpeed,
      collisionRadius: enemyStats?.collisionRadius ?? 0.5
    }
  ];

  if (placedPosition && selectedCard) {
    const placedKey = selectedCard.id;
    const placedStats = OFFICIAL_CARD_STATS[placedKey];

    if (placedKey === 'skeletons') {
      const offsets = [
        { dx: 0.5, dy: 0.2 },
        { dx: 0.2, dy: 0.8 },
        { dx: 0.8, dy: 0.8 }
      ];
      offsets.forEach((offset, idx) => {
        initialEntities.push({
          id: `player_placed_${idx}`,
          name: 'Skeleton',
          team: 'blue',
          x: placedPosition.x + offset.dx,
          y: placedPosition.y + offset.dy,
          hp: placedStats ? placedStats.hp : 67,
          maxHp: placedStats ? placedStats.hp : 67,
          speed: placedStats ? placedStats.speed : 1.2,
          type: selectedCard.type,
          targets: placedStats ? placedStats.targets : 'ground',
          movement: placedStats ? placedStats.movement : 'ground',
          range: placedStats ? placedStats.range : 1.0,
          sightRange: placedStats ? placedStats.sightRange : 5.0,
          icon: selectedCard.icon || '💀',
          targetId: null,
          lastAttackTime: 0,
          alive: true,
          direction: 'idle',
          attackSpeed: placedStats ? placedStats.attackSpeed : 1000,
          damage: placedStats ? placedStats.damage : 67,
          collisionRadius: placedStats?.collisionRadius ?? 0.4
        });
      });
    } else {
      initialEntities.push({
        id: 'player_placed',
        name: selectedCard.name,
        team: 'blue',
        x: placedPosition.x + 0.5,
        y: placedPosition.y + 0.5,
        hp: placedStats ? placedStats.hp : 500,
        maxHp: placedStats ? placedStats.hp : 500,
        speed: placedStats ? placedStats.speed : 0,
        type: selectedCard.type,
        targets: placedStats ? placedStats.targets : 'both',
        movement: placedStats ? placedStats.movement : 'ground',
        range: placedStats ? placedStats.range : 1.5,
        sightRange: placedStats ? placedStats.sightRange : 5.5,
        icon: selectedCard.icon,
        targetId: null,
        lastAttackTime: 0,
        alive: true,
        direction: 'idle',
        attackSpeed: placedStats ? placedStats.attackSpeed : 1000,
        damage: placedStats ? placedStats.damage : 90,
        projectileSpeed: placedStats?.projectileSpeed,
        collisionRadius: placedStats?.collisionRadius ?? 0.5
      });
    }
  }

  return initialEntities;
}

function getDirection(dx: number, dy: number): 'up' | 'down' | 'left' | 'right' | 'idle' {
  if (Math.hypot(dx, dy) < 0.05) return 'idle';
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? 'right' : 'left';
  }
  return dy > 0 ? 'down' : 'up';
}

export function tickSimulation(
  currentEntities: Entity[],
  currentProjectiles: Projectile[],
  currentTime: number
): {
  nextEntities: Entity[];
  nextProjectiles: Projectile[];
  newProjectilesFired: Projectile[];
  aggroTriggeredId: string | null;
} {
  const nextEntities = currentEntities.map((e) => ({ ...e }));
  const newProjectilesFired: Projectile[] = [];
  let aggroTriggeredId: string | null = null;

  const activeEnemy = nextEntities.find((e) => e.id === 'enemy_troop' && e.alive);
  if (!activeEnemy) {
    return {
      nextEntities,
      nextProjectiles: currentProjectiles.map((p) => ({ ...p })),
      newProjectilesFired,
      aggroTriggeredId
    };
  }

  // 1. Pathfinding and Targeting for Enemy
  let target: Entity | null = null;
  
  if (activeEnemy.targets === 'buildings') {
    const candidates = nextEntities.filter((e) => e.team === 'blue' && e.alive && e.type === 'building');
    let minDist = Infinity;
    for (const c of candidates) {
      const dist = Math.hypot(activeEnemy.x - c.x, activeEnemy.y - c.y);
      const isVisible = c.isTower || dist <= activeEnemy.sightRange;
      if (isVisible && dist < minDist) {
        minDist = dist;
        target = c;
      }
    }
  } else {
    const candidates = nextEntities.filter((e) => e.team === 'blue' && e.alive);
    let minDist = Infinity;
    for (const c of candidates) {
      const dist = Math.hypot(activeEnemy.x - c.x, activeEnemy.y - c.y);
      const isVisible = c.isTower || dist <= activeEnemy.sightRange;
      if (isVisible && dist < minDist) {
        minDist = dist;
        target = c;
      }
    }
  }

  // Set Aggro alerts if target switches
  if (target && activeEnemy.targetId !== target.id) {
    aggroTriggeredId = activeEnemy.id;
    activeEnemy.targetId = target.id;
  }

  // 2. Move active enemy troop
  if (target) {
    const centerDist = Math.hypot(activeEnemy.x - target.x, activeEnemy.y - target.y);
    
    // Distância efetiva = centro-a-centro menos os raios de colisão de ambos
    const selfRadius = activeEnemy.collisionRadius ?? 0.5;
    const targetRadius = target.collisionRadius ?? 0.5;
    const effectiveDist = centerDist - selfRadius - targetRadius;

    if (effectiveDist > activeEnemy.range) {
      let moveTargetX = target.x;
      let moveTargetY = target.y;

      if (activeEnemy.movement === 'ground') {
        const currentY = activeEnemy.y;
        const targetY = target.y;

        if (currentY < 14.95 && targetY >= 17) {
          const useLeft = activeEnemy.x < 9;
          moveTargetX = useLeft ? 3.5 : 14.5;
          moveTargetY = 15.0;
        } else if (currentY > 17.05 && targetY <= 15) {
          const useLeft = activeEnemy.x < 9;
          moveTargetX = useLeft ? 3.5 : 14.5;
          moveTargetY = 17.0;
        }
      }

      const dx = moveTargetX - activeEnemy.x;
      const dy = moveTargetY - activeEnemy.y;
      if (Math.hypot(dx, dy) > 0.05) {
        const angle = Math.atan2(dy, dx);
        let stepX = Math.cos(angle) * (activeEnemy.speed * 0.1);
        let stepY = Math.sin(angle) * (activeEnemy.speed * 0.1);

        // SAFETY CLAMP: não deixa o passo invadir o collision do alvo
        const nextCenterDist = Math.hypot(
          (activeEnemy.x + stepX) - target.x,
          (activeEnemy.y + stepY) - target.y
        );
        const minAllowedDist = selfRadius + targetRadius;
        if (nextCenterDist < minAllowedDist) {
          // Recua o passo para parar exatamente na borda de colisão
          const scale = (centerDist - minAllowedDist) / Math.hypot(stepX, stepY);
          stepX *= Math.max(0, scale);
          stepY *= Math.max(0, scale);
        }

        activeEnemy.x += stepX;
        activeEnemy.y += stepY;
        activeEnemy.direction = getDirection(stepX, stepY);
      }
    } else {
      // Em range de ataque
      activeEnemy.direction = getDirection(target.x - activeEnemy.x, target.y - activeEnemy.y);
      const attackCooldown = activeEnemy.attackSpeed || 1200;
      if (currentTime - activeEnemy.lastAttackTime >= attackCooldown) {
        const dmg = activeEnemy.damage || 120;
        target.hp = Math.max(0, target.hp - dmg);
        activeEnemy.lastAttackTime = currentTime;
        if (target.hp <= 0) {
          target.alive = false;
          activeEnemy.targetId = null;
        }
      }
    }
  }

  // 3. Player placed card attacks
  const playerPlacedUnits = nextEntities.filter((e) => e.team === 'blue' && e.alive && e.id.startsWith('player_placed'));
  playerPlacedUnits.forEach((unit) => {
    if (unit.range > 0) {
      const enemy = nextEntities.find((e) => e.team === 'red' && e.alive && e.type === 'troop');
      if (enemy) {
        const centerDist = Math.hypot(unit.x - enemy.x, unit.y - enemy.y);
        const selfRadius = unit.collisionRadius ?? 0.5;
        const enemyRadius = enemy.collisionRadius ?? 0.5;
        const effectiveDist = centerDist - selfRadius - enemyRadius;

        if (effectiveDist <= unit.range) {
          unit.direction = getDirection(enemy.x - unit.x, enemy.y - unit.y);
          const attackCooldown = unit.attackSpeed || 1000;
          if (currentTime - (unit.lastAttackTime || 0) >= attackCooldown) {
            const newProj: Projectile = {
              id: Math.random().toString(),
              startX: unit.x,
              startY: unit.y,
              x: unit.x,
              y: unit.y,
              targetId: enemy.id,
              speed: unit.projectileSpeed || 6.0,
              damage: unit.damage || 90,
            };
            newProjectilesFired.push(newProj);
            unit.lastAttackTime = currentTime;
          }
        } else {
          unit.direction = 'idle';
        }
      }
    }
  });

  // 4. Tower Defense Target firing
  nextEntities.forEach((entity) => {
    if (entity.isTower && entity.alive) {
      // King Tower Activation logic: only active if damaged or if any Princess Tower on its team is destroyed.
      let isTowerActive = true;
      if (entity.isKing) {
        const sisterTowers = nextEntities.filter((e) => e.team === entity.team && e.isTower && !e.isKing);
        const anySisterTowerFallen = sisterTowers.some((t) => !t.alive);
        const takenDamage = entity.hp < entity.maxHp;
        isTowerActive = anySisterTowerFallen || takenDamage;
      }

      if (isTowerActive) {
        const hostile = nextEntities.find((e) => e.team !== entity.team && e.alive && e.type === 'troop');
        if (hostile) {
          const centerDist = Math.hypot(entity.x - hostile.x, entity.y - hostile.y);
          const effectiveDist = centerDist - (entity.collisionRadius ?? 1.0) - (hostile.collisionRadius ?? 0.5);
          if (effectiveDist <= entity.range) {
            const attackCooldown = entity.attackSpeed || 800;
            if (currentTime - (entity.lastAttackTime || 0) >= attackCooldown) {
              const newProj: Projectile = {
                id: Math.random().toString(),
                startX: entity.x,
                startY: entity.y,
                x: entity.x,
                y: entity.y,
                targetId: hostile.id,
                speed: entity.projectileSpeed || 6.0,
                damage: entity.damage || 50,
              };
              newProjectilesFired.push(newProj);
              entity.lastAttackTime = currentTime;
            }
          }
        }
      }
    }
  });

  // 5. Update projectiles movement and impacts
  const nextProjectiles = [...currentProjectiles, ...newProjectilesFired]
    .map((p) => {
      const pTarget = nextEntities.find((e) => e.id === p.targetId && e.alive);
      if (!pTarget) return null;

      const dx = pTarget.x - p.x;
      const dy = pTarget.y - p.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 0.3) {
        // Impact
        pTarget.hp = Math.max(0, pTarget.hp - p.damage);
        if (pTarget.hp <= 0) {
          pTarget.alive = false;
        }
        return null;
      }

      const angle = Math.atan2(dy, dx);
      return {
        ...p,
        x: p.x + Math.cos(angle) * (p.speed * 0.1),
        y: p.y + Math.sin(angle) * (p.speed * 0.1),
      };
    })
    .filter((p): p is Projectile => p !== null);

  return {
    nextEntities,
    nextProjectiles,
    newProjectilesFired,
    aggroTriggeredId
  };
}
