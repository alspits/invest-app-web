import { classifyError, type DetailedError } from './error-classifier';
import { fetchWithTimeout, calculateBackoffDelay, sleep } from './fetch-utils';

/**
 * Retry configuration for HTTP requests
 */
export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

/**
 * Default retry configuration with exponential backoff
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
};

/**
 * Fetch with retry logic and exponential backoff
 *
 * This function attempts to fetch a URL with automatic retries on failures.
 * It uses exponential backoff for retry delays and only retries retriable errors.
 *
 * @param url - URL to fetch
 * @param config - Retry configuration (defaults to DEFAULT_RETRY_CONFIG)
 * @param timeoutMs - Timeout for each individual request in milliseconds (default: 30000)
 * @returns Response object on success
 * @throws DetailedError on failure after all retries exhausted
 */
export async function fetchWithRetry(
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
