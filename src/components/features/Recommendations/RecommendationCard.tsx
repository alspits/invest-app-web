'use client';

import { Recommendation } from '@/lib/recommendation-service';
import {
  AlertTriangle,
  TrendingUp,
  Info,
  ChevronRight,
  CheckCircle2,
  X,
  Target,
} from 'lucide-react';

interface RecommendationCardProps {
  recommendation: Recommendation;
  onApply?: (id: string) => void;
  onDismiss?: (id: string) => void;
  onLearnMore?: (id: string) => void;
}

export function RecommendationCard({
  recommendation,
  onApply,
  onDismiss,
  onLearnMore,
}: RecommendationCardProps) {
  const { id, type, priority, title, description, actionItems, rationale, potentialImpact } =
    recommendation;

  // Priority styling
  const priorityConfig = {
    high: {
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-700',
      badgeBg: 'bg-red-100',
      icon: AlertTriangle,
      label: 'Высокий приоритет',
    },
    medium: {
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-700',
      badgeBg: 'bg-yellow-100',
      icon: TrendingUp,
      label: 'Средний приоритет',
    },
    low: {
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-700',
      badgeBg: 'bg-blue-100',
      icon: Info,
      label: 'Низкий приоритет',
    },
  };

  const config = priorityConfig[priority];
  const PriorityIcon = config.icon;

  // Type labels
  const typeLabels: Record<string, string> = {
    diversification: 'Диверсификация',
    rebalancing: 'Ребалансировка',
    cash_allocation: 'Денежные средства',
    concentration_risk: 'Риск концентрации',
    sector_allocation: 'Распределение по секторам',
    risk_management: 'Управление рисками',
  };

  return (
    <div
      className={`bg-white rounded-lg border-2 ${config.borderColor} p-5 hover:shadow-lg transition-all duration-200`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-gray-500" />
            <h3 className="font-semibold text-gray-900 text-lg">{title}</h3>
          </div>
          <span className="text-xs text-gray-500 font-medium">{typeLabels[type]}</span>
        </div>

        {/* Priority Badge */}
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${config.badgeBg}`}>
          <PriorityIcon className={`w-4 h-4 ${config.textColor}`} />
          <span className={`text-xs font-semibold ${config.textColor}`}>{config.label}</span>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-700 mb-4 leading-relaxed">{description}</p>

      {/* Action Items */}
      {actionItems.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Рекомендуемые действия:</h4>
          <ul className="space-y-2">
            {actionItems.map((item, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                <ChevronRight className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Rationale */}
      <div className={`mb-4 p-3 rounded-lg ${config.bgColor}`}>
        <p className="text-sm text-gray-700">
          <span className="font-semibold">Обоснование: </span>
          {rationale}
        </p>
      </div>

      {/* Potential Impact */}
      {potentialImpact && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            <span className="font-semibold">Ожидаемый эффект: </span>
            {potentialImpact}
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 pt-3 border-t border-gray-100">
        {onApply && (
          <button
            onClick={() => onApply(id)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
          >
            <CheckCircle2 className="w-4 h-4" />
            Применить
          </button>
        )}

        {onLearnMore && (
          <button
            onClick={() => onLearnMore(id)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
          >
            Подробнее
          </button>
        )}

        {onDismiss && (
          <button
            onClick={() => onDismiss(id)}
            className="px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
            title="Отклонить рекомендацию"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
