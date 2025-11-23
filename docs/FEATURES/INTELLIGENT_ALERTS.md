# Intelligent Price Alerts System

## Обзор

Система интеллектуальных ценовых оповещений (Intelligent Price Alerts) — это комплексное решение для мониторинга рынка с поддержкой:
- Базовых пороговых оповещений (цена достигла X)
- Новостных триггеров (негативный сентимент → уведомление)
- Детектора аномалий (резкое движение цены на 15% без новостей, всплеск объема в 5x, статистические выбросы 2σ)
- Сложных мультиусловных оповещений с булевой логикой (IF цена > 230 AND P/E < 5 AND RSI < 30 THEN уведомить)

## Архитектура

### Модульная структура (Nov 2025 Refactoring)

Alert System был рефакторен в модульную архитектуру для улучшения читаемости и поддержки:

**Alert Engine (до рефакторинга):** 1 монолитный файл `alert-engine.ts` (637 строк)
**Alert Engine (после рефакторинга):** 10 фокусированных модулей (каждый < 150 строк)

```
src/lib/alerts/engine/
├── types.ts                         # Типы engine
├── alert-engine.ts                  # Главный оркестратор (evaluateAlert)
├── batcher.ts                       # AlertBatcher class (батчинг)
├── sentiment-analyzer.ts            # SentimentAnalyzer class (анализ новостей)
├── state-helpers.ts                 # DND, cooldown, лимиты
├── evaluators/
│   ├── conditions.ts                # Оценка условий (AND/OR логика)
│   ├── news-trigger.ts              # Оценка новостных триггеров
│   ├── anomaly.ts                   # Детектор аномалий
│   └── operator-utils.ts            # Утилиты операторов
└── index.ts                         # Public API
```

**Alert Store (до рефакторинга):** 1 файл `alertStore.ts` (602 строки)
**Alert Store (после рефакторинга):** 10 модулей (каждый < 120 строк)

```
src/stores/alerts/
├── types.ts                         # Типы store
├── mock-data.ts                     # Mock данные изолированы (200 строк)
├── alert-store.ts                   # Главный store (делегирует actions)
├── actions/
│   ├── crud-actions.ts              # CRUD операции (add, update, delete)
│   ├── alert-actions.ts             # Действия с оповещениями (toggle, snooze)
│   ├── bulk-actions.ts              # Массовые операции (deleteAll, toggleAll)
│   ├── loader-actions.ts            # Загрузка данных (loadAlerts, loadHistory)
│   └── evaluation-actions.ts        # Оценка оповещений (evaluateAlerts)
└── index.ts                         # Public API
```

**Переиспользуемые HTTP утилиты:**
```
src/lib/http/                        # Переиспользуются во всех stores
├── error-classifier.ts              # Классификация ошибок (NETWORK, AUTH, TIMEOUT)
├── fetch-utils.ts                   # Timeout, backoff, JSON parsing
├── retry.ts                         # Retry с exponential backoff
└── index.ts                         # Public API
```

**Преимущества модульной архитектуры:**
- ✅ Каждый evaluator тестируется независимо
- ✅ Легко добавлять новые типы триггеров
- ✅ Переиспользуемый SentimentAnalyzer для других функций
- ✅ Простая поддержка state-helpers (DND, cooldown)
- ✅ HTTP утилиты переиспользуются в других stores (analytics, portfolio, etc.)
- ✅ Использует ~80% меньше контекста для AI Code Assistant
- ✅ **Graceful error handling** - исключения в evaluator не прерывают оценку других алертов

Подробнее о модульной архитектуре → [CLAUDE.md](../../CLAUDE.md#-modular-architecture-nov-2025-refactoring)

### Обработка ошибок

Alert Engine реализует graceful error handling для evaluator'ов:

```typescript
// Каждый evaluator обернут в try-catch
case 'THRESHOLD':
  try {
    ({ triggered, triggerReason, conditionsMet } = evaluateConditions(...));
  } catch (error) {
    console.error(`[Alert Engine] Error evaluating conditions for alert ${alert.id}:`, error);
    triggered = false;
    triggerReason = `evaluator_error: ${error.message}`;
    conditionsMet = [];
  }
```

**Поведение при ошибках:**
- ❌ Исключение в evaluator не прерывает весь процесс оценки
- ✅ Возвращается graceful non-triggering результат: `{ triggered: false, triggerReason: 'evaluator_error: ...' }`
- 📝 Ошибка логируется с контекстом (alert.id, alert.type)
- 🔄 Другие алерты продолжают оцениваться нормально

Это гарантирует, что единичная ошибка в одном типе триггера не сломает всю систему оповещений.

### Типы оповещений

```typescript
// Базовое пороговое оповещение
THRESHOLD - Простое условие (например, цена > 250₽)

// Мультиусловие с булевой логикой
MULTI_CONDITION - Комбинация условий (AND/OR)

// Новостное оповещение
NEWS_TRIGGERED - Триггер на негативный новостной сентимент

// Детектор аномалий
ANOMALY - Автоматическое обнаружение необычных движений
```

### Компоненты

```
src/components/features/Alerts/
├── AlertBuilder.tsx       - Визуальный конструктор оповещений
├── AlertList.tsx          - Список и управление оповещениями
└── AlertHistory.tsx       - История срабатываний
```

### Store

```typescript
// src/stores/alerts/ (модульная структура)
useAlertStore() - Zustand store для управления оповещениями

Методы (модульно разделены по actions/):
- addAlert() - Создать новое оповещение (crud-actions.ts)
- updateAlert() - Обновить существующее (crud-actions.ts)
- deleteAlert() - Удалить оповещение (crud-actions.ts)
- toggleAlert() - Вкл/выкл оповещение (alert-actions.ts)
- snoozeAlert() - Отложить на N часов (alert-actions.ts)
- dismissAlert() - Отклонить событие (alert-actions.ts)
- deleteAll() - Удалить все оповещения (bulk-actions.ts)
- toggleAll() - Вкл/выкл все оповещения (bulk-actions.ts)
- evaluateAlerts() - Проверить все оповещения (evaluation-actions.ts)
- loadAlerts() - Загрузить из API (loader-actions.ts)
- loadTriggerHistory() - История срабатываний (loader-actions.ts)
- loadStatistics() - Статистика оповещений (loader-actions.ts)
```

### API Routes

```
GET    /api/alerts                  - Получить все оповещения
POST   /api/alerts                  - Создать новое оповещение
PATCH  /api/alerts/[id]             - Обновить оповещение
DELETE /api/alerts/[id]             - Удалить оповещение
POST   /api/alerts/evaluate         - Оценить все активные оповещения
GET    /api/alerts/history          - История срабатываний (параметр: days)
GET    /api/alerts/statistics       - Статистика оповещений
```

### Alert Engine

```typescript
// src/lib/alerts/engine/ (модульная структура)

AlertEngine - Основной движок оценки оповещений
├── evaluateAlert() - Оценить одно оповещение (engine/alert-engine.ts)
├── evaluateConditions() - Проверить условия с AND/OR логикой (engine/evaluators/conditions.ts)
├── evaluateNewsTrigger() - Проверить новостные триггеры (engine/evaluators/news-trigger.ts)
└── evaluateAnomaly() - Детектор аномалий (engine/evaluators/anomaly.ts)

Вспомогательные утилиты:
├── isInDNDPeriod() - Проверка режима "Не беспокоить" (engine/state-helpers.ts)
├── isInCooldown() - Проверка cooldown периода (engine/state-helpers.ts)
└── hasReachedDailyLimit() - Проверка дневного лимита (engine/state-helpers.ts)

AlertBatcher - Батчинг оповещений (engine/batcher.ts)
├── addToBatch() - Добавить в пакет (с error handling в таймере)
└── flushAll() - Отправить все пакеты (обрабатывает все батчи даже при ошибках)

SentimentAnalyzer - Анализ новостного сентимента (engine/sentiment-analyzer.ts)
└── calculateSentiment() - Расчет среднего сентимента

Используйте index export:
import { AlertEngine, AlertBatcher, SentimentAnalyzer } from '@/lib/alerts/engine';
```

## Типы данных

### Alert

```typescript
interface Alert {
  id: string;
  ticker: string;
  name: string;
  description?: string;

  type: AlertTriggerType;  // THRESHOLD | MULTI_CONDITION | NEWS_TRIGGERED | ANOMALY
  priority: AlertPriority; // LOW | MEDIUM | HIGH | CRITICAL
  status: AlertStatus;     // ACTIVE | TRIGGERED | SNOOZED | DISMISSED | EXPIRED | DISABLED

  conditionGroups: AlertConditionGroup[];
  anomalyConfig?: AnomalyConfig;

  frequency: AlertFrequency;
  dndSettings: DNDSettings;

  createdAt: Date;
  updatedAt: Date;
  lastTriggeredAt?: Date;
  triggeredCount: number;

  notifyViaApp: boolean;
  notifyViaPush: boolean;
  notifyViaEmail: boolean;
}
```

### AlertCondition

```typescript
interface AlertCondition {
  id: string;
  field: AlertConditionField;  // PRICE, VOLUME, PE_RATIO, RSI, etc.
  operator: AlertOperator;     // GREATER_THAN, LESS_THAN, etc.
  value: number;
  baselineValue?: number;
}
```

### AnomalyConfig

```typescript
interface AnomalyConfig {
  priceChangeThreshold: number;      // % изменения для триггера (по умолчанию: 15)
  volumeSpikeMultiplier: number;     // Множитель объема (по умолчанию: 5)
  statisticalSigma: number;          // Стандартные отклонения (по умолчанию: 2)
  requiresNoNews: boolean;           // Только если нет новостей (по умолчанию: true)
  newsLookbackHours: number;         // Период проверки новостей (по умолчанию: 24)
}
```

### AlertFrequency

```typescript
interface AlertFrequency {
  maxPerDay: number;                 // Макс. оповещений в день (по умолчанию: 3)
  cooldownMinutes: number;           // Задержка между срабатываниями (по умолчанию: 60)
  batchingEnabled: boolean;          // Включить батчинг
  batchingWindowMinutes: number;     // Окно батчинга (по умолчанию: 15)
}
```

### DNDSettings

```typescript
interface DNDSettings {
  enabled: boolean;
  startTime: string;  // "22:00"
  endTime: string;    // "08:00"
  days: number[];     // [0, 1, 2, 3, 4, 5, 6] - Sunday to Saturday
}
```

## Примеры использования

### 1. Простое пороговое оповещение

```typescript
import { useAlertStore } from '@/stores/alerts';
import { createAlert, createConditionGroup, createAlertCondition } from '@/types/alert';

const alertStore = useAlertStore();

// Уведомить когда цена Сбербанка > 250₽
const alert = createAlert(
  'SBER',
  'Сбербанк превысил 250₽',
  'THRESHOLD',
  [
    createConditionGroup('AND', [
      createAlertCondition('PRICE', 'GREATER_THAN', 250)
    ])
  ]
);

alertStore.addAlert(alert);
```

### 2. Мультиусловное оповещение

```typescript
// Уведомить когда Газпром недооценен И перепродан
const complexAlert = createAlert(
  'GAZP',
  'Газпром - точка входа',
  'MULTI_CONDITION',
  [
    createConditionGroup('AND', [
      createAlertCondition('PRICE', 'GREATER_THAN', 230),
      createAlertCondition('PE_RATIO', 'LESS_THAN', 5),
      createAlertCondition('RSI', 'LESS_THAN', 30)
    ])
  ]
);

alertStore.addAlert({
  ...complexAlert,
  priority: 'HIGH',
  notifyViaPush: true
});
```

### 3. Детектор аномалий

```typescript
// Уведомить при резких движениях без новостей
const anomalyAlert = createAlert(
  'TMOS',
  'TMOS - детектор аномалий',
  'ANOMALY',
  []
);

alertStore.addAlert({
  ...anomalyAlert,
  priority: 'CRITICAL',
  anomalyConfig: {
    priceChangeThreshold: 15,      // Триггер при изменении > 15%
    volumeSpikeMultiplier: 5,      // Или объем в 5x больше среднего
    statisticalSigma: 2,           // Или выброс 2σ от среднего
    requiresNoNews: true,          // Только если нет новостей
    newsLookbackHours: 24
  }
});
```

### 4. Использование в компоненте

```typescript
'use client';

import { useEffect } from 'react';
import { useAlertStore } from '@/stores/alerts';
import AlertList from '@/components/features/Alerts/AlertList';
import AlertHistory from '@/components/features/Alerts/AlertHistory';

export default function AlertsPage() {
  const { loadAlerts, evaluateAlerts } = useAlertStore();

  useEffect(() => {
    // Загрузить оповещения при монтировании
    loadAlerts();

    // Опционально: запускать оценку каждые 5 минут
    const interval = setInterval(() => {
      evaluateAlerts();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [loadAlerts, evaluateAlerts]);

  return (
    <div className="space-y-8">
      <AlertList />
      <AlertHistory />
    </div>
  );
}
```

## Конфигурация

### Значения по умолчанию

```typescript
// src/types/alert.ts

export const DEFAULT_ALERT_FREQUENCY: AlertFrequency = {
  maxPerDay: 3,
  cooldownMinutes: 60,
  batchingEnabled: true,
  batchingWindowMinutes: 15,
};

export const DEFAULT_DND_SETTINGS: DNDSettings = {
  enabled: false,
  startTime: '22:00',
  endTime: '08:00',
  days: [0, 1, 2, 3, 4, 5, 6], // Все дни
};

export const DEFAULT_ANOMALY_CONFIG: AnomalyConfig = {
  priceChangeThreshold: 15,
  volumeSpikeMultiplier: 5,
  statisticalSigma: 2,
  requiresNoNews: true,
  newsLookbackHours: 24,
};
```

## Интеграция с другими функциями

### Интеграция с News Feed (Phase 3)

Alert Engine автоматически использует NewsAPI для:
- Детекции новостных триггеров
- Анализа сентимента
- Фильтрации аномалий (игнорирует движения, объясненные новостями)

```typescript
// Автоматически используется внутри AlertEngine
import { NewsItem } from '@/lib/news-api';
import { SentimentAnalyzer } from '@/lib/alerts/engine';

// Расчет среднего сентимента из новостей
const sentiment = SentimentAnalyzer.calculateSentiment(newsArticles);
```

### Интеграция с Notifications (PWA)

```typescript
// Автоматически отправляет push-уведомления через notificationStore
import { useNotificationStore } from '@/stores/notificationStore';

// При срабатывании оповещения
if (alert.notifyViaPush) {
  // Отправляется через /api/notifications/test
}
```

### Интеграция с Portfolio

```typescript
// Можно создавать оповещения для инструментов из портфеля
import { usePortfolioStore } from '@/stores/portfolioStore';

const portfolio = usePortfolioStore();
const tickers = portfolio.portfolio?.positions.map(p => p.ticker) || [];

// Создать оповещение для каждого тикера
tickers.forEach(ticker => {
  // ...
});
```

## Логика оценки оповещений

### 1. Проверки перед оценкой

```typescript
// src/lib/alerts/engine/alert-engine.ts
// AlertEngine.evaluateAlert() выполняет проверки:
1. Статус оповещения === ACTIVE
2. Оповещение не истекло (expiresAt)
3. Не в режиме DND (engine/state-helpers.ts: isInDNDPeriod)
4. Не в cooldown периоде (engine/state-helpers.ts: isInCooldown)
5. Не превышен дневной лимит (engine/state-helpers.ts: hasReachedDailyLimit)
```

### 2. Оценка по типу

```typescript
// src/lib/alerts/engine/alert-engine.ts
switch (alert.type) {
  case 'THRESHOLD':
  case 'MULTI_CONDITION':
    // Проверяем все conditionGroups
    // Поддерживаем AND/OR логику
    // → engine/evaluators/conditions.ts: evaluateConditions()
    break;

  case 'NEWS_TRIGGERED':
    // Проверяем средний сентимент новостей
    // Триггер при sentiment < -0.3
    // → engine/evaluators/news-trigger.ts: evaluateNewsTrigger()
    // → engine/sentiment-analyzer.ts: SentimentAnalyzer.calculateSentiment()
    break;

  case 'ANOMALY':
    // Проверяем:
    // 1. Изменение цены > threshold
    // 2. Всплеск объема > multiplier
    // 3. Статистический выброс > sigma
    // 4. Отсутствие новостей (если requiresNoNews)
    // → engine/evaluators/anomaly.ts: evaluateAnomaly()
    break;
}
```

### 3. Создание события

```typescript
// При срабатывании создается AlertTriggerEvent
{
  id: crypto.randomUUID(),
  alertId: alert.id,
  ticker: alert.ticker,
  triggeredAt: new Date(),
  triggerReason: "Условия выполнены: PRICE > 250",
  conditionsMet: ["PRICE > 250 (actual: 255.50)"],
  priceAtTrigger: 255.5,
  volumeAtTrigger: 10000000,
  newsCount: 5,
  sentiment: -0.4,
  userAction: 'PENDING'
}
```

## Батчинг оповещений

### Как работает

```typescript
// src/lib/alerts/engine/batcher.ts
// AlertBatcher накапливает события в течение окна (default: 15 мин)
// Затем отправляет все события одним уведомлением

import { AlertBatcher } from '@/lib/alerts/engine';

const batcher = new AlertBatcher();

batcher.addToBatch(
  'SBER',
  event,
  15, // окно в минутах
  (ticker, events) => {
    // Отправить батч из events.length событий
    console.log(`Батч для ${ticker}: ${events.length} событий`);
  }
);
```

## Smart Timing (DND Mode)

### Конфигурация DND

```typescript
const dndSettings: DNDSettings = {
  enabled: true,
  startTime: '22:00',  // Начало тихого режима
  endTime: '08:00',    // Окончание тихого режима
  days: [0, 1, 2, 3, 4, 5, 6] // Активен все дни
};

// Поддерживает overnight DND (22:00 → 08:00)
// Поддерживает same-day DND (12:00 → 14:00)
```

### Проверка DND

```typescript
// src/lib/alerts/engine/state-helpers.ts
// isInDNDPeriod() автоматически:
1. Проверяет день недели
2. Проверяет текущее время
3. Поддерживает overnight периоды (22:00 → 08:00)
4. Блокирует срабатывания в DND

import { isInDNDPeriod } from '@/lib/alerts/engine';
const inDND = isInDNDPeriod(dndSettings, new Date());
```

## Сентимент-анализ

### Простая реализация на ключевых словах

```typescript
// src/lib/alerts/engine/sentiment-analyzer.ts
// SentimentAnalyzer использует русские ключевые слова
import { SentimentAnalyzer } from '@/lib/alerts/engine';

const negativeKeywords = [
  'падение', 'снижение', 'убыток', 'кризис',
  'банкротство', 'риск', 'потери', 'долг'
];

const positiveKeywords = [
  'рост', 'прибыль', 'успех', 'достижение',
  'увеличение', 'дивиденд', 'расширение'
];

// Возвращает значение от -1 (очень негативно) до +1 (очень позитивно)
const sentiment = SentimentAnalyzer.calculateSentiment(articles);
```

## Статистика

```typescript
interface AlertStatistics {
  totalAlerts: number;              // Всего оповещений
  activeAlerts: number;             // Активных
  triggeredToday: number;           // Срабатываний сегодня
  triggeredThisWeek: number;        // За неделю
  triggeredThisMonth: number;       // За месяц
  averageTriggersPerDay: number;    // Среднее в день
  mostTriggeredTicker: string;      // Самый активный тикер
  mostTriggeredAlertType: AlertTriggerType;
}

// Загрузка статистики
// src/stores/alerts/actions/loader-actions.ts
import { useAlertStore } from '@/stores/alerts';
const { loadStatistics, statistics } = useAlertStore();
await loadStatistics();
```

## Mock Data (Development Mode)

В режиме разработки без API токена автоматически используются моковые данные:

```typescript
// src/stores/alerts/mock-data.ts
// Изолированные моковые данные (200 строк):
- 3 примера оповещений (SBER, GAZP, TMOS)
- 2 события в истории
- Моковую статистику

// Автоматически активируется при:
// src/stores/alerts/alert-store.ts
process.env.NODE_ENV === 'development' && !hasToken

import { mockAlerts, mockTriggerEvents, mockStatistics } from './mock-data';
```

## Валидация данных

Все данные валидируются через Zod схемы:

```typescript
import { AlertSchema, AlertConditionSchema } from '@/types/alert';

// Валидация при создании
const validated = AlertSchema.parse(alertData);

// Валидация в API route
const body = await request.json();
const validated = AlertSchema.parse(body);
```

## Known Issues / Limitations

### Текущие ограничения

1. **Нет персистентности**: Данные пока не сохраняются в БД (только в памяти store)
2. **Нет автоматической оценки**: Требуется ручной вызов `evaluateAlerts()` или настройка cron job
3. **Простой сентимент-анализ**: Использует только ключевые слова, нет ML модели
4. **Нет email уведомлений**: Флаг `notifyViaEmail` не реализован
5. **Нет исторических данных для RSI/MA**: Требуется интеграция с источником технических индикаторов

### Недавние улучшения

- [x] **Улучшенная обработка ошибок в AlertBatcher** (Nov 2025)
  - `flushAll()`: Обрабатывает все батчи даже если callback выбрасывает исключение
  - `addToBatch()`: Гарантирует очистку батчей в `finally` блоке при ошибках в таймерах
  - Логирование ошибок callback с продолжением обработки оставшихся батчей
  - Предотвращает утечки памяти при ошибках в batch processing

- [x] **Улучшенная observability в Anomaly Detector** (Nov 2025)
  - Исправлен `evaluators/anomaly.ts`: сохраняются `conditionsMet` даже когда аномалия не срабатывает из-за новостей
  - Раньше: при раннем возврате (новости объясняют движение) терялась информация об обнаруженных условиях
  - Теперь: возвращаются все накопленные условия (price change, volume spike, statistical outlier) для debugging/мониторинга
  - Пример: `{triggered: false, triggerReason: "Anomaly detected but explained by news", conditionsMet: ["Price change: 18.5%", "Volume spike: 6.2x"]}`
  - Улучшает анализ ложных срабатываний и тюнинг порогов

- [x] **Валидация ticker в Alert Engine** (Nov 2025)
  - Добавлена проверка соответствия `marketData.ticker` и `alert.ticker` в [alert-engine.ts:59-66](../../src/lib/alerts/engine/alert-engine.ts#L59-L66)
  - Предотвращает оценку алерта с неправильными рыночными данными
  - Логирует предупреждение с `alert.id`, ожидаемым и полученным ticker
  - Возвращает `{triggered: false}` при несоответствии или отсутствии `marketData`
  - Покрыто unit-тестами: `alert-engine.test.ts` (тесты ticker mismatch и missing marketData)

- [x] **Защита от деления на ноль и NaN в Anomaly Detector** (Nov 2025)
  - **Проблема 1**: Расчет `priceChange` мог производить `Infinity/NaN` при `previousClose = 0`
  - **Решение**: Добавлена проверка `previousClose === 0` → возвращает `priceChange = 0` вместо деления на ноль
  - **Проблема 2**: `calculateStatistics()` возвращал `NaN` при пустом массиве данных
  - **Решение**: Добавлена явная проверка `data.length === 0` → выбрасывается ошибка `'calculateStatistics requires at least one data point'`
  - **Локация**: [anomaly.ts:31-33](../../src/lib/alerts/engine/evaluators/anomaly.ts#L31-L33) и [anomaly.ts:103-105](../../src/lib/alerts/engine/evaluators/anomaly.ts#L103-L105)
  - **Поведение**: Вызывающий код получает понятную ошибку вместо тихих `NaN` значений, которые ломают downstream логику
  - Покрыто валидационными тестами

### Планируемые улучшения

- [ ] Интеграция с PostgreSQL/Supabase для персистентности
- [ ] Cron job для автоматической оценки (каждые 5-15 минут)
- [ ] ML-based sentiment analysis (Hugging Face API)
- [ ] Email notifications (SendGrid/AWS SES)
- [ ] Интеграция с техническими индикаторами (TradingView/Yahoo Finance)
- [ ] Webhooks для интеграции с внешними системами
- [ ] Экспорт истории в CSV/JSON
- [ ] Шаблоны оповещений (presets)

## Зависимости

```json
{
  "zustand": "Управление состоянием",
  "zod": "Валидация данных",
  "@/lib/news-api": "Интеграция с NewsAPI для сентимента",
  "@/lib/alerts/engine": "Модульный alert engine (evaluators, batcher, sentiment)",
  "@/stores/alerts": "Модульный alert store (CRUD, evaluation, loaders)",
  "@/stores/notificationStore": "PWA push-уведомления",
  "@/stores/portfolioStore": "Данные портфеля для тикеров"
}
```

## Безопасность

- API routes защищены от прямого вызова Tinkoff API (только серверная сторона)
- Валидация всех входных данных через Zod
- Лимиты на частоту оповещений (maxPerDay, cooldown)
- DND режим для предотвращения спама

## Производительность

- Батчинг снижает количество уведомлений
- Cooldown предотвращает дублирование
- Кэширование новостей (1 час TTL в newsStore)
- Эффективная проверка DND без дополнительных запросов

---

**Документация создана**: 2024-11-23
**Последнее обновление**: 2025-11-23 (обновлены пути после модульного рефакторинга)
**Версия**: 2.0.0 (Modular Architecture)
**Автор**: Claude Code + Sequential Thinking MCP
