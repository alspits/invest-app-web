import { NextRequest, NextResponse } from 'next/server';
import { fetchPortfolio } from '@/lib/tinkoff-api';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const accountId = searchParams.get('accountId');

    console.log('=== DEBUG: Portfolio Request ===');
    console.log('Account ID:', accountId);

    if (!accountId) {
      console.error('❌ No accountId provided');
      return NextResponse.json(
        { error: 'accountId parameter is required' },
        { status: 400 }
      );
    }

    const token = process.env.TINKOFF_API_TOKEN;
    console.log('Token exists:', !!token);

    if (!token) {
      console.error('❌ TINKOFF_API_TOKEN is not set');
      return NextResponse.json(
        { error: 'Tinkoff API token not configured' },
        { status: 500 }
      );
    }

    console.log('✅ Fetching portfolio for account:', accountId);
    const portfolio = await fetchPortfolio(accountId, token);
    console.log('✅ Portfolio fetched successfully');
    console.log('Positions count:', portfolio.positions?.length || 0);

    return NextResponse.json(portfolio);
  } catch (error) {
    console.error('❌ Error fetching portfolio:', error);
    return NextResponse.json(
      { error: 'Failed to fetch portfolio', details: (error as Error).message },
      { status: 500 }
    );
  }
}
