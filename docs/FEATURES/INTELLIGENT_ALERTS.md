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

**Преимущества модульной архитектуры:**
- ✅ Каждый evaluator тестируется независимо
- ✅ Легко добавлять новые типы триггеров
- ✅ Переиспользуемый SentimentAnalyzer для других функций
- ✅ Простая поддержка state-helpers (DND, cooldown)
- ✅ Использует ~80% меньше контекста для AI Code Assistant

Подробнее о модульной архитектуре → [CLAUDE.md](../../CLAUDE.md#-modular-architecture-nov-2025-refactoring)

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
// src/stores/alerts/
useAlertStore() - Zustand store для управления оповещениями

Методы:
- addAlert() - Создать новое оповещение
- updateAlert() - Обновить существующее
- deleteAlert() - Удалить оповещение
- toggleAlert() - Вкл/выкл оповещение
- snoozeAlert() - Отложить на N часов
- dismissAlert() - Отклонить событие
- evaluateAlerts() - Проверить все оповещения
- loadAlerts() - Загрузить из API
- loadTriggerHistory() - История срабатываний
- loadStatistics() - Статистика оповещений
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
├── evaluateAlert() - Оценить одно оповещение (alert-engine.ts)
├── evaluateConditions() - Проверить условия с AND/OR логикой (evaluators/conditions.ts)
├── evaluateNewsTrigger() - Проверить новостные триггеры (evaluators/news-trigger.ts)
└── evaluateAnomaly() - Детектор аномалий (evaluators/anomaly.ts)

AlertBatcher - Батчинг оповещений (batcher.ts)
├── addToBatch() - Добавить в пакет
└── flushAll() - Отправить все пакеты

SentimentAnalyzer - Анализ новостного сентимента (sentiment-analyzer.ts)
└── calculateSentiment() - Расчет среднего сентимента
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
import { useAlertStore } from '@/stores/alertStore';
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
import { useAlertStore } from '@/stores/alertStore';
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
import { SentimentAnalyzer } from '@/lib/alerts/alert-engine';

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
// AlertEngine.evaluateAlert() выполняет проверки:
1. Статус оповещения === ACTIVE
2. Оповещение не истекло (expiresAt)
3. Не в режиме DND
4. Не в cooldown периоде
5. Не превышен дневной лимит (maxPerDay)
```

### 2. Оценка по типу

```typescript
switch (alert.type) {
  case 'THRESHOLD':
  case 'MULTI_CONDITION':
    // Проверяем все conditionGroups
    // Поддерживаем AND/OR логику
    break;

  case 'NEWS_TRIGGERED':
    // Проверяем средний сентимент новостей
    // Триггер при sentiment < -0.3
    break;

  case 'ANOMALY':
    // Проверяем:
    // 1. Изменение цены > threshold
    // 2. Всплеск объема > multiplier
    // 3. Статистический выброс > sigma
    // 4. Отсутствие новостей (если requiresNoNews)
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
// AlertBatcher накапливает события в течение окна (default: 15 мин)
// Затем отправляет все события одним уведомлением

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
// AlertEngine.isInDNDPeriod() автоматически:
1. Проверяет день недели
2. Проверяет текущее время
3. Поддерживает overnight периоды
4. Блокирует срабатывания в DND
```

## Сентимент-анализ

### Простая реализация на ключевых словах

```typescript
// SentimentAnalyzer использует русские ключевые слова
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
const { loadStatistics, statistics } = useAlertStore();
await loadStatistics();
```

## Mock Data (Development Mode)

В режиме разработки без API токена автоматически используются моковые данные:

```typescript
// src/stores/alertStore.ts содержит:
- 3 примера оповещений (SBER, GAZP, TMOS)
- 2 события в истории
- Моковую статистику

// Автоматически активируется при:
process.env.NODE_ENV === 'development' && !hasToken
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
**Версия**: 1.0.0
**Автор**: Claude Code + Sequential Thinking MCP
