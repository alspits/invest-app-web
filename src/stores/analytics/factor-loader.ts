import { z } from 'zod';
import {
  ErrorType,
  type DetailedError,
  classifyError,
  fetchWithRetry,
  safeJsonParse,
  DEFAULT_RETRY_CONFIG,
} from '@/lib/http';

/**
 * Load factor analysis from API with enhanced error handling
 *
 * @param set - Zustand set function
 * @param get - Zustand get function
 * @param accountId - Account ID to load factor analysis for
 */
export async function loadFactorAnalysisAction(
  set: any,
  get: any,
  accountId: string
): Promise<void> {
  const startTime = Date.now();
  set({ factorLoading: true, factorError: null });

  try {
    const url = `/api/analytics/factors?accountId=${accountId}`;

    console.log('📊 [Analytics Store] Loading factor analysis:', {
      accountId,
      url,
      timestamp: new Date().toISOString(),
    });

    // Fetch with retry and timeout
    let response: Response;
    try {
      response = await fetchWithRetry(url, DEFAULT_RETRY_CONFIG, 30000);
    } catch (error) {
      const detailedError = error as DetailedError;
      console.error('❌ [Analytics Store] Factor analysis fetch failed:', {
        type: detailedError.type,
        message: detailedError.message,
      });
      throw detailedError;
    }

    // Check response status
    if (!response.ok) {
      const responseText = await response.text();
      console.error('❌ [Analytics Store] Factor API Error:', {
        status: response.status,
        statusText: response.statusText,
        bodyPreview: responseText.substring(0, 500),
      });

      let errorMessage = `Server returned ${response.status}: ${response.statusText}`;
      try {
        const errorData = JSON.parse(responseText);
        if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch (parseError) {
        // Ignore parse errors
      }

      const detailedError = classifyError(new Error(errorMessage), response);
      throw detailedError;
    }

    // Parse JSON response
    let data: unknown;
    try {
      data = await safeJsonParse(response);
    } catch (error) {
      console.error('❌ [Analytics Store] Factor JSON parse error:', error);
      throw classifyError(error);
    }

    // Validate response structure
    const responseSchema = z.object({
      success: z.boolean(),
      data: z.any(), // FactorAnalysis type
      metadata: z.object({
        accountId: z.string(),
        positionsCount: z.number(),
        totalValue: z.number(),
        timestamp: z.string(),
        duration: z.number(),
      }).optional(),
    });

    let validatedData: z.infer<typeof responseSchema>;
    try {
      validatedData = responseSchema.parse(data);
    } catch (error) {
      console.error('❌ [Analytics Store] Factor response validation failed:', {
        error: error instanceof z.ZodError ? error.issues : error,
      });
      throw classifyError(error);
    }

    const duration = Date.now() - startTime;

    console.log('✅ [Analytics Store] Factor analysis loaded:', {
      duration: `${duration}ms`,
      positionsCount: validatedData.metadata?.positionsCount,
      sectorCount: validatedData.data.sectorExposure?.length,
    });

    // Update state
    set({
      factorAnalysis: validatedData.data,
      factorLoading: false,
      factorError: null,
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    const detailedError = error as DetailedError;

    // Generate user-friendly error message
    let userMessage = 'Не удалось загрузить факторный анализ';

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

    console.error('❌ [Analytics Store] Factor analysis load failed:', {
      accountId,
      errorType: detailedError.type,
      errorMessage: detailedError.message,
      userMessage,
      duration: `${duration}ms`,
    });

    set({
      factorLoading: false,
      factorError: userMessage,
      factorAnalysis: null,
    });
  }
}
