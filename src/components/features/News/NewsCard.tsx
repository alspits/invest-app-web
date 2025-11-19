'use client';

import { NewsItem } from '@/lib/news-api';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ExternalLink, Calendar } from 'lucide-react';

interface NewsCardProps {
  newsItem: NewsItem;
  onClick?: () => void;
}

export function NewsCard({ newsItem, onClick }: NewsCardProps) {
  const {
    title,
    description,
    source,
    publishedDate,
    imageURL,
    articleURL,
    relevantAssets,
  } = newsItem;

  const timeAgo = formatDistanceToNow(publishedDate, {
    addSuffix: true,
    locale: ru,
  });

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      window.open(articleURL, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <article
      onClick={handleClick}
      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex gap-4 p-4">
        {/* Image */}
        {imageURL && (
          <div className="flex-shrink-0 w-32 h-32 bg-gray-100 rounded-lg overflow-hidden">
            <img
              src={imageURL}
              alt={title}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Hide image on error
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
              {title}
            </h3>
            <ExternalLink className="flex-shrink-0 w-4 h-4 text-gray-400" />
          </div>

          {/* Description */}
          {description && (
            <p className="text-gray-600 text-sm line-clamp-2 mb-3">
              {description}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* Source and Date */}
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="font-medium">{source}</span>
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{timeAgo}</span>
              </div>
            </div>

            {/* Relevant Assets Badges */}
            {relevantAssets.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap">
                {relevantAssets.slice(0, 3).map((ticker) => (
                  <span
                    key={ticker}
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {ticker}
                  </span>
                ))}
                {relevantAssets.length > 3 && (
                  <span className="text-xs text-gray-500">
                    +{relevantAssets.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
