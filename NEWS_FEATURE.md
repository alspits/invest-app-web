# News Feed Feature Documentation

## Overview

The News Feed feature provides real-time financial news filtered by your portfolio assets. It automatically shows news articles that mention stocks you own, helping you stay informed about relevant market developments.

## Features

### 🎯 Smart Filtering
- Automatically filters news to show only articles about assets in your portfolio
- Uses intelligent word-boundary matching to avoid false positives
- Falls back to general business headlines if no portfolio-specific news found

### 🔍 Ticker Search
- Search for news about any specific ticker
- Quick search input with clear functionality
- Real-time results

### ⚡ Performance Optimization
- **1-hour TTL cache**: Reduces API calls and improves load times
- Cache status indicator shows when data is fresh
- Force refresh option available via refresh button

### 📊 Rich Display
- News headlines with descriptions
- Publication source and relative timestamps ("2 hours ago")
- Article images when available
- Relevant asset badges showing which stocks are mentioned
- Click to open full article in new tab

### 🔄 Error Handling
- Graceful error states with retry buttons
- Loading skeletons during fetch
- Empty state messages
- Comprehensive error logging

## Setup

### 1. Get NewsAPI Key

1. Visit https://newsapi.org
2. Sign up for a free account
3. Copy your API key from the dashboard

### 2. Configure Environment

Add to your `.env.local` file:

```bash
NEWSAPI_KEY=your_newsapi_key_here
```

**Important**: The free tier has limits:
- 100 requests per day
- No commercial use
- 1-month article history

For production use, consider upgrading to a paid plan.

### 3. Verify Installation

The feature should work automatically once the API key is configured. Navigate to the Portfolio page and click the "News" tab.

## Usage

### Viewing Portfolio News

1. Navigate to the Portfolio page
2. Ensure a portfolio is loaded with positions
3. Click the "News" tab
4. News will automatically load for your portfolio tickers

### Searching for Specific News

1. Click the "News" tab
2. Enter a ticker symbol in the search box
3. Click "Найти" (Find) or press Enter
4. Click "Очистить" (Clear) to return to portfolio news

### Refreshing News

- Click the refresh icon button to fetch latest news
- News is automatically refreshed every hour
- Green indicator shows when cache is active

## API Reference

### News API Route

**Endpoint**: `/api/news`

**Query Parameters**:
- `tickers` (string): Comma-separated list of tickers to filter by
- `ticker` (string): Single ticker for specific search
- `language` ('ru' | 'en'): Language preference (default: 'ru')
- `pageSize` (number): Number of articles (default 50, max 100)

**Example**:
```bash
GET /api/news?tickers=AAPL,GOOGL&pageSize=20
GET /api/news?ticker=TSLA&language=en
```

**Response**:
```json
{
  "news": [
    {
      "id": "abc123",
      "title": "Company announces earnings",
      "description": "Lorem ipsum...",
      "source": "Reuters",
      "publishedDate": "2025-01-15T10:30:00Z",
      "imageURL": "https://...",
      "articleURL": "https://...",
      "relevantAssets": ["AAPL", "GOOGL"]
    }
  ]
}
```

## Architecture

### Data Flow

```
User Portfolio → Extract Tickers → News Store → API Route → NewsAPI
                                    ↓
                               Cache (1 hour)
                                    ↓
                              News Components
```

### Components

1. **NewsFeed** (`src/components/features/News/NewsFeed.tsx`)
   - Main container component
   - Handles search and refresh logic
   - Auto-loads news for portfolio

2. **NewsList** (`src/components/features/News/NewsList.tsx`)
   - Renders list of articles
   - Manages loading/error/empty states

3. **NewsCard** (`src/components/features/News/NewsCard.tsx`)
   - Individual article card
   - Displays all article metadata
   - Handles image errors gracefully

### State Management

**News Store** (`src/stores/newsStore.ts`):

```typescript
// Load news for portfolio tickers
loadNews(tickers: string[], forceRefresh?: boolean)

// Load news for specific ticker
loadTickerNews(ticker: string)

// Check if cache is valid
isCacheValid(): boolean

// Reset store
reset()
```

### Service Layer

**NewsAPI Service** (`src/lib/news-api.ts`):

```typescript
// Fetch and filter by portfolio tickers
fetchFinancialNews(tickers: string[], apiKey: string, language?: 'ru' | 'en', pageSize?: number)

// Fetch for specific ticker
fetchTickerNews(ticker: string, apiKey: string, language?: 'ru' | 'en', pageSize?: number)

// Fetch general business headlines (fallback)
fetchBusinessHeadlines(apiKey: string, country?: 'ru' | 'us', pageSize?: number)
```

## Rate Limiting & Caching

### Cache Strategy

- **TTL**: 1 hour (3,600,000 ms)
- **Storage**: In-memory (Zustand store)
- **Invalidation**: Automatic after TTL expires or manual refresh
- **Per-tab**: Cache is shared across portfolio/search modes

### Rate Limit Management

With free tier (100 requests/day):
- Cache reduces requests significantly
- Average usage: ~24 requests/day (1 per hour)
- Search operations count against limit
- Monitor usage in NewsAPI dashboard

## Troubleshooting

### No News Showing

**Problem**: Empty state or no news articles

**Solutions**:
1. Check if portfolio is loaded
2. Verify `NEWSAPI_KEY` is set in `.env.local`
3. Check browser console for API errors
4. Verify tickers are in English format
5. Try general business news (clear search)

### API Rate Limit Exceeded

**Problem**: Error message about rate limits

**Solutions**:
1. Wait for rate limit to reset (typically 24 hours)
2. Rely on cached data (1-hour TTL)
3. Reduce manual refreshes
4. Consider upgrading NewsAPI plan

### News Not Updating

**Problem**: Stale news showing

**Solutions**:
1. Click refresh button to force update
2. Check cache indicator (green = active)
3. Wait for 1-hour TTL to expire
4. Clear browser cache and reload

### Images Not Loading

**Problem**: Broken image placeholders

**Solutions**:
1. This is expected for some sources
2. NewsCard hides broken images automatically
3. No action needed - article still readable

## Performance Considerations

### Optimization Techniques

1. **Caching**: 1-hour TTL reduces API calls by ~96%
2. **Lazy Loading**: News only loads when tab is active
3. **Debounced Search**: Prevents excessive API calls
4. **Batch Filtering**: Single API call filters multiple tickers

### Best Practices

1. Avoid excessive manual refreshes
2. Use search sparingly (cache doesn't apply)
3. Monitor API usage in NewsAPI dashboard
4. Consider upgrading for high-traffic use

## Future Enhancements

Potential improvements for future releases:

- [ ] Persistent cache (localStorage/IndexedDB)
- [ ] Push notifications for important news
- [ ] Sentiment analysis on articles
- [ ] Bookmarking/saving articles
- [ ] Filter by news source
- [ ] Advanced search (date range, keywords)
- [ ] RSS feed integration
- [ ] Alternative news providers (Moex API)

## Security Notes

- NewsAPI key is **server-side only** (never exposed to client)
- All requests go through Next.js API routes
- No sensitive data stored in news cache
- External links open in new tab with `noopener,noreferrer`

## Support

For issues or questions:
1. Check this documentation
2. Review console logs for errors
3. Verify environment variables
4. Check NewsAPI status page: https://newsapi.org/status

## Credits

- **News Provider**: NewsAPI.org
- **Date Formatting**: date-fns library
- **Icons**: Lucide React
- **State Management**: Zustand
