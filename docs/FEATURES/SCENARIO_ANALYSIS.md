# Scenario Analysis (What-If Analysis)

## Обзор

Модуль анализа сценариев позволяет пользователю симулировать изменения портфеля при различных рыночных условиях или гипотетических действиях.

**Возможности:**
- Симуляция исторических событий (COVID-19 Crash, Tech Boom, Market Corrections)
- Создание кастомных сценариев (изменение цен, количества, добавление/удаление позиций)
- Сравнение нескольких сценариев
- Визуализация влияния на стоимость, диверсификацию, секторное распределение
- Сохранение и повторное использование сценариев

## Архитектура

### Core Library (`src/lib/scenario/`)

**types.ts** (~150 lines)
- `ScenarioChange` - изменение для применения (price change, quantity change, add/remove position, market event)
- `ScenarioSnapshot` - снимок портфеля (стоимость, позиции, веса секторов/географии)
- `ScenarioResult` - результат применения сценария (base vs scenario, дельты метрик)
- `HistoricalScenario` - пресет исторического события

**whatif-engine.ts** (~150 lines)
- `createSnapshot()` - создать снимок текущего портфеля
- `applyScenario()` - применить изменения к портфелю и рассчитать результат
- `compareScenarios()` - сравнить несколько результатов (best/worst case, value range)
- Внутренние функции: `applyPriceChange()`, `applyQuantityChange()`, `applyAddPosition()`, `applyRemovePosition()`, `applyMarketEvent()`

**backtest-utils.ts** (~130 lines)
- `loadPresets()` - загрузить исторические пресеты (COVID-19 Crash, 2020 Recovery, Tech Correction 2022, AI Rally 2023)
- `replayHistoricalScenario()` - применить историческое событие к текущему портфелю
- `simulateMarketMove()` - симулировать кастомное рыночное движение
- `simulateSectorMove()` - симулировать движение всего сектора

### Zustand Store (`src/stores/scenarios/`)

**scenarios-store.ts** (~80 lines)
- State: `scenarios`, `selectedScenarioId`, `isLoading`, `error`
- Actions:
  - `createScenario()` - создать новый сценарий
  - `updateScenario()` - обновить существующий
  - `deleteScenario()` - удалить сценарий
  - `duplicateScenario()` - дублировать сценарий
  - `selectScenario()` - выбрать активный сценарий
  - `cacheResult()` - кешировать результат расчета
  - `loadFromStorage()` / `saveToStorage()` - персистентность в localStorage

### UI Components (`src/components/features/ScenarioAnalysis/`)

**ScenarioDesigner.tsx** (~140 lines)
Multi-step wizard для создания сценариев:
- Step 1: Select Base Portfolio (использует текущий портфель)
- Step 2: Add Changes (пресеты + кастомные изменения)
- Step 3: Review & Save

Функции:
- Выбор исторических пресетов из dropdown
- Добавление кастомных изменений (price change, quantity change, add position)
- Список применяемых изменений с возможностью удаления
- Сохранение сценария в store

**WhatIfImpactPanel.tsx** (~120 lines)
Визуализация влияния выбранного сценария:
- Value Impact (Base → Scenario → Change %)
- Diversification Impact (Herfindahl Index before/after)
- Sector Allocation Changes (bar chart)
- Geography Allocation Changes (bar chart)
- Applied Changes Summary

## Usage Example

### 1. Создание сценария через UI

```typescript
import { ScenarioDesigner, WhatIfImpactPanel } from '@/components/features/ScenarioAnalysis';

export function ScenarioPage() {
  return (
    <div className="grid grid-cols-2 gap-6">
      <ScenarioDesigner />
      <WhatIfImpactPanel />
    </div>
  );
}
```

### 2. Программное создание сценария

```typescript
import { useScenarioStore } from '@/stores/scenarios';
import { applyScenario } from '@/lib/scenario';

const { createScenario } = useScenarioStore();
const { positions, cashBalance } = usePortfolioStore();

// Симуляция падения S&P 500 на 20%
const changes: ScenarioChange[] = [
  {
    id: 'spx-drop',
    type: 'price_change',
    label: 'S&P 500 -20%',
    ticker: 'SPX',
    priceChangePercent: -20,
  },
];

const result = applyScenario(positions, changes, cashBalance);

const scenario = createScenario({
  name: 'Market Crash Simulation',
  description: 'What if S&P 500 drops 20%?',
  changes,
});
```

### 3. Использование исторических пресетов

```typescript
import { loadPresets, replayHistoricalScenario } from '@/lib/scenario';

const presets = loadPresets();
const covidCrash = presets.find(p => p.id === 'covid-crash-2020')!;

const result = replayHistoricalScenario(positions, covidCrash, cashBalance);

console.log('Portfolio value after COVID crash:', result.scenarioSnapshot.totalValue);
console.log('Value change:', result.valueChangePercent, '%');
```

### 4. Сравнение нескольких сценариев

```typescript
import { compareScenarios } from '@/lib/scenario';

const results = [
  applyScenario(positions, crashChanges, cashBalance),
  applyScenario(positions, recoveryChanges, cashBalance),
  applyScenario(positions, flatChanges, cashBalance),
];

const comparison = compareScenarios(results);

console.log('Best case:', comparison.bestCase.value);
console.log('Worst case:', comparison.worstCase.value);
console.log('Value spread:', comparison.valueRange.spread);
```

## Configuration

### Исторические пресеты

Определены в [backtest-utils.ts](../../src/lib/scenario/backtest-utils.ts):

1. **COVID-19 Crash (Feb-Mar 2020)** - падение рынка на 25-34%
2. **2020 Recovery (Mar-Aug 2020)** - восстановление +35-52%
3. **Tech Correction (Jan-Oct 2022)** - коррекция на 25-45% (война, санкции)
4. **AI Rally (Jan-Nov 2023)** - рост на фоне AI-хайпа +24-42%

Каждый пресет содержит:
- `marketMultipliers` - коэффициенты изменения цен для конкретных тикеров
- `spx500Change` / `moexChange` - изменение индексов для справки
- `tags` - теги для фильтрации

### Добавление нового пресета

```typescript
// В backtest-utils.ts
const newPreset: HistoricalScenario = {
  id: 'my-event',
  name: 'My Historical Event',
  description: 'Description',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-03-31'),
  marketMultipliers: {
    'AAPL': 1.15, // +15%
    'MSFT': 1.20, // +20%
    'GAZP': 0.90, // -10%
  },
  spx500Change: 10,
  moexChange: 5,
  tags: ['rally', 'tech'],
};
```

## API Routes

Не требуется - все вычисления выполняются на клиенте.

## Integrations

### С другими модулами

- **Portfolio Store** (`usePortfolioStore`) - получение текущих позиций
- **Analytics** (`@/lib/analytics/portfolio`) - для расчета Herfindahl Index, sector weights
- **Recommendations** (`@/lib/recommendations`) - будущая интеграция для goal probability impact
- **Goals** (`useGoalStore`) - будущая интеграция для вероятности достижения целей

## Known Issues

1. **Ticker Mapping** - пресеты используют упрощенные тикеры (AAPL, SBER), нужно мапить на FIGI для точного соответствия
2. **Historical Data** - нет реальных исторических цен, используются приблизительные коэффициенты
3. **Goal Probabilities** - пока не рассчитываются (требуется интеграция с Goal Analyzer)
4. **Volatility Change** - метрика определена в типах, но не рассчитывается (требуется исторические данные)

## Future Enhancements

1. **Batch Comparison** - UI для сравнения 3-5 сценариев одновременно
2. **PDF Export** - экспорт результатов сценария в PDF
3. **Monte Carlo** - добавить стохастические сценарии (тысячи итераций)
4. **Goal Impact** - показать вероятность достижения целей в каждом сценарии
5. **Historical Price API** - интеграция с реальными историческими данными (Yahoo Finance, Tinkoff API)
6. **Scenario Templates** - библиотека готовых шаблонов (bull market, bear market, sector rotation)

## Performance Notes

- Все расчеты выполняются на клиенте (нет серверных запросов)
- Результаты кешируются в store для быстрого переключения
- Максимальная сложность: O(n * m), где n = позиции, m = изменения
- Для портфеля из 100 позиций расчет занимает < 10ms

## Testing Checklist

- [ ] Создание сценария через UI
- [ ] Применение исторического пресета
- [ ] Добавление кастомных изменений
- [ ] Удаление изменений
- [ ] Сохранение сценария
- [ ] Выбор сценария из списка
- [ ] Визуализация результатов
- [ ] Сравнение нескольких сценариев
- [ ] Дублирование сценария
- [ ] Удаление сценария
- [ ] Персистентность в localStorage

## References

- Спецификация: Phase 4 - What-If Scenario Analysis
- Related docs: [GOAL_TRACKING_FEATURE.md](./GOAL_TRACKING_FEATURE.md), [PORTFOLIO_INTEGRATION.md](../PORTFOLIO_INTEGRATION.md)
- UI pattern: Multi-step wizard с state management через Zustand
