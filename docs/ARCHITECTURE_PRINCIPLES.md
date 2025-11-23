# Architecture Principles

**Investment Portfolio Tracker - Modular Architecture Guide (November 2025)**

This document describes the modular architecture principles adopted in November 2025 refactoring. It serves as a practical guide for developers and AI assistants (Claude Code) working with the codebase.

## Table of Contents

1. [Core Philosophy](#core-philosophy)
2. [File Size Limits](#file-size-limits)
3. [Module Structure Pattern](#module-structure-pattern)
4. [Refactored Modules Overview](#refactored-modules-overview)
5. [Benefits Achieved](#benefits-achieved)
6. [Creating New Features](#creating-new-features)
7. [Refactoring Checklist](#refactoring-checklist)
8. [Code Review Standards](#code-review-standards)
9. [Real-World Examples](#real-world-examples)

---

## Core Philosophy

### Single Responsibility Principle

**Every file has ONE clear purpose.**

```typescript
// ❌ BAD: Monolithic file doing everything
// src/lib/recommendations.ts (798 lines)
export function generateRecommendations() {
  // Concentration analysis
  // Cash analysis
  // Sector analysis
  // Diversification recommendations
  // Rebalancing recommendations
  // Cash recommendations
  // Concentration recommendations
  // Sector recommendations
  // Risk recommendations
  // ... 700+ more lines
}

// ✅ GOOD: Focused modules
// src/lib/recommendations/analyzers/concentration-analyzer.ts (85 lines)
export function analyzeConcentration(positions: Position[]): ConcentrationAnalysis {
  // Only concentration analysis logic
}

// src/lib/recommendations/generators/diversification-gen.ts (92 lines)
export function generateDiversificationRecommendations(
  analysis: PortfolioAnalysis
): Recommendation[] {
  // Only diversification recommendation generation
}
```

### Testability

**Modules are unit-testable in isolation.**

```typescript
// ✅ Easy to test - no dependencies on other modules
import { analyzeConcentration } from '@/lib/recommendations/analyzers/concentration-analyzer';

describe('analyzeConcentration', () => {
  it('identifies concentrated positions above threshold', () => {
    const positions = [
      { ticker: 'AAPL', value: 8000, totalValue: 10000 }, // 80%
      { ticker: 'GOOGL', value: 2000, totalValue: 10000 }, // 20%
    ];

    const result = analyzeConcentration(positions);

    expect(result.isConcentrated).toBe(true);
    expect(result.topPositions).toHaveLength(1);
    expect(result.topPositions[0].ticker).toBe('AAPL');
  });
});
```

### Reusability

**Common utilities are extracted and reused across features.**

```typescript
// ✅ Reusable HTTP utilities
// src/lib/http/fetch-utils.ts
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout = 10000
): Promise<Response> {
  // Timeout logic
}

// Used in analytics store
import { fetchWithTimeout } from '@/lib/http';
const response = await fetchWithTimeout('/api/analytics/history');

// Used in alert store
import { fetchWithTimeout } from '@/lib/http';
const response = await fetchWithTimeout('/api/alerts/evaluate');

// Used in pattern recognition
import { fetchWithTimeout } from '@/lib/http';
const response = await fetchWithTimeout('/api/patterns');
```

### AI-Friendly

**Smaller files reduce context usage in Claude Code by ~80%.**

**Before refactoring:**
- Claude needs to read entire 798-line file to understand one function
- High token usage, slow responses
- Risk of missing context in large files

**After refactoring:**
- Claude reads only relevant 85-line module
- Low token usage, fast responses
- Complete context in small files

---

## File Size Limits

### Strict Limits (Enforced)

| File Type | Max Lines | Reasoning |
|-----------|-----------|-----------|
| Main service/store | 150 | Orchestrator only, delegates to modules |
| Action modules | 120 | Single action implementation |
| Utility modules | 100 | Pure functions, no side effects |
| Data/constants | 200 | Large data maps allowed (exception) |

### Exceptions

**Only data/constants files can exceed 200 lines:**

```typescript
// src/lib/analytics/portfolio/data/moex-benchmark.ts (250 lines)
// Exception: Contains full MOEX index composition data
export const MOEX_INDEX_COMPOSITION: Record<string, number> = {
  SBER: 0.15,
  GAZP: 0.12,
  // ... 100+ more tickers
};
```

**All other files MUST be split if exceeding limit.**

---

## Module Structure Pattern

### Pattern: Service with Delegated Actions

**Main service file (orchestrator):**

```typescript
// src/lib/recommendations/recommendation-engine.ts (142 lines)
import { analyzeConcentration } from './analyzers/concentration-analyzer';
import { analyzeCashPosition } from './analyzers/cash-analyzer';
import { generateDiversificationRecommendations } from './generators/diversification-gen';
import { generateRebalancingRecommendations } from './generators/rebalancing-gen';

export function generateRecommendations(portfolio: Portfolio): RecommendationReport {
  // Orchestrate: call analyzers, pass results to generators
  const concentration = analyzeConcentration(portfolio.positions);
  const cash = analyzeCashPosition(portfolio);

  const recommendations = [
    ...generateDiversificationRecommendations(concentration),
    ...generateRebalancingRecommendations(portfolio),
  ];

  return { recommendations, score: calculateScore(recommendations) };
}
```

**Action modules (focused logic):**

```typescript
// src/lib/recommendations/analyzers/concentration-analyzer.ts (85 lines)
export function analyzeConcentration(positions: Position[]): ConcentrationAnalysis {
  // Only concentration analysis logic - no other concerns
}

// src/lib/recommendations/generators/diversification-gen.ts (92 lines)
export function generateDiversificationRecommendations(
  analysis: ConcentrationAnalysis
): Recommendation[] {
  // Only diversification recommendation generation - no other concerns
}
```

### Pattern: Store with Action Files

**Main store file (state + delegates):**

```typescript
// src/stores/analytics/analytics-store.ts (148 lines)
import { create } from 'zustand';
import { loadHistoryAction } from './history-loader';
import { loadFactorAnalysisAction } from './factor-loader';

interface AnalyticsState {
  history: HistoryData | null;
  factorAnalysis: FactorAnalysis | null;
  isLoading: boolean;
  error: string | null;

  // Actions (delegates to action files)
  loadHistory: () => Promise<void>;
  loadFactorAnalysis: () => Promise<void>;
}

export const useAnalyticsStore = create<AnalyticsState>((set, get) => ({
  history: null,
  factorAnalysis: null,
  isLoading: false,
  error: null,

  loadHistory: () => loadHistoryAction(set, get),
  loadFactorAnalysis: () => loadFactorAnalysisAction(set, get),
}));
```

**Action files (implementation):**

```typescript
// src/stores/analytics/history-loader.ts (98 lines)
import { fetchWithRetry } from '@/lib/http';

export async function loadHistoryAction(
  set: SetState<AnalyticsState>,
  get: GetState<AnalyticsState>
): Promise<void> {
  set({ isLoading: true, error: null });

  try {
    const response = await fetchWithRetry('/api/analytics/history');
    const data = await response.json();
    set({ history: data, isLoading: false });
  } catch (error) {
    set({ error: error.message, isLoading: false });
  }
}
```

### Pattern: Shared Utilities

**Reusable utilities (no feature-specific logic):**

```typescript
// src/lib/http/retry.ts (76 lines)
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  maxRetries = 3
): Promise<Response> {
  // Generic retry logic with exponential backoff
  // No knowledge of analytics, alerts, or other features
}

// src/lib/http/error-classifier.ts (54 lines)
export function classifyError(error: Error): ErrorType {
  // Generic error classification
  // Reusable across all features
}
```

### Directory Structure

**Recommended structure for new features:**

```text
src/lib/my-feature/
├── types.ts                    # Domain types (50-80 lines)
├── constants.ts                # Constants (30-50 lines)
├── my-feature-service.ts       # Main orchestrator (120-150 lines)
├── calculators/                # Business logic modules
│   ├── calculator-a.ts         # (80-100 lines)
│   ├── calculator-b.ts         # (80-100 lines)
│   └── calculator-c.ts         # (80-100 lines)
├── utils/                      # Helper functions
│   ├── formatter.ts            # (40-60 lines)
│   └── validator.ts            # (40-60 lines)
└── index.ts                    # Public API (10-20 lines)
```

---

## Refactored Modules Overview

### 1. Recommendations Engine

**Before:** 1 file, 798 lines
**After:** 15 modules

**Structure:**

```text
src/lib/recommendations/
├── types.ts                    # Domain types (62 lines)
├── converters.ts               # Tinkoff converters (48 lines)
├── scoring.ts                  # Health score calculation (71 lines)
├── recommendation-engine.ts    # Main orchestrator (142 lines)
├── analyzers/                  # Analysis modules
│   ├── concentration-analyzer.ts   (85 lines)
│   ├── cash-analyzer.ts            (58 lines)
│   ├── sector-analyzer.ts          (92 lines)
│   └── allocation-calculator.ts    (67 lines)
├── generators/                 # Recommendation generators
│   ├── diversification-gen.ts      (92 lines)
│   ├── rebalancing-gen.ts          (104 lines)
│   ├── cash-gen.ts                 (76 lines)
│   ├── concentration-gen.ts        (88 lines)
│   ├── sector-gen.ts               (95 lines)
│   └── risk-gen.ts                 (82 lines)
└── index.ts                    # Public API (15 lines)
```

**Key improvements:**
- Analyzers isolated from generators
- Each generator handles ONE recommendation type
- Easy to add new recommendation types (just add new generator)

### 2. Analytics Store

**Before:** 1 file, 691 lines
**After:** 10 modules + HTTP utilities

**Structure:**

```text
src/stores/analytics/
├── types.ts                    # State types (45 lines)
├── schemas.ts                  # Zod validation (68 lines)
├── analytics-store.ts          # Main store (148 lines)
├── history-loader.ts           # loadHistory action (98 lines)
├── factor-loader.ts            # loadFactorAnalysis action (105 lines)
└── index.ts                    # Public API (12 lines)

src/lib/http/                   # ✨ NEW: Reusable utilities
├── error-classifier.ts         # Error handling (54 lines)
├── fetch-utils.ts              # Timeout, parse (72 lines)
├── retry.ts                    # Retry logic (76 lines)
└── index.ts                    # Public API (18 lines)
```

**Key improvements:**
- HTTP utilities reusable across ALL stores
- Actions testable independently
- Clear separation: state definition vs. data loading

### 3. Pattern Recognition

**Before:** 1 class, 682 lines
**After:** 13 modules

**Structure:**

```text
src/lib/intelligence/patterns/
├── types.ts                    # Domain types (78 lines)
├── pattern-service.ts          # PatternRecognitionService class (135 lines)
├── matchers/                   # Trade matching
│   ├── operation-grouper.ts        (64 lines)
│   └── trade-matcher.ts            (88 lines)
├── detectors/                  # Pattern detectors
│   ├── panic-detector.ts           (72 lines)
│   ├── fomo-detector.ts            (68 lines)
│   ├── strategic-detector.ts       (85 lines)
│   ├── emotional-detector.ts       (76 lines)
│   ├── pair-detector.ts            (92 lines)
│   └── standalone-detector.ts      (58 lines)
├── analyzers/                  # Analysis & reporting
│   ├── statistics-analyzer.ts      (81 lines)
│   ├── summary-generator.ts        (95 lines)
│   └── recommendation-generator.ts (102 lines)
├── utils/                      # Helpers
│   ├── trigger-factory.ts          (45 lines)
│   └── formatters.ts               (38 lines)
└── index.ts                    # Public API (16 lines)
```

**Key improvements:**
- Each detector handles ONE pattern type
- Easy to add new patterns (just add new detector)
- Statistics and recommendations separated

### 4. Alert Engine

**Before:** 1 monolith, 637 lines
**After:** 10 modules

**Structure:**

```text
src/lib/alerts/engine/
├── types.ts                    # Domain types (52 lines)
├── alert-engine.ts             # Main orchestrator (128 lines)
├── batcher.ts                  # AlertBatcher class (86 lines)
├── sentiment-analyzer.ts       # SentimentAnalyzer class (92 lines)
├── state-helpers.ts            # DND, cooldown, limits (74 lines)
├── evaluators/                 # Condition evaluation
│   ├── conditions.ts               (95 lines)
│   ├── news-trigger.ts             (88 lines)
│   ├── anomaly.ts                  (76 lines)
│   └── operator-utils.ts           (42 lines)
└── index.ts                    # Public API (14 lines)
```

**Key improvements:**
- Batching logic isolated
- Each evaluator handles ONE trigger type
- State helpers (DND, cooldown) reusable

### 5. Portfolio Analysis

**Before:** 1 file, 624 lines
**After:** 15 modules

**Structure:**

```text
src/lib/analytics/portfolio/
├── constants.ts                # Thresholds (28 lines)
├── types.ts                    # Domain types (56 lines)
├── data/                       # Data maps (easy to update)
│   ├── moex-benchmark.ts           (212 lines) ⚠️ Exception
│   ├── sector-map.ts               (185 lines) ⚠️ Exception
│   ├── geography-map.ts            (142 lines)
│   └── market-cap-map.ts           (98 lines)
├── classifiers/                # Classification logic
│   ├── sector-classifier.ts        (68 lines)
│   ├── geography-classifier.ts     (72 lines)
│   ├── market-cap-classifier.ts    (64 lines)
│   └── currency-classifier.ts      (48 lines)
├── calculators/                # Metric calculations
│   ├── concentration.ts            (76 lines)
│   ├── sector-exposure.ts          (82 lines)
│   ├── market-cap-exposure.ts      (78 lines)
│   ├── geography-exposure.ts       (80 lines)
│   ├── currency-exposure.ts        (58 lines)
│   └── tilt-calculator.ts          (94 lines)
├── enrichment.ts               # Position enrichment (88 lines)
├── factor-analyzer.ts          # Main orchestrator (125 lines)
└── index.ts                    # Public API (14 lines)
```

**Key improvements:**
- Data maps separated (easy to update MOEX composition)
- Classifiers reusable across features
- Each calculator handles ONE metric type

### 6. Alert Store

**Before:** 1 file, 602 lines
**After:** 10 modules

**Structure:**

```text
src/stores/alerts/
├── types.ts                    # State types (48 lines)
├── mock-data.ts                # Mock data (198 lines) ⚠️ Exception
├── alert-store.ts              # Main store (142 lines)
├── actions/                    # Action implementations
│   ├── crud-actions.ts             (95 lines)
│   ├── alert-actions.ts            (88 lines)
│   ├── bulk-actions.ts             (76 lines)
│   ├── loader-actions.ts           (102 lines)
│   └── evaluation-actions.ts       (108 lines)
└── index.ts                    # Public API (12 lines)
```

**Key improvements:**
- CRUD operations separated
- Evaluation logic isolated
- Mock data doesn't clutter main store

---

## Benefits Achieved

### 1. Context Reduction (~80%)

**Before refactoring:**
```text
Claude reads: recommendations.ts (798 lines)
Token usage: ~2400 tokens
```

**After refactoring:**
```text
Claude reads: concentration-analyzer.ts (85 lines)
Token usage: ~250 tokens
Savings: ~90% tokens per file read
```

### 2. Faster Development

**Adding new recommendation type:**

**Before:**
- Read entire 798-line file
- Find relevant section
- Modify in context of unrelated code
- Risk breaking other recommendation types

**After:**
- Create new file: `generators/my-new-rec.ts` (80 lines)
- Import in orchestrator (1 line)
- Zero risk to existing recommendations

### 3. Improved Testability

**Before:**
```typescript
// Hard to test - tightly coupled
describe('generateRecommendations', () => {
  it('should work', () => {
    // Test setup requires mocking everything
    // Test 10+ recommendation types at once
  });
});
```

**After:**
```typescript
// Easy to test - isolated
describe('generateDiversificationRecommendations', () => {
  it('suggests diversification when concentrated', () => {
    // Only test diversification logic
    // Simple mock data
  });
});
```

### 4. Code Reusability

**HTTP utilities used in 6+ modules:**

```typescript
// src/stores/analytics/history-loader.ts
import { fetchWithRetry } from '@/lib/http';

// src/stores/alerts/actions/evaluation-actions.ts
import { fetchWithRetry } from '@/lib/http';

// src/lib/intelligence/patterns/pattern-service.ts
import { fetchWithRetry } from '@/lib/http';

// ... 3+ more modules
```

**Classifiers used in multiple features:**

```typescript
// src/lib/analytics/portfolio/classifiers/sector-classifier.ts
export function classifySector(ticker: string): Sector { /* ... */ }

// Used in:
// - Portfolio analysis
// - Recommendations engine
// - Alert evaluators (sector-based alerts)
// - Tax optimization (sector-aware harvesting)
```

### 5. AI-Friendly Codebase

**Conversation efficiency:**

```text
User: "Fix bug in concentration analysis"

Before (798-line file):
- Claude reads entire file (2400 tokens)
- Searches for relevant section
- High token usage, slow response

After (85-line module):
- Claude reads only concentration-analyzer.ts (250 tokens)
- Immediate understanding
- Fast response, low cost
```

---

## Creating New Features

### ✅ DO: Start Modular

**When creating new feature, structure from the start:**

```typescript
// ✅ CORRECT: Modular structure
src/lib/my-new-feature/
├── types.ts                    # Domain types
├── my-feature-service.ts       # Orchestrator
├── calculators/
│   ├── calculator-a.ts         # Focused logic
│   └── calculator-b.ts         # Focused logic
├── utils/
│   └── helper.ts               # Helpers
└── index.ts                    # Public API

// Usage
import { myFeatureService } from '@/lib/my-new-feature';
```

**Orchestrator pattern:**

```typescript
// src/lib/my-new-feature/my-feature-service.ts (120 lines)
import { calculateA } from './calculators/calculator-a';
import { calculateB } from './calculators/calculator-b';
import { formatResult } from './utils/helper';

export function myFeatureService(input: Input): Output {
  // Orchestrate: delegate to focused modules
  const resultA = calculateA(input);
  const resultB = calculateB(input);

  return formatResult({ resultA, resultB });
}
```

### ❌ DON'T: Create Monoliths

```typescript
// ❌ WRONG: Monolithic file
src/lib/my-new-feature.ts       // 600+ lines - BAD!

// All logic in one file:
export function myFeatureService(input: Input): Output {
  // Calculator A logic (200 lines)
  // Calculator B logic (200 lines)
  // Formatting logic (100 lines)
  // Validation logic (100 lines)
  // ... total 600+ lines
}
```

### Pattern Checklist

When creating new feature:

- [ ] Create directory structure first (`mkdir src/lib/my-feature`)
- [ ] Define types in `types.ts`
- [ ] Create orchestrator file (max 150 lines)
- [ ] Split logic into focused modules (max 100 lines each)
- [ ] Extract reusable utilities to `src/lib/[utility-name]`
- [ ] Create `index.ts` for public API
- [ ] Write unit tests for each module
- [ ] Update feature documentation in `docs/FEATURES/`

---

## Refactoring Checklist

### When to Refactor

**Triggers:**

- File exceeds size limits (150 lines for service, 100 for utility)
- Multiple responsibilities in one file
- Difficult to write unit tests
- Copy-paste between files (extract to shared utility)
- Hard to navigate/understand file

### Step-by-Step Process

#### 1. Analyze Current Structure

```bash
# Check file size
wc -l src/lib/my-feature.ts
# Example output: 650 src/lib/my-feature.ts

# Identify logical sections
# - What are the main responsibilities?
# - Which functions are related?
# - What can be extracted as utilities?
```

#### 2. Create Module Structure

```bash
mkdir -p src/lib/my-feature/{calculators,utils}
touch src/lib/my-feature/{types.ts,index.ts}
```

#### 3. Extract Types First

```typescript
// src/lib/my-feature/types.ts
export interface Input { /* ... */ }
export interface Output { /* ... */ }
export interface CalculationResult { /* ... */ }
```

#### 4. Split Logic into Modules

**Identify logical groups:**

```typescript
// Original monolith (650 lines)
function myFeatureService(input) {
  // Section 1: Validation (50 lines) → utils/validator.ts
  // Section 2: Calculator A (150 lines) → calculators/calculator-a.ts
  // Section 3: Calculator B (150 lines) → calculators/calculator-b.ts
  // Section 4: Calculator C (150 lines) → calculators/calculator-c.ts
  // Section 5: Formatting (100 lines) → utils/formatter.ts
  // Section 6: Orchestration (50 lines) → my-feature-service.ts
}
```

**Create focused modules:**

```typescript
// src/lib/my-feature/calculators/calculator-a.ts (100 lines)
export function calculateA(input: Input): ResultA {
  // Only calculator A logic
}

// src/lib/my-feature/calculators/calculator-b.ts (100 lines)
export function calculateB(input: Input): ResultB {
  // Only calculator B logic
}

// src/lib/my-feature/utils/validator.ts (40 lines)
export function validateInput(input: Input): ValidationResult {
  // Only validation logic
}

// src/lib/my-feature/my-feature-service.ts (120 lines)
import { calculateA } from './calculators/calculator-a';
import { calculateB } from './calculators/calculator-b';
import { validateInput } from './utils/validator';

export function myFeatureService(input: Input): Output {
  // Orchestrate: validate, calculate, format
  const validation = validateInput(input);
  if (!validation.valid) throw new Error(validation.error);

  const resultA = calculateA(input);
  const resultB = calculateB(input);

  return { resultA, resultB };
}
```

#### 5. Create Public API

```typescript
// src/lib/my-feature/index.ts
export { myFeatureService } from './my-feature-service';
export type { Input, Output } from './types';

// Internal modules NOT exported (implementation details)
// - calculators/* (private)
// - utils/* (private)
```

#### 6. Update Imports

```typescript
// Before refactoring
import { myFeatureService } from '@/lib/my-feature';

// After refactoring (same import!)
import { myFeatureService } from '@/lib/my-feature';

// Public API unchanged - zero breaking changes
```

#### 7. Write Tests

```typescript
// Before: Hard to test monolith
describe('myFeatureService', () => {
  it('should work', () => {
    // Test everything at once - 200+ line test
  });
});

// After: Easy to test modules
describe('calculateA', () => {
  it('calculates result A correctly', () => {
    // Test only calculator A - 20 line test
  });
});

describe('calculateB', () => {
  it('calculates result B correctly', () => {
    // Test only calculator B - 20 line test
  });
});

describe('myFeatureService', () => {
  it('orchestrates calculators', () => {
    // Test orchestration only - mock calculators
  });
});
```

#### 8. Delete Original File

```bash
# After all tests pass
rm src/lib/my-feature.ts

# Keep only modular structure
ls src/lib/my-feature/
# types.ts
# my-feature-service.ts
# calculators/
# utils/
# index.ts
```

---

## Code Review Standards

### File Size Check

**Automated check (pre-commit hook):**

```bash
#!/bin/bash
# .git/hooks/pre-commit

# Check file sizes
for file in $(git diff --cached --name-only | grep '\.ts$'); do
  if [ -f "$file" ]; then
    lines=$(wc -l < "$file")

    # Service/store files: max 150 lines
    if [[ "$file" =~ (service|store)\.ts$ ]] && [ "$lines" -gt 150 ]; then
      echo "❌ $file exceeds 150 lines ($lines lines)"
      echo "   Split into focused modules"
      exit 1
    fi

    # Utility files: max 100 lines
    if [[ "$file" =~ utils/ ]] && [ "$lines" -gt 100 ]; then
      echo "❌ $file exceeds 100 lines ($lines lines)"
      echo "   Split into smaller utilities"
      exit 1
    fi

    # Data files: max 200 lines (exception)
    if [[ "$file" =~ data/ ]] && [ "$lines" -gt 200 ]; then
      echo "⚠️  $file exceeds 200 lines ($lines lines)"
      echo "   Consider splitting if not purely data"
    fi
  fi
done

echo "✅ All files within size limits"
```

### Review Checklist

**For new features:**

- [ ] Each file has single responsibility
- [ ] File sizes within limits (150/100/200 lines)
- [ ] Reusable utilities extracted to `src/lib/[utility]`
- [ ] Public API exported via `index.ts`
- [ ] Unit tests for each module
- [ ] Feature documentation updated

**For refactoring:**

- [ ] Original functionality preserved (no breaking changes)
- [ ] Public API unchanged
- [ ] All tests pass
- [ ] New modules follow size limits
- [ ] Imports updated across codebase

**For code quality:**

- [ ] TypeScript strict mode compliance
- [ ] No `any` types (use `unknown` or specific types)
- [ ] Proper error handling
- [ ] JSDoc comments for public functions

---

## Real-World Examples

### Example 1: Adding New Recommendation Type

**Scenario:** Add "currency risk" recommendations.

**Before (monolith):**

```typescript
// src/lib/recommendations.ts (798 lines)
export function generateRecommendations(portfolio) {
  // ... 700 lines of existing recommendations

  // Add new logic here (risky - might break existing)
  const currencyRisk = /* 100 lines of new logic */;
  recommendations.push(...currencyRisk);

  // ... more existing code
}
```

**After (modular):**

```typescript
// 1. Create new generator (zero risk to existing code)
// src/lib/recommendations/generators/currency-gen.ts (95 lines)
export function generateCurrencyRecommendations(
  positions: EnrichedPosition[]
): Recommendation[] {
  // Currency risk analysis logic
  const exposure = calculateCurrencyExposure(positions);

  if (exposure.usd > 0.4) {
    return [{
      type: 'currency_diversification',
      priority: 'high',
      action: 'Reduce USD exposure',
      impact: 'medium',
    }];
  }

  return [];
}

// 2. Add to orchestrator (1 line change)
// src/lib/recommendations/recommendation-engine.ts
import { generateCurrencyRecommendations } from './generators/currency-gen';

export function generateRecommendations(portfolio) {
  return [
    ...generateDiversificationRecommendations(portfolio),
    ...generateRebalancingRecommendations(portfolio),
    ...generateCurrencyRecommendations(portfolio), // ← New line
  ];
}

// 3. Write isolated test
// src/lib/recommendations/generators/currency-gen.test.ts
describe('generateCurrencyRecommendations', () => {
  it('suggests diversification when USD > 40%', () => {
    const positions = [
      { ticker: 'AAPL', currency: 'USD', value: 5000, total: 10000 },
      { ticker: 'SBER', currency: 'RUB', value: 5000, total: 10000 },
    ];

    const recs = generateCurrencyRecommendations(positions);

    expect(recs).toHaveLength(1);
    expect(recs[0].type).toBe('currency_diversification');
  });
});
```

**Benefits:**
- Zero risk to existing recommendations
- Easy to test in isolation
- Clear code organization

### Example 2: Reusing HTTP Utilities

**Scenario:** New store needs to fetch data with retry logic.

**Before (copy-paste):**

```typescript
// src/stores/my-new-store.ts
// Copy-paste retry logic from analytics store
async function loadData() {
  let retries = 0;
  while (retries < 3) {
    try {
      const response = await fetch('/api/data');
      return await response.json();
    } catch (error) {
      retries++;
      await new Promise(r => setTimeout(r, 1000 * retries));
    }
  }
  throw new Error('Failed after 3 retries');
}
```

**After (reuse utility):**

```typescript
// src/stores/my-new-store.ts
import { fetchWithRetry } from '@/lib/http';

async function loadData() {
  // Reuse tested, reliable HTTP utility
  const response = await fetchWithRetry('/api/data', {}, 3);
  return await response.json();
}
```

**Benefits:**
- No code duplication
- Bug fixes in `fetchWithRetry` benefit all stores
- Consistent error handling across app

### Example 3: Extracting Shared Classifier

**Scenario:** Multiple features need sector classification.

**Before (duplicated logic):**

```typescript
// src/lib/recommendations/analyzers/sector-analyzer.ts
function classifySector(ticker: string): string {
  if (['SBER', 'VTB'].includes(ticker)) return 'Financials';
  if (['GAZP', 'LKOH'].includes(ticker)) return 'Energy';
  return 'Other';
}

// src/lib/alerts/engine/evaluators/conditions.ts
function classifySector(ticker: string): string {
  if (['SBER', 'VTB'].includes(ticker)) return 'Financials';
  if (['GAZP', 'LKOH'].includes(ticker)) return 'Energy';
  return 'Other';
}

// ... duplicated in 3+ more files
```

**After (shared classifier):**

```typescript
// src/lib/analytics/portfolio/classifiers/sector-classifier.ts (68 lines)
export function classifySector(ticker: string): Sector {
  // Single source of truth for sector classification
  const sectorMap = SECTOR_MAP[ticker];
  return sectorMap?.sector ?? 'Other';
}

// Used in:
// - src/lib/recommendations/analyzers/sector-analyzer.ts
// - src/lib/alerts/engine/evaluators/conditions.ts
// - src/lib/tax/harvesting/sector-matcher.ts
// - src/lib/analytics/portfolio/factor-analyzer.ts

import { classifySector } from '@/lib/analytics/portfolio/classifiers/sector-classifier';
```

**Benefits:**
- Single source of truth
- Update sector mapping in ONE place
- Consistent classification across features

---

## Summary

### Key Takeaways

1. **Every file has ONE purpose** - Single Responsibility Principle
2. **Strict size limits** - 150/100/200 lines max
3. **Orchestrator pattern** - Main file delegates to modules
4. **Extract utilities** - Reuse across features (`src/lib/http`, classifiers)
5. **Public API** - Export via `index.ts`, hide implementation details
6. **Test in isolation** - Each module unit-testable independently

### When in Doubt

**Ask yourself:**

- Can this file be split into focused modules? → **Split it**
- Is this logic duplicated elsewhere? → **Extract to utility**
- Would adding a feature modify existing code? → **Create new module instead**
- Is this file hard to test? → **Split into testable modules**
- Does Claude Code struggle with this file? → **Too large, split it**

### Resources

- [CLAUDE.md](../CLAUDE.md) - Critical patterns and project structure
- [docs/FEATURES/](../FEATURES/) - Feature-specific documentation
- [docs/PORTFOLIO_INTEGRATION.md](../PORTFOLIO_INTEGRATION.md) - Portfolio integration details

---

**Last Updated:** November 2025
**Maintainer:** Aleksandr Spitsin
