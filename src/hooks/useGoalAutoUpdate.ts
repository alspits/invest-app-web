import { useEffect } from 'react';
import { usePortfolioStore } from '@/stores/portfolioStore';
import { useAnalyticsStore } from '@/stores/analytics';
import { useGoalStore } from '@/stores/goalStore';
import { moneyValueToNumber, quotationToNumber } from '@/lib/tinkoff-api';

/**
 * Hook to auto-update goals based on portfolio and analytics changes
 */
export function useGoalAutoUpdate() {
  const { portfolio, selectedAccountId } = usePortfolioStore();
  const { metrics } = useAnalyticsStore();
  const { autoUpdateGoals } = useGoalStore();

  useEffect(() => {
    if (!selectedAccountId || !portfolio) return;

    // Calculate total portfolio value
    const totalValue = calculateTotalValue();

    // Get return percentage from metrics
    const returnPercent = metrics?.roi || 0;

    // Get diversification score from metrics
    const diversificationScore = metrics?.diversificationScore || 0;

    // Auto-update goals
    autoUpdateGoals(selectedAccountId, {
      totalValue,
      returnPercent,
      diversificationScore,
    });
  }, [portfolio, metrics, selectedAccountId, autoUpdateGoals]);

  /**
   * Calculate total portfolio value from current positions
   */
  function calculateTotalValue(): number {
    if (!portfolio) return 0;

    let total = 0;

    // Add up all position values
    portfolio.positions.forEach((position) => {
      const quantity = quotationToNumber(position.quantity);
      const price = position.currentPrice
        ? moneyValueToNumber(position.currentPrice)
        : 0;
      total += quantity * price;
    });

    return total;
  }
}
