import type { Operation, InstrumentOperations } from '@/types/trading-pattern';

/**
 * Group operations by instrument (FIGI) and sort chronologically
 *
 * @param operations - Array of executed operations
 * @returns Array of instrument operations grouped by FIGI
 *
 * @example
 * ```typescript
 * const grouped = groupOperationsByInstrument(operations);
 * // Returns: [{ figi: 'BBG...', operations: [...] }, ...]
 * ```
 */
export function groupOperationsByInstrument(
  operations: Operation[]
): InstrumentOperations[] {
  const grouped = new Map<string, Operation[]>();

  for (const op of operations) {
    if (!grouped.has(op.figi)) {
      grouped.set(op.figi, []);
    }
    grouped.get(op.figi)!.push(op);
  }

  return Array.from(grouped.entries()).map(([figi, ops]) => ({
    figi,
    operations: ops.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    ),
  }));
}
