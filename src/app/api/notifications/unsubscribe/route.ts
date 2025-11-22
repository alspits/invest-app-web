import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/notifications/unsubscribe
 * Unsubscribe from push notifications
 */
export async function POST(request: NextRequest) {
  try {
    const { subscription } = await request.json();

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription data required' },
        { status: 400 }
      );
    }

    // TODO: Remove subscription from database
    console.log('[API] Unsubscribing:', subscription.endpoint);

    // In production, you would:
    // 1. Find subscription by endpoint
    // 2. Delete from database
    // 3. Clean up related data

    return NextResponse.json({
      success: true,
      message: 'Unsubscribed from push notifications',
    });
  } catch (error) {
    console.error('[API] Unsubscribe error:', error);
    return NextResponse.json(
      { error: 'Failed to unsubscribe' },
      { status: 500 }
    );
  }
}
