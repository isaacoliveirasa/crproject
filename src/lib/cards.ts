import { Card } from '@/types/game';
import { mockCards } from '@/data/mockData';

export async function fetchMergedCards(): Promise<Record<string, Card>> {
  try {
    const res = await fetch('/api/cards');
    if (!res.ok) {
      throw new Error(`Failed to fetch cards: ${res.statusText}`);
    }
    const data = await res.json();
    
    const merged: Record<string, Card> = {};
    
    if (data.items && Array.isArray(data.items)) {
      data.items.forEach((item: any) => {
        // Map card name to match mockCards keys (slugify name)
        // e.g. "Ice Spirit" -> "ice-spirit", "Mini P.E.K.K.A." -> "mini-p-e-k-k-a"
        const id = item.name
          .toLowerCase()
          .replace(/[\s\.\-]+/g, '-')
          .replace(/[^a-z0-9\-]/g, '')
          .replace(/\-+$/, '')
          .replace(/^\-+/, '');

        const local = mockCards[id];
        
        merged[id] = {
          id,
          name: item.name,
          cost: local ? local.cost : 3, // default fallback elixir cost
          type: local ? local.type : 'troop',
          icon: item.iconUrls?.medium || '🃏', // use API graphic URL or fallback emoji
          color: local ? local.color : '#4B5563',
        };
      });
    }

    // Include any custom mock cards that weren't fetched from the API
    Object.keys(mockCards).forEach((key) => {
      if (!merged[key]) {
        merged[key] = mockCards[key];
      }
    });

    return merged;
  } catch (err) {
    console.warn('API card mapping failed, falling back to static mock emojis:', err);
    return mockCards;
  }
}
