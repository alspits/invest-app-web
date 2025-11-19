import { NextRequest, NextResponse } from 'next/server';
import { fetchFinancialNews, fetchTickerNews, fetchBusinessHeadlines } from '@/lib/news-api';

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.NEWSAPI_KEY;

    if (!apiKey) {
      console.error('❌ NEWSAPI_KEY is not set in environment variables');
      return NextResponse.json(
        { error: 'NewsAPI key not configured' },
        { status: 500 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const tickersParam = searchParams.get('tickers');
    const ticker = searchParams.get('ticker');
    const language = (searchParams.get('language') || 'ru') as 'ru' | 'en';
    const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);

    console.log('✅ NewsAPI route called with:', {
      tickersParam,
      ticker,
      language,
      pageSize,
    });

    // Fetch news for specific ticker
    if (ticker) {
      const news = await fetchTickerNews(ticker, apiKey, language, Math.min(pageSize, 20));
      return NextResponse.json({ news });
    }

    // Fetch news filtered by portfolio tickers
    if (tickersParam) {
      const tickers = tickersParam.split(',').filter(t => t.trim());

      if (tickers.length === 0) {
        // If no tickers, return business headlines as fallback
        const news = await fetchBusinessHeadlines(apiKey, language === 'ru' ? 'ru' : 'us', 20);
        return NextResponse.json({ news });
      }

      const news = await fetchFinancialNews(tickers, apiKey, language, Math.min(pageSize, 100));

      // If no relevant news found for portfolio, fetch business headlines as fallback
      if (news.length === 0) {
        console.log('ℹ️ No portfolio-specific news found, fetching business headlines');
        const headlines = await fetchBusinessHeadlines(apiKey, language === 'ru' ? 'ru' : 'us', 20);
        return NextResponse.json({ news: headlines });
      }

      return NextResponse.json({ news });
    }

    // Default: fetch business headlines
    const news = await fetchBusinessHeadlines(apiKey, language === 'ru' ? 'ru' : 'us', 20);
    return NextResponse.json({ news });

  } catch (error) {
    console.error('❌ Error fetching news:', error);
    return NextResponse.json(
      { error: 'Failed to fetch news', details: (error as Error).message },
      { status: 500 }
    );
  }
}
