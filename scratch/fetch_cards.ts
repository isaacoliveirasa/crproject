import { prisma } from '../src/lib/prisma';
import 'dotenv/config';

async function fetchAndPopulateCards() {
  const apiKey = process.env.CLASH_ROYALE_API_KEY;
  if (!apiKey) {
    console.error('CLASH_ROYALE_API_KEY is not defined.');
    return;
  }

  console.log('Fetching all cards from Clash Royale API...');
  try {
    const res = await fetch('https://api.clashroyale.com/v1/cards', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch cards: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    console.log(`Fetched ${data.items.length} cards from API. Populating CardIntelligence table...`);

    for (const item of data.items) {
      // Map names to slug ids
      const id = item.name
        .toLowerCase()
        .replace(/[\s\.\-]+/g, '-')
        .replace(/[^a-z0-9\-]/g, '')
        .replace(/\-+$/, '')
        .replace(/^\-+/, '');

      // Simple heuristic mappings based on Clash Royale naming conventions
      let type = 'troop';
      let movement = 'ground';
      let targets = 'ground';
      let range = 1.5;

      const nameLower = item.name.toLowerCase();

      // Feitiços (Spells)
      if (
        nameLower.includes('spell') ||
        nameLower.includes('arrows') ||
        nameLower.includes('fireball') ||
        nameLower.includes('rocket') ||
        nameLower.includes('lightning') ||
        (nameLower.includes('zap') && !nameLower.includes('zappies')) ||
        nameLower.includes('freeze') ||
        nameLower.includes('poison') ||
        nameLower.includes('tornado') ||
        nameLower.includes('earthquake') ||
        nameLower.includes('log') ||
        nameLower.includes('snowball') ||
        nameLower.includes('rage') ||
        nameLower.includes('clone') ||
        nameLower.includes('delivery') ||
        nameLower.includes('void')
      ) {
        type = 'spell';
        movement = 'none';
        targets = 'both';
        range = 4.0;
      }
      // Construções (Buildings)
      else if (
        (nameLower.includes('tower') && !nameLower.includes('furnace')) ||
        nameLower.includes('cannon') ||
        nameLower.includes('mortar') ||
        nameLower.includes('tesla') ||
        nameLower.includes('x-bow') ||
        (nameLower.includes('inferno') && nameLower.includes('tower')) ||
        nameLower.includes('tombstone') ||
        nameLower.includes('hut') ||
        nameLower.includes('cage') ||
        nameLower.includes('drill') ||
        nameLower.includes('collector')
      ) {
        type = 'building';
        movement = 'none';
        targets = nameLower.includes('tesla') || nameLower.includes('inferno') || nameLower.includes('x-bow') ? 'both' : 'ground';
        range = nameLower.includes('x-bow') ? 11.5 : nameLower.includes('mortar') ? 11.5 : 5.5;
      }
      // Tropas Aéreas (Air troops)
      else if (
        nameLower.includes('dragon') ||
        nameLower.includes('minion') ||
        nameLower.includes('bat') ||
        nameLower.includes('balloon') ||
        nameLower.includes('lava') ||
        nameLower.includes('phoenix') ||
        nameLower.includes('horde') ||
        nameLower.includes('machine') ||
        nameLower.includes('healer')
      ) {
        movement = 'air';
        targets = nameLower.includes('balloon') || nameLower.includes('lava') ? 'buildings' : 'both';
        range = nameLower.includes('dragon') || nameLower.includes('minion') ? 3.5 : 1.2;
      }
      // Tropas Terrestres que miram construções (Building targeters)
      else if (
        nameLower.includes('giant') ||
        nameLower.includes('golem') ||
        nameLower.includes('hog') ||
        nameLower.includes('ram') ||
        nameLower.includes('wall breaker')
      ) {
        movement = 'ground';
        targets = 'buildings';
        range = 1.2;
      }
      // Tropas Terrestres que miram ambos (Ground & Air)
      else if (
        nameLower.includes('musketeer') ||
        nameLower.includes('archer') ||
        nameLower.includes('wizard') ||
        nameLower.includes('witch') ||
        nameLower.includes('spear') ||
        nameLower.includes('hunter') ||
        nameLower.includes('electro') ||
        nameLower.includes('princess') ||
        nameLower.includes('dart') ||
        nameLower.includes('firecracker')
      ) {
        movement = 'ground';
        targets = 'both';
        range = nameLower.includes('princess') ? 9.0 : nameLower.includes('dart') ? 6.5 : 5.0;
      }

      await prisma.cardIntelligence.upsert({
        where: { id },
        update: {
          name: item.name,
          cost: item.elixirCost || 3, // fallback if API doesn't return cost in some endpoints
          type,
          movement,
          targets,
          range,
          description: `Strategic card of type ${type}. Moves via ${movement} and targets ${targets}.`,
        },
        create: {
          id,
          name: item.name,
          cost: item.elixirCost || 3,
          type,
          movement,
          targets,
          range,
          description: `Strategic card of type ${type}. Moves via ${movement} and targets ${targets}.`,
        },
      });
    }

    console.log('CardIntelligence population complete!');
  } catch (err) {
    console.error('Error fetching cards:', err);
  } finally {
    await prisma.$disconnect();
  }
}

fetchAndPopulateCards();
