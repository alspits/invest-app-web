import { NextRequest, NextResponse } from 'next/server';
import { AlertTriggerEvent } from '@/types/alert';

/**
 * GET /api/alerts/history
 * Fetch alert trigger history
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '30', 10);

    // In production, fetch from database
    const history: AlertTriggerEvent[] = [];

    return NextResponse.json({
      success: true,
      history,
      days,
    });
  } catch (error) {
    console.error('❌ Error fetching history:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch history',
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
