'use client';

import { useState, useEffect } from 'react';
import { useGoalStore } from '@/stores/goalStore';
import { usePortfolioStore } from '@/stores/portfolioStore';
import { useGoalAutoUpdate } from '@/hooks/useGoalAutoUpdate';
import { GoalCard } from './GoalCard';
import { GoalForm } from './GoalForm';
import { CreateGoalInput, GoalAlert } from '@/lib/goal-service';
import { Target, Plus, AlertCircle, Info, AlertTriangle, CheckCircle } from 'lucide-react';

export function GoalList() {
  const [showForm, setShowForm] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  const { selectedAccountId } = usePortfolioStore();

  // Auto-update goals based on portfolio changes
  useGoalAutoUpdate();
  const {
    goals,
    goalProgresses,
    alerts,
    loadGoals,
    createGoal,
    deleteGoal,
    resetGoalProgress,
    completeGoal,
  } = useGoalStore();

  // Load goals when account changes
  useEffect(() => {
    if (selectedAccountId) {
      loadGoals(selectedAccountId);
    }
  }, [selectedAccountId, loadGoals]);

  // Handle create goal
  const handleCreateGoal = (input: CreateGoalInput) => {
    try {
      createGoal(input);
      setShowForm(false);
    } catch (error) {
      console.error('Failed to create goal:', error);
    }
  };

  // Handle delete goal
  const handleDeleteGoal = (id: string) => {
    if (confirm('Вы уверены, что хотите удалить эту цель?')) {
      deleteGoal(id);
    }
  };

  // Dismiss alert
  const handleDismissAlert = (goalId: string) => {
    setDismissedAlerts(new Set([...dismissedAlerts, goalId]));
  };

  // Filter out dismissed alerts
  const visibleAlerts = alerts.filter((alert) => !dismissedAlerts.has(alert.goalId));

  // Alert icon mapping
  const alertIconMap = {
    info: Info,
    warning: AlertTriangle,
    error: AlertCircle,
    success: CheckCircle,
  };

  // Alert color mapping
  const alertColorMap = {
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: 'text-blue-600',
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      icon: 'text-yellow-600',
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: 'text-red-600',
    },
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      icon: 'text-green-600',
    },
  };

  // No account selected
  if (!selectedAccountId) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          Выберите счет, чтобы просматривать и управлять целями
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-gray-700" />
          <h2 className="text-lg font-bold text-gray-900">Инвестиционные цели</h2>
          {goals.length > 0 && (
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
              {goals.length}
            </span>
          )}
        </div>

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            Новая цель
          </button>
        )}
      </div>

      {/* Alerts */}
      {visibleAlerts.length > 0 && (
        <div className="space-y-2">
          {visibleAlerts.map((alert) => {
            const colors = alertColorMap[alert.severity];
            const AlertIcon = alertIconMap[alert.severity];

            return (
              <div
                key={`${alert.goalId}-${alert.type}`}
                className={`flex items-start gap-3 p-3 rounded-lg border ${colors.bg} ${colors.border}`}
              >
                <AlertIcon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${colors.icon}`} />
                <p className={`flex-1 text-sm ${colors.text}`}>{alert.message}</p>
                <button
                  onClick={() => handleDismissAlert(alert.goalId)}
                  className={`text-sm ${colors.text} hover:opacity-70 transition-opacity`}
                >
                  Скрыть
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Goal Form */}
      {showForm && (
        <GoalForm
          portfolioId={selectedAccountId}
          onSubmit={handleCreateGoal}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Goals Grid */}
      {goals.length === 0 && !showForm ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-12">
          <div className="text-center">
            <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-gray-700 font-semibold mb-2">
              Нет целей
            </h3>
            <p className="text-gray-500 mb-4">
              Создайте свою первую инвестиционную цель
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Plus className="w-4 h-4" />
              Создать цель
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((goal) => {
            const progress = goalProgresses.get(goal.id);
            if (!progress) return null;

            return (
              <GoalCard
                key={goal.id}
                goal={goal}
                progress={progress}
                onDelete={handleDeleteGoal}
                onReset={resetGoalProgress}
                onComplete={completeGoal}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
