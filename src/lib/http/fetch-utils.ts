import type { DetailedError } from './error-classifier';

/**
 * Sleep helper for retry logic
 *
 * @param ms - Milliseconds to sleep
 * @returns Promise that resolves after the specified time
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay
 *
 * @param attempt - Current attempt number (0-indexed)
 * @param config - Retry configuration with backoff settings
 * @returns Calculated delay in milliseconds
 */
export function calculateBackoffDelay(
  attempt: number,
  config: { initialDelay: number; maxDelay: number; backoffMultiplier: number }
): number {
  const delay = config.initialDelay * Math.pow(config.backoffMultiplier, attempt);
  return Math.min(delay, config.maxDelay);
}

/**
 * Fetch with timeout support using AbortController
 *
 * @param url - URL to fetch
 * @param options - Fetch options
 * @param timeoutMs - Timeout in milliseconds (default: 30000)
 * @returns Response object
 * @throws Error if request times out
 */
export async function fetchWithTimeout(
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
 * Safe JSON parse with error handling and logging
 *
 * @param response - HTTP response to parse
 * @returns Parsed JSON data
 * @throws Error if response is empty or invalid JSON
 */
export async function safeJsonParse<T>(response: Response): Promise<T> {
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
