import { z } from 'zod';

/**
 * Enhanced error types for better error handling
 */
export enum ErrorType {
  NETWORK = 'NETWORK',
  TIMEOUT = 'TIMEOUT',
  SERVER = 'SERVER',
  VALIDATION = 'VALIDATION',
  PARSE = 'PARSE',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Detailed error interface with classification and retry information
 */
export interface DetailedError {
  type: ErrorType;
  message: string;
  statusCode?: number;
  details?: unknown;
  retriable: boolean;
}

/**
 * Classify error type based on error characteristics
 *
 * @param error - The error to classify
 * @param response - Optional HTTP response for context
 * @returns Detailed error with type classification and retry recommendation
 */
export function classifyError(error: unknown, response?: Response): DetailedError {
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
