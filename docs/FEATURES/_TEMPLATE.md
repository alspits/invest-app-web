# [Feature Name]

## Обзор

Краткое описание функции (1-2 предложения на русском языке).

**Основные возможности:**
- ✅ Возможность 1
- ✅ Возможность 2
- ✅ Возможность 3

## Архитектура

### Модульная структура

Для функций со сложной логикой (>150 строк), используйте модульную структуру:

```
src/feature-name/
├── types.ts                    # Типы данных
├── main-service.ts             # Главный оркестратор (делегирует логику)
├── [category]/                 # Группированные модули по категориям
│   ├── module-1.ts             # Модуль 1 (< 150 строк)
│   └── module-2.ts             # Модуль 2 (< 150 строк)
├── utils/                      # Утилиты
└── index.ts                    # Public API
```

**Правила модульной архитектуры:**
- Максимум **150 строк** на файл (main-service)
- Максимум **120 строк** на action модуль
- Максимум **100 строк** на utility модуль
- Каждый модуль имеет **одну ответственность**
- Переиспользуемые утилиты в `@/lib/http`, `@/lib/utils`

**Преимущества:**
- ✅ Легкое тестирование изолированных модулей
- ✅ Простая поддержка и расширение
- ✅ Переиспользование между функциями
- ✅ Использует ~80% меньше контекста для AI Code Assistant

Подробнее о модульной архитектуре → [CLAUDE.md](../../CLAUDE.md#-modular-architecture-nov-2025-refactoring)

### Компоненты

```
src/components/features/[FeatureName]/
├── ComponentName.tsx           # Описание компонента
└── SubComponents/
    └── SubComponent.tsx        # Вложенный компонент
```

### Store

Если используется Zustand store:

```typescript
// src/stores/[featureName]/
├── types.ts                    # Типы store
├── [feature]-store.ts          # Главный store
├── actions/                    # Модульные actions (если store > 150 строк)
│   ├── crud-actions.ts
│   └── loader-actions.ts
└── index.ts                    # Public API
```

**Использование:**
```typescript
import { useFeatureStore } from '@/stores/featureStore';

const { data, loadData } = useFeatureStore();
```

### API Routes

```
GET    /api/feature                 # Получить данные
POST   /api/feature                 # Создать
PATCH  /api/feature/[id]            # Обновить
DELETE /api/feature/[id]            # Удалить
```

## Использование

### Базовый пример

```typescript
import { FeatureComponent } from '@/components/features/Feature/FeatureComponent';

export default function Page() {
  return <FeatureComponent />;
}
```

### Программный доступ

```typescript
import { calculateSomething } from '@/lib/feature';

const result = calculateSomething(data);
```

## Конфигурация

```typescript
// src/lib/feature/constants.ts
export const FEATURE_CONSTANTS = {
  DEFAULT_VALUE: 100,
  MAX_VALUE: 1000,
};
```

## Интеграция

### С Portfolio

```typescript
import { usePortfolioStore } from '@/stores/portfolioStore';
// ...
```

### С другими функциями

Описание интеграции с другими модулями.

## Известные ограничения

1. **Ограничение 1**: Описание и причина
2. **Ограничение 2**: Описание и причина

## Планы развития

### v1.1 (Краткосрочные)
- [ ] Задача 1
- [ ] Задача 2

### v2.0 (Долгосрочные)
- [ ] Задача 3
- [ ] Задача 4

## Тестирование

```bash
# Type checking
npx tsc --noEmit

# Linting
npm run lint

# Manual testing
npm run dev
```

## Связанная документация

- [ARCHITECTURE.md](../ARCHITECTURE.md) - Общая архитектура
- [CLAUDE.md](../../CLAUDE.md) - Инструкции для разработки

---

**Версия документации:** 1.0
**Дата создания:** YYYY-MM-DD
**Статус:** Development | Production Ready
