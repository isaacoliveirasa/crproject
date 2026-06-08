import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('Seeding database...');

  // Create default Sandbox User
  const defaultUser = await prisma.user.upsert({
    where: { username: 'sandbox_player' },
    update: {},
    create: {
      username: 'sandbox_player',
      email: 'sandbox@clashtactics.org',
      glickoRating: 1500.0,
      glickoRD: 350.0,
      glickoVolatility: 0.06,
    },
  });

  console.log(`Upserted sandbox user: ${defaultUser.username}`);

  // Create Mock Puzzles
  const puzzle1 = await prisma.puzzle.upsert({
    where: { id: '1' },
    update: {
      enemyTroop: {
        name: 'Giant',
        icon: '👹',
        startPos: { x: 14, y: 10 },
        path: [
          { x: 14, y: 10 },
          { x: 14, y: 12 },
          { x: 14, y: 15 },
          { x: 14, y: 18 },
          { x: 14, y: 24 },
        ],
      },
      solutions: {
        '8,18': 'optimal',
        '8,19': 'optimal',
        '9,18': 'optimal',
        '9,19': 'optimal',
        '7,18': 'good',
        '7,19': 'good',
        '10,18': 'good',
        '10,19': 'good',
        '8,17': 'good',
        '9,17': 'good',
        '8,20': 'acceptable',
        '9,20': 'acceptable',
        '6,18': 'acceptable',
        '11,18': 'acceptable',
      },
      hints: [
        'The center tiles of the arena are the most powerful for kiting placements.',
        'Try placing the Cannon 2-3 tiles below the river (y=18 or y=19) to draw the Giant into range of both princess towers.'
      ],
    },
    create: {
      id: '1',
      title: 'Optimal Cannon Pull vs Giant',
      description: 'A Giant is marching down the right lane. Place your Cannon in the center "kill zone" at the exact tile where both Princess Towers will target it while pulling it maximum distance.',
      difficulty: 'easy',
      glickoRating: 1200.0,
      glickoRD: 350.0,
      glickoVolatility: 0.06,
      hand: ['cannon'],
      enemyTroop: {
        name: 'Giant',
        icon: '👹',
        startPos: { x: 14, y: 10 },
        path: [
          { x: 14, y: 10 },
          { x: 14, y: 12 },
          { x: 14, y: 15 },
          { x: 14, y: 18 },
          { x: 14, y: 24 },
        ],
      },
      solutions: {
        '8,18': 'optimal',
        '8,19': 'optimal',
        '9,18': 'optimal',
        '9,19': 'optimal',
        '7,18': 'good',
        '7,19': 'good',
        '10,18': 'good',
        '10,19': 'good',
        '8,17': 'good',
        '9,17': 'good',
        '8,20': 'acceptable',
        '9,20': 'acceptable',
        '6,18': 'acceptable',
        '11,18': 'acceptable',
      },
      hints: [
        'The center tiles of the arena are the most powerful for kiting placements.',
        'Try placing the Cannon 2-3 tiles below the river (y=18 or y=19) to draw the Giant into range of both princess towers.'
      ],
    },
  });

  const puzzle2 = await prisma.puzzle.upsert({
    where: { id: '2' },
    update: {
      enemyTroop: {
        name: 'Mini P.E.K.K.A.',
        icon: '🤖',
        startPos: { x: 14, y: 10 },
        path: [
          { x: 14, y: 10 },
          { x: 14, y: 12 },
          { x: 14, y: 15 },
          { x: 14, y: 18 },
          { x: 14, y: 24 },
        ],
      },
      solutions: {
        '8,18': 'optimal',
        '8,19': 'optimal',
        '9,18': 'good',
        '9,19': 'good',
        '8,20': 'acceptable',
      },
      hints: [
        'Pulls work best when placed in the opposite lane to make the Mini P.E.K.K.A walk diagonally.'
      ],
    },
    create: {
      id: '2',
      title: 'Skeletons Distraction vs Mini P.E.K.K.A.',
      description: 'A Mini P.E.K.K.A. is approaching. Place Skeletons to pull it to the center, maximizing its walk distance and princess tower shots.',
      difficulty: 'medium',
      glickoRating: 1450.0,
      glickoRD: 350.0,
      glickoVolatility: 0.06,
      hand: ['skeletons'],
      enemyTroop: {
        name: 'Mini P.E.K.K.A.',
        icon: '🤖',
        startPos: { x: 14, y: 10 },
        path: [
          { x: 14, y: 10 },
          { x: 14, y: 12 },
          { x: 14, y: 15 },
          { x: 14, y: 18 },
          { x: 14, y: 24 },
        ],
      },
      solutions: {
        '8,18': 'optimal',
        '8,19': 'optimal',
        '9,18': 'good',
        '9,19': 'good',
        '8,20': 'acceptable',
      },
      hints: [
        'Pulls work best when placed in the opposite lane to make the Mini P.E.K.K.A walk diagonally.'
      ],
    },
  });

  // Seed Card Intelligence
  const cardsIntelligence = [
    {
      id: 'skeletons',
      name: 'Skeletons',
      cost: 1,
      type: 'troop',
      movement: 'ground',
      targets: 'ground',
      range: 1.5,
      description: 'Four fast, weak melee ground troops. Excellent for distracting single-target ground attackers like P.E.K.K.A or Prince.',
    },
    {
      id: 'ice-spirit',
      name: 'Ice Spirit',
      cost: 1,
      type: 'troop',
      movement: 'ground',
      targets: 'both',
      range: 2.5,
      description: 'Spawns one mischievous spirit that leaps at targets, freezing them for a brief period. Excellent for kiting and cycling decks.',
    },
    {
      id: 'cannon',
      name: 'Cannon',
      cost: 3,
      type: 'building',
      movement: 'none',
      targets: 'ground',
      range: 5.5,
      description: 'Defensive building that targets ground units. Essential for pulling building-seeking giants and hog riders into the kill zone.',
    },
    {
      id: 'musketeer',
      name: 'Musketeer',
      cost: 4,
      type: 'troop',
      movement: 'ground',
      targets: 'both',
      range: 6.0,
      description: 'Accurate, strong ranged shooter that handles both ground and flying threats. Keep her protected behind other defensive pulls.',
    },
    {
      id: 'giant',
      name: 'giant',
      cost: 5,
      type: 'troop',
      movement: 'ground',
      targets: 'buildings',
      range: 1.2,
      description: 'Slow but durable building-seeking giant. Can be kited across lanes using strategically placed buildings.',
    }
  ];

  for (const card of cardsIntelligence) {
    await prisma.cardIntelligence.upsert({
      where: { id: card.id },
      update: {
        name: card.name,
        cost: card.cost,
        type: card.type,
        movement: card.movement,
        targets: card.targets,
        range: card.range,
        description: card.description,
      },
      create: card,
    });
  }

  console.log(`Upserted ${puzzle1.title} & ${puzzle2.title}`);
  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

