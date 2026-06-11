import { describe, it, expect } from 'vitest';
import { canDeployAt, isPlayerPlaceable, PLAYER_SIDE_MIN_Y } from '../arena/tilemap';

describe('deploy rules (Clash Royale placement)', () => {
  it('allows placement on own half open grass', () => {
    expect(isPlayerPlaceable(8, 20)).toBe(true);
    expect(isPlayerPlaceable(0, 31)).toBe(true);
    expect(isPlayerPlaceable(17, PLAYER_SIDE_MIN_Y)).toBe(true);
  });

  it('blocks the enemy half', () => {
    expect(isPlayerPlaceable(8, 5)).toBe(false);
    expect(isPlayerPlaceable(3, 14)).toBe(false);
  });

  it('blocks the river rows', () => {
    expect(isPlayerPlaceable(8, 15)).toBe(false);
    expect(isPlayerPlaceable(8, 16)).toBe(false);
  });

  it('blocks player tower footprints', () => {
    expect(isPlayerPlaceable(3, 24)).toBe(false); // left princess
    expect(isPlayerPlaceable(14, 24)).toBe(false); // right princess
    expect(isPlayerPlaceable(8, 30)).toBe(false); // king
    // adjacent tiles remain placeable
    expect(isPlayerPlaceable(5, 24)).toBe(true);
    expect(isPlayerPlaceable(6, 30)).toBe(true);
  });

  it('blocks out-of-bounds tiles', () => {
    expect(canDeployAt(-1, 20)).toBe(false);
    expect(canDeployAt(18, 20)).toBe(false);
    expect(canDeployAt(8, 32)).toBe(false);
  });

  it('lets spells be cast anywhere in bounds', () => {
    expect(canDeployAt(8, 5, { spell: true })).toBe(true);
    expect(canDeployAt(8, 15, { spell: true })).toBe(true);
    expect(canDeployAt(3, 24, { spell: true })).toBe(true);
    expect(canDeployAt(-1, 5, { spell: true })).toBe(false);
  });
});
