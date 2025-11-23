/**
 * Tax Loss Harvesting API Route
 * Analyzes portfolio for tax optimization opportunities
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchPortfolio, fetchOperations } from '@/lib/tinkoff-api';
import { moneyValueToNumber, quotationToNumber } from '@/lib/tinkoff/converters';
import { analyzeLossHarvestingOpportunities } from '@/lib/tax/tax-loss-harvesting';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const accountId = searchParams.get('accountId');

    if (!accountId) {
      return NextResponse.json(
        { error: 'accountId parameter is required' },
        { status: 400 }
      );
    }

    const token = process.env.TINKOFF_API_TOKEN;

    if (!token) {
      return NextResponse.json(
        { error: 'Tinkoff API token not configured' },
        { status: 500 }
      );
    }

    // Fetch portfolio positions
    const portfolio = await fetchPortfolio(accountId, token);

    if (!portfolio.positions || portfolio.positions.length === 0) {
      return NextResponse.json({
        totalUnrealizedLosses: 0,
        potentialTaxSavings: 0,
        harvestablePositions: [],
        blockedPositions: [],
        recommendations: [],
      });
    }

    // Convert Tinkoff positions to our format
    const positions = portfolio.positions.map((pos: any) => {
      const quantity = quotationToNumber(pos.quantity);
      const averageCost = moneyValueToNumber(pos.averagePositionPrice);
      const currentPrice = moneyValueToNumber(pos.currentPrice);

      return {
        figi: pos.figi,
        ticker: pos.ticker || pos.figi,
        name: pos.instrumentType || 'Unknown',
        quantity,
        averageCost,
        currentPrice,
      };
    });

    // Fetch operations (transactions) for the last year
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const operations = await fetchOperations(
      accountId,
      token,
      oneYearAgo,
      new Date()
    );

    // Convert operations to transactions
    const transactions = operations
      .filter((op: any) =>
        op.operationType === 'buy' ||
        op.operationType === 'sell' ||
        op.operationType === 'Покупка' ||
        op.operationType === 'Продажа'
      )
      .map((op: any) => {
        const isBuy = op.operationType === 'buy' || op.operationType === 'Покупка';

        return {
          figi: op.figi,
          date: new Date(op.date),
          type: isBuy ? 'buy' as const : 'sell' as const,
          quantity: Math.abs(op.quantity || quotationToNumber(op.quantityRest) || 0),
          price: Math.abs(moneyValueToNumber(op.payment) / (op.quantity || 1)),
        };
      });

    // Analyze for loss harvesting opportunities
    const report = analyzeLossHarvestingOpportunities(
      positions,
      transactions,
      new Date()
    );

    return NextResponse.json(report);
  } catch (error) {
    console.error('Error analyzing tax loss harvesting:', error);
    return NextResponse.json(
      {
        error: 'Failed to analyze tax loss harvesting',
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
