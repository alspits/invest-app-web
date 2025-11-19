# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an **Investment Portfolio Tracker** for Tinkoff Investments, built as a Next.js 16 web application. The app allows users to view their investment portfolio, track performance metrics, and analyze historical data through integration with the Tinkoff Invest API.

## Development Commands

```bash
# Development
cd invest-app-web
npm run dev          # Start development server at http://localhost:3000

# Build & Production
npm run build        # Production build
npm start            # Start production server

# Linting
npm run lint         # Run ESLint
```

## Environment Setup

The application requires a `.env.local` file in `invest-app-web/` with:

```bash
NEXT_PUBLIC_TINKOFF_API_URL=https://invest-public-api.tinkoff.ru/rest
TINKOFF_API_TOKEN=<your_token_here>
NEWSAPI_KEY=<your_newsapi_key_here>
NEXTAUTH_SECRET=<secret>
NEXTAUTH_URL=http://localhost:3000
```

**Important**:
- The `TINKOFF_API_TOKEN` is required for API routes to work. All Tinkoff API requests are made server-side through Next.js API routes.
- The `NEWSAPI_KEY` is required for the News Feed feature. Get your free API key at https://newsapi.org

## Architecture

### Tech Stack
- **Framework**: Next.js 16 (App Router) with React 19
- **State Management**: Zustand stores + TanStack Query (React Query)
- **Styling**: Tailwind CSS v4
- **Validation**: Zod schemas
- **Charts**: Recharts
- **Performance**: React Compiler enabled (`reactCompiler: true` in next.config.ts)

### Directory Structure

```
invest-app-web/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/               # Backend API routes (server-side)
│   │   │   ├── tinkoff/       # Tinkoff API routes
│   │   │   │   ├── accounts/  # GET accounts
│   │   │   │   ├── portfolio/ # GET portfolio by accountId
│   │   │   │   └── portfolio-history/ # GET historical snapshots
│   │   │   ├── news/          # GET news (filtered by tickers)
│   │   │   └── market/        # GET market indices (RTS, MOEX, etc.)
│   │   ├── portfolio/         # Portfolio page with tabs
│   │   ├── page.tsx           # Home page (redirects to Portfolio)
│   │   └── layout.tsx         # Root layout with providers
│   │
│   ├── stores/                # Zustand global state
│   │   ├── portfolioStore.ts  # Portfolio & accounts state
│   │   ├── analyticsStore.ts  # Analytics & history state
│   │   ├── newsStore.ts       # News state with 1-hour TTL caching
│   │   ├── marketStore.ts     # Market indices with 15-min TTL caching
│   │   └── goalStore.ts       # Investment goals tracking
│   │
│   ├── lib/                   # Core business logic
│   │   ├── tinkoff-api.ts    # Tinkoff API client with Zod validation
│   │   ├── news-api.ts       # NewsAPI client with Zod validation
│   │   ├── market-api.ts     # Market indices API with Zod validation
│   │   ├── analytics.ts      # Portfolio metrics calculations
│   │   ├── goal-service.ts   # Goal CRUD and progress tracking
│   │   └── providers.tsx     # React Query provider setup
│   │
│   ├── hooks/                 # Custom React hooks
│   │   └── useGoalAutoUpdate.ts # Auto-update goals from portfolio
│   │
│   └── components/features/   # Feature-based component organization
│       ├── Portfolio/        # Portfolio display components
│       │   └── PerformanceSummary.tsx # Performance overview widget
│       ├── Analytics/        # Analytics dashboard components
│       ├── News/             # News feed components
│       ├── Market/           # Market context components
│       └── Goals/            # Goal tracking components
```

### Data Flow Architecture

**Three-Layer Pattern:**

1. **API Routes** (`src/app/api/tinkoff/*`): Server-side Next.js routes that proxy requests to Tinkoff API
   - Handle authentication (API token from env)
   - Call functions from `lib/tinkoff-api.ts`
   - Return validated JSON responses

2. **Zustand Stores** (`src/stores/*`): Client-side state management
   - `portfolioStore`: Manages accounts list, selected account, and current portfolio data
   - `analyticsStore`: Manages historical snapshots and calculated metrics
   - Stores fetch data from API routes and trigger UI updates

3. **React Components**: Consume data from stores and render UI
   - Subscribe to store state changes
   - Trigger store actions on user interactions

### Key Design Patterns

#### Tinkoff API Integration (`lib/tinkoff-api.ts`)

- **Zod Schema Validation**: All API responses validated at runtime with comprehensive schemas
- **Retry Logic**: Exponential backoff with configurable retry attempts (default: 3 retries, 1-10s delay)
- **Two-Stage Portfolio Fetch**:
  1. Fetch portfolio positions
  2. Enrich each position with instrument details (ticker, name) via `getInstrumentByFigi`
- **Helper Functions**: `moneyValueToNumber()`, `quotationToNumber()` convert Tinkoff's {units, nano} format to numbers

#### Analytics System (`lib/analytics.ts`)

Calculates comprehensive portfolio metrics from historical snapshots:

- **ROI**: Return on Investment (percentage and absolute)
- **Volatility**: Annualized volatility from daily returns (252 trading days/year)
- **Sharpe Ratio**: Risk-adjusted returns using 5% default risk-free rate
- **Diversification Score**: Based on Herfindahl-Hirschman Index (0=concentrated, 1=diversified)
- **Day Change**: Change from previous snapshot

All calculations include edge case handling for zero/infinite values.

#### State Management Pattern

**Zustand stores follow this pattern:**
```typescript
// Load data from API
loadData: async () => {
  set({ loading: true, error: null });
  const response = await fetch('/api/tinkoff/...');
  const data = await response.json();
  set({ data, loading: false });
}
```

**Auto-loading behavior:**
- `portfolioStore.loadAccounts()` auto-selects first account
- Selecting an account automatically triggers `loadPortfolio(accountId)`
- Analytics store recalculates metrics whenever snapshots change

## Important Notes

### Path Aliases
- Use `@/*` for imports from `src/` directory (configured in tsconfig.json)
- Example: `import { fetchPortfolio } from '@/lib/tinkoff-api'`

### API Token Security
- Never expose `TINKOFF_API_TOKEN` to client-side code
- All Tinkoff API calls must go through Next.js API routes (`src/app/api/tinkoff/*`)
- API routes access the token via `process.env.TINKOFF_API_TOKEN`

### React Query Configuration
- Stale time: 60 seconds
- Refetch on window focus: disabled
- Retry attempts: 1
- Configured in `src/lib/providers.tsx`

### Data Format Conversions
When working with Tinkoff API responses:
- MoneyValue: `{currency: string, units: string, nano: number}` → use `moneyValueToNumber()`
- Quotation: `{units: string, nano: number}` → use `quotationToNumber()`
- Both helpers convert nano (billionths) to decimal: `units + (nano / 1_000_000_000)`

### Component Organization
- Feature-based structure: group related components by feature (Portfolio, Analytics)
- Each feature folder contains all related components
- Use index.ts for clean exports where appropriate

### Styling Approach
- Tailwind utility classes for all styling
- No custom CSS modules
- Tailwind v4 with PostCSS configured
- Responsive design with mobile-first approach

## News Feed Feature

The News Feed provides real-time financial news filtered by portfolio assets.

### NewsAPI Integration (`lib/news-api.ts`)

- **Zod Schema Validation**: All NewsAPI responses validated at runtime
- **Retry Logic**: Exponential backoff with configurable retry attempts (same as Tinkoff API)
- **Three Fetch Methods**:
  1. `fetchFinancialNews(tickers)`: Fetches general financial news and filters by portfolio tickers
  2. `fetchTickerNews(ticker)`: Fetches news for a specific ticker
  3. `fetchBusinessHeadlines()`: Fallback method for general business news

### News Store (`stores/newsStore.ts`)

- **1-Hour TTL Caching**: News is cached for 1 hour to minimize API calls
- **Cache Validation**: `isCacheValid()` checks if cached data is still fresh
- **Force Refresh**: `loadNews(tickers, true)` bypasses cache
- **Ticker Search**: `loadTickerNews(ticker)` fetches news for specific asset

### News Components

**NewsFeed** (`components/features/News/NewsFeed.tsx`):
- Main container component
- Auto-loads news for portfolio tickers
- Search functionality for specific tickers
- Refresh button with cache status indicator
- Shows loading, error, and empty states

**NewsList** (`components/features/News/NewsList.tsx`):
- Renders list of news articles
- Handles loading/error/empty states
- Provides retry functionality

**NewsCard** (`components/features/News/NewsCard.tsx`):
- Individual news article display
- Shows title, description, image, source, and publish date
- Displays relevant asset badges (tickers)
- Clickable to open article in new tab
- Uses `date-fns` for relative time formatting (e.g., "2 hours ago")

### News Data Model

```typescript
interface NewsItem {
  id: string;                    // Auto-generated hash from title + date
  title: string;
  description: string | null;
  source: string;                // Publication name
  publishedDate: Date;
  imageURL: string | null;
  articleURL: string;            // Link to full article
  relevantAssets: string[];      // Array of tickers mentioned
}
```

### NewsAPI Configuration

- **API Endpoint**: `/api/news`
- **Query Parameters**:
  - `tickers`: Comma-separated list of tickers to filter by
  - `ticker`: Single ticker for specific search
  - `language`: 'ru' (default) or 'en'
  - `pageSize`: Number of articles (default 50, max 100)
- **Default Behavior**: Returns Russian business headlines if no tickers provided

### Ticker Filtering Logic

The system intelligently filters news by:
1. Fetching general financial news from NewsAPI
2. Searching article title, description, and content for portfolio tickers
3. Using regex word-boundary matching to avoid false positives
4. Returning only articles that mention at least one portfolio ticker
5. Falling back to business headlines if no matches found

### Important Notes

- NewsAPI has rate limits on free tier (100 requests/day for developer plan)
- The 1-hour cache helps stay within rate limits
- News is fetched in Russian by default (`language: 'ru'`)
- All NewsAPI calls go through Next.js API route for security
- API key is server-side only: `process.env.NEWSAPI_KEY`

## Market Context Feature

The Market Context feature provides real-time market indices data to give users market awareness while managing their portfolio.

### Market Indices Integration (`lib/market-api.ts`)

- **Zod Schema Validation**: All Tinkoff Market Data API responses validated at runtime
- **Hybrid Data Source**:
  - Russian indices (IMOEX, RTSI) fetched from Tinkoff API via MarketDataService
  - International indices (S&P 500, Nasdaq) use mock data (can be replaced with real API)
- **Comprehensive Data**: Current value, change %, day high/low, previous close

### Market Store (`stores/marketStore.ts`)

- **15-Minute TTL Caching**: Market data is cached for 15 minutes (indices update frequently)
- **Cache Validation**: `isCacheValid()` checks if cached data is still fresh
- **Force Refresh**: `loadMarketIndices(true)` bypasses cache
- **Auto-refresh**: Component automatically refreshes every 15 minutes

### Market Components

**MarketContext** (`components/features/Market/MarketContext.tsx`):
- Main widget component displayed above all tabs
- Auto-loads indices on mount
- Refresh button with loading state
- Cache status indicator (green dot when active)
- Error handling with retry functionality
- Auto-refresh every 15 minutes

**IndexCard** (`components/features/Market/IndexCard.tsx`):
- Individual index display card
- Color-coded changes (green/red/gray)
- Trend icons (up/down/neutral)
- Current value with formatting
- Change percentage and absolute value
- Day range (high/low) when available
- Responsive grid layout

### Market Data Model

```typescript
interface MarketIndex {
  name: string;              // Display name (e.g., "Индекс МосБиржи")
  ticker: string;            // Ticker symbol (e.g., "IMOEX")
  figi?: string;            // FIGI identifier for Tinkoff API
  currentValue: number;      // Current index value
  changePercent: number;     // Percentage change from previous close
  changeAbsolute: number;    // Absolute change from previous close
  dayHigh?: number;         // Day's high value
  dayLow?: number;          // Day's low value
  yearHigh?: number;        // 52-week high (not yet implemented)
  yearLow?: number;         // 52-week low (not yet implemented)
  previousClose?: number;   // Previous day's closing value
  lastUpdated: string;      // ISO timestamp
}
```

### Tinkoff Market Data API

The feature uses two Tinkoff API endpoints:

1. **GetLastPrices**: Fetches current price for indices by FIGI
   - Endpoint: `/tinkoff.public.invest.api.contract.v1.MarketDataService/GetLastPrices`
   - Returns: Latest price quotation

2. **GetCandles**: Fetches OHLC data for day high/low and previous close
   - Endpoint: `/tinkoff.public.invest.api.contract.v1.MarketDataService/GetCandles`
   - Interval: `CANDLE_INTERVAL_DAY`
   - Returns: Candle data with high, low, open, close

### Supported Indices

Currently configured indices:

| Index | Name | Ticker | FIGI | Data Source |
|-------|------|--------|------|-------------|
| MOEX Index | Индекс МосБиржи | IMOEX | BBG004730ZJ9 | Tinkoff API |
| RTS Index | Индекс РТС | RTSI | BBG004731354 | Tinkoff API |
| S&P 500 | S&P 500 | SPX | - | Mock Data |
| Nasdaq | Nasdaq | IXIC | - | Mock Data |

### API Endpoint

- **Route**: `/api/market`
- **Method**: GET
- **Response**:
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
      "lastUpdated": "2025-01-15T14:30:00Z"
    }
  ],
  "lastUpdated": "2025-01-15T14:30:00Z"
}
```

### Performance Considerations

- **15-min cache**: Balances data freshness with API call efficiency
- **Parallel fetching**: Russian indices fetched concurrently
- **Fallback mechanism**: If Tinkoff API fails, uses mock data to prevent blank screen
- **Response time**: Typically under 3 seconds (multiple API calls)

### Important Notes

- All market data calls use the same Tinkoff API token as portfolio data
- International indices use mock data (realistic values with random variation)
- To replace mock data with real API, integrate Alpha Vantage, Yahoo Finance, or similar
- Market Context is visible on all tabs (Portfolio, Analytics, News)
- Component handles loading, error, and stale cache states gracefully

### Future Enhancements

Potential improvements:

- [ ] Real API integration for international indices (Alpha Vantage, Yahoo Finance)
- [ ] Year high/low data (52-week range)
- [ ] Mini trend charts (sparklines) for each index
- [ ] More indices (commodity prices, currency pairs, bonds)
- [ ] User customization (select which indices to display)
- [ ] Comparison view (overlay multiple indices)
- [ ] Historical performance (1D, 1W, 1M, 1Y changes)

## Goal Tracking Feature

The Goal Tracking feature allows users to set, monitor, and achieve investment goals with automatic progress tracking and deadline management.

### Goal Service (`lib/goal-service.ts`)

- **Zod Schema Validation**: All goal data validated at runtime
- **localStorage-based**: Goals persisted in browser localStorage
- **CRUD Operations**: Full create, read, update, delete support
- **Progress Calculation**: Automatic progress percentage and remaining value
- **Status Tracking**: Active, Completed, Missed, Paused states
- **Alert Generation**: Deadline warnings and achievement notifications

### Goal Store (`stores/goalStore.ts`)

- **State Management**: Zustand store for goals and computed states
- **Auto-refresh**: Progresses and alerts recalculated on changes
- **CRUD Actions**: All goal operations accessible via store
- **Auto-update**: Integrates with portfolio metrics for automatic value updates

### Goal Types

The system supports multiple goal types:

| Goal Type | Description | Auto-Update Source |
|-----------|-------------|--------------------|
| TARGET_VALUE | Target portfolio value (e.g., 1M RUB) | Total portfolio value |
| TARGET_RETURN | Target return percentage (e.g., 20% ROI) | Analytics ROI percentage |
| TARGET_POSITION | Target position value (e.g., 100 shares) | Manual update |
| SAVE_AMOUNT | Save specific amount by deadline | Total portfolio value |
| DIVERSIFICATION | Achieve diversification score | Analytics diversification |

### Goal Components

**GoalList** (`components/features/Goals/GoalList.tsx`):
- Main container displaying all goals for selected portfolio
- Create new goal button
- Alert banner for deadline warnings and achievements
- Empty state with call-to-action
- Grid layout (1-3 columns responsive)
- Auto-loads goals on account change
- Integrates with `useGoalAutoUpdate` hook

**GoalCard** (`components/features/Goals/GoalCard.tsx`):
- Individual goal display card
- Color-coded status badges (completed/on-track/at-risk/overdue)
- Animated progress bar with percentage
- Current value, target value, and remaining amount
- Days remaining until deadline
- Action buttons: Complete, Reset, Delete
- Visual status indicators (icons and colors)

**GoalForm** (`components/features/Goals/GoalForm.tsx`):
- Create new goal form with validation
- Goal type selector with descriptions
- Target value and current value inputs
- Deadline date picker (future dates only)
- Optional description field
- Form validation with error messages
- Cancel and submit actions

### Goal Data Model

```typescript
interface Goal {
  id: string;                    // Auto-generated unique ID
  portfolioId: string;           // Associated portfolio/account
  name: string;                  // Goal name (e.g., "Reach 1M RUB")
  description?: string;          // Optional description
  goalType: GoalType;            // Type of goal
  targetValue: number;           // Target to achieve
  currentValue: number;          // Current progress
  deadline: string;              // ISO date string
  status: GoalStatus;            // Active/Completed/Missed/Paused
  createdAt: string;             // ISO date string
  updatedAt: string;             // ISO date string
  completedAt?: string;          // ISO date string (when completed)
}

interface GoalProgress {
  goal: Goal;
  progress: number;              // Percentage (0-100)
  remaining: number;             // Amount remaining
  daysRemaining: number;         // Days until deadline
  isOnTrack: boolean;            // Linear projection
  status: 'on-track' | 'at-risk' | 'overdue' | 'completed';
}
```

### Auto-Update System

**useGoalAutoUpdate Hook** (`hooks/useGoalAutoUpdate.ts`):
- Monitors portfolio and analytics changes
- Automatically updates goal current values
- Calculates total portfolio value from positions
- Extracts ROI percentage from analytics metrics
- Extracts diversification score from analytics
- Updates goals when source data changes

**Update Flow**:
```
Portfolio Change → Calculate Metrics → Auto-Update Goals → Refresh Progress → Generate Alerts
```

**Auto-update mapping**:
- `TARGET_VALUE` / `SAVE_AMOUNT` → Total portfolio value
- `TARGET_RETURN` → Analytics ROI percentage
- `DIVERSIFICATION` → Analytics diversification score
- `TARGET_POSITION` → Manual update only

### Goal Progress Tracking

**Progress Calculation**:
- `progress = (currentValue / targetValue) * 100`
- Clamped between 0-100%
- Automatically completes goal when ≥100%

**On-Track Determination**:
- Compares actual progress vs. expected progress
- Expected progress based on time elapsed
- Goal is "on-track" if actual ≥ 80% of expected
- Linear projection from creation to deadline

**Status Determination**:
- **Completed**: Progress ≥ 100%
- **Overdue**: Deadline passed, progress < 100%
- **At-Risk**: On-track check fails
- **On-Track**: Normal progress

### Alerts and Notifications

**Alert Types**:
- 🎉 **Goal Achieved**: When progress reaches 100%
- ⚠️ **Deadline Near**: 7 days or less remaining
- ❌ **Deadline Passed**: Missed deadline
- ⚠️ **At Risk**: Progress below expected

**Alert Severity**:
- `success`: Goal achieved
- `warning`: Deadline near, at risk
- `error`: Deadline passed
- `info`: General information

**Alert Display**:
- Shown at top of GoalList
- Color-coded by severity
- Dismissible (persists in session)
- Auto-generated on goal changes

### localStorage Persistence

**Storage Key**: `investment_goals`

**Data Format**:
```json
[
  {
    "id": "goal_1234567890_abc123",
    "portfolioId": "account_123",
    "name": "Reach 1M RUB",
    "goalType": "TARGET_VALUE",
    "targetValue": 1000000,
    "currentValue": 750000,
    "deadline": "2025-12-31T00:00:00.000Z",
    "status": "ACTIVE",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-15T14:30:00.000Z"
  }
]
```

**Persistence Behavior**:
- Goals saved immediately on create/update/delete
- Loaded from localStorage on component mount
- Survives page refreshes
- Per-browser storage (not synced across devices)

### Goal Operations

**Create Goal**:
```typescript
goalStore.createGoal({
  portfolioId: 'account_123',
  name: 'Reach 1M RUB',
  goalType: 'TARGET_VALUE',
  targetValue: 1000000,
  currentValue: 0,
  deadline: '2025-12-31',
});
```

**Update Goal**:
```typescript
goalStore.updateGoal({
  id: 'goal_123',
  targetValue: 1500000,
});
```

**Delete Goal**:
```typescript
goalStore.deleteGoal('goal_123');
```

**Complete Goal**:
```typescript
goalStore.completeGoal('goal_123');
// Sets status to COMPLETED, currentValue to targetValue
```

**Reset Progress**:
```typescript
goalStore.resetGoalProgress('goal_123');
// Sets currentValue to 0, status to ACTIVE
```

### Important Notes

- Goals are stored per-account (portfolioId)
- Auto-update only affects specific goal types
- TARGET_POSITION must be updated manually
- Goals persist in localStorage (browser-specific)
- No backend API required
- Progress calculated in real-time
- Deadlines checked on every render
- Alerts regenerated when goals change

### Future Enhancements

Potential improvements:

- [ ] **Cloud sync**: Save goals to backend database
- [ ] **Recurring goals**: Monthly/yearly recurring targets
- [ ] **Milestone tracking**: Sub-goals within main goal
- [ ] **Goal templates**: Pre-defined goal templates
- [ ] **Achievement history**: Track completed goals over time
- [ ] **Goal categories**: Organize goals by category
- [ ] **Custom notifications**: Email/push notifications
- [ ] **Goal sharing**: Share goals with financial advisor
- [ ] **Progress charts**: Visualize progress over time
- [ ] **Goal recommendations**: AI-suggested goals based on portfolio

## Performance Summary Widget

The Performance Summary is a comprehensive dashboard widget that displays key portfolio metrics in one compact, auto-updating card at the top of the Portfolio page.

### Features

- **Total Portfolio Value**: Current value with weekly change (absolute and percentage)
- **ROI Metrics**: Return on Investment percentage and absolute change
- **Goal Completion Rate**: Overall progress across all investment goals
- **Best/Worst Performers**: Top and bottom performing assets by expected yield
- **Sector Allocation**: Portfolio distribution by instrument type (shares, bonds, ETF, etc.)
- **Auto-Updates**: Automatically refreshes when portfolio or analytics data changes
- **Responsive Design**: Adapts to mobile, tablet, and desktop screens

### Component Location

**PerformanceSummary** ([src/components/features/Portfolio/PerformanceSummary.tsx](src/components/features/Portfolio/PerformanceSummary.tsx))

Main widget component that:
- Integrates with portfolio, analytics, and goal stores
- Calculates weekly change from historical snapshots
- Identifies best and worst performing assets
- Computes sector allocation percentages
- Displays color-coded metrics with trend indicators

### Data Sources

The component pulls data from three Zustand stores:

1. **portfolioStore**: Current portfolio positions and values
2. **analyticsStore**: Historical snapshots and calculated metrics (ROI, volatility, etc.)
3. **goalStore**: Investment goals and progress data

### Key Metrics Displayed

#### 1. Portfolio Value
- **Current Value**: Total portfolio value in RUB
- **Weekly Change**: Absolute and percentage change from ~7 days ago
- **Color Coding**: Green for positive, red for negative
- **Calculation**: Finds snapshot closest to 7 days ago and compares with current value

#### 2. ROI (Return on Investment)
- **Percentage**: ROI as percentage from analytics metrics
- **Absolute Change**: Total profit/loss in RUB
- **Color Coding**: Green for positive, red for negative
- **Source**: `metrics.roi` and `metrics.roiAbsolute` from analytics store

#### 3. Goal Completion Rate
- **Average Progress**: Mean progress across all active goals
- **Goal Count**: Number of tracked goals
- **Color Coding**: Green (≥80%), blue (50-79%), gray (<50%)
- **Calculation**: Sum of individual goal progress percentages / number of goals

#### 4. Best/Worst Performers
- **Best Asset**: Asset with highest expected yield
- **Worst Asset**: Asset with lowest expected yield
- **Display**: Ticker, name, and yield percentage
- **Color Coding**: Green for best, red for worst
- **Calculation**: Compares `expectedYield` across all positions

#### 5. Sector Allocation
- **By Instrument Type**: Distribution by share, bond, ETF, currency, futures
- **Percentage Bars**: Visual representation of allocation
- **Sorted**: Descending order by value
- **Calculation**: Groups positions by `instrumentType` and calculates percentage of total

### Weekly Change Algorithm

```typescript
// Find snapshot from ~7 days ago
const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

// Find closest snapshot to 7 days ago
let weekSnapshot = snapshots[0];
let minDiff = Math.abs(weekSnapshot.timestamp.getTime() - weekAgo.getTime());

for (const snapshot of snapshots) {
  const diff = Math.abs(snapshot.timestamp.getTime() - weekAgo.getTime());
  if (diff < minDiff) {
    minDiff = diff;
    weekSnapshot = snapshot;
  }
}

// Calculate change
const absolute = totalValue - weekSnapshot.totalValue;
const percent = (absolute / weekSnapshot.totalValue) * 100;
```

### Best/Worst Asset Algorithm

```typescript
let best = portfolio.positions[0];
let worst = portfolio.positions[0];
let bestYield = quotationToNumber(best.expectedYield);
let worstYield = quotationToNumber(worst.expectedYield);

portfolio.positions.forEach((position) => {
  const yieldValue = quotationToNumber(position.expectedYield);
  if (yieldValue > bestYield) {
    bestYield = yieldValue;
    best = position;
  }
  if (yieldValue < worstYield) {
    worstYield = yieldValue;
    worst = position;
  }
});
```

### Responsive Design

The widget uses a responsive grid layout:

- **Key Metrics**: 1 column (mobile) → 3 columns (desktop)
- **Best/Worst Performers**: 1 column (mobile) → 2 columns (desktop)
- **Sector Allocation**: Full width on all screen sizes
- **Breakpoints**:
  - Mobile: < 768px (1 column)
  - Tablet/Desktop: ≥ 768px (2-3 columns)

### Integration

The component is integrated into the Portfolio page above the MarketContext widget:

```tsx
// src/app/portfolio/page.tsx
import { PerformanceSummary } from '@/components/features/Portfolio/PerformanceSummary';

export default function PortfolioPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Performance Summary */}
        <div className="pt-6 pb-4">
          <PerformanceSummary />
        </div>

        {/* Market Context Widget */}
        <div className="pb-4">
          <MarketContext />
        </div>

        {/* Tabs and Content */}
        ...
      </div>
    </div>
  );
}
```

### Auto-Update Behavior

The component automatically updates when:
- Portfolio positions change (buy/sell assets)
- Analytics metrics are recalculated
- Goals are created, updated, or completed
- Historical snapshots are loaded

This is achieved through Zustand store subscriptions - the component re-renders whenever the stores it consumes change.

### Performance Considerations

- **Memoization**: All calculations use `useMemo` to avoid recomputation on every render
- **Efficient Lookups**: Weekly snapshot search optimized with single-pass algorithm
- **Lightweight**: No external API calls - all data from existing stores
- **Fast Rendering**: Conditional rendering prevents unnecessary DOM updates

### Number Formatting

The component uses internationalization for proper number formatting:

**Currency**:
```typescript
new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
}).format(value);
```

**Percentage**:
```typescript
`${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
```

### Color Coding System

The component uses a consistent color scheme:

| Color | Usage | CSS Classes |
|-------|-------|-------------|
| Green | Positive changes, best performers, high completion | `bg-green-50`, `text-green-700`, `border-green-200` |
| Red | Negative changes, worst performers | `bg-red-50`, `text-red-700`, `border-red-200` |
| Blue | Neutral/informational, moderate completion | `bg-blue-50`, `text-blue-700`, `border-blue-200` |
| Gray | No change, low completion | `bg-gray-50`, `text-gray-700`, `border-gray-200` |
| Purple | Special metrics | `bg-purple-50`, `text-purple-700`, `border-purple-200` |

### Icons

All icons from Lucide React:
- `TrendingUp`: Positive trends, best performers
- `TrendingDown`: Negative trends, worst performers
- `Minus`: No change/neutral
- `Target`: Goal-related metrics
- `PieChart`: Sector allocation
- `Calendar`: Time-based metrics

### Important Notes

- **No Data Handling**: Component returns `null` if portfolio is not loaded
- **Edge Cases**: All calculations handle zero values and empty arrays gracefully
- **Instrument Type Mapping**: Translates English types to Russian labels
- **Weekly Data**: Requires at least 2 historical snapshots for weekly change
- **Goal Completion**: Returns 0% if no goals exist

### Future Enhancements

Potential improvements:

- [ ] **Customizable Time Periods**: Allow user to select weekly/monthly/yearly change
- [ ] **Sparklines**: Mini charts showing trend for each metric
- [ ] **Expandable Sections**: Collapsible sections for detailed breakdowns
- [ ] **Export Data**: Download metrics as CSV/PDF
- [ ] **Comparison Mode**: Compare current period vs. previous period
- [ ] **Alerts**: Notify when metrics cross thresholds
- [ ] **Sector Drill-Down**: Click sector to see detailed position breakdown
- [ ] **Performance Attribution**: Show which positions contributed most to returns
- [ ] **Risk Metrics**: Add Sharpe ratio, volatility to summary
- [ ] **Historical Trends**: Show metric trends over time
