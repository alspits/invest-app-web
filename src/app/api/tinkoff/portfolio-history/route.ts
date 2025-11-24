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

    // ✅ Detect mock mode
    const isMockAccount = accountId.startsWith('mock-');

    let snapshots: PortfolioSnapshot[] = [];

    if (isMockAccount) {
      // Generate mock portfolio history with caching
      console.log('🎭 Using MOCK mode for portfolio history');

      // Create cache key from accountId and days
      const cacheKey = `${accountId}-${days || 30}`;

      // Check cache first
      const cachedSnapshots = portfolioHistory.get(cacheKey);
      if (cachedSnapshots) {
        console.log('✅ Returning cached mock snapshots');
        snapshots = cachedSnapshots;
      } else {
        console.log('🔄 Generating new deterministic mock snapshots');
        snapshots = generateMockPortfolioHistory(accountId, days || 30);

        // Store in cache (same as real accounts)
        portfolioHistory.set(cacheKey, snapshots);
        console.log('✅ Mock snapshots cached');
      }
    } else {
      // Real account - fetch from Tinkoff API
      const token = process.env.TINKOFF_API_TOKEN;
      console.log('Token exists:', !!token);

      if (!token) {
        console.error('❌ TINKOFF_API_TOKEN is not configured');
        return NextResponse.json(
          { error: 'API token not configured' },
          { status: 500 }
        );
      }

      console.log('🔵 Using REAL Tinkoff API for portfolio history');
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
      const allSnapshots = portfolioHistory.get(accountId) || [];

      // Add new snapshot to full array
      allSnapshots.push(snapshot);

      // Always persist the full array to cache (never filter when saving)
      portfolioHistory.set(accountId, allSnapshots);

      console.log('✅ Portfolio history updated');
      console.log('Total snapshots in cache:', allSnapshots.length);

      // Filter for response only (if days parameter is provided)
      if (days !== null) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        snapshots = allSnapshots.filter(s => new Date(s.timestamp) >= cutoffDate);
      } else {
        snapshots = allSnapshots;
      }
    }

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
    const snapshots = portfolioHistory.get(accountId) || [];

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

/**
 * Simple deterministic pseudo-random number generator (seeded)
 * Using Mulberry32 algorithm for deterministic randomness
 */
function createSeededRandom(seed: number) {
  return function() {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Create deterministic seed from string (accountId + days)
 */
function hashStringToSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Generate mock portfolio history for testing without Tinkoff API
 * Uses deterministic seed from accountId and days for consistent data
 */
function generateMockPortfolioHistory(accountId: string, days: number): PortfolioSnapshot[] {
  // Create deterministic seed from accountId and days
  const seedString = `${accountId}-${days}`;
  const seed = hashStringToSeed(seedString);
  const random = createSeededRandom(seed);

  const snapshots: PortfolioSnapshot[] = [];
  const volatility = 0.015; // 1.5% daily volatility
  const drift = 0.0003; // Slight upward drift per day

  console.log(`🎲 Using deterministic seed: ${seed} for ${seedString}`);

  // Mock positions with realistic distribution
  const mockPositions = [
    {
      symbol: 'SBER',
      figi: 'BBG004730N88',
      name: 'Sberbank',
      baseQuantity: 1000,
      basePrice: 280,
      weight: 0.35, // 35% of portfolio
    },
    {
      symbol: 'GAZP',
      figi: 'BBG004730ZJ9',
      name: 'Gazprom',
      baseQuantity: 500,
      basePrice: 200,
      weight: 0.25, // 25% of portfolio
    },
    {
      symbol: 'LKOH',
      figi: 'BBG004731032',
      name: 'LUKOIL',
      baseQuantity: 50,
      basePrice: 6500,
      weight: 0.20, // 20% of portfolio
    },
    {
      symbol: 'YNDX',
      figi: 'BBG001NVJ6W4',
      name: 'Yandex',
      baseQuantity: 30,
      basePrice: 4500,
      weight: 0.15, // 15% of portfolio
    },
    {
      symbol: 'TMOS',
      figi: 'BBG00QPYJ5H0',
      name: 'MOEX Russia Index ETF',
      baseQuantity: 100,
      basePrice: 500,
      weight: 0.05, // 5% of portfolio
    },
  ];

  // Generate historical snapshots
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    // Random walk with drift (using deterministic random)
    const randomChange = (random() - 0.5) * volatility + drift;
    const dayMultiplier = 1 + randomChange;

    // Calculate positions for this day
    const positions = mockPositions.map(pos => {
      const priceChange = 1 + (random() - 0.5) * volatility * 2;
      const currentPrice = pos.basePrice * priceChange * Math.pow(dayMultiplier, days - i);
      const quantity = pos.baseQuantity;
      const value = quantity * currentPrice;
      const investedValue = quantity * pos.basePrice * 0.95; // Assume bought at 5% lower price (5% unrealized gain)

      return {
        symbol: pos.symbol,
        quantity,
        currentPrice: Math.round(currentPrice * 100) / 100,
        value: Math.round(value * 100) / 100,
        investedValue: Math.round(investedValue * 100) / 100,
      };
    });

    const totalValue = positions.reduce((sum, pos) => sum + pos.value, 0);

    snapshots.push({
      timestamp: date,
      totalValue: Math.round(totalValue * 100) / 100,
      positions,
      currency: 'RUB',
    });
  }

  console.log(`✅ Generated ${snapshots.length} mock snapshots for ${accountId}`);
  console.log(`Value range: ${Math.round(snapshots[0].totalValue)} - ${Math.round(snapshots[snapshots.length - 1].totalValue)} RUB`);

  return snapshots;
}
