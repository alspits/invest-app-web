import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PortfolioSnapshot } from '@/lib/analytics';
import { fetchPortfolio, moneyValueToNumber, quotationToNumber } from '@/lib/tinkoff-api';

// Zod schemas for validation
const PositionSchema = z.object({
  symbol: z.string(),
  quantity: z.number(),
  currentPrice: z.number(),
  value: z.number(),
  investedValue: z.number().optional(),
});

const SnapshotSchema = z.object({
  timestamp: z.union([z.string(), z.date()]).transform(val =>
    typeof val === 'string' ? new Date(val) : val
  ),
  totalValue: z.number(),
  positions: z.array(PositionSchema),
  currency: z.string(),
});

// In-memory cache for portfolio history
// TODO: Replace with persistent storage (Redis, database) for production
// Current in-memory cache will reset on server restart
const portfolioHistory: Map<string, PortfolioSnapshot[]> = new Map();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const accountId = searchParams.get('accountId');
    const daysParam = searchParams.get('days');

    console.log('=== DEBUG: Portfolio History GET Request ===');
    console.log('Account ID:', accountId);
    console.log('Days param:', daysParam);

    // Validate accountId
    if (!accountId) {
      console.error('❌ No accountId provided');
      return NextResponse.json(
        { error: 'accountId is required' },
        { status: 400 }
      );
    }

    // Validate days parameter
    if (daysParam && daysParam !== 'all') {
      const parsedDays = parseInt(daysParam, 10);
      if (isNaN(parsedDays) || parsedDays <= 0) {
        console.error('❌ Invalid days parameter');
        return NextResponse.json(
          { error: 'days must be a positive number or "all"' },
          { status: 400 }
        );
      }
    }

    const days = daysParam === 'all' ? null : (daysParam ? parseInt(daysParam, 10) : 30);
    console.log('Days:', days);

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

    // Create PortfolioSnapshot object using helper functions
    const snapshot: PortfolioSnapshot = {
      timestamp: new Date(),
      totalValue: portfolio.totalAmountShares
        ? moneyValueToNumber(portfolio.totalAmountShares)
        : 0,
      positions: portfolio.positions?.map(pos => {
        const quantity = quotationToNumber(pos.quantity);
        const currentPrice = pos.currentPrice ? moneyValueToNumber(pos.currentPrice) : 0;
        const averagePrice = pos.averagePositionPrice ? moneyValueToNumber(pos.averagePositionPrice) : null;

        return {
          symbol: pos.ticker || pos.figi,
          quantity,
          currentPrice,
          value: quantity * currentPrice,
          investedValue: averagePrice ? quantity * averagePrice : undefined,
        };
      }) || [],
      currency: portfolio.totalAmountShares?.currency || 'RUB',
    };

    // Get or create cache array for accountId
    let snapshots = portfolioHistory.get(accountId) || [];

    // Add new snapshot to array
    snapshots.push(snapshot);

    // Filter snapshots: keep only last N days (if days is not null)
    if (days !== null) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      snapshots = snapshots.filter(s => new Date(s.timestamp) >= cutoffDate);
    }

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

    // Validate accountId
    if (!accountId || typeof accountId !== 'string') {
      console.error('❌ Invalid or missing accountId');
      return NextResponse.json(
        { error: 'accountId is required and must be a string' },
        { status: 400 }
      );
    }

    // Validate snapshot with Zod schema
    let validatedSnapshot: PortfolioSnapshot;
    try {
      validatedSnapshot = SnapshotSchema.parse(snapshot);
    } catch (error) {
      console.error('❌ Invalid snapshot data:', error);
      return NextResponse.json(
        {
          error: 'Invalid snapshot data',
          details: error instanceof z.ZodError ? error.issues : 'Validation failed'
        },
        { status: 400 }
      );
    }

    // Get or create cache array for accountId
    let snapshots = portfolioHistory.get(accountId) || [];

    // Add validated snapshot to array
    snapshots.push(validatedSnapshot);

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
