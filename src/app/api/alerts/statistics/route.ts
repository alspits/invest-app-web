import { NextRequest, NextResponse } from 'next/server';
import { AlertStatistics } from '@/types/alert';

/**
 * GET /api/alerts/statistics
 * Fetch alert statistics
 */
export async function GET(request: NextRequest) {
  try {
    // In production, calculate from database
    const statistics: AlertStatistics = {
      totalAlerts: 0,
      activeAlerts: 0,
      triggeredToday: 0,
      triggeredThisWeek: 0,
      triggeredThisMonth: 0,
      averageTriggersPerDay: 0,
      mostTriggeredTicker: '',
      mostTriggeredAlertType: 'THRESHOLD',
    };

    return NextResponse.json({
      success: true,
      statistics,
    });
  } catch (error) {
    console.error('❌ Error fetching statistics:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch statistics',
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
