import { create } from 'zustand';
import { z } from 'zod';
import {
  PortfolioSnapshot,
  PortfolioMetrics,
  calculateMetrics,
} from '@/lib/analytics';

interface AnalyticsState {
  // State
  snapshots: PortfolioSnapshot[];
  metrics: PortfolioMetrics | null;
  selectedDays: 30 | 90 | 180 | 365 | 'all';
  loading: boolean;
  error: string | null;

  // Actions
  loadHistory: (accountId: string, days?: number) => Promise<void>;
  setSelectedDays: (days: 30 | 90 | 180 | 365 | 'all') => void;
  recalculateMetrics: () => void;
  clearHistory: () => void;
}

// ============================================================================
// Error Types & Configuration
// ============================================================================

// Enhanced error types for better error handling
enum ErrorType {
  NETWORK = 'NETWORK',
  TIMEOUT = 'TIMEOUT',
  SERVER = 'SERVER',
  VALIDATION = 'VALIDATION',
  PARSE = 'PARSE',
  UNKNOWN = 'UNKNOWN',
}

interface DetailedError {
  type: ErrorType;
  message: string;
  statusCode?: number;
  details?: unknown;
  retriable: boolean;
}

// Zod schema for API response validation
const ApiPositionSchema = z.object({
  symbol: z.string(),
  quantity: z.number(),
  currentPrice: z.number(),
  value: z.number(),
  investedValue: z.number().optional(),
});

const ApiSnapshotSchema = z.object({
  timestamp: z.string(),
  totalValue: z.number(),
  positions: z.array(ApiPositionSchema),
  currency: z.string(),
});

const ApiResponseSchema = z.object({
  success: z.boolean().optional(),
  snapshots: z.array(ApiSnapshotSchema),
  count: z.number().optional(),
});

// Retry configuration
interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

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
 * Sleep helper for retry logic
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay
 */
function calculateBackoffDelay(attempt: number, config: RetryConfig): number {
  const delay = config.initialDelay * Math.pow(config.backoffMultiplier, attempt);
  return Math.min(delay, config.maxDelay);
}

/**
 * Fetch with timeout support using AbortController
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 30000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeoutMs}ms`);
    }
    throw error;
  }
}

/**
 * Classify error type based on error characteristics
 */
function classifyError(error: unknown, response?: Response): DetailedError {
  // Network errors (no response)
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      type: ErrorType.NETWORK,
      message: 'Network error: Unable to connect to server',
      retriable: true,
    };
  }

  // Timeout errors
  if (error instanceof Error && error.message.includes('timeout')) {
    return {
      type: ErrorType.TIMEOUT,
      message: 'Request timeout: Server took too long to respond',
      retriable: true,
    };
  }

  // Validation errors (Zod)
  if (error instanceof z.ZodError) {
    return {
      type: ErrorType.VALIDATION,
      message: 'Data validation failed: Invalid API response format',
      details: error.issues,
      retriable: false,
    };
  }

  // Server errors (with response)
  if (response) {
    const isServerError = response.status >= 500;
    const isClientError = response.status >= 400 && response.status < 500;

    if (isServerError) {
      return {
        type: ErrorType.SERVER,
        message: `Server error: ${response.status} ${response.statusText}`,
        statusCode: response.status,
        retriable: true, // Retry on 5xx errors
      };
    }

    if (isClientError) {
      return {
        type: ErrorType.SERVER,
        message: `Client error: ${response.status} ${response.statusText}`,
        statusCode: response.status,
        retriable: false, // Don't retry on 4xx errors
      };
    }
  }

  // JSON parse errors
  if (error instanceof SyntaxError && error.message.includes('JSON')) {
    return {
      type: ErrorType.PARSE,
      message: 'Failed to parse server response as JSON',
      retriable: false,
    };
  }

  // Unknown errors
  return {
    type: ErrorType.UNKNOWN,
    message: error instanceof Error ? error.message : 'Unknown error occurred',
    details: error,
    retriable: false,
  };
}

/**
 * Safe JSON parse with error handling
 */
async function safeJsonParse<T>(response: Response): Promise<T> {
  const text = await response.text();

  console.log('📄 Raw response text:', {
    length: text.length,
    preview: text.substring(0, 200),
    isEmpty: text.length === 0,
  });

  if (!text || text.trim().length === 0) {
    throw new Error('Empty response body from server');
  }

  try {
    const parsed = JSON.parse(text);
    console.log('✅ JSON parsed successfully:', {
      keys: Object.keys(parsed),
      hasSnapshots: !!parsed.snapshots,
    });
    return parsed;
  } catch (error) {
    console.error('❌ JSON parse failed:', {
      error: error instanceof Error ? error.message : 'Unknown',
      textSample: text.substring(0, 500),
    });
    throw new Error(`Invalid JSON response: ${error instanceof Error ? error.message : 'Parse error'}`);
  }
}

/**
 * Fetch with retry logic and exponential backoff
 */
async function fetchWithRetry(
  url: string,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  timeoutMs: number = 30000
): Promise<Response> {
  let lastError: DetailedError | null = null;
  const startTime = Date.now();

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      console.log(`🔄 Fetch attempt ${attempt + 1}/${config.maxRetries + 1}:`, { url });

      const response = await fetchWithTimeout(url, {}, timeoutMs);
      const duration = Date.now() - startTime;

      console.log('✅ Fetch successful:', {
        attempt: attempt + 1,
        duration: `${duration}ms`,
        status: response.status,
      });

      return response;
    } catch (error) {
      const detailedError = classifyError(error);
      lastError = detailedError;

      console.error(`❌ Fetch attempt ${attempt + 1} failed:`, {
        type: detailedError.type,
        message: detailedError.message,
        retriable: detailedError.retriable,
      });

      // Don't retry if error is not retriable
      if (!detailedError.retriable) {
        console.log('⚠️ Error is not retriable, stopping attempts');
        throw detailedError;
      }

      // Don't retry on last attempt
      if (attempt < config.maxRetries) {
        const delay = calculateBackoffDelay(attempt, config);
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await sleep(delay);
      }
    }
  }

  // All retries exhausted
  console.error('❌ All retry attempts exhausted');
  throw lastError || new Error('All retry attempts failed');
}

const initialState = {
  snapshots: [],
  metrics: null,
  selectedDays: 30 as const,
  loading: false,
  error: null,
};

export const useAnalyticsStore = create<AnalyticsState>((set, get) => ({
  ...initialState,

  // Load portfolio history from API with enhanced error handling
  loadHistory: async (accountId: string, days?: number) => {
    const startTime = Date.now();
    set({ loading: true, error: null });

    try {
      const daysParam = days ?? get().selectedDays;
      const daysValue = daysParam === 'all' ? 'all' : daysParam.toString();
      const url = `/api/tinkoff/portfolio-history?accountId=${accountId}&days=${daysValue}`;

      console.log('📊 [Analytics Store] Loading portfolio history:', {
        accountId,
        days: daysValue,
        url,
        timestamp: new Date().toISOString(),
      });

      // Step 1: Fetch with retry and timeout
      let response: Response;
      try {
        response = await fetchWithRetry(url, DEFAULT_RETRY_CONFIG, 30000);
      } catch (error) {
        // Handle fetch errors (network, timeout, retries exhausted)
        const detailedError = error as DetailedError;
        console.error('❌ [Analytics Store] Fetch failed:', {
          type: detailedError.type,
          message: detailedError.message,
          statusCode: detailedError.statusCode,
          retriable: detailedError.retriable,
        });
        throw detailedError;
      }

      // Step 2: Log response headers and metadata
      console.log('📊 [Analytics Store] Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: {
          contentType: response.headers.get('content-type'),
          contentLength: response.headers.get('content-length'),
        },
      });

      // Step 3: Check response status
      if (!response.ok) {
        const responseText = await response.text();
        console.error('❌ [Analytics Store] API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          url,
          contentType: response.headers.get('content-type'),
          bodyLength: responseText.length,
          bodyPreview: responseText.substring(0, 500),
        });

        // Try to parse JSON error message
        let errorMessage = `Server returned ${response.status}: ${response.statusText}`;
        try {
          const errorData = JSON.parse(responseText);
          if (errorData.error) {
            errorMessage = errorData.error;
          }
          console.log('📄 [Analytics Store] Parsed error response:', errorData);
        } catch (parseError) {
          console.warn('⚠️ [Analytics Store] Could not parse error response as JSON');
        }

        const detailedError = classifyError(new Error(errorMessage), response);
        throw detailedError;
      }

      // Step 4: Safe JSON parsing
      let data: unknown;
      try {
        data = await safeJsonParse(response);
      } catch (error) {
        console.error('❌ [Analytics Store] JSON parse error:', error);
        throw classifyError(error);
      }

      // Step 5: Validate response structure with Zod
      let validatedData: z.infer<typeof ApiResponseSchema>;
      try {
        validatedData = ApiResponseSchema.parse(data);
        console.log('✅ [Analytics Store] Response validation passed:', {
          hasSnapshots: true,
          snapshotCount: validatedData.snapshots.length,
          success: validatedData.success,
        });
      } catch (error) {
        console.error('❌ [Analytics Store] Response validation failed:', {
          error: error instanceof z.ZodError ? error.issues : error,
          receivedData: data,
        });
        throw classifyError(error);
      }

      // Step 6: Process and transform snapshots
      const snapshots: PortfolioSnapshot[] = [];
      let invalidCount = 0;

      for (const [index, snapshot] of validatedData.snapshots.entries()) {
        try {
          const timestamp = new Date(snapshot.timestamp);

          // Validate timestamp
          if (isNaN(timestamp.getTime())) {
            console.error(`❌ [Analytics Store] Invalid timestamp at index ${index}:`, snapshot.timestamp);
            invalidCount++;
            continue;
          }

          snapshots.push({
            ...snapshot,
            timestamp,
          });
        } catch (error) {
          console.error(`❌ [Analytics Store] Failed to process snapshot at index ${index}:`, {
            error: error instanceof Error ? error.message : 'Unknown',
            snapshot,
          });
          invalidCount++;
        }
      }

      const duration = Date.now() - startTime;

      console.log('✅ [Analytics Store] Portfolio history loaded successfully:', {
        totalReceived: validatedData.snapshots.length,
        validSnapshots: snapshots.length,
        invalidSnapshots: invalidCount,
        duration: `${duration}ms`,
        dateRange: snapshots.length > 0 ? {
          from: snapshots[0].timestamp.toISOString(),
          to: snapshots[snapshots.length - 1].timestamp.toISOString(),
        } : null,
      });

      // Step 7: Update state
      set({
        snapshots,
        loading: false,
        error: null,
      });

      // Step 8: Recalculate metrics
      get().recalculateMetrics();

    } catch (error) {
      const duration = Date.now() - startTime;
      const detailedError = error as DetailedError;

      // Generate user-friendly error message
      let userMessage = 'Не удалось загрузить историю портфеля';

      switch (detailedError.type) {
        case ErrorType.NETWORK:
          userMessage = 'Ошибка сети: не удалось подключиться к серверу';
          break;
        case ErrorType.TIMEOUT:
          userMessage = 'Превышено время ожидания: сервер не ответил вовремя';
          break;
        case ErrorType.SERVER:
          userMessage = `Ошибка сервера: ${detailedError.statusCode || 'неизвестная'}`;
          break;
        case ErrorType.VALIDATION:
          userMessage = 'Ошибка валидации: неверный формат данных от сервера';
          break;
        case ErrorType.PARSE:
          userMessage = 'Ошибка парсинга: не удалось обработать ответ сервера';
          break;
        default:
          userMessage = detailedError.message || 'Неизвестная ошибка';
      }

      console.error('❌ [Analytics Store] Load failed:', {
        accountId,
        days: days ?? get().selectedDays,
        errorType: detailedError.type,
        errorMessage: detailedError.message,
        userMessage,
        statusCode: detailedError.statusCode,
        retriable: detailedError.retriable,
        duration: `${duration}ms`,
        details: detailedError.details,
      });

      set({
        loading: false,
        error: userMessage,
        snapshots: [],
        metrics: null,
      });
    }
  },

  // Update selected time period
  setSelectedDays: (days: 30 | 90 | 180 | 365 | 'all') => {
    set({ selectedDays: days });
  },

  // Recalculate metrics based on current snapshots
  recalculateMetrics: () => {
    const { snapshots } = get();

    // Handle empty snapshots
    if (!snapshots || snapshots.length === 0) {
      set({ metrics: null });
      return;
    }

    // Get the last snapshot (current state)
    const currentSnapshot = snapshots[snapshots.length - 1];

    // Calculate comprehensive metrics
    const metrics = calculateMetrics(currentSnapshot, snapshots);

    set({ metrics });
  },

  // Clear all history and metrics
  clearHistory: () => {
    set({
      snapshots: [],
      metrics: null,
      error: null,
    });
  },
}));
