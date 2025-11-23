import { NewsItem } from '@/lib/news-api';

// ============================================================================
// Market Data Interface
// ============================================================================

/**
 * Market data required for alert evaluation
 */
export interface MarketData {
  ticker: string;
  price: number;
  previousClose: number;
  volume: number;
  averageVolume?: number;
  peRatio?: number;
  rsi?: number;
  movingAvg50?: number;
  movingAvg200?: number;
  marketCap?: number;
  timestamp: Date;
}

/**
 * News data for alert evaluation
 */
export interface NewsData {
  ticker: string;
  articles: NewsItem[];
  averageSentiment?: number;
  newsCount: number;
}

/**
 * Historical price data point
 */
export interface PriceDataPoint {
  timestamp: Date;
  price: number;
  volume: number;
}
