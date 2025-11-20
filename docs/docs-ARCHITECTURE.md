# Architecture Overview

## Project: invest-app-web

**Type:** Next.js 16 PWA for investment portfolio management  
**Focus:** Advanced analytics & automation (read-only, no trading execution)

---

## Tech Stack

### Core Technologies

**Frontend:**
- **Framework:** Next.js 16 (App Router)
- **React:** 19 (latest)
- **TypeScript:** 5.x (strict mode)
- **Styling:** Tailwind CSS v4

**State Management:**
- **Global State:** Zustand (lightweight, no boilerplate)
- **Server State:** TanStack Query v5 (data fetching, caching)
- **Form State:** React Hook Form + Zod validation

**Data Visualization:**
- **Charts:** Recharts (responsive, composable)
- **Tables:** TanStack Table (headless, flexible)

**API Integration:**
- **Broker APIs:** Tinkoff Invest API (primary)
- **News:** NewsAPI
- **Market Data:** Yahoo Finance / MOEX API

**Deployment:**
- **Platform:** Vercel (optimized for Next.js)
- **CI/CD:** Automatic deployments from `main` branch

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│ User Interaction (Browser)                                  │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ React Component (UI Layer)                                  │
│ - Displays data                                             │
│ - Handles user events                                       │
│ - Triggers state updates                                    │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ Zustand Store (Global State)                                │
│ - Portfolio state                                           │
│ - Goals state                                               │
│ - User preferences                                          │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ TanStack Query (Server State & Caching)                     │
│ - Fetch data from API routes                                │
│ - Cache responses (stale-while-revalidate)                  │
│ - Handle loading/error states                               │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ Next.js API Routes (Server-Side)                            │
│ - /api/tinkoff/* - Tinkoff API proxy                        │
│ - /api/news/* - News API proxy                              │
│ - /api/analytics/* - Portfolio analytics                    │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ External APIs                                               │
│ - Tinkoff Invest API (portfolio, accounts, operations)      │
│ - NewsAPI (financial news)                                  │
│ - Yahoo Finance / MOEX (market data)                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
invest-app-web/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (dashboard)/              # Dashboard routes group
│   │   │   ├── page.tsx              # Home / Dashboard
│   │   │   └── layout.tsx            # Dashboard layout
│   │   ├── portfolio/                # Portfolio routes
│   │   ├── analytics/                # Analytics routes
│   │   ├── goals/                    # Goals routes
│   │   ├── news/                     # News routes
│   │   └── api/                      # API routes (server-side)
│   │       ├── tinkoff/              # Tinkoff API proxy
│   │       ├── news/                 # News API proxy
│   │       └── analytics/            # Analytics endpoints
│   │
│   ├── components/
│   │   ├── ui/                       # Reusable UI primitives
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   └── ...
│   │   └── features/                 # Feature-specific components
│   │       ├── Portfolio/            # Portfolio components
│   │       ├── Analytics/            # Analytics components
│   │       ├── Goals/                # Goals components
│   │       └── News/                 # News components
│   │
│   ├── lib/
│   │   ├── tinkoff/                  # Tinkoff API client
│   │   │   ├── client.ts             # API client
│   │   │   ├── converters.ts         # Data converters (MoneyValue, Quotation)
│   │   │   └── types.ts              # TypeScript types
│   │   ├── stores/                   # Zustand stores
│   │   │   ├── portfolio.ts          # Portfolio state
│   │   │   ├── goals.ts              # Goals state
│   │   │   └── preferences.ts        # User preferences
│   │   ├── analytics/                # Analytics logic
│   │   │   ├── performance.ts        # Performance calculations
│   │   │   ├── risk.ts               # Risk metrics
│   │   │   └── allocation.ts         # Asset allocation
│   │   └── utils/                    # Utility functions
│   │       ├── currency.ts           # Currency formatting
│   │       ├── date.ts               # Date utilities
│   │       └── validation.ts         # Zod schemas
│   │
│   └── types/                        # TypeScript type definitions
│       ├── tinkoff.ts                # Tinkoff API types
│       ├── portfolio.ts              # Portfolio types
│       └── index.ts                  # Barrel export
│
├── public/                           # Static assets
├── docs/                             # Documentation
│   ├── FEATURES/                     # Feature documentation
│   ├── ARCHITECTURE.md               # This file
│   └── API_PATTERNS.md               # API integration patterns
└── package.json
```

---

## State Management

### Zustand Stores

**Pattern:** Domain-driven stores (one per feature domain)

#### Portfolio Store (`lib/stores/portfolio.ts`)

```typescript
interface PortfolioState {
  accounts: Account[];
  selectedAccountId: string | null;
  positions: Position[];
  loading: boolean;
  error: Error | null;
  
  // Actions
  loadAccounts: () => Promise<void>;
  selectAccount: (accountId: string) => void;
  loadPortfolio: (accountId: string) => Promise<void>;
}

export const usePortfolioStore = create<PortfolioState>((set, get) => ({
  // ... implementation
}));
```

**Usage:**
```typescript
const { accounts, loadAccounts } = usePortfolioStore();

useEffect(() => {
  loadAccounts(); // Auto-load on mount
}, []);
```

#### Goals Store (`lib/stores/goals.ts`)

```typescript
interface GoalsState {
  goals: Goal[];
  addGoal: (goal: Omit<Goal, 'id'>) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  calculateProgress: (goalId: string) => number;
}
```

#### Preferences Store (`lib/stores/preferences.ts`)

```typescript
interface PreferencesState {
  theme: 'light' | 'dark' | 'system';
  currency: 'RUB' | 'USD' | 'EUR';
  language: 'ru' | 'en';
  
  setTheme: (theme: PreferencesState['theme']) => void;
  setCurrency: (currency: PreferencesState['currency']) => void;
}
```

---

### TanStack Query

**Pattern:** React Query for all server data fetching

**Configuration (`app/providers.tsx`):**

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

**Query Keys Pattern:**

```typescript
// Query key factory pattern
export const portfolioKeys = {
  all: ['portfolio'] as const,
  accounts: () => [...portfolioKeys.all, 'accounts'] as const,
  portfolio: (accountId: string) => [...portfolioKeys.all, 'portfolio', accountId] as const,
  operations: (accountId: string) => [...portfolioKeys.all, 'operations', accountId] as const,
};
```

**Usage:**

```typescript
// Fetch portfolio
const { data: portfolio, isLoading } = useQuery({
  queryKey: portfolioKeys.portfolio(accountId),
  queryFn: () => fetchPortfolio(accountId),
  enabled: !!accountId,
});

// Invalidate cache on portfolio change
queryClient.invalidateQueries({ queryKey: portfolioKeys.all });
```

---

## API Integration

### Tinkoff API Client

**Location:** `lib/tinkoff/client.ts`

**Architecture:** Adapter pattern + Server-side proxy

#### Why Server-Side Proxy?

```typescript
// ❌ WRONG: Client-side call exposes token
fetch('https://invest-public-api.tinkoff.ru/...', {
  headers: { Authorization: `Bearer ${TINKOFF_TOKEN}` }
});

// ✅ CORRECT: Server-side proxy hides token
fetch('/api/tinkoff/portfolio?accountId=123');
```

#### API Route Pattern

```typescript
// app/api/tinkoff/portfolio/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get('accountId');
  
  if (!accountId) {
    return NextResponse.json({ error: 'Missing accountId' }, { status: 400 });
  }
  
  try {
    const portfolio = await tinkoffClient.getPortfolio(accountId);
    return NextResponse.json(portfolio);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch portfolio' }, { status: 500 });
  }
}
```

#### Data Converters

**Problem:** Tinkoff uses `MoneyValue` and `Quotation` format:

```typescript
// API returns:
{
  units: "100",   // Integer part
  nano: 500000000 // Fractional part (9 decimal places)
}

// We need: 100.5
```

**Solution:**

```typescript
// lib/tinkoff/converters.ts
export function moneyValueToNumber(value: MoneyValue | undefined): number {
  if (!value) return 0;
  const units = parseFloat(value.units);
  const nano = value.nano / 1_000_000_000;
  return units + nano;
}

export function quotationToNumber(value: Quotation | undefined): number {
  // Same logic as moneyValueToNumber
}
```

---

## Performance Optimizations

### 1. Code Splitting

```typescript
// Lazy load heavy components
const Analytics = lazy(() => import('./components/features/Analytics'));

<Suspense fallback={<Skeleton />}>
  <Analytics />
</Suspense>
```

### 2. Memoization

```typescript
// Expensive calculations
const portfolioMetrics = useMemo(() => {
  return calculatePerformanceMetrics(positions);
}, [positions]);

// Stable callbacks
const handleRebalance = useCallback(() => {
  rebalancePortfolio(targetAllocation);
}, [targetAllocation]);
```

### 3. Virtual Scrolling

```typescript
// For long lists (100+ items)
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={positions.length}
  itemSize={80}
>
  {({ index, style }) => (
    <PositionRow position={positions[index]} style={style} />
  )}
</FixedSizeList>
```

### 4. Image Optimization

```typescript
import Image from 'next/image';

<Image
  src={newsImageUrl}
  alt={newsTitle}
  width={400}
  height={250}
  loading="lazy"
  placeholder="blur"
/>
```

---

## Security

### 1. API Token Protection

- **Tokens stored:** Server-side only (environment variables)
- **Client access:** None (all calls via API routes)
- **Token exposure:** Zero (never sent to browser)

### 2. CORS

```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: process.env.NEXTAUTH_URL },
        ],
      },
    ];
  },
};
```

### 3. Input Validation

```typescript
// Zod schemas for all API inputs
const portfolioSchema = z.object({
  accountId: z.string().uuid(),
});

const validated = portfolioSchema.parse(request.body);
```

---

## Testing Strategy

### Unit Tests

**Target:** Business logic in `lib/`

```typescript
// lib/analytics/performance.test.ts
describe('Performance Metrics', () => {
  it('calculates total return correctly', () => {
    const positions = [
      { cost: 100000, current: 120000 },
    ];
    expect(calculateTotalReturn(positions)).toBe(0.20); // 20%
  });
});
```

### Integration Tests

**Target:** API routes

```typescript
// app/api/tinkoff/portfolio/route.test.ts
describe('GET /api/tinkoff/portfolio', () => {
  it('returns portfolio for valid accountId', async () => {
    const response = await GET(new Request('http://localhost?accountId=123'));
    expect(response.status).toBe(200);
  });
});
```

### E2E Tests

**Recommendation:** Skip for personal project (manual testing sufficient)

---

## Deployment

### Vercel Configuration

**Platform:** Vercel (automatic deployments)

**Environment Variables:**
```
TINKOFF_API_TOKEN=xxx
NEWSAPI_KEY=yyy
NEXTAUTH_SECRET=zzz
```

**Build Command:** `npm run build`  
**Output Directory:** `.next`

**CI/CD:**
- Push to `main` → Auto-deploy to production
- Pull Request → Deploy preview URL

---

## Key Principles

1. **Security First:** All sensitive API calls server-side
2. **Type Safety:** Strict TypeScript, Zod validation
3. **Performance:** Code splitting, memoization, lazy loading
4. **Maintainability:** Feature-based structure, clear separation of concerns
5. **DX:** Path aliases, consistent patterns, clear error messages

---

## Further Reading

- **API Patterns:** See `docs/API_PATTERNS.md`
- **Feature Docs:** See `docs/FEATURES/` for feature-specific architecture
- **Troubleshooting:** See `docs/TROUBLESHOOTING.md`