import { Card, Puzzle } from '@/types/game';

export const mockCards: Record<string, Card> = {
  skeletons: {
    id: 'skeletons',
    name: 'Skeletons',
    cost: 1,
    type: 'troop',
    icon: '/assets/cards/skeletons.png',
    color: '#E2E8F0',
  },
  'ice-spirit': {
    id: 'ice-spirit',
    name: 'Ice Spirit',
    cost: 1,
    type: 'troop',
    icon: '/assets/cards/ice-spirit.png',
    color: '#93C5FD',
  },
  cannon: {
    id: 'cannon',
    name: 'Cannon',
    cost: 3,
    type: 'building',
    icon: '/assets/cards/cannon.png',
    color: '#4B5563',
  },
  tornado: {
    id: 'tornado',
    name: 'Tornado',
    cost: 3,
    type: 'spell',
    icon: '/assets/cards/tornado.png',
    color: '#A78BFA',
  },
  musketeer: {
    id: 'musketeer',
    name: 'Musketeer',
    cost: 4,
    type: 'troop',
    icon: '/assets/cards/musketeer.png',
    color: '#F472B6',
  },
  giant: {
    id: 'giant',
    name: 'Giant',
    cost: 5,
    type: 'troop',
    icon: '/assets/cards/giant.png',
    color: '#F59E0B',
  },
  'mini-pekka': {
    id: 'mini-pekka',
    name: 'Mini P.E.K.K.A.',
    cost: 4,
    type: 'troop',
    icon: '/assets/cards/mini-pekka.png',
    color: '#3B82F6',
  }
};

export const mockPuzzles: Puzzle[] = [
  {
    id: '1',
    title: 'Optimal Cannon Pull vs Giant',
    description: 'A Giant is marching down the right lane. Place your Cannon in the center "kill zone" at the exact tile where both Princess Towers will target it while pulling it maximum distance.',
    difficulty: 'easy',
    glicko: 1200,
    author: 'Milton',
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
      // Optimal placements: middle center-right just below the river to pull the Giant
      '8,18': 'optimal',
      '8,19': 'optimal',
      '9,18': 'optimal',
      '9,19': 'optimal',
      // Good: slightly further or offset, still pulls but less tower damage overlap
      '7,18': 'good',
      '7,19': 'good',
      '10,18': 'good',
      '10,19': 'good',
      '8,17': 'good',
      '9,17': 'good',
      // Acceptable: pulls but Cannon gets destroyed very fast or is too low
      '8,20': 'acceptable',
      '9,20': 'acceptable',
      '6,18': 'acceptable',
      '11,18': 'acceptable',
    },
    hints: [
      'The center tiles of the arena are the most powerful for building placements.',
      'Try placing the Cannon 2-3 tiles below the river (y=18 or y=19) to draw the Giant into range of both princess towers.',
    ],
  },
  {
    id: '2',
    title: 'Skeletons Distraction vs Mini P.E.K.K.A.',
    description: 'A Mini P.E.K.K.A. is approaching. Place Skeletons to pull it to the center, maximizing its walk distance and princess tower shots.',
    difficulty: 'medium',
    glicko: 1450,
    author: 'TacticMaster',
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
      'Pulls work best when placed in the opposite lane to make the Mini P.E.K.K.A walk diagonally.',
    ],
  },
];
