# Investment Portfolio Tracker

Personal PWA for investment portfolio management with advanced analytics.

## Tech Stack

**Framework:** Next.js 16 (App Router) + React 19 + TypeScript
**React Compiler:** Enabled (React 19 optimization)
**State Management:** Zustand + TanStack Query
**Styling:** Tailwind CSS v4
**Data Validation:** Zod schemas
**Charts:** Recharts
**API:** Tinkoff Invest API

## Architecture

### Modular Design

Strict modular architecture with **max 150 lines per file**:

- **Single Responsibility** - each file has one clear purpose
- **Highly Testable** - modules unit tested independently
- **Reusable** - shared utilities (HTTP, classifiers) across features
- **AI-Friendly** - ~80% context reduction in Claude Code

### Key Refactored Modules (November 2025)

| Module | Files | Previous | Improvement |
|--------|-------|----------|-------------|
| `src/lib/recommendations/` | 15 modules | 798 lines (monolith) | Analyzers + Generators |
| `src/stores/analytics/` | 10 modules + HTTP utils | 691 lines | Reusable fetch/retry |
| `src/lib/intelligence/patterns/` | 13 modules | 682 lines | Detectors + Matchers |
| `src/lib/alerts/engine/` | 10 modules | 637 lines | Evaluators + State |
| `src/lib/analytics/portfolio/` | 15 modules | 624 lines | Classifiers + Calculators |
| `src/stores/alerts/` | 10 modules | 602 lines | CRUD + Evaluation |

See [CLAUDE.md](CLAUDE.md) for structure details and [docs/ARCHITECTURE_PRINCIPLES.md](docs/ARCHITECTURE_PRINCIPLES.md) for principles.

## Getting Started

### Prerequisites

Node.js 18+ and npm/yarn/pnpm/bun installed.

### Installation

```bash
# Clone repository
git clone <repository-url>
cd invest-app-web

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
# Edit .env.local with your API keys (see below)

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Environment Variables

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

# PWA Push Notifications (optional)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<your_vapid_public_key>
VAPID_PRIVATE_KEY=<your_vapid_private_key>
VAPID_SUBJECT=mailto:your-email@example.com
```

**Note:** Mock data available for development without API tokens.

## Features

✅ **Portfolio Integration** - Multi-account tracking via Tinkoff Invest API
✅ **Analytics Dashboard** - Performance metrics, factor analysis, diversification
✅ **Investment Recommendations** - AI-powered portfolio optimization suggestions
✅ **Pattern Recognition** - Behavioral trading pattern detection (panic selling, FOMO)
✅ **Alert System** - Price, news, and anomaly alerts with smart batching
✅ **Tax Optimization** - Tax loss harvesting opportunities
✅ **Goal Tracking** - Investment goals with progress monitoring
✅ **What-If Scenarios** - Portfolio simulation tools
✅ **News Feed** - Financial news aggregation
✅ **Market Context** - Real-time market data and sentiment
✅ **Progressive Web App** - Installable with push notifications

See [docs/FEATURES/](docs/FEATURES/) for detailed documentation.

## Development Workflow

```bash
# Development
npm run dev             # Start dev server at http://localhost:3000

# Build & Production
npm run build          # Build for production
npm start              # Start production server

# Code Quality
npm run lint           # Run ESLint
npx tsc --noEmit       # Type checking
```

## Project Structure

```text
src/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes (server-side)
│   └── (dashboard)/              # Dashboard routes
├── components/
│   ├── ui/                       # Reusable UI components
│   └── features/                 # Feature-specific components
├── stores/                       # Zustand stores (modular)
│   ├── analytics/                # ✨ Modular analytics store
│   ├── alerts/                   # ✨ Modular alert store
│   └── [other stores]
├── lib/                          # Utility libraries (modular)
│   ├── http/                     # ✨ Reusable HTTP utilities
│   ├── recommendations/          # ✨ Modular recommendation engine
│   ├── intelligence/patterns/    # ✨ Modular pattern recognition
│   ├── alerts/engine/            # ✨ Modular alert engine
│   ├── analytics/portfolio/      # ✨ Modular portfolio analysis
│   └── [other services]
└── types/                        # TypeScript type definitions
```

## Documentation

- [CLAUDE.md](CLAUDE.md) - AI assistant guidance (critical patterns)
- [docs/ARCHITECTURE_PRINCIPLES.md](docs/ARCHITECTURE_PRINCIPLES.md) - Modular architecture guide
- [docs/PORTFOLIO_INTEGRATION.md](docs/PORTFOLIO_INTEGRATION.md) - Portfolio integration details
- [docs/PWA_SETUP.md](docs/PWA_SETUP.md) - PWA configuration guide
- [docs/FEATURES/](docs/FEATURES/) - Feature-specific documentation

## Contributing

1. Follow modular architecture principles (max 150 lines per file)
2. Write unit tests for new modules
3. Update feature documentation in `docs/FEATURES/`
4. Run `npm run lint` and `npx tsc --noEmit` before committing

## License

Private project - All rights reserved.
