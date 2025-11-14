import { NextRequest, NextResponse } from 'next/server';
import { fetchAccounts } from '@/lib/tinkoff-api';

export async function GET(request: NextRequest) {
  try {
    const token = process.env.TINKOFF_API_TOKEN;

    // Debug logging
    console.log('=== DEBUG: Tinkoff API Token Check ===');
    console.log('Token exists:', !!token);
    console.log('Token length:', token?.length || 0);
    console.log('Token prefix:', token?.substring(0, 10) || 'N/A');
    console.log('All env vars:', Object.keys(process.env).filter(k => k.includes('TINKOFF')));
    console.log('=====================================');

    if (!token) {
      console.error('❌ TINKOFF_API_TOKEN is not set in environment variables');
      return NextResponse.json(
        { error: 'Tinkoff API token not configured' },
        { status: 500 }
      );
    }

    console.log('✅ Token found, calling fetchAccounts...');
    const accounts = await fetchAccounts(token);
    console.log('✅ Accounts fetched successfully:', accounts.length);

    return NextResponse.json({ accounts });
  } catch (error) {
    console.error('❌ Error fetching accounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accounts', details: (error as Error).message },
      { status: 500 }
    );
  }
}
