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

```text
User: "Add button to dashboard"
Assistant: "Добавляю кнопку на дашборд. Вот компонент..."
```

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
- **Modular architecture** with focused, testable modules (max 150 lines per file)

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

**Available Stores (Modular):**
- **usePortfolioStore** - Portfolio & accounts state
- **useAnalyticsStore** - `src/stores/analytics/` (modular: actions split, HTTP utils reusable)
- **useTaxStore** - Tax optimization & harvesting
- **useGoalStore** - Investment goals tracking
- **useScenarioStore** - What-if scenario calculations
- **usePatternStore** - Trading pattern recognition
- **useAlertStore** - `src/stores/alerts/` (modular: CRUD, evaluation, mock data separated)
- **useNewsStore** - News feed state
- **useMarketStore** - Market context data
- **useNotificationStore** - PWA notifications

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

## 🏗️ Modular Architecture (Nov 2025 Refactoring)

**Philosophy:** Every module has **Single Responsibility**, max **150 lines per file**, highly **testable** and **reusable**.

### Refactored Modules

#### 1. Recommendations (`src/lib/recommendations/`)
**Before:** 1 file (798 lines)  
**After:** 15 focused modules

```
src/lib/recommendations/
├── types.ts                    # Domain types
├── converters.ts               # Tinkoff converters
├── scoring.ts                  # Health score calculation
├── recommendation-engine.ts    # Main orchestrator
├── analyzers/
│   ├── concentration-analyzer.ts
│   ├── cash-analyzer.ts
│   ├── sector-analyzer.ts
│   └── allocation-calculator.ts
├── generators/
│   ├── diversification-gen.ts
│   ├── rebalancing-gen.ts
│   ├── cash-gen.ts
│   ├── concentration-gen.ts
│   ├── sector-gen.ts
│   └── risk-gen.ts
└── index.ts                    # Public API
```

**Usage:**
```typescript
import { generateRecommendations } from '@/lib/recommendations';
```

#### 2. Analytics Store (`src/stores/analytics/`)
**Before:** 1 file (691 lines)  
**After:** 10 focused modules + reusable HTTP utilities

```
src/stores/analytics/
├── types.ts
├── schemas.ts                  # Zod validation
├── analytics-store.ts          # Main store (delegates to actions)
├── history-loader.ts           # loadHistory action
├── factor-loader.ts            # loadFactorAnalysis action
└── index.ts

src/lib/http/                   # NEW: Reusable across all stores
├── error-classifier.ts         # Error handling
├── fetch-utils.ts              # Timeout, backoff, parse
├── retry.ts                    # Retry logic with exponential backoff
└── index.ts
```

**Usage:**
```typescript
import { useAnalyticsStore } from '@/stores/analytics';
import { fetchWithRetry } from '@/lib/http'; // Reusable!
```

#### 3. Pattern Recognition (`src/lib/intelligence/patterns/`)
**Before:** 1 class (682 lines)  
**After:** 13 focused modules

```
src/lib/intelligence/patterns/
├── pattern-service.ts          # PatternRecognitionService class
├── matchers/
│   ├── operation-grouper.ts
│   └── trade-matcher.ts
├── detectors/
│   ├── panic-detector.ts
│   ├── fomo-detector.ts
│   ├── strategic-detector.ts
│   ├── emotional-detector.ts
│   ├── pair-detector.ts
│   └── standalone-detector.ts
├── analyzers/
│   ├── statistics-analyzer.ts
│   ├── summary-generator.ts
│   └── recommendation-generator.ts
├── utils/
│   ├── trigger-factory.ts
│   └── formatters.ts
└── index.ts
```

**Usage:**
```typescript
import { PatternRecognitionService } from '@/lib/intelligence/patterns';
```

#### 4. Alert Engine (`src/lib/alerts/engine/`)
**Before:** 1 monolith (637 lines)  
**After:** 10 focused modules

```
src/lib/alerts/engine/
├── types.ts
├── alert-engine.ts             # Main orchestrator
├── batcher.ts                  # AlertBatcher class
├── sentiment-analyzer.ts       # SentimentAnalyzer class
├── state-helpers.ts            # DND, cooldown, limits
├── evaluators/
│   ├── conditions.ts
│   ├── news-trigger.ts
│   ├── anomaly.ts
│   └── operator-utils.ts
└── index.ts
```

**Usage:**
```typescript
import { AlertEngine } from '@/lib/alerts/engine';
```

#### 5. Portfolio Analysis (`src/lib/analytics/portfolio/`)
**Before:** 1 file (624 lines)  
**After:** 15 focused modules

```
src/lib/analytics/portfolio/
├── constants.ts
├── data/                       # Data maps (easy to update)
│   ├── moex-benchmark.ts
│   ├── sector-map.ts
│   ├── geography-map.ts
│   └── market-cap-map.ts
├── classifiers/
│   ├── sector-classifier.ts
│   ├── geography-classifier.ts
│   ├── market-cap-classifier.ts
│   └── currency-classifier.ts
├── calculators/
│   ├── concentration.ts
│   ├── sector-exposure.ts
│   ├── market-cap-exposure.ts
│   ├── geography-exposure.ts
│   ├── currency-exposure.ts
│   └── tilt-calculator.ts
├── enrichment.ts
├── factor-analyzer.ts          # Main orchestrator
└── index.ts
```

**Usage:**
```typescript
import { calculateFactorAnalysis } from '@/lib/analytics/portfolio';
```

#### 6. Alert Store (`src/stores/alerts/`)
**Before:** 1 file (602 lines)  
**After:** 10 focused modules

```
src/stores/alerts/
├── types.ts
├── mock-data.ts                # Mock data isolated (200 lines)
├── alert-store.ts              # Main store (delegates)
├── actions/
│   ├── crud-actions.ts
│   ├── alert-actions.ts
│   ├── bulk-actions.ts
│   ├── loader-actions.ts
│   └── evaluation-actions.ts
└── index.ts
```

**Usage:**
```typescript
import { useAlertStore } from '@/stores/alerts';
```

### Modular Architecture Benefits

✅ **Single Responsibility** - Each file has ONE clear purpose  
✅ **Testability** - Easy to unit test isolated modules  
✅ **Maintainability** - Easy to find and modify specific logic  
✅ **Reusability** - HTTP utilities, classifiers reused across features  
✅ **AI-Friendly** - Claude Code uses **~80% less context** per file  
✅ **Scalability** - Add new features without touching old code  

### File Size Rules

**CRITICAL:** All new code must follow these limits:

- **Main service/store:** Max **150 lines**
- **Action modules:** Max **120 lines**
- **Utility modules:** Max **100 lines**
- **Data/constants:** Max **200 lines** (exceptions for large maps)

**If file exceeds limit → Split into focused modules.**

### When Creating New Features

**✅ DO:**
```typescript
// Create modular structure from the start
src/lib/new-feature/
├── types.ts
├── main-service.ts         # Orchestrator only
├── calculators/            # Business logic
├── utils/                  # Helpers
└── index.ts                # Public API
```

**❌ DON'T:**
```typescript
// Don't create monolithic files
src/lib/new-feature.ts      // 600+ lines - BAD!
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
│   │   ├── alerts/               # Alert evaluation endpoints
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
│       ├── Alerts/               # Alert management UI
│       ├── News/                 # News feed UI
│       ├── Market/               # Market context UI
│       ├── Notifications/        # Notification settings UI
│       └── PWA/                  # PWA-specific components
├── stores/                       # Zustand stores (modular)
│   ├── analytics/                # ✨ Modular analytics store
│   ├── alerts/                   # ✨ Modular alert store
│   └── [other stores]
├── lib/                          # Utility libraries (modular)
│   ├── http/                     # ✨ Reusable HTTP utilities
│   ├── recommendations/          # ✨ Modular recommendation engine
│   ├── intelligence/
│   │   └── patterns/             # ✨ Modular pattern recognition
│   ├── alerts/
│   │   └── engine/               # ✨ Modular alert engine
│   ├── analytics/
│   │   └── portfolio/            # ✨ Modular portfolio analysis
│   ├── tinkoff-api.ts            # Tinkoff API client & converters
│   ├── analytics.ts              # Analytics calculations
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

✅ Pattern Recognition (PATTERN_RECOGNITION.md) - ✨ **Refactored to modular**

✅ Tax Optimization (TAX_OPTIMIZATION.md)

✅ What-If Scenarios (component exists)

✅ Investment Recommendations - ✨ **Refactored to modular**

✅ Alert System - ✨ **Refactored to modular**

## Important Rules

**API Security:** All Tinkoff calls via `/api/tinkoff/*` routes (server-side only)

**Styling:** Tailwind utilities only (no CSS modules)

**State:** Zustand for global state, React Query for server state

**TypeScript:** Strict mode enabled, no `any` types

**Feature Structure:** Components in `src/components/features/[FeatureName]/`

**Modular Architecture:** Max 150 lines per file, split into focused modules

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
/api/alerts/evaluate               # POST - Evaluate alerts
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
- **ALWAYS follow modular architecture** - max 150 lines per file
- **Reuse utilities** from `@/lib/http`, classifiers, etc.
- When refactoring - split into focused modules like examples above
