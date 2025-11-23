import {
  AlertCondition,
  AlertConditionGroup,
} from '@/types/alert';
import { MarketData, NewsData } from '../types';
import { compareValues, operatorToSymbol, getFieldValue } from './operator-utils';

/**
 * Safely format a field value for display
 * @param value - Value to format
 * @returns formatted string
 */
function safeFormatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return 'N/A';
  }

  // If already a finite number, format with 2 decimals
  if (typeof value === 'number' && isFinite(value)) {
    return value.toFixed(2);
  }

  // Try converting to number
  const numValue = Number(value);
  if (!isNaN(numValue) && isFinite(numValue)) {
    return numValue.toFixed(2);
  }

  // Fallback to string representation
  return String(value);
}

/**
 * Evaluate condition groups with boolean logic
 * @param conditionGroups - Array of condition groups to evaluate
 * @param marketData - Market data
 * @param newsData - Optional news data
 * @returns evaluation result with trigger reason and conditions met
 */
export function evaluateConditions(
  conditionGroups: AlertConditionGroup[],
  marketData: MarketData,
  newsData?: NewsData
): { triggered: boolean; triggerReason: string; conditionsMet: string[] } {
  let conditionsMet: string[] = [];
  let triggered = false;

  for (const group of conditionGroups) {
    const groupResults = group.conditions.map((condition) =>
      evaluateSingleCondition(condition, marketData, newsData)
    );

    const groupMet =
      group.logic === 'AND'
        ? groupResults.every((r) => r.met)
        : groupResults.some((r) => r.met);

    if (groupMet) {
      triggered = true;
      conditionsMet = [
        ...conditionsMet,
        ...groupResults.filter((r) => r.met).map((r) => r.description)
      ];
    }
  }

  const triggerReason = triggered
    ? `Conditions met: ${conditionsMet.join(', ')}`
    : 'No conditions met';

  return { triggered, triggerReason, conditionsMet };
}

/**
 * Evaluate a single condition
 * @param condition - Condition to evaluate
 * @param marketData - Market data
 * @param newsData - Optional news data
 * @returns evaluation result with description
 */
export function evaluateSingleCondition(
  condition: AlertCondition,
  marketData: MarketData,
  newsData?: NewsData
): { met: boolean; description: string } {
  const fieldValue = getFieldValue(condition.field, marketData, newsData);

  if (fieldValue === null) {
    return { met: false, description: `${condition.field} data unavailable` };
  }

  const met = compareValues(fieldValue, condition.operator, condition.value);

  const description = `${condition.field} ${operatorToSymbol(
    condition.operator
  )} ${condition.value} (actual: ${safeFormatValue(fieldValue)})`;

  return { met, description };
}
