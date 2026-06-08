import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.CLASH_ROYALE_API_KEY;

    if (!apiKey) {
      console.error('CLASH_ROYALE_API_KEY is not defined in environment variables.');
      return NextResponse.json(
        { error: 'API Configuration Error' },
        { status: 500 }
      );
    }

    const res = await fetch('https://api.clashroyale.com/v1/cards', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      next: { revalidate: 86400 }, // Cache response for 24 hours
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`Supercell API error: ${res.status} ${errText}`);
      return NextResponse.json(
        { error: `Failed to fetch cards: ${res.statusText}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to proxy cards API:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
