import { NewsItem } from '@/lib/news-api';

/**
 * Sentiment analysis for news articles
 * Provides simple keyword-based sentiment scoring
 */
export class SentimentAnalyzer {
  /**
   * Calculate average sentiment from news articles
   * Returns value between -1 (very negative) and 1 (very positive)
   * @param articles - Array of news articles
   * @returns average sentiment score
   */
  static calculateSentiment(articles: NewsItem[]): number {
    if (articles.length === 0) return 0;

    // Simple keyword-based sentiment
    const sentiments = articles.map((article) =>
      this.analyzeSingleArticle(article)
    );

    return sentiments.reduce((sum, s) => sum + s, 0) / sentiments.length;
  }

  /**
   * Analyze single article sentiment
   * @param article - News article to analyze
   * @returns sentiment score between -1 and 1
   */
  private static analyzeSingleArticle(article: NewsItem): number {
    const text = `${article.title} ${article.description || ''}`.toLowerCase();

    // Negative keywords (Russian)
    const negativeKeywords = [
      'падение',
      'снижение',
      'убыток',
      'кризис',
      'банкротство',
      'риск',
      'потери',
      'долг',
      'падают',
      'снижаются',
      'обвал',
      'дефолт',
      'санкции',
    ];

    // Positive keywords (Russian)
    const positiveKeywords = [
      'рост',
      'прибыль',
      'успех',
      'достижение',
      'увеличение',
      'дивиденд',
      'растут',
      'повышение',
      'расширение',
      'инновация',
      'лидер',
      'прорыв',
    ];

    let score = 0;

    negativeKeywords.forEach((keyword) => {
      if (text.includes(keyword)) score -= 0.2;
    });

    positiveKeywords.forEach((keyword) => {
      if (text.includes(keyword)) score += 0.2;
    });

    // Clamp between -1 and 1
    return Math.max(-1, Math.min(1, score));
  }
}
