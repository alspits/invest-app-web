📋 Project Overview
invest-app — Next.js 16 PWA for investment portfolio management (Tinkoff Invest API).

Tech Stack
Framework: Next.js 16 with App Router

Language: TypeScript (strict mode)

UI: React 19, Tailwind CSS v4

State Management: Zustand

Data Fetching: TanStack Query (React Query)

API: Tinkoff Invest API (REST)


🎯 Your Role
You are a Next.js/React specialist helping develop invest-app as a production PWA.

When coding:

Follow Next.js 16 App Router best practices

Use TypeScript for all code (strict mode)

Apply Tailwind CSS v4 for styling

Respect existing UI Design Principles

Implement Fintech Design Trends 2025 patterns

Follow PWA Implementation guidelines


🧪 Key Principles
1. Mobile-First
Design for 375px width first

Responsive breakpoints: 640px, 768px, 1024px

Touch-friendly (no hover-only interactions)

2. Performance
Lazy load heavy components

Optimize images (WebP, srcset)

Use dynamic imports for Phase 4 features

Target Core Web Vitals: LCP < 2.5s, CLS < 0.1

3. Data Management
Tinkoff API calls through React Query (cache-first)

Real-time updates for portfolio (WebSocket if available)

Optimistic UI updates for better UX

4. Security
Never expose API keys in client code

Use environment variables (NEXT_PUBLIC_* for public)

Validate input on both client and server

HTTPS only for API calls


PWA Features
Service Worker caching

Offline support for dashboard

Push notifications for portfolio alerts

Install prompt (add to home screen)

📝 Code Style
Naming Conventions
Components: PascalCase (PortfolioCard.tsx)

Utilities: camelCase (formatCurrency.ts)

Stores: *.store.ts (portfolio.store.ts)

API calls: *.api.ts (tinkoff.api.ts)

File Organization
text
feature/
├── components/    # Feature-specific components
├── hooks/         # Feature-specific hooks
├── types/         # TypeScript types
├── api.ts         # API calls for this feature
└── index.ts       # Barrel export
TypeScript First
Use interface for external APIs

Use type for unions and complex types

Strict null checking enabled

No any types (use unknown if necessary)

🎯 When to Use MCP Tools
Before implementing features:
Use context7 to verify latest API syntax

Use sequentialthinking for complex architecture decisions

During development:
Check documentation with context7 for best practices

Validate UI with playwright screenshots

After implementation:
Run CodeRabbit for quality checks

Use playwright for visual regression tests

🚀 Quick Start Examples
For new features:
text
Generate a React component for Recommendation Engine that follows 
the design system and TypeScript best practices. Use context7 to 
verify TanStack Query patterns.
For debugging:
text
Debug this component, check for performance issues and suggest 
improvements. Use playwright to screenshot the result.
For refactoring:
text
Refactor this code to follow the architecture patterns. 
Use sequentialthinking to plan the approach.
💡 Recent Notes
Next.js 16 + React 19: Use latest hooks (useOptimistic, useFormStatus)

Tailwind v4: CSS variables for theming, utility-first approach

Phase 4 Focus: Recommendation Engine + What-If Analysis (most impactful)

PWA: Prioritize offline support for dashboard view
