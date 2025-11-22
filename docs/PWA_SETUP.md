# PWA Setup Guide

Пошаговая инструкция по настройке и запуску PWA функциональности.

## Быстрый старт

### 1. Установка зависимостей

```bash
npm install
```

Это установит все необходимые пакеты, включая `web-push` для push-уведомлений.

### 2. Генерация VAPID ключей

VAPID ключи нужны для безопасной отправки push-уведомлений:

```bash
npx web-push generate-vapid-keys
```

Вывод будет выглядеть так:
```
=======================================
Public Key:
BG3xRKx...your-public-key...xyz

Private Key:
dGh1c...your-private-key...abc
=======================================
```

### 3. Настройка переменных окружения

Создайте файл `.env.local` в корне проекта и добавьте сгенерированные ключи:

```bash
# VAPID Keys for Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BG3xRKx...your-public-key...xyz
VAPID_PRIVATE_KEY=dGh1c...your-private-key...abc
VAPID_SUBJECT=mailto:your-email@example.com

# Existing keys (не удаляйте)
NEXT_PUBLIC_TINKOFF_API_URL=https://invest-public-api.tinkoff.ru/rest
TINKOFF_API_TOKEN=your_token
NEWSAPI_KEY=your_newsapi_key
```

⚠️ **Важно:**
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` - публичный ключ (доступен в браузере)
- `VAPID_PRIVATE_KEY` - приватный ключ (только на сервере, НЕ ПУБЛИКУЙТЕ!)
- `VAPID_SUBJECT` - ваш email для контакта

### 4. Запуск приложения

#### Development режим

```bash
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000)

#### Production режим

```bash
npm run build
npm start
```

## Проверка PWA функциональности

### 1. Service Worker

Откройте DevTools (F12) → Application → Service Workers

Вы должны увидеть:
- ✅ Service Worker активен
- ✅ Статус: "activated and is running"
- ✅ Scope: "/"

### 2. Manifest

DevTools → Application → Manifest

Проверьте:
- ✅ Name: "Investment Portfolio Tracker"
- ✅ Short name: "Портфель"
- ✅ Icons: 192x192 и 512x512
- ✅ Theme color: #1e293b

### 3. Cache Storage

DevTools → Application → Cache Storage

Должен быть кэш `invest-app-v1.0.0` с файлами:
- `/`
- `/offline`
- `/portfolio`
- `/analytics`
- `/manifest.json`

### 4. Push Notifications

1. Перейдите в раздел с настройками уведомлений
2. Нажмите "Включить уведомления"
3. Разрешите уведомления в браузере
4. Нажмите "Отправить тестовое уведомление"
5. Проверьте получение уведомления

DevTools → Application → Push Messaging покажет статус подписки.

## Тестирование офлайн-режима

### Метод 1: DevTools Network Throttling

1. Откройте DevTools (F12)
2. Network → Throttling → Offline
3. Перезагрузите страницу (F5)
4. Должна открыться страница `/offline`

### Метод 2: Отключение интернета

1. Отключите Wi-Fi или интернет
2. Попробуйте открыть страницу
3. Приложение должно работать с кэшированными данными

### Проверка кэшированных данных

Откройте консоль (F12) и выполните:

```javascript
// Список всех кэшей
caches.keys().then(console.log);

// Содержимое кэша
caches.open('invest-app-v1.0.0')
  .then(cache => cache.keys())
  .then(keys => keys.map(k => k.url))
  .then(console.log);

// Проверка наличия API данных в кэше
caches.match('/api/tinkoff/portfolio')
  .then(response => response ? response.json() : null)
  .then(console.log);
```

## Lighthouse PWA Audit

### Запуск аудита

1. Соберите production билд:
```bash
npm run build
npm start
```

2. Откройте DevTools → Lighthouse
3. Категории: выберите "Progressive Web App"
4. Device: Mobile
5. Нажмите "Analyze page load"

### Целевые метрики

Приложение должно пройти все проверки PWA:

✅ **Installable**
- Web app manifest present
- Service worker registered
- HTTPS (production)

✅ **PWA Optimized**
- Fast and reliable
- Works offline
- Page load is fast enough on mobile

✅ **Additional checks**
- Viewport meta tag present
- Theme color set
- Icons provided

### Ожидаемый результат

Score: **100%** или близко к этому.

Если есть ошибки, проверьте:
- Манифест корректен
- Service Worker активен
- HTTPS включен (в production)
- Все иконки на месте

## Установка PWA на устройство

### Desktop (Chrome/Edge)

1. Откройте приложение
2. В адресной строке появится иконка установки (+)
3. Нажмите "Установить"
4. Приложение откроется в отдельном окне

### Android (Chrome)

1. Откройте приложение
2. Меню (⋮) → "Добавить на главный экран"
3. Подтвердите установку
4. Иконка появится на рабочем столе

### iOS (Safari)

1. Откройте приложение в Safari
2. Нажмите кнопку "Поделиться" (квадрат со стрелкой)
3. "Добавить на экран Домой"
4. Подтвердите

⚠️ **iOS ограничения:**
- Push-уведомления доступны только с iOS 16.4+
- Background sync не поддерживается
- Ограниченный размер кэша (50MB)

## Отправка push-уведомлений (для разработчиков)

### Пример серверного кода

```typescript
import webpush from 'web-push';

// Конфигурация VAPID
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

// Отправка уведомления
async function sendNotification(subscription: PushSubscription, data: any) {
  const payload = JSON.stringify({
    title: 'Изменение портфеля',
    body: 'Ваш портфель вырос на 5%',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    url: '/portfolio',
    data: data,
  });

  try {
    await webpush.sendNotification(subscription, payload);
    console.log('Notification sent successfully');
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
}
```

### Автоматическая отправка при событиях

Пример триггера на изменение цены:

```typescript
// В вашем API endpoint
if (priceChangePercent > 5) {
  // Получить все подписки пользователя из БД
  const subscriptions = await getUserSubscriptions(userId);

  // Отправить уведомление каждому
  for (const sub of subscriptions) {
    await sendNotification(sub, {
      type: 'price-alert',
      ticker: 'AAPL',
      change: +5.2,
    });
  }
}
```

## Обновление Service Worker

### Изменение версии

Когда вы обновляете код приложения:

1. Измените версию в `public/sw.js`:
```javascript
const CACHE_VERSION = 'v1.0.1'; // было v1.0.0
```

2. Соберите новую версию:
```bash
npm run build
```

3. При следующем посещении:
   - Новый SW загрузится в фоне
   - Пользователь увидит уведомление об обновлении
   - Сможет обновить приложение или продолжить работу

### Принудительное обновление (для разработки)

DevTools → Application → Service Workers → Update

Или в консоли:
```javascript
navigator.serviceWorker.getRegistration()
  .then(reg => reg?.update());
```

## Очистка данных PWA

### Полная очистка

```javascript
// Удалить все кэши
caches.keys()
  .then(names => Promise.all(names.map(n => caches.delete(n))));

// Отписаться от уведомлений
navigator.serviceWorker.ready
  .then(reg => reg.pushManager.getSubscription())
  .then(sub => sub?.unsubscribe());

// Удалить Service Worker
navigator.serviceWorker.getRegistration()
  .then(reg => reg?.unregister());
```

### Через DevTools

1. Application → Storage
2. "Clear site data"
3. Отметить все пункты
4. "Clear data"

## Troubleshooting

### Service Worker не регистрируется

**Проблема:** SW не активируется

**Решения:**
1. Проверьте консоль на ошибки
2. Убедитесь что путь `/sw.js` доступен
3. В production нужен HTTPS
4. Очистите кэш браузера

### Push-уведомления не работают

**Проблема:** Уведомления не приходят

**Решения:**
1. Проверьте VAPID ключи в `.env.local`
2. Убедитесь что разрешение дано в браузере
3. Проверьте что SW активен
4. Проверьте логи сервера

### Приложение не работает офлайн

**Проблема:** Ошибка при отключении интернета

**Решения:**
1. Убедитесь что SW активен
2. Проверьте что `/offline` в STATIC_ASSETS
3. Проверьте стратегию кэширования
4. Очистите кэш и перезагрузите

### Обновления не применяются

**Проблема:** Код обновился, но пользователь видит старую версию

**Решения:**
1. Измените CACHE_VERSION в sw.js
2. Перезагрузите с Ctrl+Shift+R (hard reload)
3. Очистите кэш вручную
4. Проверьте логику activate event

## Production Checklist

Перед деплоем на production:

- [ ] VAPID ключи добавлены в переменные окружения
- [ ] HTTPS настроен (обязательно для SW)
- [ ] Lighthouse PWA score > 90
- [ ] Тестирование на реальных устройствах (iOS/Android)
- [ ] Иконки корректно отображаются
- [ ] Офлайн-режим работает
- [ ] Push-уведомления работают
- [ ] Манифест корректен
- [ ] Service Worker оптимизирован
- [ ] Кэш не слишком большой (<50MB)

## Полезные ссылки

- [Web.dev: PWA](https://web.dev/progressive-web-apps/)
- [MDN: Service Worker](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [web-push документация](https://github.com/web-push-libs/web-push)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [Workbox](https://developers.google.com/web/tools/workbox) (альтернатива ручному SW)

## Поддержка

Если возникли проблемы:

1. Проверьте документацию: `docs/FEATURES/PWA.md`
2. Проверьте консоль браузера на ошибки
3. Запустите Lighthouse audit
4. Проверьте DevTools → Application
