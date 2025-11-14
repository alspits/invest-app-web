import { NextRequest, NextResponse } from 'next/server';
import { PortfolioSnapshot } from '@/lib/analytics';
import { fetchPortfolio } from '@/lib/tinkoff-api';

// In-memory cache for portfolio history
const portfolioHistory: Map<string, PortfolioSnapshot[]> = new Map();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const accountId = searchParams.get('accountId');
    const daysParam = searchParams.get('days');
    const days = daysParam ? parseInt(daysParam, 10) : 30;

    console.log('=== DEBUG: Portfolio History GET Request ===');
    console.log('Account ID:', accountId);
    console.log('Days:', days);

    if (!accountId) {
      console.error('❌ No accountId provided');
      return NextResponse.json(
        { error: 'accountId is required' },
        { status: 400 }
      );
    }

    const token = process.env.TINKOFF_API_TOKEN;
    console.log('Token exists:', !!token);

    if (!token) {
      console.error('❌ TINKOFF_API_TOKEN is not configured');
      return NextResponse.json(
        { error: 'API token not configured' },
        { status: 500 }
      );
    }

    console.log('✅ Fetching portfolio for account:', accountId);
    const portfolio = await fetchPortfolio(accountId, token);
    console.log('✅ Portfolio fetched successfully');

    // Create PortfolioSnapshot object
    const snapshot: PortfolioSnapshot = {
      timestamp: new Date(),
      totalValue: portfolio.totalAmountShares?.units
        ? parseFloat(portfolio.totalAmountShares.units) + (portfolio.totalAmountShares.nano / 1_000_000_000)
        : 0,
      positions: portfolio.positions?.map(pos => ({
        symbol: pos.ticker || pos.figi,
        quantity: parseFloat(pos.quantity.units) + (pos.quantity.nano / 1_000_000_000),
        currentPrice: pos.currentPrice
          ? parseFloat(pos.currentPrice.units) + (pos.currentPrice.nano / 1_000_000_000)
          : 0,
        value: pos.currentPrice
          ? (parseFloat(pos.quantity.units) + (pos.quantity.nano / 1_000_000_000)) *
            (parseFloat(pos.currentPrice.units) + (pos.currentPrice.nano / 1_000_000_000))
          : 0,
        investedValue: pos.averagePositionPrice
          ? (parseFloat(pos.quantity.units) + (pos.quantity.nano / 1_000_000_000)) *
            (parseFloat(pos.averagePositionPrice.units) + (pos.averagePositionPrice.nano / 1_000_000_000))
          : undefined,
      })) || [],
      currency: portfolio.totalAmountShares?.currency || 'RUB',
    };

    // Get or create cache array for accountId
    let snapshots = portfolioHistory.get(accountId) || [];

    // Add new snapshot to array
    snapshots.push(snapshot);

    // Filter snapshots: keep only last N days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    snapshots = snapshots.filter(s => new Date(s.timestamp) >= cutoffDate);

    // Save filtered array back to cache
    portfolioHistory.set(accountId, snapshots);

    console.log('✅ Portfolio history updated');
    console.log('Total snapshots:', snapshots.length);

    return NextResponse.json({
      success: true,
      snapshots: snapshots,
      count: snapshots.length,
    });
  } catch (error) {
    console.error('❌ Error fetching portfolio history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch portfolio history' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accountId, snapshot } = body;

    console.log('=== DEBUG: Portfolio History POST Request ===');
    console.log('Account ID:', accountId);
    console.log('Snapshot timestamp:', snapshot?.timestamp);

    if (!accountId) {
      console.error('❌ No accountId provided');
      return NextResponse.json(
        { error: 'accountId is required' },
        { status: 400 }
      );
    }

    // Get or create cache array for accountId
    let snapshots = portfolioHistory.get(accountId) || [];

    // Add snapshot to array
    snapshots.push(snapshot);

    // Save back to cache
    portfolioHistory.set(accountId, snapshots);

    console.log('✅ Snapshot saved successfully');
    console.log('Total snapshots:', snapshots.length);

    return NextResponse.json({
      success: true,
      message: 'Snapshot saved',
    });
  } catch (error) {
    console.error('❌ Error saving snapshot:', error);
    return NextResponse.json(
      { error: 'Failed to save snapshot' },
      { status: 500 }
    );
  }
}
