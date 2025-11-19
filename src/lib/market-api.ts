import { z } from 'zod';
import { quotationToNumber, moneyValueToNumber } from './tinkoff-api';

// ============================================================================
// Zod Schemas for Runtime Validation
// ============================================================================

// Define Quotation and MoneyValue schemas locally (not exported from tinkoff-api)
const QuotationSchema = z.object({
  units: z.string(),
  nano: z.number(),
});

const MoneyValueSchema = z.object({
  currency: z.string(),
  units: z.string(),
  nano: z.number(),
});

const MarketIndexSchema = z.object({
  name: z.string(),
  ticker: z.string(),
  figi: z.string().optional(),
  currentValue: z.number(),
  changePercent: z.number(),
  changeAbsolute: z.number(),
  dayHigh: z.number().optional(),
  dayLow: z.number().optional(),
  yearHigh: z.number().optional(),
  yearLow: z.number().optional(),
  previousClose: z.number().optional(),
  lastUpdated: z.string(),
});

const LastPriceSchema = z.object({
  figi: z.string(),
  price: QuotationSchema,
  time: z.string(),
  instrumentUid: z.string().optional(),
});

const LastPricesResponseSchema = z.object({
  lastPrices: z.array(LastPriceSchema),
});

const CandleSchema = z.object({
  open: QuotationSchema,
  high: QuotationSchema,
  low: QuotationSchema,
  close: QuotationSchema,
  volume: z.string(),
  time: z.string(),
  isComplete: z.boolean(),
});

const CandlesResponseSchema = z.object({
  candles: z.array(CandleSchema),
});

// ============================================================================
// TypeScript Types
// ============================================================================

export type MarketIndex = z.infer<typeof MarketIndexSchema>;
export type LastPrice = z.infer<typeof LastPriceSchema>;
export type LastPricesResponse = z.infer<typeof LastPricesResponseSchema>;
export type Candle = z.infer<typeof CandleSchema>;
export type CandlesResponse = z.infer<typeof CandlesResponseSchema>;

export interface MarketContextData {
  indices: MarketIndex[];
  lastUpdated: string;
}

// ============================================================================
// Configuration
// ============================================================================

// Well-known market indices with their FIGIs
const MARKET_INDICES = {
  IMOEX: {
    name: 'Индекс МосБиржи',
    ticker: 'IMOEX',
    figi: 'BBG004730ZJ9', // MOEX Index FIGI
  },
  RTSI: {
    name: 'Индекс РТС',
    ticker: 'RTSI',
    figi: 'BBG004731354', // RTS Index FIGI
  },
  // For international indices, we'll use mock data as Tinkoff may not provide them
  SPX: {
    name: 'S&P 500',
    ticker: 'SPX',
    figi: null, // Not available in Tinkoff
  },
  IXIC: {
    name: 'Nasdaq',
    ticker: 'IXIC',
    figi: null, // Not available in Tinkoff
  },
} as const;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Sleep helper for retry logic
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Make authenticated request to Tinkoff API
 */
async function tinkoffRequest<T>(
  endpoint: string,
  token: string,
  method: 'GET' | 'POST' = 'POST',
  body?: unknown,
  schema?: z.ZodSchema<T>
): Promise<T> {
  const apiUrl = process.env.NEXT_PUBLIC_TINKOFF_API_URL || 'https://invest-public-api.tinkoff.ru/rest';
  const url = `${apiUrl}${endpoint}`;

  console.log('🔵 Tinkoff Market API Request:', {
    endpoint,
    method,
  });

  const response = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('❌ Tinkoff Market API Error:', errorData);
    throw new Error(
      `Tinkoff Market API Error: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();

  // Validate with Zod if schema provided
  if (schema) {
    try {
      return schema.parse(data);
    } catch (error) {
      console.error('❌ Zod validation failed:', error);
      throw error;
    }
  }

  return data as T;
}

/**
 * Calculate percentage change
 */
function calculatePercentChange(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Get today's date range for candle data
 */
function getTodayDateRange() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return {
    from: today.toISOString(),
    to: now.toISOString(),
  };
}

/**
 * Get yesterday's close for comparison
 */
function getYesterdayDateRange() {
  const now = new Date();
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  const yesterdayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return {
    from: yesterday.toISOString(),
    to: yesterdayEnd.toISOString(),
  };
}

// ============================================================================
// Mock Data for International Indices
// ============================================================================

/**
 * Generate realistic mock data for international indices
 * In production, you would replace this with a real API (e.g., Alpha Vantage, Yahoo Finance)
 */
function generateMockIndexData(ticker: 'SPX' | 'IXIC'): MarketIndex {
  const baseValues = {
    SPX: { value: 4780, range: 100 },
    IXIC: { value: 15100, range: 200 },
  };

  const base = baseValues[ticker];
  const randomChange = (Math.random() - 0.5) * base.range;
  const currentValue = base.value + randomChange;
  const previousClose = base.value;
  const changeAbsolute = currentValue - previousClose;
  const changePercent = calculatePercentChange(currentValue, previousClose);

  return {
    name: MARKET_INDICES[ticker].name,
    ticker: MARKET_INDICES[ticker].ticker,
    currentValue: Number(currentValue.toFixed(2)),
    changePercent: Number(changePercent.toFixed(2)),
    changeAbsolute: Number(changeAbsolute.toFixed(2)),
    dayHigh: Number((currentValue + Math.random() * 50).toFixed(2)),
    dayLow: Number((currentValue - Math.random() * 50).toFixed(2)),
    previousClose: Number(previousClose.toFixed(2)),
    lastUpdated: new Date().toISOString(),
  };
}

// ============================================================================
// Public API Methods
// ============================================================================

/**
 * Fetch last price for a specific FIGI
 */
async function getLastPrice(figi: string, token: string): Promise<number> {
  try {
    const response = await tinkoffRequest<LastPricesResponse>(
      '/tinkoff.public.invest.api.contract.v1.MarketDataService/GetLastPrices',
      token,
      'POST',
      { figi: [figi] },
      LastPricesResponseSchema
    );

    if (response.lastPrices.length === 0) {
      throw new Error(`No price data for FIGI: ${figi}`);
    }

    return quotationToNumber(response.lastPrices[0].price);
  } catch (error) {
    console.error(`Error fetching last price for ${figi}:`, error);
    throw error;
  }
}

/**
 * Fetch candle data for day high/low and previous close
 */
async function getCandleData(figi: string, token: string): Promise<{
  dayHigh?: number;
  dayLow?: number;
  previousClose?: number;
}> {
  try {
    const today = getTodayDateRange();

    const response = await tinkoffRequest<CandlesResponse>(
      '/tinkoff.public.invest.api.contract.v1.MarketDataService/GetCandles',
      token,
      'POST',
      {
        figi,
        from: today.from,
        to: today.to,
        interval: 'CANDLE_INTERVAL_DAY',
      },
      CandlesResponseSchema
    );

    if (response.candles.length === 0) {
      return {};
    }

    const todayCandle = response.candles[response.candles.length - 1];

    // Get yesterday's candle for previous close
    const yesterday = getYesterdayDateRange();
    const yesterdayResponse = await tinkoffRequest<CandlesResponse>(
      '/tinkoff.public.invest.api.contract.v1.MarketDataService/GetCandles',
      token,
      'POST',
      {
        figi,
        from: yesterday.from,
        to: yesterday.to,
        interval: 'CANDLE_INTERVAL_DAY',
      },
      CandlesResponseSchema
    );

    const previousClose = yesterdayResponse.candles.length > 0
      ? quotationToNumber(yesterdayResponse.candles[yesterdayResponse.candles.length - 1].close)
      : undefined;

    return {
      dayHigh: quotationToNumber(todayCandle.high),
      dayLow: quotationToNumber(todayCandle.low),
      previousClose,
    };
  } catch (error) {
    console.error(`Error fetching candle data for ${figi}:`, error);
    return {};
  }
}

/**
 * Fetch market index data from Tinkoff API
 */
async function fetchTinkoffIndex(
  indexKey: 'IMOEX' | 'RTSI',
  token: string
): Promise<MarketIndex> {
  const indexInfo = MARKET_INDICES[indexKey];

  if (!indexInfo.figi) {
    throw new Error(`No FIGI available for ${indexKey}`);
  }

  try {
    // Fetch current price
    const currentValue = await getLastPrice(indexInfo.figi, token);

    // Fetch candle data for high/low and previous close
    const candleData = await getCandleData(indexInfo.figi, token);

    // Calculate changes
    const previousClose = candleData.previousClose || currentValue;
    const changeAbsolute = currentValue - previousClose;
    const changePercent = calculatePercentChange(currentValue, previousClose);

    return {
      name: indexInfo.name,
      ticker: indexInfo.ticker,
      figi: indexInfo.figi,
      currentValue: Number(currentValue.toFixed(2)),
      changePercent: Number(changePercent.toFixed(2)),
      changeAbsolute: Number(changeAbsolute.toFixed(2)),
      dayHigh: candleData.dayHigh,
      dayLow: candleData.dayLow,
      previousClose: candleData.previousClose,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Error fetching ${indexKey}:`, error);
    throw error;
  }
}

/**
 * Fetch all market indices
 * Returns combination of real Tinkoff data and mock international data
 */
export async function fetchMarketIndices(token: string): Promise<MarketContextData> {
  const indices: MarketIndex[] = [];

  // Fetch Russian indices from Tinkoff API
  try {
    const imoex = await fetchTinkoffIndex('IMOEX', token);
    indices.push(imoex);
  } catch (error) {
    console.error('Failed to fetch IMOEX, using fallback');
    // Fallback mock data if Tinkoff API fails
    indices.push({
      name: 'Индекс МосБиржи',
      ticker: 'IMOEX',
      currentValue: 3200,
      changePercent: 0.5,
      changeAbsolute: 16,
      lastUpdated: new Date().toISOString(),
    });
  }

  try {
    const rtsi = await fetchTinkoffIndex('RTSI', token);
    indices.push(rtsi);
  } catch (error) {
    console.error('Failed to fetch RTSI, using fallback');
    // Fallback mock data if Tinkoff API fails
    indices.push({
      name: 'Индекс РТС',
      ticker: 'RTSI',
      currentValue: 1100,
      changePercent: -0.3,
      changeAbsolute: -3.3,
      lastUpdated: new Date().toISOString(),
    });
  }

  // Add international indices (mock data for now)
  indices.push(generateMockIndexData('SPX'));
  indices.push(generateMockIndexData('IXIC'));

  return {
    indices,
    lastUpdated: new Date().toISOString(),
  };
}
