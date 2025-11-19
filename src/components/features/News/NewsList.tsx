'use client';

import { NewsItem } from '@/lib/news-api';
import { NewsCard } from './NewsCard';
import { Newspaper } from 'lucide-react';

interface NewsListProps {
  news: NewsItem[];
  isLoading: boolean;
  error: string | null;
  onRetry?: () => void;
}

export function NewsList({ news, isLoading, error, onRetry }: NewsListProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Загрузка новостей...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-red-800 font-semibold mb-2">
          Ошибка загрузки новостей
        </h3>
        <p className="text-red-600 mb-4">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Повторить попытку
          </button>
        )}
      </div>
    );
  }

  // Empty state
  if (news.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-12">
        <div className="text-center">
          <Newspaper className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-gray-700 font-semibold mb-2">
            Нет новостей
          </h3>
          <p className="text-gray-500">
            Новостей по вашим активам пока не найдено
          </p>
        </div>
      </div>
    );
  }

  // News list
  return (
    <div className="space-y-4">
      {news.map((newsItem) => (
        <NewsCard key={newsItem.id} newsItem={newsItem} />
      ))}
    </div>
  );
}
