/**
 * Benchmark Data Accessor
 *
 * Provides access to MOEX benchmark data
 */

import type { MOEXBenchmark } from '@/types/analytics';
import { MOEX_BENCHMARK } from './data/moex-benchmark';

/**
 * Get MOEX benchmark data
 *
 * Returns official MOEX Index benchmark weights for sector and geography allocation.
 * Used for comparison with portfolio allocations to calculate tilts and deviations.
 *
 * @returns MOEX benchmark data with sector and geography weights
 */
export function getMOEXBenchmark(): MOEXBenchmark {
  return MOEX_BENCHMARK;
}
