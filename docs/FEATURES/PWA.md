# Progressive Web App (PWA)

## Обзор

Investment Portfolio Tracker реализован как полноценное Progressive Web App (PWA) с поддержкой офлайн-режима, кэширования, push-уведомлений и установки на устройство.

## Основные возможности

- ✅ **Офлайн-режим**: Работа без интернета с кэшированными данными
- ✅ **Service Worker**: Умное кэширование и фоновая синхронизация
- ✅ **Push-уведомления**: Оповещения о изменениях портфеля
- ✅ **Установка**: Добавление на домашний экран (iOS/Android)
- ✅ **Обновления**: Автоматическое обновление с уведомлением пользователя
- ✅ **Кэширование**: Многоуровневая стратегия кэширования

## Архитектура

### Service Worker

**Файл**: `public/sw.js`

Service Worker реализует несколько стратегий кэширования:

#### 1. Network-First (для API)
```javascript
// Приоритет сети для актуальных данных
- /api/tinkoff/*
- /api/market/*
- /api/news/*
- /api/goals/*
```

**Логика:**
1. Попытка получить данные из сети
2. При успехе - обновить кэш
3. При ошибке - вернуть из кэша
4. Если кэша нет - вернуть offline ответ

#### 2. Cache-First (для статики)
```javascript
// Приоритет кэша для производительности
- HTML страницы
- CSS/JS файлы
- Изображения
- Шрифты
```

**Логика:**
1. Проверить кэш
2. Если есть - вернуть из кэша
3. Одновременно обновить кэш в фоне
4. Если кэша нет - загрузить из сети

#### 3. Версионирование кэша
```javascript
const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `invest-app-${CACHE_VERSION}`;
```

При обновлении версии старые кэши автоматически удаляются.

### Компоненты

#### PWARegistration (`src/components/PWARegistration.tsx`)

Клиентский компонент для регистрации и управления Service Worker.

**Функции:**
- Регистрация SW при загрузке страницы
- Обнаружение обновлений
- Показ уведомления об обновлении
- Применение обновления без потери данных
- Проверка существования SW в development-режиме
- Совместимость с Next.js 16 + Turbopack

**Особенности Next.js 16:**
```typescript
// Проверка окружения и существования SW файла
if (isDevelopment) {
  // Пробуем оба пути для совместимости с Turbopack
  const swPaths = ['/sw.js', './sw.js'];
  // Регистрируем только если файл существует
}

// Используем абсолютный путь
navigator.serviceWorker.register('/sw.js', {
  scope: '/',
  updateViaCache: 'none' // Всегда получать свежий SW
});
```

**Использование:**
```typescript
// Уже подключен в app/layout.tsx
<PWARegistration />
```

#### NotificationSettings (`src/components/features/Notifications/NotificationSettings.tsx`)

UI для управления push-уведомлениями.

**Функции:**
- Запрос разрешения на уведомления
- Подписка/отписка от уведомлений
- Настройка типов уведомлений
- Отправка тестового уведомления

**Использование:**
```typescript
import { NotificationSettings } from '@/components/features/Notifications/NotificationSettings';

<NotificationSettings />
```

### Store

#### notificationStore (`src/stores/notificationStore.ts`)

Zustand store для управления состоянием уведомлений.

**State:**
```typescript
{
  permission: 'default' | 'granted' | 'denied',
  isSupported: boolean,
  subscription: PushSubscription | null,
  settings: {
    priceAlerts: boolean,
    portfolioUpdates: boolean,
    newsAlerts: boolean,
    goalAchievements: boolean,
  }
}
```

**Actions:**
```typescript
checkSupport()           // Проверка поддержки браузера
requestPermission()      // Запрос разрешения
subscribe()             // Подписка на уведомления
unsubscribe()           // Отписка
updateSettings()        // Обновление настроек
sendTestNotification()  // Тестовое уведомление
```

**Пример:**
```typescript
import { useNotificationStore } from '@/stores/notificationStore';

const {
  permission,
  subscribe,
  updateSettings
} = useNotificationStore();

// Включить уведомления
await subscribe();

// Настроить типы
updateSettings({ priceAlerts: true });
```

### API Routes

#### POST /api/notifications/subscribe
Сохранение подписки на сервере.

**Request:**
```json
{
  "subscription": {
    "endpoint": "https://...",
    "keys": { "p256dh": "...", "auth": "..." }
  },
  "settings": {
    "priceAlerts": true,
    "portfolioUpdates": true,
    "newsAlerts": false,
    "goalAchievements": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Subscribed to push notifications"
}
```

#### POST /api/notifications/unsubscribe
Удаление подписки.

**Request:**
```json
{
  "subscription": {
    "endpoint": "https://..."
  }
}
```

#### PUT /api/notifications/settings
Обновление настроек уведомлений.

**Request:**
```json
{
  "settings": {
    "priceAlerts": false,
    "newsAlerts": true
  }
}
```

#### POST /api/notifications/test
Отправка тестового уведомления.

**Request:**
```json
{
  "subscription": { ... }
}
```

## Web App Manifest

**Файл**: `public/manifest.json`

### Конфигурация

```json
{
  "name": "Investment Portfolio Tracker",
  "short_name": "Портфель",
  "description": "Трекер инвестиционного портфеля Tinkoff",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#1e293b",
  "background_color": "#0f172a"
}
```

### Icons

Приложение использует иконки с графиком роста:

- `icon-192x192.png` - Основная иконка (192x192px)
- `icon-512x512.png` - Большая иконка (512x512px)

Формат: SVG-based PNG с градиентами и эффектами.

### Shortcuts

Быстрый доступ к разделам:

```json
[
  { "name": "Портфель", "url": "/portfolio" },
  { "name": "Аналитика", "url": "/analytics" },
  { "name": "Новости", "url": "/news" }
]
```

## Offline Page

**Файл**: `src/app/offline/page.tsx`

Специальная страница, отображаемая когда пользователь офлайн.

### Функции

- ✅ Индикатор статуса подключения
- ✅ Отображение кэшированных данных
- ✅ Кнопка повторной попытки подключения
- ✅ Список доступных функций
- ✅ Автоматическое перенаправление при восстановлении связи

### Поведение

1. **Офлайн:**
   - Показывается статус "Нет подключения"
   - Отображаются кэшированные данные
   - Кнопка "Повторить попытку"

2. **Онлайн:**
   - Статус меняется на "Подключение восстановлено"
   - Автоматический редирект на главную через 2 секунды

## Установка

### Настройка проекта

1. **Добавить в `app/layout.tsx`:**
```typescript
export const metadata: Metadata = {
  manifest: "/manifest.json",
  themeColor: "#1e293b",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Портфель",
  },
};
```

2. **Зарегистрировать SW:**
```typescript
import { PWARegistration } from '@/components/PWARegistration';

<PWARegistration />
```

### VAPID ключи для push-уведомлений

Для работы push-уведомлений нужны VAPID ключи:

#### Генерация ключей

```bash
npx web-push generate-vapid-keys
```

#### Добавить в `.env.local`

```bash
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key
VAPID_SUBJECT=mailto:your-email@example.com
```

#### Установка зависимости

```bash
npm install web-push
```

## Использование

### Включение уведомлений

```typescript
import { useNotificationStore } from '@/stores/notificationStore';

function MyComponent() {
  const { requestPermission, subscribe } = useNotificationStore();

  async function enableNotifications() {
    const granted = await requestPermission();
    if (granted) {
      await subscribe();
    }
  }

  return (
    <button onClick={enableNotifications}>
      Включить уведомления
    </button>
  );
}
```

### Отправка уведомления (серверная часть)

```typescript
import webpush from 'web-push';

// Конфигурация
webpush.setVapidDetails(
  'mailto:admin@example.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

// Отправка
const payload = JSON.stringify({
  title: 'Изменение цены',
  body: 'AAPL выросла на 5%',
  icon: '/icon-192x192.png',
  url: '/portfolio',
});

await webpush.sendNotification(subscription, payload);
```

### Проверка кэша

```javascript
// В DevTools Console
caches.keys().then(console.log);

// Просмотр содержимого
caches.open('invest-app-v1.0.0')
  .then(cache => cache.keys())
  .then(console.log);

// Очистка кэша
caches.keys()
  .then(names => Promise.all(names.map(name => caches.delete(name))));
```

## События Service Worker

### Install
Срабатывает при первой установке SW:
```javascript
self.addEventListener('install', (event) => {
  // Кэширование статических ресурсов
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
  );
});
```

### Activate
Срабатывает при активации SW:
```javascript
self.addEventListener('activate', (event) => {
  // Очистка старых кэшей
  event.waitUntil(cleanupOldCaches());
});
```

### Fetch
Перехват всех сетевых запросов:
```javascript
self.addEventListener('fetch', (event) => {
  // Применение стратегий кэширования
  event.respondWith(handleFetch(event.request));
});
```

### Push
Получение push-уведомлений:
```javascript
self.addEventListener('push', (event) => {
  const data = event.data.json();
  self.registration.showNotification(data.title, data);
});
```

### Sync
Фоновая синхронизация:
```javascript
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-portfolio') {
    event.waitUntil(syncPortfolioData());
  }
});
```

## Тестирование

### Lighthouse PWA Audit

```bash
npm run build
npm start
```

Открыть DevTools → Lighthouse → Progressive Web App

**Целевые метрики:**
- ✅ Installable
- ✅ Works offline
- ✅ Fast and reliable
- ✅ Optimized for mobile

### Тестирование офлайн-режима

1. Открыть DevTools
2. Network → Throttling → Offline
3. Перезагрузить страницу
4. Проверить функциональность

### Тестирование уведомлений

1. Включить уведомления в UI
2. Нажать "Отправить тестовое уведомление"
3. Проверить получение уведомления
4. Нажать на уведомление → проверить навигацию

### Проверка Service Worker

```javascript
// DevTools Console
navigator.serviceWorker.getRegistration()
  .then(reg => console.log('SW Status:', reg.active?.state));

// Список сообщений SW
navigator.serviceWorker.addEventListener('message', e => {
  console.log('SW Message:', e.data);
});
```

## Best Practices

### 1. Кэширование
- ✅ Кэшировать только необходимое
- ✅ Использовать версионирование
- ✅ Очищать старые кэши
- ✅ Ограничивать размер кэша

### 2. Уведомления
- ✅ Запрашивать разрешение в контексте
- ✅ Не спамить пользователя
- ✅ Делать уведомления полезными
- ✅ Группировать похожие уведомления

### 3. Обновления
- ✅ Уведомлять об обновлениях
- ✅ Не форсировать перезагрузку
- ✅ Давать пользователю выбор
- ✅ Сохранять состояние при обновлении

### 4. Производительность
- ✅ Минимизировать код SW
- ✅ Избегать блокирующих операций
- ✅ Использовать IndexedDB для больших данных
- ✅ Оптимизировать размер кэша

## Известные ограничения

### iOS Safari
- ❌ Нет поддержки Background Sync
- ⚠️ Push-уведомления только на iOS 16.4+
- ⚠️ Ограниченный размер кэша (50MB)

### Desktop Safari
- ❌ Частичная поддержка push-уведомлений
- ⚠️ Требует явного действия пользователя

### Private/Incognito режим
- ❌ Service Worker не сохраняется
- ❌ Push-уведомления недоступны

## Troubleshooting

### SW не регистрируется

**Проблема:** Service Worker не активируется

**Решение:**
1. Проверить HTTPS (обязательно, кроме localhost)
2. Проверить путь к sw.js
3. Проверить консоль на ошибки
4. Проверить scope SW

```javascript
navigator.serviceWorker.register('/sw.js', { scope: '/' });
```

### Next.js 16 + Turbopack: "Not found" ошибка

**Проблема:** `Failed to update a ServiceWorker for scope ('http://localhost:3000/') with script ('Unknown'): Not found`

**Причина:** Turbopack обрабатывает статические файлы по-другому, чем Webpack.

**Решение:**
1. Убедиться что `sw.js` находится в `/public` директории
2. Компонент автоматически проверяет существование файла в dev-режиме
3. Рестартовать dev-сервер после добавления `sw.js`
4. Очистить кэш браузера (Shift+F5)

```bash
# Проверить что файл существует
ls -la public/sw.js

# Рестарт dev-сервера
npm run dev
```

**Логи PWARegistration в консоли:**
```
[PWA] Development mode - checking SW availability
[PWA] SW file found at: /sw.js
[PWA] Service Worker registered: http://localhost:3000/
```

Если файл не найден:
```
[PWA] SW file not found - skipping registration
[PWA] To enable PWA in dev: place sw.js in /public directory
```

### Кэш не обновляется

**Проблема:** Старые данные в кэше

**Решение:**
1. Изменить CACHE_VERSION в sw.js
2. Очистить кэш вручную в DevTools
3. Перезагрузить с Shift+F5
4. Проверить логику updateCache

### Уведомления не приходят

**Проблема:** Push-уведомления не работают

**Решение:**
1. Проверить VAPID ключи в .env.local
2. Проверить разрешение в браузере
3. Проверить подписку в DevTools → Application → Push
4. Проверить логи сервера

### Офлайн-страница не показывается

**Проблема:** Вместо offline page - ошибка сети

**Решение:**
1. Добавить /offline в STATIC_ASSETS
2. Проверить логику cacheFirstStrategy
3. Проверить request.mode === 'navigate'

## Дальнейшие улучшения

- [ ] Фоновая синхронизация данных
- [ ] Periodic Background Sync (автообновление)
- [ ] Web Share API для шаринга портфеля
- [ ] Badge API для счетчика уведомлений
- [ ] File System Access API для экспорта данных
- [ ] Payment Request API для пополнения счета
- [ ] IndexedDB для хранения больших данных
- [ ] Workbox для упрощения SW

## Ссылки

- [MDN: Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Web.dev: PWA](https://web.dev/progressive-web-apps/)
- [Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
