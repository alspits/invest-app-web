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
Quick Start
bash
cd invest-app-web
npm run dev  # http://localhost:3000
Environment Variables
Required in .env.local:

bash
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
Tech Stack
Framework: Next.js 16 (App Router) + React 19 + TypeScript

State Management: Zustand + TanStack Query

Styling: Tailwind CSS v4

Data Validation: Zod schemas

Charts: Recharts

API: Tinkoff Invest API

Critical Patterns (ALWAYS Follow)
1. Tinkoff API (Server-Side Only)
typescript
// ✅ CORRECT: Call via API routes
const response = await fetch('/api/tinkoff/portfolio?accountId=123');

// ❌ WRONG: Never call Tinkoff directly from client
fetch('https://invest-public-api.tinkoff.ru/...');
Why: API token must stay server-side for security.

2. Data Conversions (Tinkoff Format)
typescript
// Tinkoff returns: {units: "100", nano: 500000000}
// Convert to: 100.5

import { moneyValueToNumber, quotationToNumber } from '@/lib/tinkoff/converters';

const price = moneyValueToNumber(position.averagePositionPrice);
const quantity = quotationToNumber(position.quantity);
Why: Tinkoff uses special format for decimals (units + nano).

3. Store Pattern (Auto-Load)
typescript
// Zustand stores auto-load data on mount
useEffect(() => {
  portfolioStore.loadAccounts(); // Auto-selects first account
}, []);
Why: Centralized data loading pattern.

4. Path Aliases
typescript
// ✅ Use path aliases
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

// ❌ Don't use relative paths
import { formatCurrency } from '../../lib/utils';
Project Structure
text
src/
├── app/                    # Next.js App Router (routes)
├── components/
│   ├── ui/                 # Reusable UI components
│   └── features/           # Feature-specific components
├── lib/
│   ├── tinkoff/            # Tinkoff API client
│   ├── stores/             # Zustand stores
│   └── utils/              # Utility functions
└── types/                  # TypeScript types
Documentation Updates (MANDATORY)
When to Update docs/FEATURES/
ALWAYS update feature documentation when:

Creating New Feature:

bash
# Create new feature doc
docs/FEATURES/[FEATURE_NAME].md
Include:

Feature overview (что делает)

Technical architecture (как работает)

API endpoints (если есть)

Components structure

Store logic

Usage examples

Known issues / limitations

Modifying Existing Feature:

bash
# Update existing feature doc
docs/FEATURES/[FEATURE_NAME].md
Update:

Changed API endpoints

New component props

Updated store methods

New configuration options

Adding Feature Components:

Document component props and usage

Add examples to feature doc

Feature Documentation Template
text
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
Completed Features
Detailed documentation in docs/FEATURES/:

✅ Portfolio Integration (PORTFOLIO_INTEGRATION.md)

✅ Analytics Dashboard (exists in project)

✅ News Feed (NEWS_FEATURE.md)

✅ Market Context (MARKET_CONTEXT_FEATURE.md)

✅ Goal Tracking (GOAL_TRACKING_FEATURE.md)

✅ Performance Summary (exists in project)

✅ Investment Recommendations (exists in project)

✅ What-If Scenarios (exists in project)

✅ Progressive Web App (PWA.md)

Important Rules
API Security: All Tinkoff calls via /api/tinkoff/* routes (server-side only)

Styling: Tailwind utilities only (no CSS modules)

State: Zustand for global state, React Query for server state

TypeScript: Strict mode enabled, no any types

Feature Structure: Components in src/components/features/[FeatureName]/

Documentation: ALWAYS update docs/FEATURES/ when feature changes

Language: Respond in Russian, code comments in English

Documentation Workflow
Before Starting Feature Development:
bash
# Check if feature doc exists
ls docs/FEATURES/[FEATURE_NAME].md

# If not, create from template
cp docs/FEATURES/_TEMPLATE.md docs/FEATURES/[FEATURE_NAME].md
During Development:
Update doc as you implement components

Document API endpoints immediately

Add usage examples

After Feature Complete:
Review and finalize documentation

Add to "Completed Features" list in this file

Update Phase tracker

MCP Servers (Docker-based)
See MCP_SETUP_INSTRUCTIONS.md for Docker MCP server setup.

When You Need More Details
Architecture & Patterns:

Full tech stack details → docs/ARCHITECTURE.md

API integration patterns → docs/API_PATTERNS.md

Features:

Feature-specific docs → docs/FEATURES/[FEATURE_NAME].md

Troubleshooting:

Common issues → docs/TROUBLESHOOTING.md

Just ask me to reference the specific doc you need!

Development Workflow
bash
# Development
npm run dev

# Build & Production
npm run build
npm start

# Linting
npm run lint

# Type checking
npm run type-check
Current Phase: Phase 4 (~50% Complete)
See docs/ROADMAP.md for complete development plan.

In Progress:

Recommendation Engine

What-If Scenario Analysis

Portfolio Rebalancing Tool

Advanced PWA Features

Response Language Examples
text
✅ CORRECT:
User: "Add recommendation engine"
You: "Создаю recommendation engine. Компонент будет включать..."

✅ CORRECT:
User: "Update NEWS_FEATURE.md"
You: "Обновляю документацию для News Feature. Добавляю секцию..."

❌ WRONG:
User: "Add recommendation engine"
You: "Creating recommendation engine. Component will include..."
📌 Remember:

This file contains ONLY critical info

For detailed documentation, see docs/ folder

ALWAYS update docs/FEATURES/ when working on features

ALWAYS respond in Russian (code comments in English)