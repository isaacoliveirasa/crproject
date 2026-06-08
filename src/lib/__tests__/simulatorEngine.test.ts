import { describe, it, expect } from 'vitest';
import { initSimulation, tickSimulation } from '../simulatorEngine';

describe('Simulator Engine Rules', () => {
  it('should initialize simulation with towers and enemy', () => {
    const enemy = { name: 'Giant', icon: '👹', startPos: { x: 14, y: 28 } };
    const selectedCard = { id: 'cannon', name: 'Cannon', cost: 3, type: 'building' as const, icon: '💣', color: '#4B5563' };
    const placedPos = { x: 8, y: 16 };

    const entities = initSimulation(enemy, selectedCard, placedPos);

    expect(entities.length).toBe(8); // 6 towers + 1 enemy + 1 placed card
    expect(entities.find(e => e.id === 'opp_k_tower')).toBeDefined();
    expect(entities.find(e => e.id === 'enemy_troop')).toBeDefined();
    expect(entities.find(e => e.id === 'player_placed')).toBeDefined();
  });

  it('should pathfind ground units via bridges', () => {
    const enemy = { name: 'Giant', icon: '👹', startPos: { x: 14, y: 5 } };
    const selectedCard = { id: 'cannon', name: 'Cannon', cost: 3, type: 'building' as const, icon: '💣', color: '#4B5563', targets: 'buildings' as const, movement: 'none' as const, range: 5.5 };
    const placedPos = { x: 14, y: 25 };

    const entities = initSimulation(enemy, selectedCard, placedPos);
    const result = tickSimulation(entities, [], Date.now());
    const movedEnemy = result.nextEntities.find(e => e.id === 'enemy_troop')!;

    // Giant is ground unit starting on right side at y=5.5 (y<15). 
    // Target is building at y=25.5 (y>=17). 
    // It should path to the right bridge top waypoint (14.5, 15.0) which is directly south.
    expect(movedEnemy.x).toBeCloseTo(14.5);
    expect(movedEnemy.y).toBeGreaterThan(5.5);
  });

  it('should trigger aggro warning when target is acquired', () => {
    const enemy = { name: 'Mini P.E.K.K.A.', icon: '🤖', startPos: { x: 14, y: 18 } };
    const selectedCard = { id: 'skeletons', name: 'Skeletons', cost: 1, type: 'troop' as const, icon: '💀', color: '#E2E8F0', targets: 'both' as const, movement: 'ground' as const, range: 1.5 };
    const placedPos = { x: 11, y: 18 };

    const entities = initSimulation(enemy, selectedCard, placedPos);
    
    // Set targetId to null initially to test transition
    const enemyTroop = entities.find(e => e.id === 'enemy_troop')!;
    enemyTroop.targetId = null;

    const result = tickSimulation(entities, [], Date.now());
    expect(result.aggroTriggeredId).toBe('enemy_troop');
    expect(result.nextEntities.find(e => e.id === 'enemy_troop')!.targetId).toContain('player_placed');
  });

  it('should deal damage and fire projectiles', () => {
    const entities = [
      { id: 'player_l_tower', name: 'Princess Tower', team: 'blue' as const, x: 3.5, y: 24.5, hp: 1400, maxHp: 1400, type: 'building', targets: 'both' as const, movement: 'none' as const, range: 7.5, sightRange: 7.5, icon: '🏰', targetId: null, lastAttackTime: 0, alive: true, isTower: true },
      { id: 'enemy_troop', name: 'Giant', team: 'red' as const, x: 3.5, y: 25.5, hp: 2000, maxHp: 2000, speed: 1.2, type: 'troop', targets: 'buildings' as const, movement: 'ground' as const, range: 1.2, sightRange: 6.5, icon: '👹', targetId: null, lastAttackTime: 0, alive: true }
    ];

    const result = tickSimulation(entities, [], Date.now());
    expect(result.newProjectilesFired.length).toBe(1);
    expect(result.newProjectilesFired[0].targetId).toBe('enemy_troop');
  });
});
