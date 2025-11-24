# Portfolio Rebalancing Feature

> **Language Policy:** This document uses mixed Russian (user-facing descriptions) and English (technical terms, code) to serve both local users and international developers. All code, types, and function names remain in English per industry standards.

## Обзор

**Portfolio Rebalancing** — комплексный модуль для ребалансировки инвестиционного портфеля. Помогает пользователям определить отклонения от целевой аллокации, сгенерировать конкретные торговые ордера (buy/sell), и создать план ребалансировки с оценкой транзакционных издержек и налогового воздействия.

**Ключевые возможности:**
- ✅ Определение целевой аллокации по секторам, географии и типу активов
- ✅ Расчет текущих отклонений от целевой аллокации
- ✅ Генерация конкретных торговых ордеров (тикер, количество, направление)
- ✅ Оценка транзакционных издержек и налогового воздействия
- ✅ Экспорт плана ребалансировки в JSON
- ✅ Поддержка стратегий: тактическая, стратегическая, по порогу (threshold-based)
- ✅ Пресеты: консервативный, умеренный, агрессивный

## Архитектура

### Modular Architecture

Модуль реализован с использованием модульной архитектуры (max 150 lines per file):

```
src/lib/rebalancing/
├── types.ts                    # Domain types, preset allocations (200 lines)
├── deviation-analyzer.ts       # Calculate allocation deviations (140 lines)
├── trade-generator.ts          # Generate buy/sell orders (150 lines)
├── cost-estimator.ts           # Transaction costs & tax estimates (120 lines)
└── index.ts                    # Public API
```

### Components

```
src/components/features/Rebalancing/
├── TargetAllocationSelector.tsx  # Set target allocation wizard (130 lines)
├── DeviationAnalyzer.tsx         # Show current deviations (120 lines)
├── TradeOrderPreview.tsx         # Review trade orders (140 lines)
└── index.ts
```

### Store

```
src/stores/rebalancing/
├── types.ts                    # Store state & actions types
├── rebalancing-store.ts        # Main Zustand store (80 lines)
└── index.ts
```

## Технические детали

### 1. Target Allocation Types

```typescript
// Domain types
export interface TargetAllocation {
  sectors: Partial<SectorAllocation>;
  geography: Partial<GeographyAllocation>;
  assetTypes: Partial<AssetTypeAllocation>;
  lastUpdated: Date;
}

export enum RebalancingStrategy {
  TACTICAL = 'TACTICAL',        // Краткосрочная корректировка
  STRATEGIC = 'STRATEGIC',      // Долгосрочное поддержание
  THRESHOLD_BASED = 'THRESHOLD_BASED', // По порогу отклонения >5%
}

// Preset allocations
export const PRESET_ALLOCATIONS = {
  conservative: { /* 40/50/10 stocks/bonds/etf */ },
  moderate: { /* 60/30/10 */ },
  aggressive: { /* 85/10/5 */ },
};
```

### 2. Deviation Analysis

**File:** `src/lib/rebalancing/deviation-analyzer.ts`

```typescript
export function calculateDeviations(
  portfolio: Portfolio,
  targets: TargetAllocation
): DeviationAnalysis {
  // 1. Calculate current allocation weights
  // 2. Compare with target allocation
  // 3. Calculate deviation % and amount
  // 4. Assign priority (1=high >5%, 2=medium 2-5%, 3=low <2%)
  // 5. Generate recommendations (BUY/SELL/HOLD)
}

export function prioritizeRebalancing(
  deviations: CategoryDeviation[]
): CategoryDeviation[] {
  // Sort by priority and absolute deviation
}
```

**Output example:**
```json
{
  "category": "technology",
  "dimension": "sector",
  "currentWeight": 0.65,
  "targetWeight": 0.35,
  "deviationPercent": 0.30,
  "deviationAmount": 300000,
  "priority": 1,
  "recommendation": "SELL"
}
```

### 3. Trade Order Generation

**File:** `src/lib/rebalancing/trade-generator.ts`

```typescript
export function generateTradeOrders(
  portfolio: Portfolio,
  targets: TargetAllocation,
  options?: {
    maxCost?: number;
    minTradeSize?: number;
  }
): TradeOrder[] {
  // Phase 1: Generate SELL orders for overweight positions
  // Phase 2: Generate BUY orders for underweight positions
  // Apply cost constraints
}

export function optimizeTradeSequence(
  orders: TradeOrder[]
): TradeOrder[] {
  // 1. Sell orders first (generate cash)
  // 2. Sort by priority
  // 3. Sort by estimated impact (larger orders first)
}
```

**Trade Order structure:**
```typescript
interface TradeOrder {
  id: string;
  ticker: string;
  figi?: string;
  name: string;
  quantity: number;
  direction: 'BUY' | 'SELL';
  estimatedPrice: number;
  estimatedTotal: number;
  reason: string; // "Reduce sector overweight: technology"
  category: string;
  priority: number;
  liquidityScore?: number;
}
```

### 4. Cost & Tax Estimation

**File:** `src/lib/rebalancing/cost-estimator.ts`

```typescript
// Transaction costs
export function estimateTransactionCosts(
  orders: TradeOrder[]
): CostBreakdown {
  // 1. Tinkoff commission: 0.03% (min 1 RUB)
  // 2. Bid-ask spread: ~0.1%
  // 3. Market impact for large orders (>1M RUB)
}

// Tax impact (Russia NDFL 13%)
export function estimateTaxImpact(
  orders: TradeOrder[],
  positions: Position[]
): TaxEstimate {
  // 1. Short-term gains (<3 years): taxed at 13%
  // 2. Long-term gains (>3 years): tax-free
  // 3. Unrealized losses: can offset gains
  // 4. Tax-loss harvesting opportunities
}
```

**Cost Breakdown structure:**
```typescript
interface CostBreakdown {
  commission: number;       // Broker fees
  spread: number;           // Bid-ask spread
  marketImpact: number;     // Price impact of large orders
  totalCost: number;
  costAsPercent: number;    // Of total order value
  itemized: Array<{
    ticker: string;
    commission: number;
    spread: number;
    marketImpact: number;
  }>;
}
```

**Tax Estimate structure:**
```typescript
interface TaxEstimate {
  shortTermGains: number;   // Held <3 years (taxable)
  longTermGains: number;    // Held >3 years (tax-free)
  unrealizedLosses: number; // Can offset gains
  estimatedTaxLiability: number; // 13% NDFL
  taxLossHarvestingOpportunities: string[]; // Tickers with losses
}
```

## Store: useRebalancingStore

**Location:** `src/stores/rebalancing/`

### State
```typescript
interface RebalancingState {
  targetAllocation: TargetAllocation | null;
  strategy: RebalancingStrategy;
  thresholdPercent: number; // For threshold-based strategy
  currentDeviations: DeviationAnalysis | null;
  proposedOrders: TradeOrder[];
  costEstimate: CostBreakdown | null;
  taxEstimate: TaxEstimate | null;
  currentPlan: RebalancingPlan | null;
  isAnalyzing: boolean;
  error: string | null;
}
```

### Actions
```typescript
interface RebalancingActions {
  // Target allocation
  setTargetAllocation: (allocation: TargetAllocation) => void;
  setStrategy: (strategy: RebalancingStrategy) => void;
  setThreshold: (percent: number) => void;
  loadPreset: (preset: 'conservative' | 'moderate' | 'aggressive') => void;

  // Analysis
  analyzeDeviations: () => Promise<void>;
  generateTrades: (maxCost?: number) => Promise<void>;
  estimateCosts: () => Promise<void>;
  estimateTaxes: () => Promise<void>;

  // Plan management
  createRebalancingPlan: () => void;
  acceptPlan: () => void;
  resetPlan: () => void;

  // Persistence
  saveToPersistence: () => void;
  loadFromPersistence: () => void;
  reset: () => void;
}
```

### Persistence

Target allocation сохраняется в `localStorage` через Zustand `persist` middleware:

```typescript
// Persisted state
{
  targetAllocation: TargetAllocation | null,
  strategy: RebalancingStrategy,
  thresholdPercent: number
}
```

## Использование

### 1. Set Target Allocation

```typescript
'use client';

import { TargetAllocationSelector } from '@/components/features/Rebalancing';
import { useRebalancingStore } from '@/stores/rebalancing';

export default function RebalancingPage() {
  const { targetAllocation, loadPreset } = useRebalancingStore();

  return (
    <div>
      <h1>Ребалансировка портфеля</h1>

      {/* Load preset or custom */}
      <TargetAllocationSelector />

      {/* Or programmatically */}
      <button onClick={() => loadPreset('moderate')}>
        Загрузить умеренный профиль
      </button>
    </div>
  );
}
```

### 2. Analyze Deviations

```typescript
import { DeviationAnalyzer } from '@/components/features/Rebalancing';

export default function RebalancingPage() {
  return (
    <div>
      {/* Shows current vs target allocation with deviations */}
      <DeviationAnalyzer />
    </div>
  );
}
```

### 3. Generate & Review Trade Orders

```typescript
import { TradeOrderPreview } from '@/components/features/Rebalancing';
import { useRebalancingStore } from '@/stores/rebalancing';

export default function RebalancingPage() {
  const { generateTrades, proposedOrders } = useRebalancingStore();

  const handleGenerate = async () => {
    await generateTrades({ maxCost: 10000 }); // Max 10K RUB costs
  };

  return (
    <div>
      <button onClick={handleGenerate}>
        Сгенерировать торговые ордера
      </button>

      {proposedOrders.length > 0 && <TradeOrderPreview />}
    </div>
  );
}
```

### 4. Programmatic Usage

```typescript
import {
  calculateDeviations,
  generateTradeOrders,
  estimateTransactionCosts,
  estimateTaxImpact,
  PRESET_ALLOCATIONS,
} from '@/lib/rebalancing';

// Example: Analyze deviations
const deviations = calculateDeviations(portfolio, PRESET_ALLOCATIONS.moderate);

// Example: Generate trade orders
const orders = generateTradeOrders(portfolio, PRESET_ALLOCATIONS.moderate, {
  maxCost: 10000,
  minTradeSize: 1000,
});

// Example: Estimate costs
const costs = estimateTransactionCosts(orders);
console.log(`Total cost: ${costs.totalCost} RUB (${costs.costAsPercent}%)`);

// Example: Estimate taxes
const taxes = estimateTaxImpact(orders, portfolio.positions);
console.log(`Tax liability: ${taxes.estimatedTaxLiability} RUB`);
```

## Рабочий процесс пользователя

### Step 1: Выбор стратегии

Пользователь выбирает стратегию ребалансировки:

- **Тактическая** — краткосрочная корректировка на основе рыночных условий
- **Стратегическая** — долгосрочное поддержание целевой аллокации
- **По порогу** — ребалансировка только при отклонении >5%

### Step 2: Установка целевой аллокации

Пользователь выбирает:

**Вариант A: Preset**
- Консервативный (40/50/10 stocks/bonds/etf)
- Умеренный (60/30/10)
- Агрессивный (85/10/5)

**Вариант B: Custom**
- Вручную задает % по секторам, географии, типу активов
- Проверка: сумма должна быть 100%

### Step 3: Анализ отклонений

Система автоматически:
1. Рассчитывает текущую аллокацию портфеля
2. Сравнивает с целевой
3. Вычисляет отклонения в % и рублях
4. Присваивает приоритет (высокий/средний/низкий)
5. Генерирует рекомендации (ПРОДАТЬ/КУПИТЬ/ДЕРЖАТЬ)

**UI отображает:**
- Статус: "Требуется ребалансировка" или "В пределах нормы"
- Количество критических отклонений (>5%)
- Ожидаемое улучшение: "Риск -8%, Диверсификация +5 баллов"
- Таблица отклонений с цветовой индикацией

### Step 4: Генерация торговых ордеров

Система генерирует конкретные ордера:

**Фаза 1: SELL ордера**
- Для перевешенных секторов (overweight)
- Приоритет: самые ликвидные позиции, затем по размеру

**Фаза 2: BUY ордера**
- Для недовешенных секторов (underweight)
- Использует cash от продаж
- Приоритет: DCA в существующие позиции

**Оптимизация:**
- Продажи первыми (генерируют cash)
- Затем покупки
- Соблюдение минимального размера сделки (1000 RUB)

### Step 5: Оценка издержек и налогов

**Транзакционные издержки:**
- Комиссия Tinkoff: 0.03% (min 1 RUB)
- Спред (bid-ask): ~0.1%
- Рыночное воздействие: для ордеров >1M RUB

**Налоговое воздействие:**
- Краткосрочные прибыли (<3 года): 13% NDFL
- Долгосрочные прибыли (>3 года): tax-free
- Убытки: могут компенсировать прибыль
- Tax-loss harvesting возможности

### Step 6: Утверждение плана

**UI показывает:**
- Всего ордеров: X (Y продать, Z купить)
- Объем сделок: XXX,XXX RUB
- Транзакционные издержки: X,XXX RUB (0.XX%)
- Налоговое воздействие: X,XXX RUB

**Предупреждения:**
- ⚠️ Высокие налоги: >10K RUB
- ⚠️ Высокие издержки: >1% от объема
- ℹ️ Рекомендация: tax-loss harvesting для тикеров [...]

**Действия:**
- ✓ Утвердить план ребалансировки
- Экспорт в JSON
- Отменить

### Step 7: Execution (Manual)

⚠️ **ВАЖНО:** Приложение НЕ выполняет торговые операции автоматически.

Пользователь самостоятельно:
1. Открывает брокерский терминал (Tinkoff Investments)
2. Размещает ордера вручную на основе плана
3. Отмечает выполненные ордера в приложении (future feature)

## Интеграция с другими модулями

### 1. Analytics Module

```typescript
import { useAnalyticsStore } from '@/stores/analytics';
import { calculateDeviations } from '@/lib/rebalancing';

const { portfolio } = useAnalyticsStore();
const deviations = calculateDeviations(portfolio, targetAllocation);
```

### 2. Recommendations Module

```typescript
import { checkGoalAlignment } from '@/lib/recommendations';

// Check if rebalancing aligns with investment goals
const isAligned = checkGoalAlignment(proposedOrders, investmentGoals);
```

### 3. Tax Module

```typescript
import { calculateTaxLiability } from '@/lib/tax-utils';

// Deep tax analysis
const detailedTaxes = calculateTaxLiability(proposedOrders);
```

### 4. Classifiers

Переиспользует классификаторы из portfolio analysis:

```typescript
import { classifySector, classifyGeography } from '@/lib/analytics/portfolio/classifiers';

// Used internally in deviation-analyzer.ts
const sector = classifySector(position.ticker);
const geo = classifyGeography(position.ticker);
```

## Configuration

### Threshold-based Strategy

```typescript
const { setStrategy, setThreshold } = useRebalancingStore();

// Set threshold-based strategy with 3% threshold
setStrategy(RebalancingStrategy.THRESHOLD_BASED);
setThreshold(3);

// Now analyzeDeviations() will only flag deviations >3%
```

### Max Cost Constraint

```typescript
// Generate trades with max 5K RUB cost limit
await generateTrades({ maxCost: 5000 });
```

### Min Trade Size

```typescript
// Only generate trades >2K RUB
const orders = generateTradeOrders(portfolio, targets, {
  minTradeSize: 2000,
});
```

## Известные ограничения

### 1. No Live Trade Execution

Приложение НЕ выполняет торговые операции. Пользователь должен вручную разместить ордера в брокерском терминале.

**Future:** Интеграция с Tinkoff Invest API для live order placement (требует расширенных прав доступа).

### 2. Static Price Estimates

Используются текущие цены позиций (`position.averagePrice`). Реальные рыночные цены могут отличаться.

**Future:** Fetch live quotes from Tinkoff API перед генерацией ордеров.

### 3. Simplified Liquidity Model

Ликвидность оценивается по размеру позиции (heuristic). В реальности нужны данные торгового объема.

**Future:** Integrate with market data API для точной оценки ликвидности.

### 4. No Partial Position Sales

Trade generator продает/покупает целые лоты. Для некоторых инструментов (облигации) может быть нужна частичная продажа.

**Future:** Support fractional shares/bonds.

### 5. Tax Calculation Simplified

Налоговый расчет использует упрощенную модель (13% NDFL). Не учитывает:
- Инвестиционные налоговые вычеты (ИИС)
- Льготы на долгосрочное владение (ЛДВ)
- Брокерские комиссии в расходах

**Future:** Integrate with tax module для полного расчета.

## Тестирование

### Unit Tests (Future)

```typescript
// tests/lib/rebalancing/deviation-analyzer.test.ts
import { calculateDeviations } from '@/lib/rebalancing';

test('calculates sector deviations correctly', () => {
  const result = calculateDeviations(mockPortfolio, targetAllocation);
  expect(result.categoryDeviations[0].deviationPercent).toBeCloseTo(0.3);
});
```

### Integration Tests (Future)

```typescript
// tests/stores/rebalancing-store.test.ts
import { useRebalancingStore } from '@/stores/rebalancing';

test('full rebalancing workflow', async () => {
  const store = useRebalancingStore.getState();

  store.loadPreset('moderate');
  await store.analyzeDeviations();
  await store.generateTrades();

  expect(store.proposedOrders.length).toBeGreaterThan(0);
  expect(store.costEstimate).toBeDefined();
});
```

## Performance

### Optimization Strategies

1. **Memoization** — Cache deviation calculations
2. **Lazy Loading** — Load cost/tax estimates only when needed
3. **Batching** — Group trade orders by category
4. **Progressive Enhancement** — Show UI immediately, estimate costs async

### Benchmarks (Target)

- Deviation calculation: <100ms for 50 positions
- Trade generation: <200ms for 20 orders
- Cost estimation: <50ms
- Tax estimation: <100ms

## Future Enhancements

### Phase 1 (Q1 2026)
- ✅ Core rebalancing logic (DONE)
- ✅ Deviation analysis (DONE)
- ✅ Trade order generation (DONE)
- ✅ Cost & tax estimation (DONE)

### Phase 2 (Q2 2026)
- [ ] PDF/Excel export для плана ребалансировки
- [ ] Live quote integration (fetch current prices)
- [ ] Liquidity scoring (volume-based)
- [ ] DCA strategy (dollar-cost averaging)

### Phase 3 (Q3 2026)
- [ ] Automatic rebalancing schedules (monthly, quarterly)
- [ ] Threshold-based alerts ("Deviation >5%, rebalance now?")
- [ ] Rebalancing history & tracking
- [ ] Goal-aligned rebalancing (учет инвестиционных целей)

### Phase 4 (Q4 2026)
- [ ] Live order placement via Tinkoff API (requires user consent)
- [ ] Fractional shares support
- [ ] Tax optimization strategies (tax-loss harvesting automation)
- [ ] Multi-account rebalancing

## Дополнительные ресурсы

### Related Documentation
- [docs/PORTFOLIO_INTEGRATION.md](../PORTFOLIO_INTEGRATION.md) — Portfolio structure
- [docs/FEATURES/TAX_OPTIMIZATION.md](TAX_OPTIMIZATION.md) — Tax calculations
- [docs/FEATURES/SCENARIO_ANALYSIS.md](SCENARIO_ANALYSIS.md) — What-if analysis

### External References
- [Tinkoff Invest API](https://russianinvestments.github.io/investAPI/) — Portfolio data
- [Modular Architecture](../ARCHITECTURE.md) — Project architecture
- [MOEX Data](https://www.moex.com/) — Russian market data

### Academic Papers
- "Portfolio Rebalancing: Theory and Evidence" (Arnott & Lovell, 1993)
- "The Rebalancing Bonus" (Bernstein, 1996)
- "Tax-Loss Harvesting" (Arnott et al., 2001)

---

**Status:** ✅ Core features implemented (modular architecture) — Phases 2-4 are planned for future releases
**Last Updated:** November 2025
**Version:** 1.0.0 (Phase 1 Complete)
**Maintainer:** Aleksandr Spitsin <aleksandrspitsin@example.com>
