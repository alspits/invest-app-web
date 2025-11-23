/**
 * Portfolio Factor Analysis API Route
 *
 * Provides advanced factor analysis including sector exposure, market cap distribution,
 * geographic allocation, and currency breakdown.
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchPortfolio } from '@/lib/tinkoff-api';
import { moneyValueToNumber, quotationToNumber } from '@/lib/tinkoff-api';
import { calculateFactorAnalysis } from '@/lib/analytics/portfolio-analysis';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const searchParams = request.nextUrl.searchParams;
    const accountId = searchParams.get('accountId');

    console.log('📊 [Factor Analysis API] Request received:', {
      accountId,
      timestamp: new Date().toISOString(),
    });

    // Validate accountId
    if (!accountId) {
      console.error('❌ [Factor Analysis API] No accountId provided');
      return NextResponse.json(
        { error: 'accountId parameter is required' },
        { status: 400 }
      );
    }

    // Check API token
    const token = process.env.TINKOFF_API_TOKEN;
    if (!token) {
      console.error('❌ [Factor Analysis API] TINKOFF_API_TOKEN not set');
      return NextResponse.json(
        { error: 'Tinkoff API token not configured' },
        { status: 500 }
      );
    }

    // Fetch portfolio data
    console.log('📥 [Factor Analysis API] Fetching portfolio data...');
    const portfolio = await fetchPortfolio(accountId, token);

    if (!portfolio || !portfolio.positions) {
      console.error('❌ [Factor Analysis API] Invalid portfolio data:', portfolio);
      return NextResponse.json(
        { error: 'Invalid portfolio data received' },
        { status: 500 }
      );
    }

    console.log('✅ [Factor Analysis API] Portfolio fetched:', {
      positionsCount: portfolio.positions.length,
    });

    // Transform portfolio positions to analysis format
    const totalValue = portfolio.positions.reduce((sum, pos) => {
      const value = moneyValueToNumber(pos.currentPrice) * quotationToNumber(pos.quantity);
      return sum + value;
    }, 0);

    const positions = portfolio.positions.map(pos => {
      const currentPrice = moneyValueToNumber(pos.currentPrice);
      const quantity = quotationToNumber(pos.quantity);
      const value = currentPrice * quantity;
      const weight = totalValue > 0 ? (value / totalValue) * 100 : 0;

      return {
        figi: pos.figi,
        ticker: pos.ticker || '',
        name: pos.name || pos.ticker || pos.figi,
        value,
        weight,
        quantity,
        currentPrice,
        currency: pos.currentPrice.currency,
        instrumentType: pos.instrumentType,
        isin: undefined, // Not available in current API response
        exchange: undefined, // Not available in current API response
      };
    });

    console.log('🔄 [Factor Analysis API] Transformed positions:', {
      count: positions.length,
      totalValue,
    });

    // Calculate factor analysis
    console.log('🧮 [Factor Analysis API] Calculating factor analysis...');
    const factorAnalysis = calculateFactorAnalysis(positions);

    const duration = Date.now() - startTime;

    console.log('✅ [Factor Analysis API] Analysis completed:', {
      duration: `${duration}ms`,
      sectorCount: factorAnalysis.sectorExposure.length,
      marketCapCount: factorAnalysis.marketCapExposure.length,
      geographyCount: factorAnalysis.geographyExposure.length,
      currencyCount: factorAnalysis.currencyExposure.length,
      concentrationRisks: factorAnalysis.riskIndicators,
    });

    // Return analysis result
    return NextResponse.json({
      success: true,
      data: factorAnalysis,
      metadata: {
        accountId,
        positionsCount: positions.length,
        totalValue,
        timestamp: new Date().toISOString(),
        duration,
      },
    });

  } catch (error) {
    const duration = Date.now() - startTime;

    console.error('❌ [Factor Analysis API] Error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      duration: `${duration}ms`,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to calculate factor analysis',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
