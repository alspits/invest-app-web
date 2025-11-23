import { NewsData } from '../types';

/**
 * Evaluate news-triggered alert
 * @param newsData - News data to evaluate
 * @param sentimentThreshold - Negative sentiment threshold (default: -0.3)
 * @returns evaluation result with trigger reason and conditions met
 */
export function evaluateNewsTrigger(
  newsData: NewsData | undefined,
  sentimentThreshold: number = -0.3
): { triggered: boolean; triggerReason: string; conditionsMet: string[] } {
  if (!newsData || newsData.newsCount === 0) {
    return {
      triggered: false,
      triggerReason: 'No news data available',
      conditionsMet: [],
    };
  }

  // Check for negative sentiment threshold
  const hasNegativeSentiment =
    newsData.averageSentiment !== undefined &&
    newsData.averageSentiment < sentimentThreshold;

  if (hasNegativeSentiment) {
    return {
      triggered: true,
      triggerReason: `Negative news sentiment detected: ${newsData.averageSentiment?.toFixed(2)}`,
      conditionsMet: [
        `${newsData.newsCount} news articles with negative sentiment`,
      ],
    };
  }

  return {
    triggered: false,
    triggerReason: 'No negative news sentiment',
    conditionsMet: [],
  };
}
