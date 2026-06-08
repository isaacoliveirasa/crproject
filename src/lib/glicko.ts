/**
 * Glicko-2 Rating System implementation.
 * Based on the specification by Mark Glickman: http://www.glicko.net/glicko/glicko2.pdf
 */

export interface GlickoRating {
  rating: number;
  rd: number;      // Rating Deviation
  volatility: number;
}

const SCALE_FACTOR = 173.7178;

// Convert from standard Glicko scale to Glicko-2 scale
function toGlicko2(rating: GlickoRating) {
  return {
    mu: (rating.rating - 1500) / SCALE_FACTOR,
    phi: rating.rd / SCALE_FACTOR,
    vol: rating.volatility,
  };
}

// Convert from Glicko-2 scale back to standard Glicko scale
function toStandard(mu: number, phi: number, vol: number): GlickoRating {
  return {
    rating: mu * SCALE_FACTOR + 1500,
    rd: phi * SCALE_FACTOR,
    volatility: vol,
  };
}

const g = (phi: number): number => {
  return 1 / Math.sqrt(1 + (3 * phi * phi) / (Math.PI * Math.PI));
};

const E = (mu: number, muOpp: number, phiOpp: number): number => {
  return 1 / (1 + Math.exp(-g(phiOpp) * (mu - muOpp)));
};

/**
 * Calculates updated Glicko-2 ratings for a player and an opponent/puzzle.
 * @param player Current player rating stats
 * @param opponent Current opponent/puzzle rating stats
 * @param score Game outcome for the player: 1.0 (win/optimal), 0.75 (good), 0.5 (acceptable), 0.0 (lose/bad)
 * @param tau Constraint on volatility change over time (default: 0.5)
 */
export function updateRatings(
  player: GlickoRating,
  opponent: GlickoRating,
  score: number,
  tau = 0.5
): { player: GlickoRating; opponent: GlickoRating } {
  // Step 2: Convert to Glicko-2 scale
  const p = toGlicko2(player);
  const opp = toGlicko2(opponent);

  // Step 3: Compute auxiliary values
  const gOpp = g(opp.phi);
  const eVal = E(p.mu, opp.mu, opp.phi);
  
  // Compute variance v
  const v = 1 / (gOpp * gOpp * eVal * (1 - eVal));

  // Compute delta (change in rating)
  const delta = v * gOpp * (score - eVal);

  // Step 5: Update volatility using Illinois Regula Falsi algorithm
  const a = Math.log(p.vol * p.vol);
  const f = (x: number): number => {
    const ex = Math.exp(x);
    const dPart = p.phi * p.phi + v + ex;
    const term1 = (ex * (delta * delta - p.phi * p.phi - v - ex)) / (2 * dPart * dPart);
    const term2 = (x - a) / (tau * tau);
    return term1 - term2;
  };

  let A = a;
  let B = 0;
  if (delta * delta > p.phi * p.phi + v) {
    B = Math.log(delta * delta - p.phi * p.phi - v);
  } else {
    let k = 1;
    while (f(a - k * tau) < 0) {
      k += 1;
    }
    B = a - k * tau;
  }

  let fA = f(A);
  let fB = f(B);

  // Regula falsi iterations
  const epsilon = 0.000001;
  let iterations = 0;
  while (Math.abs(B - A) > epsilon && iterations < 100) {
    const C = A + (A - B) * fA / (fB - fA);
    const fC = f(C);
    if (fC * fB < 0) {
      A = B;
      fA = fB;
    } else {
      fA = fA / 2;
    }
    B = C;
    fB = fC;
    iterations += 1;
  }

  const newVol = Math.exp(B / 2);

  // Step 6: Update rating deviation to pre-rating value
  const phiStar = Math.sqrt(p.phi * p.phi + newVol * newVol);

  // Step 7: Update final rating deviation and rating
  const newPhi = 1 / Math.sqrt(1 / (phiStar * phiStar) + 1 / v);
  const newMu = p.mu + newPhi * newPhi * gOpp * (score - eVal);

  // Calculate corresponding updates for opponent (reversing outcome)
  const oppScore = 1.0 - score;
  const gPlayer = g(p.phi);
  const eOppVal = E(opp.mu, p.mu, p.phi);
  
  const vOpp = 1 / (gPlayer * gPlayer * eOppVal * (1 - eOppVal));
  const deltaOpp = vOpp * gPlayer * (oppScore - eOppVal);

  const aOpp = Math.log(opp.vol * opp.vol);
  const fOpp = (x: number): number => {
    const ex = Math.exp(x);
    const dPart = opp.phi * opp.phi + vOpp + ex;
    const term1 = (ex * (deltaOpp * deltaOpp - opp.phi * opp.phi - vOpp - ex)) / (2 * dPart * dPart);
    const term2 = (x - aOpp) / (tau * tau);
    return term1 - term2;
  };

  let AOpp = aOpp;
  let BOpp = 0;
  if (deltaOpp * deltaOpp > opp.phi * opp.phi + vOpp) {
    BOpp = Math.log(deltaOpp * deltaOpp - opp.phi * opp.phi - vOpp);
  } else {
    let k = 1;
    while (fOpp(aOpp - k * tau) < 0) {
      k += 1;
    }
    BOpp = aOpp - k * tau;
  }

  let fAOpp = fOpp(AOpp);
  let fBOpp = fOpp(BOpp);

  iterations = 0;
  while (Math.abs(BOpp - AOpp) > epsilon && iterations < 100) {
    const COpp = AOpp + (AOpp - BOpp) * fAOpp / (fBOpp - fAOpp);
    const fCOpp = fOpp(COpp);
    if (fCOpp * fBOpp < 0) {
      AOpp = BOpp;
      fAOpp = fBOpp;
    } else {
      fAOpp = fAOpp / 2;
    }
    BOpp = COpp;
    fBOpp = fCOpp;
    iterations += 1;
  }

  const newVolOpp = Math.exp(BOpp / 2);
  const phiStarOpp = Math.sqrt(opp.phi * opp.phi + newVolOpp * newVolOpp);
  const newPhiOpp = 1 / Math.sqrt(1 / (phiStarOpp * phiStarOpp) + 1 / vOpp);
  const newMuOpp = opp.mu + newPhiOpp * newPhiOpp * gPlayer * (oppScore - eOppVal);

  return {
    player: toStandard(newMu, newPhi, newVol),
    opponent: toStandard(newMuOpp, newPhiOpp, newVolOpp),
  };
}
