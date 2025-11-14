# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## 🌐 Communication Language

**IMPORTANT FOR CLAUDE CODE:**

- **Prompts:** Write in English
- **Code:** Always in English (variables, functions, comments)
- **Responses:** Answer in Russian — explain code, plans, and decisions in Russian

**Example:**
- User: "Create a Portfolio component..." (English)
- Claude: "Создам Portfolio компонент с поддержкой..." (Russian)

---

## 📋 Project Overview

**Type:** Next.js 15 + React 19 + TypeScript Progressive Web App (PWA)
**Purpose:** Personal investment portfolio tracker with Tinkoff API integration
**Status:** Phase 1 (Prototype)

---

## 🏗️ Architecture

### Tech Stack
- **Framework:** Next.js 15 (App Router), React 19
- **Language:** TypeScript (strict mode)
- **State:** Zustand
- **Validation:** Zod (runtime) + TypeScript (compile-time)
- **Styling:** TailwindCSS v4
- **API:** Tinkoff Invest API (REST)

### Not Yet Implemented
- shadcn/ui components (mentioned in parent CLAUDE.md but not installed)
- Chart.js (not installed)
- NextAuth.js (no authentication yet)
- Prisma (no database)
- PWA manifest (not configured)

---

## 📁 Project Structure

```
invest-app-web/
├── src/
│   ├── app/
│   │   ├── api/tinkoff/          # API routes (secure server-side)
│   │   │   ├── accounts/route.ts
│   │   │   └── portfolio/route.ts
│   │   ├── layout.tsx            # Root layout with QueryClientProvider
│   │   ├── page.tsx              # Home page (Portfolio component)
│   │   └── globals.css           # TailwindCSS + theme
│   ├── components/
│   │   └── features/Portfolio/   # Feature components
│   ├── lib/
│   │   ├── tinkoff-api.ts        # Tinkoff API service (core business logic)
│   │   └── providers.tsx         # React Query provider setup
│   └── stores/
│       └── portfolioStore.ts     # Zustand store
├── .env.local                     # TINKOFF_API_TOKEN (DO NOT commit!)
├── tsconfig.json                  # TypeScript strict mode
├── next.config.ts                 # React Compiler enabled
└── package.json
```

---

## 🔧 Common Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (localhost:3000) — **DO NOT RUN** |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |

**Note:** Per parent CLAUDE.md instructions, do NOT run `npm install` or `npm run dev`.

---

## 🌊 Data Flow Architecture

```
Browser (Client)
    ↓
Zustand Store (usePortfolioStore)
    ↓
Next.js API Routes (/api/tinkoff/*)
    ↓
tinkoff-api.ts Service Layer
    ↓
Tinkoff Invest API (External)
    ↓
Zod Validation + TypeScript Types
    ↓
UI Components (Portfolio, PositionList, etc.)
```

### Two-Stage Portfolio Fetch

```typescript
// Stage 1: Fetch portfolio data
POST /GetPortfolio { accountId }
// Returns: PortfolioResponse with positions[]

// Stage 2: Enrich positions with instrument details
for each position:
  POST /GetInstrumentBy { id: figi }
  // Returns: { instrument: { ticker, name, ... } }

// Combine: position + { ticker, name }
// Result: Enriched portfolio with readable names
```

**Why two stages?**
Tinkoff API returns only FIGI codes in portfolio. To display "Яндекс" instead of "BBG006L8G4H1", we must fetch instrument details separately. This is done in parallel using `Promise.all()` for performance.

---

## 🔐 Security Model

- **Token Storage:** `TINKOFF_API_TOKEN` in `.env.local` (server-side only)
- **API Routes:** Act as secure proxy between client and Tinkoff
- **Client:** Never sees the token
- **Validation:** Zod schemas validate all API responses at runtime

**Environment Variables:**
```bash
TINKOFF_API_TOKEN=<your_bearer_token>
NEXT_PUBLIC_TINKOFF_API_URL=https://invest-public-api.tinkoff.ru/rest  # optional
```

---

## 📝 Development Rules

### ✅ DO:

1. **Use TypeScript** — All new files must be `.ts` or `.tsx`
   - Enable strict mode in tsconfig.json
   - Type all functions and variables

2. **Follow structure** — Create components in `components/features/[Feature]/`
   - Component.tsx — main component
   - types.ts — types for the component (if complex)

3. **Use Zod for validation** — All API responses must be validated
   - Define schema with `z.object(...)`
   - Infer TypeScript type: `type Foo = z.infer<typeof FooSchema>`
   - Validate in tinkoffRequest: `tinkoffRequest(..., FooSchema)`

4. **Error handling:**
   - Use try-catch in async functions
   - Return typed errors
   - Display user-friendly messages in Russian

5. **State management pattern:**
   - Zustand store for global state (accounts, portfolio)
   - Component-local state for UI-only state (modals, dropdowns)

6. **API integration pattern:**
   - Client → Zustand action → fetch `/api/tinkoff/*` → API route → tinkoff-api.ts → Tinkoff API
   - Never call Tinkoff API directly from client

### ❌ DON'T:

- Don't create files without TypeScript types
- Don't forget error handling for API requests
- Don't use magic numbers — use constants
- Don't create large components (>300 lines) — split them
- Don't add dependencies without justification
- Don't commit `.env.local` to git!
- Don't run `npm run dev` or `npm install` (per parent CLAUDE.md)

---

## 🧩 Key Architectural Patterns

### 1. Retry Logic with Exponential Backoff

All Tinkoff API requests use retry logic:
- **Max retries:** 3
- **Initial delay:** 1000ms
- **Max delay:** 10000ms
- **Backoff multiplier:** 2x

**Smart retry:**
- Retries on 5xx errors and network failures
- Does NOT retry on 4xx client errors

### 2. Data Enrichment Pattern

Portfolio positions are enriched with instrument details:

```typescript
// Raw position from API
{ figi: "BBG006L8G4H1", quantity: {...}, ... }

// After enrichment
{ figi: "BBG006L8G4H1", ticker: "YNDX", name: "Яндекс", quantity: {...}, ... }
```

**Implementation:** `fetchPortfolio()` in tinkoff-api.ts (lines 268-307)

### 3. MoneyValue Conversion

Tinkoff API uses `MoneyValue` format:
```typescript
{ units: "123", nano: 456789000 } → 123.456789
```

**Helpers:**
- `moneyValueToNumber(money: MoneyValue): number`
- `quotationToNumber(quotation: Quotation): number`

### 4. Component Skeleton Pattern

All data-loading components use skeleton loaders:
```typescript
if (isLoading) return <SkeletonLoader />;
if (error) return <ErrorMessage />;
if (!data || data.length === 0) return <EmptyState />;
return <DataView />;
```

---

## 🎨 Styling Guidelines

- **Framework:** TailwindCSS v4 (utility-first)
- **No shadcn/ui** — Use Tailwind classes directly
- **Color scheme:**
  - Blue for primary elements
  - Green for profit
  - Red for loss
  - Gray for neutral elements

**Example:**
```tsx
<div className="bg-white rounded-lg shadow-md p-6">
  <h2 className="text-2xl font-bold text-gray-900">...</h2>
</div>
```

---

## 🧪 Type Safety Pattern

**Two-level type safety:**

1. **Runtime (Zod):** Validates API responses before use
2. **Compile-time (TypeScript):** Inferred from Zod schemas

**Example:**
```typescript
// 1. Define Zod schema
const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
});

// 2. Infer TypeScript type
export type User = z.infer<typeof UserSchema>;

// 3. Validate at runtime
const user = UserSchema.parse(apiResponse);
```

---

## 📊 Main Data Models

### Account
```typescript
{
  id: string
  type: "ACCOUNT_TYPE_TINKOFF" | "ACCOUNT_TYPE_TINKOFF_IIS" | "ACCOUNT_TYPE_INVEST_BOX"
  name: string
  status: "ACCOUNT_STATUS_OPEN" | "ACCOUNT_STATUS_CLOSED"
  accessLevel?: string
}
```

### PortfolioPosition
```typescript
{
  figi: string                    // FIGI code (e.g., "BBG006L8G4H1")
  ticker?: string                 // Enriched (e.g., "YNDX")
  name?: string                   // Enriched (e.g., "Яндекс")
  instrumentType: string          // "share", "bond", "etf", etc.
  quantity: Quotation
  averagePositionPrice: MoneyValue
  currentPrice: MoneyValue
  expectedYield: Quotation
  currentNkd?: MoneyValue         // Accrued interest (for bonds)
}
```

### MoneyValue
```typescript
{
  currency: string                // "RUB", "USD", etc.
  units: string                   // "123"
  nano: number                    // 456789000 (nanoseconds)
}
// Converts to: 123.456789
```

---

## 🚨 Critical Implementation Details

### 1. Position Enrichment Cost
Each portfolio position triggers a separate API call to `GetInstrumentBy`. For a portfolio with 10 positions, this means 11 API calls total (1 for portfolio + 10 for instruments).

**Current:** Uses `Promise.all()` for parallel requests
**Future optimization:** Batch API or caching layer

### 2. State Management Flow

```typescript
// User action
AccountSelector.onChange(accountId)
  ↓
// Zustand store
portfolioStore.switchAccount(accountId)
  ↓
// Auto-triggers
portfolioStore.loadPortfolio(accountId)
  ↓
// Fetches from API route
fetch('/api/tinkoff/portfolio?accountId=xxx')
  ↓
// API route calls service
fetchPortfolio(accountId, token)
  ↓
// Service calls Tinkoff API + enriches
[GetPortfolio, GetInstrumentBy × N]
  ↓
// Updates store
portfolioStore.portfolio = enrichedPortfolio
  ↓
// Components re-render
PortfolioSummary, PositionList
```

### 3. Error Handling Layers

1. **API Route Level:** Returns 500 with error message
2. **Zustand Store Level:** Catches and stores error state
3. **Component Level:** Displays error UI with retry button

---

## 🔍 Debugging Tips

### Console Logs
The codebase includes debug logs:
- `🔵 Tinkoff API Request:` — API request details
- `✅ Tinkoff API Success:` — API response summary
- `❌ Tinkoff API Error Response:` — API error details
- `🔍 Enriching positions...` — Position enrichment start
- `✅ Enriched BBG... -> YNDX (Яндекс)` — Successful enrichment
- `Position data:` — Position object in PositionList

### Browser DevTools
Open with F12, check:
- **Console tab:** API logs and errors
- **Network tab:** Check `/api/tinkoff/*` requests
- **React DevTools:** Inspect Zustand store state

---

## 🎯 Known Limitations

1. **No real-time data** — Data refreshes only on page load or account switch
2. **Single token** — Uses one global `TINKOFF_API_TOKEN`, no per-user auth
3. **No rate limiting** — API routes have no rate limits configured
4. **No caching optimization** — React Query configured but hooks not used
5. **Position enrichment N+1** — Fetches instrument details sequentially per position

---

## 📚 Helpful Resources

- [Next.js 15 Docs](https://nextjs.org/docs)
- [React Query Docs](https://tanstack.com/query/latest)
- [Zustand Docs](https://zustand-demo.pmnd.rs/)
- [Zod Docs](https://zod.dev/)
- [Tinkoff Invest API](https://tinkoff.github.io/investAPI/)
- [TailwindCSS v4 Docs](https://tailwindcss.com/docs)

---

## 🆕 Recent Changes

### Position Display Enhancement (Latest)
**What changed:**
- Portfolio positions now display instrument names instead of FIGI codes
- Example: "Яндекс" instead of "BBG006L8G4H1"

**Files modified:**
- `src/lib/tinkoff-api.ts`:
  - Added `InstrumentSchema` and `InstrumentResponseSchema`
  - Updated `getInstrumentByFigi()` to return typed `Instrument`
  - Modified `fetchPortfolio()` to enrich positions with ticker + name
  - Added optional `ticker` and `name` fields to `PortfolioPositionSchema`

- `src/components/features/Portfolio/PositionList.tsx`:
  - Updated display logic: `position.name || position.ticker || position.figi`
  - Added separate ticker badge if available
  - Added debug console.log for position data

**Testing:**
Open browser DevTools (F12) and check console for:
```
🔍 Enriching positions with instrument details...
✅ Enriched BBG006L8G4H1 -> YNDX (Яндекс)
Position data: { figi: "BBG006L8G4H1", ticker: "YNDX", name: "Яндекс", ... }
```
