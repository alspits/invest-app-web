import { z } from 'zod';
import type { PortfolioSnapshot } from '@/lib/analytics';
import { calculateMetrics } from '@/lib/analytics';
import {
  ErrorType,
  type DetailedError,
  classifyError,
  fetchWithRetry,
  safeJsonParse,
  DEFAULT_RETRY_CONFIG,
} from '@/lib/http';
import { ApiResponseSchema } from './schemas';

/**
 * Load portfolio history from API with enhanced error handling
 *
 * @param set - Zustand set function
 * @param get - Zustand get function
 * @param accountId - Account ID to load history for
 * @param days - Number of days to load (optional)
 */
export async function loadHistoryAction(
  set: any,
  get: any,
  accountId: string,
  days?: number
): Promise<void> {
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
}
