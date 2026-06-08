import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export async function GET() {
  try {
    const res = await fetch('https://supercell.com/en/games/clashroyale/blog/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!res.ok) {
      throw new Error(`Supercell response error: ${res.statusText}`);
    }

    const html = await res.text();
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);

    if (!nextDataMatch) {
      throw new Error('__NEXT_DATA__ JSON script element not found.');
    }

    const nextData = JSON.parse(nextDataMatch[1]);
    const articles = nextData.props?.pageProps?.articles || [];

    if (articles.length === 0) {
      return NextResponse.json({ checked: true, status: 'No articles found' });
    }

    const latestArticle = articles[0];
    const latestId = latestArticle.linkUrl;

    // Check last cached article ID in Redis fallback
    const lastNotifiedId = await redis.get<string>('clash_royale_last_notified_news_id');

    let isNew = false;
    if (lastNotifiedId !== latestId) {
      isNew = true;
      // Update cache
      await redis.set('clash_royale_last_notified_news_id', latestId);
    }

    return NextResponse.json({
      checked: true,
      isNew,
      latestNews: {
        title: latestArticle.title,
        url: `https://supercell.com${latestArticle.linkUrl}`,
        publishDate: latestArticle.publishDate,
      },
    });
  } catch (error) {
    console.error('Failed to run auto-news check:', error);
    return NextResponse.json({ error: 'Failed news automation check' }, { status: 500 });
  }
}
