import { z } from 'zod';

// ============================================================================
// Zod Schemas for Runtime Validation
// ============================================================================

const MoneyValueSchema = z.object({
  currency: z.string(),
  units: z.string(),
  nano: z.number(),
});

const QuotationSchema = z.object({
  units: z.string(),
  nano: z.number(),
});

const AccountSchema = z.object({
  id: z.string(),
  type: z.string(),
  name: z.string(),
  status: z.string(),
  openedDate: z.string().optional(),
  closedDate: z.string().optional(),
  accessLevel: z.string().optional(),
});

const PositionSchema = z.object({
  figi: z.string(),
  instrumentType: z.string(),
  quantity: QuotationSchema,
  averagePositionPrice: MoneyValueSchema,
  expectedYield: QuotationSchema,
  currentNkd: MoneyValueSchema.optional(),
  averagePositionPricePt: QuotationSchema.optional(),
  currentPrice: MoneyValueSchema.optional(),
  averagePositionPriceFifo: MoneyValueSchema.optional(),
  quantityLots: QuotationSchema.optional(),
});

const PortfolioPositionSchema = z.object({
  figi: z.string(),
  instrumentType: z.string(),
  quantity: QuotationSchema,
  averagePositionPrice: MoneyValueSchema,
  expectedYield: QuotationSchema,
  currentNkd: MoneyValueSchema.optional(),
  currentPrice: MoneyValueSchema,
  instrumentUid: z.string().optional(),
  blocked: z.boolean().optional(),
  // Enriched fields from InstrumentsService
  ticker: z.string().optional(),
  name: z.string().optional(),
});

const PortfolioResponseSchema = z.object({
  totalAmountShares: MoneyValueSchema,
  totalAmountBonds: MoneyValueSchema,
  totalAmountEtf: MoneyValueSchema,
  totalAmountCurrencies: MoneyValueSchema,
  totalAmountFutures: MoneyValueSchema,
  expectedYield: QuotationSchema,
  positions: z.array(PortfolioPositionSchema),
});

const AccountsResponseSchema = z.object({
  accounts: z.array(AccountSchema),
});

const InstrumentSchema = z.object({
  figi: z.string(),
  ticker: z.string(),
  classCode: z.string().optional(),
  isin: z.string().optional(),
  lot: z.number().optional(),
  currency: z.string().optional(),
  name: z.string(),
  exchange: z.string().optional(),
  instrumentType: z.string().optional(),
  uid: z.string().optional(),
});

const InstrumentResponseSchema = z.object({
  instrument: InstrumentSchema,
});

// ============================================================================
// TypeScript Types
// ============================================================================

export type MoneyValue = z.infer<typeof MoneyValueSchema>;
export type Quotation = z.infer<typeof QuotationSchema>;
export type Account = z.infer<typeof AccountSchema>;
export type Position = z.infer<typeof PositionSchema>;
export type PortfolioPosition = z.infer<typeof PortfolioPositionSchema>;
export type PortfolioResponse = z.infer<typeof PortfolioResponseSchema>;
export type AccountsResponse = z.infer<typeof AccountsResponseSchema>;
export type Instrument = z.infer<typeof InstrumentSchema>;
export type InstrumentResponse = z.infer<typeof InstrumentResponseSchema>;

export interface TinkoffAPIError {
  code: string;
  message: string;
  details?: unknown;
}

export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

// ============================================================================
// Configuration
// ============================================================================

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert MoneyValue to a number (units + nano)
 */
export function moneyValueToNumber(money: MoneyValue): number {
  const units = parseFloat(money.units);
  const nano = money.nano / 1_000_000_000;
  return units + nano;
}

/**
 * Convert Quotation to a number
 */
export function quotationToNumber(quotation: Quotation): number {
  const units = parseFloat(quotation.units);
  const nano = quotation.nano / 1_000_000_000;
  return units + nano;
}

/**
 * Sleep helper for retry logic
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay
 */
function calculateBackoffDelay(
  attempt: number,
  config: RetryConfig
): number {
  const delay = config.initialDelay * Math.pow(config.backoffMultiplier, attempt);
  return Math.min(delay, config.maxDelay);
}

/**
 * Generic retry wrapper with exponential backoff
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on client errors (4xx), only on server errors (5xx) and network errors
      if (error instanceof Response && error.status >= 400 && error.status < 500) {
        throw error;
      }

      if (attempt < config.maxRetries) {
        const delay = calculateBackoffDelay(attempt, config);
        console.log(`Retry attempt ${attempt + 1}/${config.maxRetries} after ${delay}ms`);
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

/**
 * Make authenticated request to Tinkoff API
 */
async function tinkoffRequest<T>(
  endpoint: string,
  token: string,
  method: 'GET' | 'POST' = 'GET',
  body?: unknown,
  schema?: z.ZodSchema<T>
): Promise<T> {
  const apiUrl = process.env.NEXT_PUBLIC_TINKOFF_API_URL || 'https://invest-public-api.tinkoff.ru/rest';
  const url = `${apiUrl}${endpoint}`;

  console.log('🔵 Tinkoff API Request:', {
    url,
    method,
    endpoint,
    hasToken: !!token,
    tokenLength: token?.length || 0,
    body: body ? JSON.stringify(body) : 'none',
  });

  const response = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  console.log('🔵 Tinkoff API Response:', {
    status: response.status,
    statusText: response.statusText,
    ok: response.ok,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('❌ Tinkoff API Error Response:', errorData);
    throw new Error(
      `Tinkoff API Error: ${response.status} ${response.statusText}. ${JSON.stringify(errorData)}`
    );
  }

  const data = await response.json();
  console.log('✅ Tinkoff API Success:', {
    dataKeys: Object.keys(data),
    dataSize: JSON.stringify(data).length,
  });

  // Validate with Zod if schema provided
  if (schema) {
    try {
      const validated = schema.parse(data);
      console.log('✅ Zod validation passed');
      return validated;
    } catch (error) {
      console.error('❌ Zod validation failed:', error);
      throw error;
    }
  }

  return data as T;
}

// ============================================================================
// Public API Methods
// ============================================================================

/**
 * Fetch all user accounts from Tinkoff
 * Uses retry logic with exponential backoff
 */
export async function fetchAccounts(token: string): Promise<Account[]> {
  const response = await withRetry(() =>
    tinkoffRequest<AccountsResponse>(
      '/tinkoff.public.invest.api.contract.v1.UsersService/GetAccounts',
      token,
      'POST',
      {},
      AccountsResponseSchema
    )
  );

  return response.accounts;
}

/**
 * Fetch portfolio for a specific account
 * Two-stage workflow: Request portfolio -> Get response
 * Uses retry logic for both stages
 * Enriches positions with instrument details (ticker, name)
 */
export async function fetchPortfolio(
  accountId: string,
  token: string
): Promise<PortfolioResponse> {
  // Stage 1: Request portfolio data
  const portfolio = await withRetry(() =>
    tinkoffRequest<PortfolioResponse>(
      '/tinkoff.public.invest.api.contract.v1.OperationsService/GetPortfolio',
      token,
      'POST',
      { accountId },
      PortfolioResponseSchema
    )
  );

  // Stage 2: Enrich positions with instrument details
  console.log('🔍 Enriching positions with instrument details...');
  const enrichedPositions = await Promise.all(
    portfolio.positions.map(async (position) => {
      try {
        const instrument = await getInstrumentByFigi(position.figi, token);
        console.log(`✅ Enriched ${position.figi} -> ${instrument.ticker} (${instrument.name})`);
        return {
          ...position,
          ticker: instrument.ticker,
          name: instrument.name,
        };
      } catch (error) {
        console.error(`❌ Failed to enrich position ${position.figi}:`, error);
        // Return position without enrichment if fetch fails
        return position;
      }
    })
  );

  return {
    ...portfolio,
    positions: enrichedPositions,
  };
}

/**
 * Fetch positions for a specific account (alternative method)
 */
export async function fetchPositions(
  accountId: string,
  token: string
): Promise<Position[]> {
  const response = await withRetry(() =>
    tinkoffRequest<{ positions: Position[] }>(
      '/tinkoff.public.invest.api.contract.v1.OperationsService/GetPositions',
      token,
      'POST',
      { accountId },
      z.object({ positions: z.array(PositionSchema) })
    )
  );

  return response.positions;
}

/**
 * Get instrument details by FIGI
 */
export async function getInstrumentByFigi(
  figi: string,
  token: string
): Promise<Instrument> {
  const response = await withRetry(() =>
    tinkoffRequest<InstrumentResponse>(
      '/tinkoff.public.invest.api.contract.v1.InstrumentsService/GetInstrumentBy',
      token,
      'POST',
      { idType: 'INSTRUMENT_ID_TYPE_FIGI', classCode: '', id: figi },
      InstrumentResponseSchema
    )
  );

  return response.instrument;
}

/**
 * Fetch operations (trading history) for a specific account
 * @param accountId - Account ID
 * @param token - API token
 * @param from - Start date (ISO string)
 * @param to - End date (ISO string)
 * @param figi - Optional: filter by specific instrument
 */
export async function fetchOperations(
  accountId: string,
  token: string,
  from: string,
  to: string,
  figi?: string
): Promise<Operation[]> {
  const OperationSchema = z.object({
    id: z.string(),
    parentOperationId: z.string().optional(),
    currency: z.string(),
    payment: MoneyValueSchema,
    price: MoneyValueSchema.optional(),
    state: z.string(),
    quantity: z.number(),
    quantityRest: z.number().optional(),
    figi: z.string(),
    instrumentType: z.string(),
    date: z.string(),
    type: z.string(),
    operationType: z.string().optional(),
    instrumentUid: z.string().optional(),
  });

  const OperationsResponseSchema = z.object({
    operations: z.array(OperationSchema),
  });

  type Operation = z.infer<typeof OperationSchema>;
  type OperationsResponse = z.infer<typeof OperationsResponseSchema>;

  const body: Record<string, unknown> = {
    accountId,
    from,
    to,
  };

  if (figi) {
    body.figi = figi;
  }

  const response = await withRetry(() =>
    tinkoffRequest<OperationsResponse>(
      '/tinkoff.public.invest.api.contract.v1.OperationsService/GetOperations',
      token,
      'POST',
      body,
      OperationsResponseSchema
    )
  );

  return response.operations;
}
