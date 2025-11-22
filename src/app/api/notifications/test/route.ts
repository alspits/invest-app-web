import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';

/**
 * POST /api/notifications/test
 * Send test push notification
 */
export async function POST(request: NextRequest) {
  try {
    const { subscription } = await request.json();

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription required' },
        { status: 400 }
      );
    }

    // Configure web-push with VAPID keys
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.warn('[API] VAPID keys not configured');
      // For development/testing, return success without sending
      return NextResponse.json({
        success: true,
        message: 'Test notification (VAPID not configured)',
      });
    }

    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

    // Prepare notification payload
    const payload = JSON.stringify({
      title: 'Тестовое уведомление',
      body: 'Push-уведомления работают корректно! 🎉',
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      tag: 'test-notification',
      url: '/portfolio',
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 'test-notification',
      },
    });

    // Send push notification
    await webpush.sendNotification(subscription, payload);

    console.log('[API] Test notification sent successfully');

    return NextResponse.json({
      success: true,
      message: 'Test notification sent',
    });
  } catch (error) {
    console.error('[API] Send test notification error:', error);
    return NextResponse.json(
      { error: 'Failed to send test notification' },
      { status: 500 }
    );
  }
}
