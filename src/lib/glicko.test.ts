import { describe, it, expect } from 'vitest';
import { updateRatings, GlickoRating } from './glicko';

describe('Glicko-2 Calculations', () => {
  const player: GlickoRating = { rating: 1500, rd: 200, volatility: 0.06 };
  const puzzle: GlickoRating = { rating: 1400, rd: 80, volatility: 0.06 };

  it('should increase player rating and decrease puzzle rating on win (score = 1.0)', () => {
    const resultWin = updateRatings(player, puzzle, 1.0);
    expect(resultWin.player.rating).toBeGreaterThan(player.rating);
    expect(resultWin.opponent.rating).toBeLessThan(puzzle.rating);
  });

  it('should decrease player rating and increase puzzle rating on loss (score = 0.0)', () => {
    const resultLoss = updateRatings(player, puzzle, 0.0);
    expect(resultLoss.player.rating).toBeLessThan(player.rating);
    expect(resultLoss.opponent.rating).toBeGreaterThan(puzzle.rating);
  });
});
