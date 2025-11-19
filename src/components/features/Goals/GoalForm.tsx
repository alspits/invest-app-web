'use client';

import { useState, FormEvent } from 'react';
import { CreateGoalInput, GoalType, GoalTypeEnum, formatGoalType } from '@/lib/goal-service';
import { X } from 'lucide-react';

interface GoalFormProps {
  portfolioId: string;
  onSubmit: (input: CreateGoalInput) => void;
  onCancel: () => void;
}

export function GoalForm({ portfolioId, onSubmit, onCancel }: GoalFormProps) {
  const [formData, setFormData] = useState<CreateGoalInput>({
    portfolioId,
    name: '',
    description: '',
    goalType: 'TARGET_VALUE',
    targetValue: 0,
    currentValue: 0,
    deadline: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Название цели обязательно';
    }

    if (formData.targetValue <= 0) {
      newErrors.targetValue = 'Целевое значение должно быть больше 0';
    }

    if (!formData.deadline) {
      newErrors.deadline = 'Укажите срок достижения цели';
    } else {
      const deadlineDate = new Date(formData.deadline);
      const now = new Date();
      if (deadlineDate <= now) {
        newErrors.deadline = 'Срок должен быть в будущем';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      onSubmit(formData);
    } catch (error) {
      setErrors({ submit: (error as Error).message });
    }
  };

  const goalTypes: GoalType[] = GoalTypeEnum.options;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900">Новая цель</h3>
        <button
          onClick={onCancel}
          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Название цели *
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Например: Достичь 1 млн рублей"
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Описание (опционально)
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={2}
            placeholder="Краткое описание цели"
          />
        </div>

        {/* Goal Type */}
        <div>
          <label htmlFor="goalType" className="block text-sm font-medium text-gray-700 mb-1">
            Тип цели *
          </label>
          <select
            id="goalType"
            value={formData.goalType}
            onChange={(e) => setFormData({ ...formData, goalType: e.target.value as GoalType })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {goalTypes.map((type) => (
              <option key={type} value={type}>
                {formatGoalType(type)}
              </option>
            ))}
          </select>
        </div>

        {/* Target Value */}
        <div>
          <label htmlFor="targetValue" className="block text-sm font-medium text-gray-700 mb-1">
            Целевое значение *
          </label>
          <input
            type="number"
            id="targetValue"
            value={formData.targetValue || ''}
            onChange={(e) => setFormData({ ...formData, targetValue: parseFloat(e.target.value) || 0 })}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.targetValue ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="1000000"
            step="0.01"
          />
          {errors.targetValue && <p className="mt-1 text-sm text-red-600">{errors.targetValue}</p>}
          <p className="mt-1 text-xs text-gray-500">
            {formData.goalType === 'TARGET_RETURN' || formData.goalType === 'DIVERSIFICATION'
              ? 'Введите значение в процентах (например: 20 для 20%)'
              : 'Введите целевое значение'}
          </p>
        </div>

        {/* Current Value */}
        <div>
          <label htmlFor="currentValue" className="block text-sm font-medium text-gray-700 mb-1">
            Текущее значение
          </label>
          <input
            type="number"
            id="currentValue"
            value={formData.currentValue || ''}
            onChange={(e) => setFormData({ ...formData, currentValue: parseFloat(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0"
            step="0.01"
          />
          <p className="mt-1 text-xs text-gray-500">
            Оставьте 0 для автоматического обновления из портфеля
          </p>
        </div>

        {/* Deadline */}
        <div>
          <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-1">
            Срок достижения *
          </label>
          <input
            type="date"
            id="deadline"
            value={formData.deadline}
            onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.deadline ? 'border-red-500' : 'border-gray-300'
            }`}
            min={new Date().toISOString().split('T')[0]}
          />
          {errors.deadline && <p className="mt-1 text-sm text-red-600">{errors.deadline}</p>}
        </div>

        {/* Submit Error */}
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600">{errors.submit}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Создать цель
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
}
