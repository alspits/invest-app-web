# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Project: Investment Portfolio Tracker (Next.js 16 + React 19)
Personal PWA for investment portfolio management with advanced analytics.

🌍 Language Rules
CRITICAL:

Prompts: User provides prompts in English (code, technical terms, file names)

Responses: ALL responses MUST be in Russian (Русский)

Code Comments: English only (standard practice)

Documentation: Russian for user-facing docs, English for technical API docs

Example:

text
User: "Add button to dashboard"
Assistant: "Добавляю кнопку на дашборд. Вот компонент..."

## Quick Start

```bash
cd invest-app-web
npm run dev  # http://localhost:3000
```

## Environment Variables

Required in `.env.local`:

```bash
# Tinkoff API
NEXT_PUBLIC_TINKOFF_API_URL=https://invest-public-api.tinkoff.ru/rest
TINKOFF_API_TOKEN=<your_token>

# News API
NEWSAPI_KEY=<your_newsapi_key>

# Auth
NEXTAUTH_SECRET=<secret>
NEXTAUTH_URL=http://localhost:3000

# PWA Push Notifications (optional, generate with: npx web-push generate-vapid-keys)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<your_vapid_public_key>
VAPID_PRIVATE_KEY=<your_vapid_private_key>
VAPID_SUBJECT=mailto:your-email@example.com
```

## Tech Stack

**Framework:** Next.js 16 (App Router) + React 19 + TypeScript

**React Compiler:** Enabled (React 19 optimization feature)

**State Management:** Zustand + TanStack Query

**Styling:** Tailwind CSS v4

**Data Validation:** Zod schemas

**Charts:** Recharts

**API:** Tinkoff Invest API

## Key Project Characteristics

This is a READ-ONLY portfolio analytics tool:
- No trading execution (viewing & analysis only)
- Focus on analytics, insights, and planning
- All data transformations happen client-side or in API routes
- Mock data available for development without API tokens

Architecture Pattern:
- Server Components where possible (App Router default)
- Client Components ('use client') only when needed (interactivity, hooks)
- API routes for server-side external API calls (security)
- Zustand stores for complex client state management
- TanStack Query for server state caching

## Critical Patterns (ALWAYS Follow)

### 1. Tinkoff API (Server-Side Only)

```typescript
// ✅ CORRECT: Call via API routes
const response = await fetch('/api/tinkoff/portfolio?accountId=123');

// ❌ WRONG: Never call Tinkoff directly from client
fetch('https://invest-public-api.tinkoff.ru/...');
```

**Why:** API token must stay server-side for security.

### 2. Data Conversions (Tinkoff Format)

```typescript
// Tinkoff returns: {units: "100", nano: 500000000}
// Convert to: 100.5

import { moneyValueToNumber, quotationToNumber } from '@/lib/tinkoff-api';

const price = moneyValueToNumber(position.averagePositionPrice);
const quantity = quotationToNumber(position.quantity);
```

**Why:** Tinkoff uses special format for decimals (units + nano).

**Note:** Converters are in `@/lib/tinkoff-api.ts`, not in a separate converters file.

### 3. Store Pattern (Auto-Load)

```typescript
// Zustand stores auto-load data on mount
useEffect(() => {
  portfolioStore.loadAccounts(); // Auto-selects first account
}, []);
```

**Why:** Centralized data loading pattern.

**Available Stores:**
- usePortfolioStore - Portfolio & accounts state
- useAnalyticsStore - Analytics & performance metrics
- useTaxStore - Tax optimization & harvesting
- useGoalStore - Investment goals tracking
- useScenarioStore - What-if scenario calculations
- usePatternStore - Trading pattern recognition
- useNewsStore - News feed state
- useMarketStore - Market context data
- useNotificationStore - PWA notifications

### 4. Mock Data Fallback (Development Mode)

```typescript
// In development without API token, stores auto-use mock data
// Example: portfolioStore loads mock accounts if TINKOFF_API_TOKEN missing
// This allows UI development without API access
```

**Why:** Enable frontend development without backend dependencies.

### 5. Path Aliases

```typescript
// ✅ Use path aliases
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

// ❌ Don't use relative paths
import { formatCurrency } from '../../lib/utils';
```

## Project Structure

```text
src/
├── app/                          # Next.js App Router (routes)
│   ├── api/                      # API routes (server-side)
│   │   ├── tinkoff/              # Tinkoff API proxy endpoints
│   │   ├── news/                 # News API endpoints
│   │   ├── market/               # Market data endpoints
│   │   ├── patterns/             # Pattern recognition endpoints
│   │   ├── tax/                  # Tax calculation endpoints
│   │   └── notifications/        # PWA notification endpoints
│   └── (dashboard)/              # Main dashboard routes
├── components/
│   ├── ui/                       # Reusable UI components
│   └── features/                 # Feature-specific components
│       ├── Portfolio/            # Portfolio management UI
│       ├── Analytics/            # Analytics dashboard
│       ├── Tax/                  # Tax optimization UI
│       ├── Goals/                # Goal tracking UI
│       ├── Scenarios/            # What-if scenarios UI
│       ├── Patterns/             # Pattern recognition UI
│       ├── Recommendations/      # Investment recommendations UI
│       ├── News/                 # News feed UI
│       ├── Market/               # Market context UI
│       ├── Notifications/        # Notification settings UI
│       └── PWA/                  # PWA-specific components
├── stores/                       # Zustand stores (9 stores)
├── lib/                          # Utility libraries
│   ├── tinkoff-api.ts            # Tinkoff API client & converters
│   ├── analytics.ts              # Analytics calculations
│   ├── tax-utils.ts              # Tax calculations
│   ├── intelligence/             # AI/ML intelligence features
│   ├── tax/                      # Tax optimization logic
│   └── [other services]
└── types/                        # TypeScript type definitions
```

## Documentation Updates (MANDATORY)

### When to Update docs/FEATURES/

ALWAYS update feature documentation when:

**Creating New Feature:**

```bash
# Create new feature doc
docs/FEATURES/[FEATURE_NAME].md
```

Include:
- Feature overview (что делает)
- Technical architecture (как работает)
- API endpoints (если есть)
- Components structure
- Store logic
- Usage examples
- Known issues / limitations

**Modifying Existing Feature:**

```bash
# Update existing feature doc
docs/FEATURES/[FEATURE_NAME].md
```

Update:
- Changed API endpoints
- New component props
- Updated store methods
- New configuration options

**Adding Feature Components:**
- Document component props and usage
- Add examples to feature doc

### Feature Documentation Template

```markdown
# [Feature Name]

## Overview
Brief description (1-2 sentences) in Russian.

## Architecture

### Components
- `ComponentName.tsx` - description

### Store
- `useFeatureStore()` - methods and state

### API Routes
- `GET /api/feature/endpoint` - description

## Usage Example

\`\`\`typescript
// Code example
\`\`\`

## Configuration

\`\`\`typescript
// Config options
\`\`\`

## Known Issues
- Issue 1
- Issue 2
```

## Completed Features

Detailed documentation in `docs/` and `docs/FEATURES/`:

✅ Portfolio Integration (PORTFOLIO_INTEGRATION.md)

✅ Analytics Dashboard (component exists)

✅ News Feed (NEWS_FEATURE.md)

✅ Market Context (MARKET_CONTEXT_FEATURE.md)

✅ Goal Tracking (GOAL_TRACKING_FEATURE.md)

✅ Progressive Web App (PWA.md, PWA_SETUP.md)

✅ Pattern Recognition (PATTERN_RECOGNITION.md)

✅ Tax Optimization (TAX_OPTIMIZATION.md)

✅ What-If Scenarios (component exists)

✅ Investment Recommendations (component exists)

## Important Rules

**API Security:** All Tinkoff calls via `/api/tinkoff/*` routes (server-side only)

**Styling:** Tailwind utilities only (no CSS modules)

**State:** Zustand for global state, React Query for server state

**TypeScript:** Strict mode enabled, no `any` types

**Feature Structure:** Components in `src/components/features/[FeatureName]/`

**Documentation:** ALWAYS update `docs/FEATURES/` when feature changes

**Language:** Respond in Russian, code comments in English

## Documentation Workflow

### Before Starting Feature Development:

```bash
# Check if feature doc exists
ls docs/FEATURES/[FEATURE_NAME].md

# If not, create from template
cp docs/FEATURES/_TEMPLATE.md docs/FEATURES/[FEATURE_NAME].md
```

### During Development:
- Update doc as you implement components
- Document API endpoints immediately
- Add usage examples

### After Feature Complete:
- Review and finalize documentation
- Add to "Completed Features" list in this file

## MCP Servers (Docker-based)

See `MCP_SETUP_INSTRUCTIONS.md` for Docker MCP server setup.

## When You Need More Details

### Architecture & Patterns:

Full tech stack details → docs/docs-ARCHITECTURE.md

Portfolio integration → `docs/PORTFOLIO_INTEGRATION.md`

### Setup & Configuration:

MCP server setup → `docs/MCP_SETUP_INSTRUCTIONS.md`

PWA setup guide → `docs/PWA_SETUP.md`

### Features:

Feature-specific docs → `docs/FEATURES/[FEATURE_NAME].md`

Available: `PWA.md`, `PATTERN_RECOGNITION.md`, `TAX_OPTIMIZATION.md`

Legacy docs → `docs/NEWS_FEATURE.md`, `docs/MARKET_CONTEXT_FEATURE.md`, `docs/GOAL_TRACKING_FEATURE.md`

Just ask me to reference the specific doc you need!

## Development Workflow

```bash
# Development
npm run dev             # Start dev server at http://localhost:3000

# Build & Production
npm run build          # Build for production
npm start              # Start production server

# Code Quality
npm run lint           # Run ESLint
# Note: No npm run type-check script - use: npx tsc --noEmit
```

## API Routes Structure

All API routes are server-side only (never call external APIs from client):

```bash
/api/tinkoff/accounts              # GET - Fetch user accounts
/api/tinkoff/portfolio             # GET - Fetch portfolio (requires ?accountId=xxx)
/api/tinkoff/portfolio-history     # GET - Fetch portfolio history
/api/news                          # GET - Fetch financial news
/api/market                        # GET - Fetch market context data
/api/patterns                      # GET - Pattern recognition analysis
/api/tax/harvesting                # GET - Tax loss harvesting opportunities
/api/notifications/subscribe       # POST - Subscribe to PWA notifications
/api/notifications/unsubscribe     # POST - Unsubscribe from notifications
/api/notifications/settings        # GET/PUT - Notification settings
/api/notifications/test            # POST - Test notification
```

## Response Language Examples

✅ **CORRECT:**
```
User: "Add recommendation engine"
You: "Создаю recommendation engine. Компонент будет включать..."
```

✅ **CORRECT:**
```
User: "Update NEWS_FEATURE.md"
You: "Обновляю документацию для News Feature. Добавляю секцию..."
```

❌ **WRONG:**
```
User: "Add recommendation engine"
You: "Creating recommendation engine. Component will include..."
```

---

## 📌 Remember

- This file contains ONLY critical info
- For detailed documentation, see `docs/` folder
- ALWAYS update `docs/FEATURES/` when working on features
- ALWAYS respond in Russian (code comments in English)