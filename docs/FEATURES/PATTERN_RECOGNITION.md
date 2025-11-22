# Trading Pattern Recognition (Распознавание Торговых Паттернов)

## Обзор

Система распознавания торговых паттернов анализирует историю операций пользователя и выявляет поведенческие модели, которые влияют на результаты инвестирования. Система помогает инвесторам осознать свои эмоциональные реакции и улучшить торговую стратегию.

**Фаза разработки:** Phase 5.1 (Behavioral Intelligence)

## Основные возможности

- ✅ Автоматическое распознавание 4 типов паттернов торговли
- ✅ Анализ эмоциональных триггеров
- ✅ Расчёт метрик эффективности по категориям
- ✅ Персонализированные рекомендации
- ✅ Визуализация хронологии паттернов
- ✅ Оценка риск-балла эмоциональной торговли

## Архитектура

### Компоненты

```
src/
├── lib/intelligence/
│   └── pattern-recognition.ts        # Основной сервис анализа
├── types/
│   └── trading-pattern.ts            # Типы и схемы данных
├── stores/
│   └── patternStore.ts               # Zustand store
├── app/api/patterns/
│   └── route.ts                      # API endpoint
└── components/features/Patterns/
    ├── PatternInsights.tsx           # Обзор паттернов
    ├── TradingTimeline.tsx           # Хронология паттернов
    └── EmotionalTriggers.tsx         # Анализ триггеров
```

### Категории паттернов

#### 1. **Panic Sell** (Паническая продажа)
Продажа активов в убыток под влиянием страха.

**Критерии обнаружения:**
- Убыток >10% от покупной цены
- Быстрая продажа после покупки (<7 дней) с убытком >5%

**Пример:**
```
Покупка: SBER @ 250₽
Продажа через 3 дня: SBER @ 220₽ (-12%)
→ Паттерн: Panic Sell (уверенность 80%)
```

#### 2. **FOMO Buy** (Импульсивная покупка)
Покупка актива на эмоциях из-за страха упустить возможность.

**Критерии обнаружения:**
- Множественные покупки одного актива за короткий период (<60 минут)
- Покупка после резкого роста цены
- Импульсивные покупки без стратегии

**Пример:**
```
14:00 - Покупка YNDX @ 3500₽
14:30 - Покупка YNDX @ 3600₽
→ Паттерн: FOMO Buy (уверенность 75%)
```

#### 3. **Strategic** (Стратегическая сделка)
Продуманные сделки в соответствии с планом.

**Критерии обнаружения:**
- Фиксация прибыли >10% с удержанием >7 дней
- Регулярные покупки (DCA стратегия)
- Дисциплинированное исполнение плана

**Пример:**
```
Покупка: GAZP @ 150₽
Продажа через 45 дней: GAZP @ 180₽ (+20%)
→ Паттерн: Strategic (уверенность 85%)
```

#### 4. **Emotional** (Эмоциональная торговля)
Частые сделки без чёткой стратегии.

**Критерии обнаружения:**
- Дневная торговля (удержание <24 часов)
- Высокая частота операций (>5 сделок за неделю с одним активом)
- Реакции на краткосрочные колебания

**Пример:**
```
Понедельник: Покупка, Вторник: Продажа, Среда: Покупка, Четверг: Продажа
→ Паттерн: Emotional (уверенность 70%)
```

## API

### GET `/api/patterns`

Получить анализ торговых паттернов для счёта.

**Query Parameters:**
- `accountId` (required) - ID счёта
- `days` (optional, default: 90) - Период анализа в днях

**Response:**
```typescript
{
  "patterns": TradingPattern[],
  "statistics": PatternStats[],
  "summary": {
    "totalPatterns": number,
    "totalOperations": number,
    "overallProfitLoss": number,
    "mostCommonCategory": string,
    "mostSuccessfulCategory": string,
    "riskScore": number // 0-100
  },
  "recommendations": Recommendation[]
}
```

**Пример:**
```bash
GET /api/patterns?accountId=2000012345&days=90
```

## Zustand Store

### `usePatternStore`

```typescript
import { usePatternStore } from '@/stores/patternStore';

function MyComponent() {
  const loadPatterns = usePatternStore((state) => state.loadPatterns);
  const analysis = usePatternStore((state) => state.analysis);
  const isLoading = usePatternStore((state) => state.isLoading);

  useEffect(() => {
    loadPatterns('accountId', 90);
  }, []);

  return <div>{/* UI */}</div>;
}
```

### Helper Hooks

```typescript
import {
  usePatternStats,
  usePatternSummary,
  usePatternRecommendations,
  useFilteredPatterns,
} from '@/stores/patternStore';

// Получить статистику по категориям
const stats = usePatternStats();

// Получить общую сводку
const summary = usePatternSummary();

// Получить рекомендации
const recommendations = usePatternRecommendations();

// Получить отфильтрованные паттерны
const patterns = useFilteredPatterns();
```

## Компоненты

### PatternInsights

Обзор торговых паттернов с метриками.

```tsx
import { PatternInsights } from '@/components/features/Patterns/PatternInsights';

<PatternInsights />
```

**Функции:**
- Отображение общей статистики (всего паттернов, риск-балл, средний P&L)
- Карточки по категориям с успешностью и метриками
- Интерактивный выбор категории для фильтрации

### TradingTimeline

Хронологическая визуализация паттернов.

```tsx
import { TradingTimeline } from '@/components/features/Patterns/TradingTimeline';

<TradingTimeline />
```

**Функции:**
- Временная шкала всех паттернов
- Цветовая индикация прибыли/убытка
- Детали операций и триггеров
- Индикатор уверенности распознавания

### EmotionalTriggers

Анализ эмоциональных триггеров.

```tsx
import { EmotionalTriggers } from '@/components/features/Patterns/EmotionalTriggers';

<EmotionalTriggers />
```

**Функции:**
- Рекомендации на основе паттернов
- Статистика по типам триггеров
- Шкала серьёзности (low/medium/high)
- Последние триггеры с деталями

## Конфигурация

Настройки для детекции паттернов задаются в [types/trading-pattern.ts](../../src/types/trading-pattern.ts):

```typescript
export const DEFAULT_PATTERN_CONFIG: PatternDetectionConfig = {
  panicSellPriceDropThreshold: 5,        // % падения для panic sell
  panicSellLossThreshold: 10,            // % убытка для panic sell
  fomoBuyPriceRiseThreshold: 5,          // % роста для FOMO buy
  fomoBuyImpulseWindowMinutes: 60,       // Окно для импульсивных покупок
  emotionalFrequencyThreshold: 5,        // Операций за неделю для emotional
  emotionalDayTradingWindowHours: 24,    // Окно для day trading
  strategicTakeProfitThreshold: 10,      // % прибыли для strategic
  strategicDCAIntervalDays: 7,           // Интервал для DCA
  analysisWindowDays: 90,                // Период анализа по умолчанию
};
```

## Алгоритм распознавания

### 1. Получение операций
```typescript
const operations = await fetchOperations(accountId, token, from, to);
```

### 2. Группировка по инструментам
```typescript
const grouped = groupOperationsByInstrument(operations);
// { figi: 'BBG004730N88', operations: [...] }
```

### 3. Создание торговых пар (FIFO)
```typescript
const pairs = matchTradePairs(buys, sells);
// { buyOperation, sellOperation, profitLoss, holdingPeriodDays }
```

### 4. Детекция паттернов
```typescript
for (const pair of pairs) {
  if (isPanicSell(pair)) category = 'panic_sell';
  else if (isFOMOBuy(pair)) category = 'fomo_buy';
  else if (isStrategic(pair)) category = 'strategic';
  else if (isEmotional(pair)) category = 'emotional';
}
```

### 5. Расчёт метрик
```typescript
const metrics = {
  profitLoss: pair.profitLossPercentage,
  timeToComplete: pair.holdingPeriodDays,
  // ...
};
```

### 6. Генерация рекомендаций
```typescript
if (summary.riskScore > 60) {
  recommendations.push({
    category: 'risk',
    message: 'Высокий уровень эмоциональных сделок...',
    severity: 'critical',
  });
}
```

## Метрики и расчёты

### Success Rate (Успешность)
```
successRate = (profitablePatterns / totalPatterns) * 100
```

### Risk Score (Риск-балл)
```
riskScore = ((emotional + panic + fomo) / totalPatterns) * 100
```

Интерпретация:
- **0-30**: Низкий риск (дисциплинированная торговля)
- **31-60**: Средний риск (есть эмоциональные сделки)
- **61-100**: Высокий риск (преобладают эмоции)

### Average P&L
```
avgProfitLoss = Σ(pattern.metrics.profitLoss) / totalPatterns
```

## Интеграция с Tinkoff API

### Метод `fetchOperations`

```typescript
import { fetchOperations } from '@/lib/tinkoff-api';

const operations = await fetchOperations(
  accountId,
  token,
  from.toISOString(),
  to.toISOString(),
  figi // optional
);
```

### Структура Operation

```typescript
{
  id: string,
  currency: string,
  payment: MoneyValue,
  price: MoneyValue,
  state: 'executed' | 'canceled' | 'progress',
  quantity: number,
  figi: string,
  instrumentType: string,
  date: string, // ISO
  type: string, // 'buy', 'sell', etc.
}
```

## Пример использования

```tsx
'use client';

import { useEffect } from 'react';
import { usePortfolioStore } from '@/stores/portfolioStore';
import { usePatternStore } from '@/stores/patternStore';
import { PatternInsights } from '@/components/features/Patterns/PatternInsights';
import { TradingTimeline } from '@/components/features/Patterns/TradingTimeline';
import { EmotionalTriggers } from '@/components/features/Patterns/EmotionalTriggers';

export default function BehaviorPage() {
  const selectedAccountId = usePortfolioStore((s) => s.selectedAccountId);
  const loadPatterns = usePatternStore((s) => s.loadPatterns);

  useEffect(() => {
    if (selectedAccountId) {
      loadPatterns(selectedAccountId, 90);
    }
  }, [selectedAccountId]);

  return (
    <div className="space-y-8">
      <h1>Анализ поведения</h1>

      {/* Обзор паттернов */}
      <PatternInsights />

      {/* Хронология */}
      <TradingTimeline />

      {/* Триггеры */}
      <EmotionalTriggers />
    </div>
  );
}
```

## Известные ограничения

1. **Нет исторических цен**: Текущая версия не использует исторические цены для точного определения FOMO Buy (покупка на максимумах). Планируется добавить интеграцию с API исторических цен.

2. **Простая логика DCA**: Детекция DCA (Dollar Cost Averaging) упрощена. Требуется более сложный анализ регулярности покупок.

3. **Нет учёта новостей**: Триггер "news" пока не реализован. Требуется интеграция с News API для корреляции сделок с новостями.

4. **Волатильность не рассчитывается**: Метрика `volatility` в PatternMetrics пока заглушка. Требуется расчёт исторической волатильности.

5. **Определение market context**: Текущая версия не определяет рыночный контекст (bull/bear/sideways). Требуется анализ индексов.

## Roadmap

### Фаза 5.2 (Planned)
- [ ] Интеграция с историческими ценами для точной детекции FOMO
- [ ] Расчёт волатильности инструментов
- [ ] Определение market context (bull/bear/sideways)
- [ ] Детекция DCA паттернов с анализом регулярности

### Фаза 5.3 (Planned)
- [ ] Интеграция с News API для детекции реакций на новости
- [ ] ML-модель для улучшения accuracy детекции
- [ ] Персонализированные пороговые значения на основе истории пользователя
- [ ] Экспорт отчётов по паттернам (PDF/CSV)

## Тестирование

```bash
# Проверка типов
npm run type-check

# Линтинг
npm run lint

# Тестирование API endpoint
curl "http://localhost:3000/api/patterns?accountId=YOUR_ACCOUNT_ID&days=90"
```

## См. также

- [Portfolio Integration](./PORTFOLIO_INTEGRATION.md) - Интеграция с портфелем
- [Analytics Dashboard](./ANALYTICS_DASHBOARD.md) - Аналитика
- [Goal Tracking](./GOAL_TRACKING_FEATURE.md) - Отслеживание целей
