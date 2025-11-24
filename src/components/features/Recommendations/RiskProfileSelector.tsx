'use client';

/**
 * Risk Profile Selector Component
 * Allows user to select their risk tolerance level
 */

import { useState, useEffect } from 'react';
import { useRecommendationsStore } from '@/stores/recommendations';
import {
  RiskProfile,
  getAllRiskProfiles,
  RISK_PROFILE_UI,
} from '@/lib/recommendations/risk-profiles';

export function RiskProfileSelector() {
  const { riskProfile, riskAssessment, setRiskProfile } = useRecommendationsStore();
  const [selectedProfile, setSelectedProfile] = useState<RiskProfile | null>(riskProfile);

  const profiles = getAllRiskProfiles();

  useEffect(() => {
    setSelectedProfile(riskProfile);
  }, [riskProfile]);

  const handleSelect = (profile: RiskProfile) => {
    setSelectedProfile(profile);
    setRiskProfile(profile);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Профиль риска</h3>
        <p className="text-sm text-gray-600">
          Выберите уровень риска для персонализированных рекомендаций
        </p>
      </div>

      {/* Profile Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {profiles.map((config) => {
          const ui = RISK_PROFILE_UI[config.profile];
          const isSelected = selectedProfile === config.profile;

          return (
            <button
              key={config.profile}
              onClick={() => handleSelect(config.profile)}
              className={`
                relative p-4 rounded-lg border-2 transition-all
                ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                }
              `}
            >
              {/* Icon & Label */}
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">{ui.icon}</span>
                <div className="text-left">
                  <div className="font-semibold text-gray-900">{config.profile}</div>
                  <div className="text-xs text-gray-500">
                    Макс. волатильность: {(config.maxVolatility * 100).toFixed(0)}%
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 text-left">{config.description}</p>

              {/* Allocation Preview */}
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="text-xs text-gray-500 mb-1">Целевое распределение:</div>
                <div className="flex gap-2 text-xs">
                  <span className="text-gray-700">
                    Облигации: {config.targetAllocation.bonds}%
                  </span>
                  <span className="text-gray-700">
                    Акции: {config.targetAllocation.stocks}%
                  </span>
                </div>
              </div>

              {/* Selection Indicator */}
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <svg
                    className="w-6 h-6 text-blue-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Risk Assessment Display */}
      {riskAssessment && selectedProfile && (
        <div
          className={`
          p-4 rounded-lg border
          ${
            riskAssessment.alignment === 'aligned'
              ? 'bg-green-50 border-green-200'
              : riskAssessment.alignment === 'too_risky'
                ? 'bg-red-50 border-red-200'
                : 'bg-yellow-50 border-yellow-200'
          }
        `}
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl">
              {riskAssessment.alignment === 'aligned'
                ? '✅'
                : riskAssessment.alignment === 'too_risky'
                  ? '⚠️'
                  : 'ℹ️'}
            </span>
            <div className="flex-1">
              <div className="font-medium text-gray-900 mb-1">
                {riskAssessment.recommendation}
              </div>
              <div className="text-sm text-gray-600">
                Текущая волатильность: {(riskAssessment.currentVolatility * 100).toFixed(1)}% |
                Целевая: {(riskAssessment.maxVolatility * 100).toFixed(1)}% | Уверенность:{' '}
                {riskAssessment.confidence}%
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
