/**
 * HTTP utilities for robust API communication
 *
 * This module provides utilities for making HTTP requests with:
 * - Error classification and handling
 * - Automatic retries with exponential backoff
 * - Request timeouts
 * - Safe JSON parsing
 */

// Error classification
export { ErrorType, classifyError } from './error-classifier';
export type { DetailedError } from './error-classifier';

// Fetch utilities
export { sleep, calculateBackoffDelay, fetchWithTimeout, safeJsonParse } from './fetch-utils';

// Retry logic
export { fetchWithRetry, DEFAULT_RETRY_CONFIG } from './retry';
export type { RetryConfig } from './retry';
