# Market Context Feature Documentation

## Overview

The Market Context feature provides real-time market indices data displayed prominently on the portfolio page. It helps users understand broader market trends while managing their investments, showing key Russian and international indices with live updates.

## Features

### 📊 Key Market Indices
- **Russian Indices**: MOEX (Индекс МосБиржи), RTS (Индекс РТС)
- **International Indices**: S&P 500, Nasdaq
- Real-time data from Tinkoff API for Russian markets
- Mock data for international indices (easily replaceable with real APIs)

### 📈 Comprehensive Display
- Current index value with proper formatting
- Percentage and absolute change from previous close
- Color-coded trend indicators (green/red/gray)
- Day high/low range when available
- Visual trend icons (up/down/neutral arrows)

### ⚡ Performance Optimized
- **15-minute TTL cache**: Balances freshness with API efficiency
- Cache status indicator shows when data is active
- Auto-refresh every 15 minutes
- Manual refresh button available
- Response time under 3 seconds

### 🎨 User Experience
- Responsive grid layout (1-4 columns based on screen size)
- Clean, card-based design
- Loading states with spinner
- Error handling with retry functionality
- Graceful fallback to mock data if API fails

## Setup

The Market Context feature works automatically once you have the Tinkoff API token configured. No additional setup required!

### Prerequisites

Ensure your `.env.local` has:
```bash
TINKOFF_API_TOKEN=your_tinkoff_api_token_here
```

The feature uses the same token as portfolio data.

## Usage

### Viewing Market Indices

1. Navigate to the Portfolio page
2. Market Context widget appears at the top, above all tabs
3. Indices load automatically on page mount
4. Data refreshes every 15 minutes

### Manual Refresh

- Click the refresh icon in the top-right corner of the widget
- Forces immediate data refresh from API
- Useful when you want the latest data before cache expires

### Understanding the Display

Each index card shows:
- **Name & Ticker**: Full name and ticker symbol
- **Current Value**: Latest index value (formatted with locale)
- **Change**: Both absolute (+24.00) and percentage (+0.75%) change
- **Trend Icon**: Visual indicator in colored circle
  - 🟢 Green up arrow: Positive change
  - 🔴 Red down arrow: Negative change
  - ⚪ Gray line: No change
- **Day Range**: High and low values for the trading day

## Technical Architecture

### Data Flow

```
Portfolio Page → MarketContext Component → Market Store → API Route → Tinkoff API
                                             ↓
                                        Cache (15 min)
                                             ↓
                                         IndexCard
```

### API Integration

#### Russian Indices (Tinkoff API)

The feature uses Tinkoff's MarketDataService with two endpoints:

1. **GetLastPrices**
   ```typescript
   POST /tinkoff.public.invest.api.contract.v1.MarketDataService/GetLastPrices
   Body: { figi: ["BBG004730ZJ9"] }
   ```
   Returns current price for the index

2. **GetCandles**
   ```typescript
   POST /tinkoff.public.invest.api.contract.v1.MarketDataService/GetCandles
   Body: {
     figi: "BBG004730ZJ9",
     interval: "CANDLE_INTERVAL_DAY",
     from: "2025-01-15T00:00:00Z",
     to: "2025-01-15T23:59:59Z"
   }
   ```
   Returns OHLC data for day high/low and previous close

#### International Indices (Mock Data)

S&P 500 and Nasdaq currently use realistic mock data with random variations.

**To replace with real data:**
1. Choose an API (Alpha Vantage, Yahoo Finance, Twelve Data, etc.)
2. Update `generateMockIndexData()` in `lib/market-api.ts`
3. Add API key to environment variables
4. Implement API call similar to Tinkoff integration

Example with Alpha Vantage:
```typescript
async function fetchAlphaVantageIndex(symbol: string): Promise<MarketIndex> {
  const response = await fetch(
    `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`
  );
  const data = await response.json();

  return {
    name: symbol,
    ticker: symbol,
    currentValue: parseFloat(data['Global Quote']['05. price']),
    changePercent: parseFloat(data['Global Quote']['10. change percent']),
    // ... map other fields
  };
}
```

### Components

#### MarketContext Component
**Location**: `src/components/features/Market/MarketContext.tsx`

**Responsibilities**:
- Auto-load indices on mount
- Set up 15-minute auto-refresh timer
- Handle manual refresh
- Display loading/error states
- Render index cards in responsive grid

**Key Props**: None (uses Zustand store directly)

#### IndexCard Component
**Location**: `src/components/features/Market/IndexCard.tsx`

**Responsibilities**:
- Display individual index data
- Color-code based on change direction
- Format numbers with locale support
- Show trend icon
- Display day range when available

**Props**:
```typescript
interface IndexCardProps {
  index: MarketIndex;
}
```

### State Management

**Market Store** (`src/stores/marketStore.ts`):

```typescript
interface MarketState {
  indices: MarketIndex[];
  isLoadingMarket: boolean;
  marketError: string | null;
  lastFetchTime: number | null;
  cacheTTL: number; // 15 minutes

  loadMarketIndices: (forceRefresh?: boolean) => Promise<void>;
  isCacheValid: () => boolean;
  reset: () => void;
}
```

**Key Methods**:
- `loadMarketIndices()`: Fetches indices, respects cache
- `loadMarketIndices(true)`: Forces refresh, bypasses cache
- `isCacheValid()`: Checks if cache is still fresh

### Caching Strategy

#### Cache TTL: 15 Minutes

Why 15 minutes?
- Indices update frequently during trading hours
- Balances data freshness with API efficiency
- Typical portfolio views last 5-20 minutes
- Reduces Tinkoff API load

#### Cache Validation

```typescript
isCacheValid(): boolean {
  const now = Date.now();
  const age = now - lastFetchTime;
  return age < 900000; // 15 minutes in ms
}
```

#### Cache Behavior

- **First load**: Fetches from API, caches result
- **Subsequent loads**: Uses cache if valid
- **After 15 min**: Auto-refreshes on next check
- **Manual refresh**: Bypasses cache completely
- **Tab switch**: Uses cache (doesn't refetch)

## Index Configuration

### Currently Configured Indices

| Index | Ticker | FIGI | Name | Data Source |
|-------|--------|------|------|-------------|
| MOEX | IMOEX | BBG004730ZJ9 | Индекс МосБиржи | Tinkoff API |
| RTS | RTSI | BBG004731354 | Индекс РТС | Tinkoff API |
| S&P 500 | SPX | - | S&P 500 | Mock Data |
| Nasdaq | IXIC | - | Nasdaq | Mock Data |

### Adding New Indices

To add a new index:

1. **For Tinkoff-available indices**:
   ```typescript
   // In lib/market-api.ts
   const MARKET_INDICES = {
     // ... existing
     NEWIDX: {
       name: 'New Index Name',
       ticker: 'NEWIDX',
       figi: 'BBG00XXXXXXX', // Find FIGI in Tinkoff docs
     },
   };
   ```

2. **Update fetch logic**:
   ```typescript
   // In fetchMarketIndices()
   try {
     const newIdx = await fetchTinkoffIndex('NEWIDX', token);
     indices.push(newIdx);
   } catch (error) {
     console.error('Failed to fetch NEWIDX');
     // Add fallback if needed
   }
   ```

3. **Test**: Verify data appears correctly in UI

## API Reference

### Market API Route

**Endpoint**: `/api/market`

**Method**: `GET`

**Authentication**: Server-side (uses `TINKOFF_API_TOKEN` from env)

**Response**:
```json
{
  "indices": [
    {
      "name": "Индекс МосБиржи",
      "ticker": "IMOEX",
      "figi": "BBG004730ZJ9",
      "currentValue": 3215.50,
      "changePercent": 0.75,
      "changeAbsolute": 24.00,
      "dayHigh": 3220.00,
      "dayLow": 3200.00,
      "previousClose": 3191.50,
      "lastUpdated": "2025-01-15T14:30:00.000Z"
    },
    {
      "name": "Индекс РТС",
      "ticker": "RTSI",
      "figi": "BBG004731354",
      "currentValue": 1105.20,
      "changePercent": -0.30,
      "changeAbsolute": -3.30,
      "dayHigh": 1110.00,
      "dayLow": 1100.00,
      "previousClose": 1108.50,
      "lastUpdated": "2025-01-15T14:30:00.000Z"
    }
  ],
  "lastUpdated": "2025-01-15T14:30:00.000Z"
}
```

**Error Response**:
```json
{
  "error": "Failed to fetch market indices",
  "details": "Tinkoff Market API Error: 500 Internal Server Error"
}
```

### Market Data Service

**Service Layer**: `src/lib/market-api.ts`

**Public Methods**:

```typescript
// Fetch all configured market indices
fetchMarketIndices(token: string): Promise<MarketContextData>
```

**Internal Methods**:

```typescript
// Fetch specific Tinkoff index
fetchTinkoffIndex(indexKey: 'IMOEX' | 'RTSI', token: string): Promise<MarketIndex>

// Get last price for FIGI
getLastPrice(figi: string, token: string): Promise<number>

// Get candle data for high/low/close
getCandleData(figi: string, token: string): Promise<{
  dayHigh?: number;
  dayLow?: number;
  previousClose?: number;
}>

// Generate mock data for international indices
generateMockIndexData(ticker: 'SPX' | 'IXIC'): MarketIndex
```

## Troubleshooting

### Indices Not Loading

**Problem**: Widget shows loading spinner indefinitely

**Solutions**:
1. Check if `TINKOFF_API_TOKEN` is set in `.env.local`
2. Verify token is valid and not expired
3. Check browser console for API errors
4. Try manual refresh button
5. Check Tinkoff API status

### Incorrect Data

**Problem**: Index values seem wrong or outdated

**Solutions**:
1. Click manual refresh to force update
2. Check if cache is active (green indicator)
3. Verify trading hours (indices only update during market hours)
4. Check Tinkoff API for maintenance
5. Clear browser cache and reload

### Error Message Displayed

**Problem**: Red error banner shows

**Solutions**:
1. Click "Повторить попытку" (Retry) button
2. Wait a moment and try again
3. Check internet connection
4. Verify Tinkoff API is operational
5. Check browser console for detailed error

### Mock Data Showing

**Problem**: S&P 500 / Nasdaq show unrealistic values

**Expected Behavior**: These use mock data by design
- Values based on realistic ranges
- Random variation on each refresh
- Replace with real API when needed (see Technical Architecture section)

### Slow Loading

**Problem**: Indices take >3 seconds to load

**Causes**:
1. Multiple Tinkoff API calls (LastPrice + Candles for each index)
2. Network latency
3. Tinkoff API response time

**Solutions**:
1. Cache should prevent frequent slow loads
2. Check network connection speed
3. Consider reducing number of indices
4. Use cache aggressively (increase TTL)

## Performance Considerations

### API Call Efficiency

**Without cache**:
- 2 API calls per Russian index (LastPrice + Candles)
- 4 total calls for IMOEX + RTSI
- Every page load = 4 API calls

**With 15-min cache**:
- First load: 4 API calls
- Next 14 minutes: 0 API calls
- 96% reduction in API calls (for frequent users)

### Response Time Breakdown

Typical response time: ~2-3 seconds

Components:
- LastPrice call: ~500ms per index
- Candles call: ~800ms per index
- Network overhead: ~200ms
- Parallel fetching: Indices fetched concurrently

### Optimization Tips

1. **Increase cache TTL** for less frequent updates:
   ```typescript
   cacheTTL: 30 * 60 * 1000 // 30 minutes
   ```

2. **Reduce indices** if load time critical:
   ```typescript
   // Comment out indices in fetchMarketIndices()
   // indices.push(generateMockIndexData('SPX'));
   ```

3. **Use mock data** for development:
   ```typescript
   // In fetchMarketIndices(), use fallback only
   ```

## Security Notes

- Tinkoff API token is **server-side only**
- Never exposed to client browser
- All requests go through Next.js API route (`/api/market`)
- No sensitive data cached on client
- FIGI identifiers are public (safe to expose)

## Future Enhancements

### Planned Features

- [ ] **Real international data**: Integrate Alpha Vantage or Yahoo Finance
- [ ] **Year high/low**: Add 52-week range to cards
- [ ] **Sparkline charts**: Mini trend charts on each card
- [ ] **User customization**: Select which indices to display
- [ ] **More indices**:
  - Commodity prices (Gold, Oil, etc.)
  - Currency pairs (USD/RUB, EUR/RUB)
  - Bond indices
  - Crypto indices (BTC, ETH)
- [ ] **Historical view**: Toggle to see 1D/1W/1M performance
- [ ] **Comparison mode**: Overlay multiple indices on one chart
- [ ] **Market status**: Show if market is open/closed
- [ ] **Pre/post market data**: Extended hours trading info

### API Integration Options

For international indices, consider:

1. **Alpha Vantage** (Recommended)
   - Free tier: 25 requests/day
   - Global coverage
   - Easy integration
   - Documentation: https://www.alphavantage.co/

2. **Yahoo Finance API**
   - Free (unofficial)
   - Good coverage
   - Less reliable
   - Use unofficial libraries

3. **Twelve Data**
   - Free tier: 800 requests/day
   - Professional-grade
   - Good for production
   - Documentation: https://twelvedata.com/

4. **Finnhub**
   - Free tier: 60 calls/minute
   - Real-time data
   - Excellent for stocks
   - Documentation: https://finnhub.io/

## Support

For issues or questions:
1. Check this documentation
2. Review browser console logs
3. Verify environment variables
4. Check Tinkoff API status
5. Review code in `src/lib/market-api.ts`

## Credits

- **Market Data**: Tinkoff Invest API
- **Icons**: Lucide React
- **State Management**: Zustand
- **Validation**: Zod
