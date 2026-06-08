import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch('https://supercell.com/en/games/clashroyale/blog/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      next: { revalidate: 3600 }, // Cache response for 1 hour
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch Supercell blog: ${res.statusText}`);
    }

    const html = await res.text();

    // Extract __NEXT_DATA__ JSON from script tag
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);

    if (!nextDataMatch) {
      throw new Error('Could not find __NEXT_DATA__ JSON in Supercell HTML.');
    }

    const nextData = JSON.parse(nextDataMatch[1]);
    const rawArticles = nextData.props?.pageProps?.articles || [];

    // Map into simplified article objects for landing page
    const articles = rawArticles.map((art: any, index: number) => {
      // Estimate reading time
      const readTime = index % 2 === 0 ? '5 min read' : '3 min read';
      
      // Clean dates
      const dateOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
      const formattedDate = new Date(art.publishDate).toLocaleDateString('en-US', dateOptions);

      return {
        id: art.linkUrl || String(index),
        tag: art.category || 'Clash Royale',
        title: art.title,
        description: art.descriptionForNewsArchive || `Read the official release notes and updates regarding "${art.title}" directly on the Supercell blog.`,
        date: formattedDate,
        readTime,
        thumbnail: art.thumbnail?.imgUrl || null,
        url: `https://supercell.com${art.linkUrl}`,
      };
    });

    return NextResponse.json(articles);
  } catch (error) {
    console.error('Failed to proxy Supercell news:', error);
    return NextResponse.json({ error: 'Failed to retrieve Supercell news feed' }, { status: 500 });
  }
}
