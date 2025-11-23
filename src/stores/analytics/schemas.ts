import { z } from 'zod';

/**
 * Zod schema for API position object
 */
export const ApiPositionSchema = z.object({
  symbol: z.string(),
  quantity: z.number(),
  currentPrice: z.number(),
  value: z.number(),
  investedValue: z.number().optional(),
});

/**
 * Zod schema for API portfolio snapshot
 */
export const ApiSnapshotSchema = z.object({
  timestamp: z.string(),
  totalValue: z.number(),
  positions: z.array(ApiPositionSchema),
  currency: z.string(),
});

/**
 * Zod schema for API response from portfolio history endpoint
 */
export const ApiResponseSchema = z.object({
  success: z.boolean().optional(),
  snapshots: z.array(ApiSnapshotSchema),
  count: z.number().optional(),
});
