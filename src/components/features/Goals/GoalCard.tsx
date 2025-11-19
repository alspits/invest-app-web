'use client';

import { Goal, GoalProgress, formatGoalType, formatGoalValue } from '@/lib/goal-service';
import { Target, Calendar, TrendingUp, AlertTriangle, CheckCircle2, XCircle, Trash2, RotateCcw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

interface GoalCardProps {
  goal: Goal;
  progress: GoalProgress;
  onDelete: (id: string) => void;
  onReset: (id: string) => void;
  onComplete: (id: string) => void;
}

export function GoalCard({ goal, progress, onDelete, onReset, onComplete }: GoalCardProps) {
  const { name, description, goalType, targetValue, currentValue, deadline, status } = goal;
  const { progress: progressPercent, remaining, daysRemaining, status: progressStatus } = progress;

  // Status colors and icons
  const statusConfig = {
    'completed': {
      color: 'green',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-700',
      icon: CheckCircle2,
      label: 'Достигнута',
    },
    'on-track': {
      color: 'blue',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-700',
      icon: TrendingUp,
      label: 'В процессе',
    },
    'at-risk': {
      color: 'yellow',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-700',
      icon: AlertTriangle,
      label: 'Под угрозой',
    },
    'overdue': {
      color: 'red',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-700',
      icon: XCircle,
      label: 'Просрочена',
    },
  };

  const config = statusConfig[progressStatus];
  const StatusIcon = config.icon;

  const deadlineDate = new Date(deadline);
  const timeToDeadline = formatDistanceToNow(deadlineDate, {
    addSuffix: true,
    locale: ru,
  });

  return (
    <div className={`bg-white rounded-lg border-2 ${config.borderColor} p-4 hover:shadow-md transition-shadow`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-4 h-4 text-gray-500" />
            <h3 className="font-semibold text-gray-900">{name}</h3>
          </div>
          {description && (
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          )}
        </div>

        {/* Status Badge */}
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${config.bgColor}`}>
          <StatusIcon className={`w-3.5 h-3.5 ${config.textColor}`} />
          <span className={`text-xs font-medium ${config.textColor}`}>
            {config.label}
          </span>
        </div>
      </div>

      {/* Goal Type */}
      <div className="text-xs text-gray-500 mb-3">
        {formatGoalType(goalType)}
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-gray-600">Прогресс</span>
          <span className="font-semibold text-gray-900">
            {progressPercent.toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              progressStatus === 'completed'
                ? 'bg-green-500'
                : progressStatus === 'at-risk'
                ? 'bg-yellow-500'
                : progressStatus === 'overdue'
                ? 'bg-red-500'
                : 'bg-blue-500'
            }`}
            style={{ width: `${Math.min(progressPercent, 100)}%` }}
          />
        </div>
      </div>

      {/* Values */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Текущее</p>
          <p className="text-sm font-semibold text-gray-900">
            {formatGoalValue(currentValue, goalType)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Цель</p>
          <p className="text-sm font-semibold text-gray-900">
            {formatGoalValue(targetValue, goalType)}
          </p>
        </div>
      </div>

      {/* Remaining */}
      {progressStatus !== 'completed' && (
        <div className="mb-3 p-2 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600">
            Осталось: <span className="font-semibold">{formatGoalValue(remaining, goalType)}</span>
          </p>
        </div>
      )}

      {/* Deadline */}
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
        <Calendar className="w-4 h-4" />
        <span>
          {daysRemaining >= 0
            ? `${timeToDeadline} (${daysRemaining} дней)`
            : `Просрочено на ${Math.abs(daysRemaining)} дней`}
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-3 border-t border-gray-100">
        {status === 'ACTIVE' && progressStatus !== 'completed' && (
          <button
            onClick={() => onComplete(goal.id)}
            className="flex-1 px-3 py-1.5 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors font-medium"
          >
            <CheckCircle2 className="w-4 h-4 inline mr-1" />
            Завершить
          </button>
        )}

        {status === 'COMPLETED' && (
          <button
            onClick={() => onReset(goal.id)}
            className="flex-1 px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium"
          >
            <RotateCcw className="w-4 h-4 inline mr-1" />
            Сбросить
          </button>
        )}

        <button
          onClick={() => onDelete(goal.id)}
          className="px-3 py-1.5 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors font-medium"
          title="Удалить цель"
        >
          <Trash2 className="w-4 h-4 inline" />
        </button>
      </div>
    </div>
  );
}
