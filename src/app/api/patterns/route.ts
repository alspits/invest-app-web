import { NextRequest, NextResponse } from 'next/server';
import { fetchOperations } from '@/lib/tinkoff-api';
import { createPatternRecognitionService } from '@/lib/intelligence/pattern-recognition';

// ============================================================================
// GET /api/patterns
// ============================================================================

/**
 * Fetch trading patterns for a specific account
 * Query params:
 * - accountId: string (required)
 * - days: number (optional, default 90)
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const accountId = searchParams.get('accountId');
    const days = parseInt(searchParams.get('days') || '90');

    // Validation
    if (!accountId) {
      return NextResponse.json(
        { error: 'Missing accountId parameter' },
        { status: 400 }
      );
    }

    // Get API token from environment
    const token = process.env.TINKOFF_API_TOKEN;
    if (!token) {
      console.error('❌ TINKOFF_API_TOKEN not configured');
      return NextResponse.json(
        { error: 'API token not configured' },
        { status: 500 }
      );
    }

    console.log('🔍 Fetching trading patterns', {
      accountId,
      days,
    });

    // Calculate date range
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);

    // Fetch operations from Tinkoff API
    console.log('📊 Fetching operations from Tinkoff API...');
    const operations = await fetchOperations(
      accountId,
      token,
      from.toISOString(),
      to.toISOString()
    );

    console.log(`✅ Fetched ${operations.length} operations`);

    // Analyze patterns
    console.log('🧠 Analyzing trading patterns...');
    const patternService = createPatternRecognitionService();
    const analysis = await patternService.analyzePatterns(accountId, operations);

    console.log(`✅ Detected ${analysis.patterns.length} patterns`);
    console.log('📈 Pattern summary:', {
      totalPatterns: analysis.summary.totalPatterns,
      mostCommon: analysis.summary.mostCommonCategory,
      riskScore: analysis.summary.riskScore.toFixed(1),
    });

    // Return analysis
    return NextResponse.json(analysis);
  } catch (error) {
    console.error('❌ Error fetching trading patterns:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch trading patterns',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
