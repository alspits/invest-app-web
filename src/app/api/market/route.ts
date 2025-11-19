import { NextRequest, NextResponse } from 'next/server';
import { fetchMarketIndices } from '@/lib/market-api';

export async function GET(request: NextRequest) {
  try {
    const token = process.env.TINKOFF_API_TOKEN;

    if (!token) {
      console.error('❌ TINKOFF_API_TOKEN is not set in environment variables');
      return NextResponse.json(
        { error: 'Tinkoff API token not configured' },
        { status: 500 }
      );
    }

    console.log('✅ Fetching market indices...');
    const marketData = await fetchMarketIndices(token);
    console.log(`✅ Fetched ${marketData.indices.length} market indices`);

    return NextResponse.json(marketData);
  } catch (error) {
    console.error('❌ Error fetching market indices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market indices', details: (error as Error).message },
      { status: 500 }
    );
  }
}
