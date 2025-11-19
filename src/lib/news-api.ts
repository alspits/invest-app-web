import { z } from 'zod';

// ============================================================================
// Zod Schemas for Runtime Validation
// ============================================================================

const NewsSourceSchema = z.object({
  id: z.string().nullable(),
  name: z.string(),
});

const NewsArticleSchema = z.object({
  source: NewsSourceSchema,
  author: z.string().nullable(),
  title: z.string(),
  description: z.string().nullable(),
  url: z.string(),
  urlToImage: z.string().nullable(),
  publishedAt: z.string(),
  content: z.string().nullable(),
});

const NewsAPIResponseSchema = z.object({
  status: z.string(),
  totalResults: z.number(),
  articles: z.array(NewsArticleSchema),
});

// ============================================================================
// TypeScript Types
// ============================================================================

export type NewsSource = z.infer<typeof NewsSourceSchema>;
export type NewsArticle = z.infer<typeof NewsArticleSchema>;
export type NewsAPIResponse = z.infer<typeof NewsAPIResponseSchema>;

export interface NewsItem {
  id: string;
  title: string;
  description: string | null;
  source: string;
  publishedDate: Date;
  imageURL: string | null;
  articleURL: string;
  relevantAssets: string[]; // Array of tickers
}

export interface NewsAPIError {
  code: string;
  message: string;
  details?: unknown;
}

export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

// ============================================================================
// Configuration
// ============================================================================

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Sleep helper for retry logic
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay
 */
function calculateBackoffDelay(
  attempt: number,
  config: RetryConfig
): number {
  const delay = config.initialDelay * Math.pow(config.backoffMultiplier, attempt);
  return Math.min(delay, config.maxDelay);
}

/**
 * Generic retry wrapper with exponential backoff
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on client errors (4xx), only on server errors (5xx) and network errors
      if (error instanceof Response && error.status >= 400 && error.status < 500) {
        throw error;
      }

      if (attempt < config.maxRetries) {
        const delay = calculateBackoffDelay(attempt, config);
        console.log(`Retry attempt ${attempt + 1}/${config.maxRetries} after ${delay}ms`);
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

/**
 * Create a unique ID from article title and published date
 */
function createArticleId(title: string, publishedAt: string): string {
  const hash = `${title}-${publishedAt}`.split('').reduce((acc, char) => {
    return ((acc << 5) - acc + char.charCodeAt(0)) | 0;
  }, 0);
  return Math.abs(hash).toString(36);
}

/**
 * Convert NewsAPI article to NewsItem format
 */
function convertToNewsItem(article: NewsArticle, relevantTickers: string[]): NewsItem {
  return {
    id: createArticleId(article.title, article.publishedAt),
    title: article.title,
    description: article.description,
    source: article.source.name,
    publishedDate: new Date(article.publishedAt),
    imageURL: article.urlToImage,
    articleURL: article.url,
    relevantAssets: relevantTickers,
  };
}

/**
 * Check if article mentions any of the given tickers
 */
function findRelevantTickers(article: NewsArticle, tickers: string[]): string[] {
  const searchText = `${article.title} ${article.description || ''} ${article.content || ''}`.toLowerCase();

  return tickers.filter(ticker => {
    const tickerLower = ticker.toLowerCase();
    // Match ticker as whole word with common separators
    const regex = new RegExp(`\\b${tickerLower}\\b`, 'i');
    return regex.test(searchText);
  });
}

/**
 * Make request to NewsAPI
 */
async function newsAPIRequest(
  endpoint: string,
  apiKey: string,
  params: Record<string, string>
): Promise<NewsAPIResponse> {
  const baseUrl = 'https://newsapi.org/v2';
  const url = new URL(`${baseUrl}${endpoint}`);

  // Add API key and params
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  console.log('🔵 NewsAPI Request:', {
    url: url.toString().replace(apiKey, 'REDACTED'),
    endpoint,
    params,
  });

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'X-Api-Key': apiKey,
    },
  });

  console.log('🔵 NewsAPI Response:', {
    status: response.status,
    statusText: response.statusText,
    ok: response.ok,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('❌ NewsAPI Error Response:', errorData);
    throw new Error(
      `NewsAPI Error: ${response.status} ${response.statusText}. ${JSON.stringify(errorData)}`
    );
  }

  const data = await response.json();
  console.log('✅ NewsAPI Success:', {
    totalResults: data.totalResults,
    articlesCount: data.articles?.length || 0,
  });

  // Validate with Zod
  try {
    const validated = NewsAPIResponseSchema.parse(data);
    console.log('✅ Zod validation passed');
    return validated;
  } catch (error) {
    console.error('❌ Zod validation failed:', error);
    throw error;
  }
}

// ============================================================================
// Public API Methods
// ============================================================================

/**
 * Fetch financial news filtered by portfolio tickers
 * Uses retry logic with exponential backoff
 *
 * @param tickers - Array of stock tickers from user's portfolio
 * @param apiKey - NewsAPI key
 * @param language - Language code (default: 'ru' for Russian)
 * @param pageSize - Number of articles to fetch (max 100)
 * @returns Array of NewsItems filtered to show only relevant articles
 */
export async function fetchFinancialNews(
  tickers: string[],
  apiKey: string,
  language: 'ru' | 'en' = 'ru',
  pageSize: number = 50
): Promise<NewsItem[]> {
  // Fetch general financial news
  const response = await withRetry(() =>
    newsAPIRequest('/everything', apiKey, {
      q: 'фондовый рынок OR акции OR инвестиции OR биржа',
      language,
      sortBy: 'publishedAt',
      pageSize: pageSize.toString(),
    })
  );

  // Filter and convert articles to NewsItems
  const newsItems: NewsItem[] = [];

  for (const article of response.articles) {
    const relevantTickers = findRelevantTickers(article, tickers);

    // Only include articles that mention at least one ticker from the portfolio
    if (relevantTickers.length > 0) {
      newsItems.push(convertToNewsItem(article, relevantTickers));
    }
  }

  console.log(`✅ Filtered ${newsItems.length} relevant articles from ${response.articles.length} total`);
  return newsItems;
}

/**
 * Fetch news for specific ticker
 *
 * @param ticker - Stock ticker to search for
 * @param apiKey - NewsAPI key
 * @param language - Language code (default: 'ru' for Russian)
 * @param pageSize - Number of articles to fetch (max 100)
 * @returns Array of NewsItems for the specific ticker
 */
export async function fetchTickerNews(
  ticker: string,
  apiKey: string,
  language: 'ru' | 'en' = 'ru',
  pageSize: number = 20
): Promise<NewsItem[]> {
  const response = await withRetry(() =>
    newsAPIRequest('/everything', apiKey, {
      q: ticker,
      language,
      sortBy: 'publishedAt',
      pageSize: pageSize.toString(),
    })
  );

  // Convert all articles to NewsItems
  const newsItems = response.articles.map(article =>
    convertToNewsItem(article, [ticker])
  );

  console.log(`✅ Found ${newsItems.length} articles for ticker ${ticker}`);
  return newsItems;
}

/**
 * Fetch top business headlines
 * Can be used as fallback if no portfolio-specific news found
 *
 * @param apiKey - NewsAPI key
 * @param country - Country code (default: 'ru' for Russia)
 * @param pageSize - Number of articles to fetch (max 100)
 * @returns Array of NewsItems
 */
export async function fetchBusinessHeadlines(
  apiKey: string,
  country: 'ru' | 'us' = 'ru',
  pageSize: number = 20
): Promise<NewsItem[]> {
  const response = await withRetry(() =>
    newsAPIRequest('/top-headlines', apiKey, {
      category: 'business',
      country,
      pageSize: pageSize.toString(),
    })
  );

  // Convert all articles to NewsItems (no ticker filtering for headlines)
  const newsItems = response.articles.map(article =>
    convertToNewsItem(article, [])
  );

  console.log(`✅ Found ${newsItems.length} business headlines`);
  return newsItems;
}
