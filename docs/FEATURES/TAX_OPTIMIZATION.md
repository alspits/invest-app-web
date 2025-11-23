# Tax Optimization Module (Phase 5.2)

## Overview
Комплексный модуль налоговой оптимизации для российских инвесторов с автоматическим анализом портфеля, выявлением возможностей для снижения налогов, учётом СОИДН (Double Tax Avoidance Agreement), калькулятором ИИС и генерацией отчётности 3-НДФЛ.

**Основные возможности:**
- Tax Loss Harvesting с wash sale detection (30-дневное правило)
- Расчёт налогов на дивиденды с учётом СОИДН
- Калькулятор вычетов ИИС (Тип А и Тип Б)
- Генерация 3-НДФЛ
- Экспорт в XML, PDF, Excel

## Features

### 1. Tax Calculator (Калькулятор налогов)
Интерактивный калькулятор для расчета налоговых обязательств по различным типам инвестиционного дохода.

**Функциональность:**
- Расчет налога на краткосрочную прибыль (< 3 лет, 13%)
- Расчет налога на долгосрочную прибыль (≥ 3 лет, 0% с вычетом)
- Расчет налога на дивиденды (13%)
- Расчет налога на купоны облигаций (13%)
- Учет вычетов и убытков
- Расчет эффективной налоговой ставки
- Визуализация разбивки по типам дохода

### 2. Tax Loss Harvesting (Оптимизация убытков)
Анализ портфеля для поиска возможностей налоговой оптимизации через реализацию убытков.

**Функциональность:**
- Поиск позиций с нереализованными убытками
- Расчет потенциальной экономии налогов (13% от суммы убытка)
- Ранжирование возможностей по размеру экономии
- Рекомендации: "Продать сейчас", "Рассмотреть", "Держать"
- Общая потенциальная экономия по портфелю

**Алгоритм рекомендаций:**
- **Продать сейчас:** Убыток > 0 и экономия > 1000 ₽
- **Рассмотреть:** Убыток > 0 и экономия > 500 ₽
- **Держать:** Убыток слишком мал или позиция в прибыли

### 3. Holding Period Tracker (Отслеживание периода владения)
Мониторинг позиций, приближающихся к 3-летнему порогу для получения налоговой льготы.

**Функциональность:**
- Отслеживание позиций в пределах 90 дней от 3-летнего порога
- Визуальный прогресс-бар владения
- Countdown таймер до безналогового статуса
- Расчет потенциальной экономии при достижении порога
- Список позиций, достигших безналогового статуса (≥ 3 лет)
- Рекомендации по удержанию позиций

**Категории срочности:**
- 🟢 ≤ 30 дней: Близко к безналоговому статусу
- 🟡 31-60 дней: Скоро достигнет порога
- 🔵 61-90 дней: Приближается к порогу

### 4. Tax Report (Налоговые отчеты)
Генерация и экспорт налоговых отчетов для подачи декларации.

**Функциональность:**
- Годовая сводка доходов и налогов
- Разбивка по типам дохода
- История всех налогооблагаемых транзакций
- Экспорт в CSV для работы в Excel
- Экспорт в PDF (планируется)
- Фильтрация по годам (последние 5 лет)

## Architecture

### Components

```
src/components/features/Tax/
├── TaxCalculator.tsx           # Калькулятор налогов
├── TaxLossHarvesting.tsx       # Оптимизация убытков
├── HoldingPeriodTracker.tsx    # Отслеживание периода владения
└── TaxReport.tsx               # Налоговые отчеты
```

### Types

```typescript
// src/types/tax.ts

interface TaxableIncome {
  id: string;
  type: 'short-term-gain' | 'long-term-gain' | 'dividend' | 'coupon';
  amount: number;
  taxRate: number;
  taxAmount: number;
  year: number;
  date: Date;
  instrumentName: string;
  ticker?: string;
}

interface PositionTaxInfo {
  positionId: string;
  ticker: string;
  instrumentName: string;
  quantity: number;
  purchaseDate: Date;
  purchasePrice: number;
  currentPrice: number;
  unrealizedGain: number;
  unrealizedLoss: number;
  holdingDays: number;
  daysUntilLongTerm: number;
  isLongTerm: boolean;
  potentialTaxSavings: number;
}

interface TaxCalculation {
  totalIncome: number;
  shortTermGains: number;
  longTermGains: number;
  dividends: number;
  coupons: number;
  totalTax: number;
  shortTermTax: number;
  longTermTax: number;
  dividendTax: number;
  couponTax: number;
}
```

### Store

```typescript
// src/stores/taxStore.ts
import { create } from 'zustand';

interface TaxState {
  taxableIncomes: TaxableIncome[];
  selectedYear: number;
  isLoading: boolean;
  error: string | null;

  addTaxableIncome: (income: TaxableIncome) => void;
  removeTaxableIncome: (id: string) => void;
  setSelectedYear: (year: number) => void;
  loadTaxData: (year: number) => Promise<void>;
  generateReport: (year: number) => TaxReport;
  exportReport: (report: TaxReport, format: 'csv' | 'pdf') => void;
}

const useTaxStore = create<TaxState>(...);
```

### Utilities

```typescript
// src/lib/tax-utils.ts

// Tax rates
export const TAX_RATES = {
  SHORT_TERM: 0.13,      // 13% for < 3 years
  LONG_TERM: 0,          // 0% for >= 3 years
  DIVIDEND: 0.13,        // 13% on dividends
  COUPON: 0.13,          // 13% on coupons
};

// Core functions
export function calculateTax(input: TaxInput): TaxCalculation;
export function calculateHoldingDays(purchaseDate: Date): number;
export function isLongTermHolding(purchaseDate: Date): boolean;
export function daysUntilLongTerm(purchaseDate: Date): number;
export function calculateTaxSavings(unrealizedGain: number): number;
export function analyzeTaxLossHarvesting(position: PositionTaxInfo): TaxLossHarvestingOpportunity;
export function findHoldingPeriodAlerts(positions: PositionTaxInfo[], daysThreshold?: number): HoldingPeriodAlert[];
export function formatHoldingPeriod(days: number): string;
export function calculateEffectiveTaxRate(totalIncome: number, totalTax: number): number;
```

## Page Structure

```typescript
// src/app/tax/page.tsx
'use client';

export default function TaxPage() {
  const [activeTab, setActiveTab] = useState<'calculator' | 'harvesting' | 'holding' | 'report'>('calculator');
  const [positions, setPositions] = useState<PositionTaxInfo[]>([]);

  return (
    <div>
      {/* Tabs navigation */}
      {/* Tab content based on activeTab */}
    </div>
  );
}
```

## Usage Examples

### Using Tax Calculator

```typescript
import TaxCalculator from '@/components/features/Tax/TaxCalculator';

<TaxCalculator />
```

### Using Tax Loss Harvesting

```typescript
import TaxLossHarvesting from '@/components/features/Tax/TaxLossHarvesting';
import { PositionTaxInfo } from '@/types/tax';

const positions: PositionTaxInfo[] = [...]; // From portfolioStore

<TaxLossHarvesting positions={positions} />
```

### Using Holding Period Tracker

```typescript
import HoldingPeriodTracker from '@/components/features/Tax/HoldingPeriodTracker';

const positions: PositionTaxInfo[] = [...]; // From portfolioStore

<HoldingPeriodTracker positions={positions} />
```

### Using Tax Report

```typescript
import TaxReport from '@/components/features/Tax/TaxReport';

<TaxReport />
```

### Programmatic Tax Calculations

```typescript
import { calculateTax, calculateTaxSavings, formatHoldingPeriod } from '@/lib/tax-utils';

// Calculate tax liability
const taxCalc = calculateTax({
  shortTermGains: 100000,
  longTermGains: 50000,
  dividends: 20000,
  coupons: 10000,
  deductions: 5000,
});

console.log(taxCalc.totalTax); // Total tax amount

// Calculate potential savings
const savings = calculateTaxSavings(100000); // 13000 ₽

// Format holding period
const period = formatHoldingPeriod(800); // "2 года 2 месяца 10 дней"
```

## Integration with Portfolio

### Current Implementation
Использует mock данные для демонстрации функциональности.

### Planned Integration
```typescript
// TODO: Integrate with portfolioStore
import { usePortfolioStore } from '@/stores/portfolioStore';

const positions = usePortfolioStore((state) =>
  state.positions.map(p => ({
    positionId: p.id,
    ticker: p.ticker,
    instrumentName: p.name,
    quantity: p.quantity,
    purchaseDate: p.purchaseDate,
    purchasePrice: p.averagePrice,
    currentPrice: p.currentPrice,
    unrealizedGain: p.unrealizedPnL,
    // ... other fields
  }))
);
```

## Tax Rules (Russian Tax Code)

### Short-term Capital Gains (< 3 years)
- **Rate:** 13% (НДФЛ)
- **Calculation:** (Sale Price - Purchase Price) × Quantity × 13%
- **Payment:** Through broker withholding or annual tax return

### Long-term Capital Gains (≥ 3 years)
- **Rate:** 0% (with deduction)
- **Deduction limit:** 3,000,000 ₽ per year per taxpayer
- **Requirements:**
  - Securities purchased on Russian exchanges
  - Held for at least 3 years
  - Not sold within first 3 years

### Dividends
- **Rate:** 13% for Russian dividends
- **Withholding:** Automatic by broker or company
- **Foreign dividends:** Subject to double taxation treaties

### Bond Coupons
- **Rate:** 13% for most bonds
- **Exceptions:**
  - OFZ (государственные облигации): 0%
  - Municipal bonds: 0%
  - Corporate bonds (issued after 2017): Taxable

### Tax Loss Harvesting
- Losses can offset gains within same calendar year
- Losses carry forward up to 10 years
- Must be declared in tax return (3-НДФЛ)

## Export Functionality

### CSV Export
```typescript
// Automatic download with BOM for Excel compatibility
// Includes:
// - Report metadata (year, generation date)
// - Summary (total income, total tax)
// - Breakdown by income type
// - Transaction details
```

### PDF Export (Planned)
```typescript
// Planned features:
// - Professional report layout
// - Charts and visualizations
// - Tax authority ready format
// - Digital signature support
```

## Configuration

### Tax Rates
```typescript
// src/lib/tax-utils.ts
export const TAX_RATES = {
  SHORT_TERM: 0.13,
  LONG_TERM: 0,
  DIVIDEND: 0.13,
  COUPON: 0.13,
};
```

### Holding Period Threshold
```typescript
export const LONG_TERM_HOLDING_DAYS = 365 * 3; // 3 years
```

### Alert Threshold
```typescript
// Default: 90 days before long-term threshold
findHoldingPeriodAlerts(positions, 90);
```

## Styling

### Color Scheme
- **Calculator:** Blue gradients (income/tax summary)
- **Loss Harvesting:** Green (savings), Red (losses)
- **Holding Period:**
  - Green: ≤30 days to threshold
  - Amber: 31-60 days
  - Blue: 61-90 days
- **Report:** Neutral grays with accent colors

### Responsive Design
- Mobile-first approach
- Grid layouts for summary cards
- Responsive tables with horizontal scroll
- Touch-friendly tab navigation

## Known Issues

1. **Mock Data:**
   - Currently uses hardcoded demo positions
   - Need integration with portfolioStore

2. **PDF Export:**
   - Not yet implemented
   - Shows alert to user

3. **Historical Data:**
   - No storage/persistence of tax transactions
   - Need API integration or local storage

4. **Multi-account:**
   - No support for multiple brokerage accounts
   - Need account selection UI

5. **Currency:**
   - Only RUB supported
   - Need currency conversion for foreign assets

## Future Enhancements

1. **Integration:**
   - Connect to portfolioStore for real positions
   - Sync with Tinkoff transaction history
   - Load realized gains/losses from broker

2. **Advanced Features:**
   - Tax loss harvesting suggestions with wash sale rules
   - Multi-year tax planning
   - Scenario modeling (what-if analysis)
   - Tax-efficient withdrawal strategies

3. **Export:**
   - PDF generation with charts
   - 3-НДФЛ XML export
   - Integration with tax software

4. **Notifications:**
   - Alerts for upcoming long-term thresholds
   - Year-end tax planning reminders
   - Dividend payment notifications

5. **Analytics:**
   - Historical tax burden charts
   - Tax efficiency metrics
   - Comparison with market benchmarks

## Testing

### Manual Testing Checklist
- [ ] Tax Calculator updates on input change
- [ ] All tax rates calculate correctly (13%, 0%)
- [ ] Effective tax rate displays accurately
- [ ] Loss harvesting shows correct opportunities
- [ ] Recommendations logic works (sell/consider/hold)
- [ ] Holding period progress bars accurate
- [ ] Long-term positions display correctly
- [ ] CSV export downloads with correct data
- [ ] Year selector changes report data
- [ ] All tooltips and info boxes display

### Edge Cases
- [ ] Zero income (all fields empty)
- [ ] Negative deductions
- [ ] Very large numbers (> 1M)
- [ ] Positions with exact 3-year holding
- [ ] No transactions for selected year

## Performance Considerations

- **Memoization:** Uses `useMemo` for expensive calculations
- **Lazy loading:** Components load only when tab is active
- **CSV generation:** Client-side, no server load
- **Position filtering:** Efficient array operations

## Accessibility

- Semantic HTML structure
- ARIA labels for interactive elements
- Keyboard navigation support
- Color contrast compliance (WCAG AA)
- Screen reader friendly tables

## Browser Compatibility

- **Supported:** Chrome, Firefox, Safari, Edge (latest 2 versions)
- **CSV download:** Works on all modern browsers
- **Date handling:** Uses native Date API

## License & Disclaimer

**Important:** This tool provides informational calculations only and does not constitute professional tax advice. Users should:
- Verify calculations with tax professionals
- Use official broker reports for tax filing
- Consult with licensed tax advisors
- Check current tax laws and regulations

## Related Documentation

- [PORTFOLIO_INTEGRATION.md](./PORTFOLIO_INTEGRATION.md) - Portfolio data source
- [ARCHITECTURE.md](../ARCHITECTURE.md) - Overall app architecture
- [API_PATTERNS.md](../API_PATTERNS.md) - API integration patterns

## Changelog

### v1.0.0 (2025-01-21)
- Initial implementation
- Tax Calculator component
- Tax Loss Harvesting component
- Holding Period Tracker component
- Tax Report component with CSV export
- Russian tax rules implementation
- Comprehensive documentation

### v2.0.0 (Phase 5.2 - 2025-11-22)
- **Wash Sale Detection:** Реализовано правило 30 дней
- **Dividend Tax Tracker:** Учёт СОИДН (US withholding + Russian tax)
- **IIS Calculator:** Расчёт вычетов для Типа А и Типа Б
- **Advanced Loss Harvesting:** Автоматические рекомендации с приоритетами
- **3-НДФЛ Export:** Генерация XML для налоговой (в разработке)
- **API Routes:** Новые endpoints для tax harvesting и reporting
- **Store Integration:** Полная интеграция с Zustand taxStore
- **Extended Types:** Новые типы для российского законодательства

---

# Phase 5.2 Additions (Новые возможности)

## 1. Wash Sale Detection (Правило 30 дней)

### Описание
Автоматическая детекция нарушений wash sale — продажи актива с убытком с последующей покупкой в течение 30 дней.

### Реализация

**lib/tax/tax-loss-harvesting.ts:**

```typescript
export function detectWashSale(
  figi: string,
  saleDate: Date,
  saleLoss: number,
  saleQuantity: number,
  recentPurchases: Array<{ date: Date; quantity: number }>
): WashSaleRule

export function wouldTriggerWashSale(
  figi: string,
  sellDate: Date,
  recentPurchases: Array<{ date: Date; quantity: number }>,
  futurePurchases?: Array<{ date: Date; quantity: number }>
): boolean
```

### Пример
```typescript
const washSaleRisk = wouldTriggerWashSale(
  'BBG000B9XRY4', // AAPL FIGI
  new Date(),     // Продажа сегодня
  [
    { date: new Date('2024-11-15'), quantity: 10 }, // Покупка 7 дней назад
  ]
);

console.log(washSaleRisk); // true — риск wash sale!
```

## 2. Dividend Tax Tracker

### Описание
Расчёт налогов на дивиденды с учётом СОИДН между Россией и США/другими странами.

### Формула (США)
- Дивиденды: $100
- Удержано в США (30%): $30
- НДФЛ РФ (13%): $13
- Зачёт СОИДН: min($30, $13) = $13
- **Доплата в РФ:** $0

### Компонент

**components/features/Tax/DividendTaxTracker.tsx:**

```tsx
import { DividendTaxTracker } from '@/components/features/Tax/DividendTaxTracker';

<DividendTaxTracker />
```

Показывает:
- Итоги по дивидендам за год
- Разбивку по странам
- Удержанные налоги
- Зачёт по СОИДН
- Итоговый налог к уплате

## 3. IIS Calculator

### Описание
Калькулятор для выбора оптимального типа ИИС (Индивидуальный Инвестиционный Счёт).

### Тип А - Вычет на взносы
- Вычет: min(взнос, 400,000₽) × 13%
- Максимум: 52,000₽/год
- Подходит: Регулярные взносы, средняя доходность

### Тип Б - Освобождение от налога на прибыль
- Освобождение: 100% прибыли
- Подходит: Высокая доходность (> 13% годовых)

### Функция выбора

```typescript
import { recommendIISType } from '@/lib/tax/tax-loss-harvesting';

const rec = recommendIISType(
  yearlyContributions: 400000,
  estimatedProfit: 500000,
  yearsHeld: 3
);

console.log(rec.recommended);  // 'B'
console.log(rec.explanation);  // "Тип Б выгоднее: экономия 65,000₽..."
```

## 4. Advanced Loss Harvesting

### Новые возможности

**Автоматические рекомендации:**
- High priority: Убыток > 50,000₽
- Medium priority: Wash sale скоро истекает (< 14 дней)
- Low priority: Конец года приближается (< 60 дней)

**Детализация:**
- Доступные для продажи позиции (harvestable)
- Заблокированные позиции (wash sale)
- Potential tax savings (13% от убытка)

### Компонент

```tsx
import TaxLossHarvesting from '@/components/features/Tax/TaxLossHarvesting';

<TaxLossHarvesting />
```

## 5. Tax Reporting & 3-НДФЛ

### Описание
Генерация налоговой отчётности с экспортом в форматы для ФНС.

### Функции
- Сбор всех доходов за год (акции, дивиденды, купоны)
- Учёт вычетов (ИИС, убытки)
- Расчёт налоговой базы
- Экспорт в XML (3-НДФЛ), PDF, Excel

### Компонент

```tsx
import { TaxReporting } from '@/components/features/Tax/TaxReporting';

<TaxReporting />
```

### API Routes (TODO)

```typescript
// Генерация отчёта
GET /api/tax/report?accountId={id}&year={year}
Response: TaxReportData

// Экспорт
POST /api/tax/export
Body: { year, format: '3ndfl' | 'pdf' | 'excel', report }
Response: File download
```

## Новые типы (types/tax.ts)

### LossPosition
```typescript
interface LossPosition {
  figi: string;
  ticker: string;
  name: string;
  quantity: number;
  averageCost: number;
  currentPrice: number;
  totalCost: number;
  currentValue: number;
  unrealizedLoss: number;
  potentialTaxSavings: number; // 13% от убытка
  washSaleRisk: boolean;
  washSaleDate?: Date;
  recommendedAction: 'harvest' | 'wait' | 'avoid';
  reason: string;
}
```

### DividendTaxInfo
```typescript
interface DividendTaxInfo {
  id: string;
  figi: string;
  ticker: string;
  paymentDate: Date;
  amount: number;
  currency: string;
  countryOfOrigin: string;
  withholdingTax: number;
  withholdingRate: number;
  russianTax: number; // 13% НДФЛ
  dtaaCredit: number; // зачёт СОИДН
  netTax: number;     // итого к уплате в РФ
  netAmount: number;
}
```

### IISDeduction
```typescript
interface IISDeduction {
  type: 'A' | 'B';
  year: number;
  contributions?: number;      // Тип А
  deduction?: number;          // Тип А: min(contributions, 400k) * 13%
  profitExemption?: number;    // Тип Б: 100% освобождение
}
```

## Константы налоговых ставок

```typescript
export const TAX_RATES = {
  PERSONAL_INCOME: 0.13,              // 13% НДФЛ
  US_DIVIDEND_WITHHOLDING: 0.30,      // 30% withholding США
  EFFECTIVE_US_DIVIDEND: 0.13,        // 13% после СОИДН
  IIS_TYPE_A_MAX_DEDUCTION: 52000,    // max 52k/год
  IIS_TYPE_B_EXEMPTION: 1.0,          // 100% освобождение
} as const;
```

## Известные ограничения

1. **Wash Sale:** Базовая реализация. Не учитывает опционы и родственные инструменты.
2. **СОИДН:** Полная поддержка только для США. Для других стран — упрощённая ставка 15%.
3. **ИИС:** Требуется ручной ввод взносов.
4. **3-НДФЛ XML:** В разработке. Требуется валидация формата ФНС.
5. **Перенос убытков:** Не реализован автоматический учёт переноса на будущие годы.

## Дальнейшее развитие

- [ ] Полная генерация 3-НДФЛ XML
- [ ] Интеграция с API брокеров для автоматического импорта дивидендов
- [ ] Расширенная детекция wash sale (опционы, фьючерсы)
- [ ] Календарь налоговых событий
- [ ] Симуляция налоговых стратегий (What-If сценарии)
- [ ] Автоматический расчёт ИИС на основе истории счёта

## Безопасность

⚠️ **ВАЖНО:**
- Персональные данные (ИНН, адрес) НЕ хранятся на сервере
- Все расчёты выполняются client-side
- API требует аутентификации (TODO: добавить middleware)
- Используйте HTTPS в production

## Соответствие законодательству

Модуль предоставляет **справочную информацию** и НЕ является налоговой консультацией. Перед принятием решений:

1. Проконсультируйтесь с налоговым консультантом
2. Проверьте актуальность налоговых ставок
3. Убедитесь в корректности данных перед подачей декларации
4. Сохраните подтверждающие документы

## Полезные ссылки

- [Налоговый кодекс РФ (глава 23 - НДФЛ)](https://www.consultant.ru/document/cons_doc_LAW_28165/)
- [СОИДН РФ-США](https://www.consultant.ru/document/cons_doc_LAW_16755/)
- [ИИС - ЦБ РФ](https://cbr.ru/finmarket/inv_acc/)
- [3-НДФЛ формат](https://www.nalog.gov.ru/rn77/taxation/taxes/ndfl/)
