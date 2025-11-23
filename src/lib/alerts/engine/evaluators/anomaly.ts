import { AnomalyConfig } from '@/types/alert';
import { MarketData, NewsData, PriceDataPoint } from '../types';

/**
 * Evaluate anomaly detection alert
 * @param marketData - Current market data
 * @param newsData - Optional news data
 * @param historicalData - Optional historical price data
 * @param config - Anomaly detection configuration
 * @returns evaluation result with trigger reason and conditions met
 */
export function evaluateAnomaly(
  marketData: MarketData,
  newsData: NewsData | undefined,
  historicalData: PriceDataPoint[] | undefined,
  config: AnomalyConfig
): { triggered: boolean; triggerReason: string; conditionsMet: string[] } {
  const defaultConfig: AnomalyConfig = {
    priceChangeThreshold: 15,
    volumeSpikeMultiplier: 5,
    statisticalSigma: 2,
    requiresNoNews: true,
    newsLookbackHours: 24,
  };

  const finalConfig = { ...defaultConfig, ...config };
  const conditionsMet: string[] = [];

  // 1. Check price change anomaly
  // Guard against division by zero
  const priceChange = marketData.previousClose === 0
    ? 0
    : ((marketData.price - marketData.previousClose) / marketData.previousClose) * 100;
  const isPriceAnomaly = Math.abs(priceChange) >= finalConfig.priceChangeThreshold;

  if (isPriceAnomaly) {
    conditionsMet.push(
      `Price change: ${priceChange.toFixed(2)}% (threshold: ${finalConfig.priceChangeThreshold}%)`
    );
  }

  // 2. Check volume spike
  const isVolumeSpike =
    marketData.averageVolume &&
    marketData.volume >= marketData.averageVolume * finalConfig.volumeSpikeMultiplier;

  if (isVolumeSpike) {
    conditionsMet.push(
      `Volume spike: ${(marketData.volume / (marketData.averageVolume || 1)).toFixed(1)}x average`
    );
  }

  // 3. Check statistical outlier (if historical data available)
  let isStatisticalOutlier = false;
  if (historicalData && historicalData.length >= 20) {
    const { mean, stdDev } = calculateStatistics(historicalData);
    const zScore = Math.abs((marketData.price - mean) / stdDev);
    isStatisticalOutlier = zScore >= finalConfig.statisticalSigma;

    if (isStatisticalOutlier) {
      conditionsMet.push(
        `Statistical outlier: ${zScore.toFixed(2)}σ from mean`
      );
    }
  }

  // 4. Check news requirement
  const hasRecentNews = newsData && newsData.newsCount > 0;
  const meetsNewsRequirement = finalConfig.requiresNoNews ? !hasRecentNews : true;

  if (finalConfig.requiresNoNews && hasRecentNews) {
    // Anomaly not triggered because news explains the movement
    // Preserve detected conditions for observability/debugging
    return {
      triggered: false,
      triggerReason: 'Anomaly detected but explained by news',
      conditionsMet, // Return accumulated conditions instead of empty array
    };
  }

  // Trigger if any anomaly is detected and news requirement is met
  const triggered =
    (isPriceAnomaly || isVolumeSpike || isStatisticalOutlier) &&
    meetsNewsRequirement;

  const triggerReason = triggered
    ? `Anomaly detected: ${conditionsMet.join('; ')}`
    : 'No anomaly detected';

  return { triggered, triggerReason, conditionsMet };
}

/**
 * Calculate mean and standard deviation
 * @param data - Historical price data
 * @returns mean and standard deviation
 * @throws {Error} If data array is empty
 */
export function calculateStatistics(data: PriceDataPoint[]): {
  mean: number;
  stdDev: number;
} {
  if (data.length === 0) {
    throw new Error('calculateStatistics requires at least one data point');
  }

  const prices = data.map((d) => d.price);
  const mean = prices.reduce((sum, p) => sum + p, 0) / prices.length;

  const variance =
    prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / prices.length;
  const stdDev = Math.sqrt(variance);

  return { mean, stdDev };
}
