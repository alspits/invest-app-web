import { NextRequest, NextResponse } from 'next/server';
import { Alert, AlertSchema } from '@/types/alert';

/**
 * GET /api/alerts
 * Fetch all alerts for the current user
 */
export async function GET(request: NextRequest) {
  try {
    // In production, fetch from database
    // For now, return empty array (store will use mock data in dev mode)
    const alerts: Alert[] = [];

    return NextResponse.json({
      success: true,
      alerts,
    });
  } catch (error) {
    console.error('❌ Error fetching alerts:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch alerts',
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/alerts
 * Create a new alert
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate alert data
    const validated = AlertSchema.parse(body);

    // In production, save to database
    console.log('✅ Alert created:', validated.name);

    return NextResponse.json({
      success: true,
      alert: validated,
    });
  } catch (error) {
    console.error('❌ Error creating alert:', error);
    return NextResponse.json(
      {
        error: 'Failed to create alert',
        details: (error as Error).message,
      },
      { status: 400 }
    );
  }
}
