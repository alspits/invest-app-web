'use client';

/**
 * What-If Impact Panel Component
 * Visualizes impact of scenario on portfolio metrics
 */

import { useMemo } from 'react';
import { useScenarioStore } from '@/stores/scenarios';
import { usePortfolioStore } from '@/stores/portfolioStore';
import { applyScenario, convertToPosition } from '@/lib/scenario';
import type { ScenarioResult } from '@/lib/scenario/types';

export function WhatIfImpactPanel() {
  const { scenarios, selectedScenarioId } = useScenarioStore();
  const { portfolio } = usePortfolioStore();

  const positions = portfolio?.positions.map(convertToPosition) || [];
  const cashBalance = 0; // TODO: Get from portfolio API if available

  const selectedScenario = useMemo(
    () => scenarios.find((s) => s.id === selectedScenarioId),
    [scenarios, selectedScenarioId]
  );

  const result = useMemo<ScenarioResult | null>(() => {
    if (!selectedScenario || positions.length === 0) return null;

    // Use cached result if available
    if (selectedScenario.result) return selectedScenario.result;

    // Calculate fresh result
    return applyScenario(positions, selectedScenario.changes, cashBalance);
  }, [selectedScenario, positions, cashBalance]);

  if (!selectedScenario || !result) {
    return (
      <div className="text-center py-8 text-gray-500">
        Select a scenario to view impact analysis
      </div>
    );
  }

  const { baseSnapshot, scenarioSnapshot, valueChange, valueChangePercent, diversificationChange } =
    result;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-bold">{selectedScenario.name}</h3>
        {selectedScenario.description && (
          <p className="text-gray-600 text-sm mt-1">{selectedScenario.description}</p>
        )}
      </div>

      {/* Value Impact */}
      <div className="grid grid-cols-3 gap-4">
        <MetricCard
          label="Base Value"
          value={formatCurrency(baseSnapshot.totalValue)}
          subtext="Current portfolio"
        />
        <MetricCard
          label="Scenario Value"
          value={formatCurrency(scenarioSnapshot.totalValue)}
          subtext="After changes"
          highlight={valueChange !== 0}
        />
        <MetricCard
          label="Change"
          value={`${valueChange > 0 ? '+' : ''}${formatCurrency(valueChange)}`}
          subtext={`${valueChangePercent > 0 ? '+' : ''}${valueChangePercent.toFixed(2)}%`}
          color={valueChange > 0 ? 'green' : valueChange < 0 ? 'red' : 'gray'}
        />
      </div>

      {/* Diversification Impact */}
      <div>
        <h4 className="font-semibold mb-2">Diversification</h4>
        <div className="grid grid-cols-3 gap-4">
          <MetricCard
            label="Before (HHI)"
            value={diversificationChange.herfindahlBefore.toFixed(3)}
            subtext="Lower is better"
          />
          <MetricCard
            label="After (HHI)"
            value={diversificationChange.herfindahlAfter.toFixed(3)}
            subtext="Lower is better"
          />
          <MetricCard
            label="Change"
            value={`${diversificationChange.delta > 0 ? '+' : ''}${diversificationChange.delta.toFixed(3)}`}
            color={diversificationChange.delta < 0 ? 'green' : diversificationChange.delta > 0 ? 'red' : 'gray'}
          />
        </div>
      </div>

      {/* Sector Weights */}
      <div>
        <h4 className="font-semibold mb-2">Sector Allocation Changes</h4>
        <div className="space-y-2">
          {Object.entries(result.sectorWeightChanges)
            .filter(([_, delta]) => Math.abs(delta) > 0.001)
            .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
            .map(([sector, delta]) => (
              <WeightChangeBar key={sector} label={sector} delta={delta} />
            ))}
          {Object.keys(result.sectorWeightChanges).length === 0 && (
            <p className="text-sm text-gray-500">No sector changes</p>
          )}
        </div>
      </div>

      {/* Geography Weights */}
      <div>
        <h4 className="font-semibold mb-2">Geography Allocation Changes</h4>
        <div className="space-y-2">
          {Object.entries(result.geoWeightChanges)
            .filter(([_, delta]) => Math.abs(delta) > 0.001)
            .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
            .map(([country, delta]) => (
              <WeightChangeBar key={country} label={country} delta={delta} />
            ))}
          {Object.keys(result.geoWeightChanges).length === 0 && (
            <p className="text-sm text-gray-500">No geography changes</p>
          )}
        </div>
      </div>

      {/* Applied Changes Summary */}
      <div>
        <h4 className="font-semibold mb-2">Applied Changes ({result.appliedChanges.length})</h4>
        <div className="space-y-1">
          {result.appliedChanges.map((change) => (
            <div key={change.id} className="text-sm p-2 bg-gray-50 rounded">
              {change.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Helper Components

function MetricCard({
  label,
  value,
  subtext,
  color = 'gray',
  highlight = false,
}: {
  label: string;
  value: string;
  subtext?: string;
  color?: 'gray' | 'green' | 'red';
  highlight?: boolean;
}) {
  const colorClasses = {
    gray: 'text-gray-900',
    green: 'text-green-600',
    red: 'text-red-600',
  };

  return (
    <div className={`p-4 border rounded ${highlight ? 'border-blue-500 bg-blue-50' : 'bg-white'}`}>
      <div className="text-sm text-gray-600 mb-1">{label}</div>
      <div className={`text-2xl font-bold ${colorClasses[color]}`}>{value}</div>
      {subtext && <div className="text-xs text-gray-500 mt-1">{subtext}</div>}
    </div>
  );
}

function WeightChangeBar({ label, delta }: { label: string; delta: number }) {
  const percent = delta * 100;
  const isIncrease = delta > 0;
  const barWidth = Math.min(Math.abs(percent), 50); // Cap at 50% for display

  return (
    <div className="flex items-center gap-2">
      <div className="w-24 text-sm text-gray-700">{label}</div>
      <div className="flex-1 flex items-center">
        {isIncrease ? (
          <>
            <div className="w-1/2" />
            <div
              className="bg-green-500 h-4 rounded"
              style={{ width: `${barWidth}%` }}
            />
          </>
        ) : (
          <>
            <div
              className="bg-red-500 h-4 rounded ml-auto"
              style={{ width: `${barWidth}%` }}
            />
            <div className="w-1/2" />
          </>
        )}
      </div>
      <div className={`w-16 text-sm text-right ${isIncrease ? 'text-green-600' : 'text-red-600'}`}>
        {isIncrease ? '+' : ''}
        {percent.toFixed(1)}%
      </div>
    </div>
  );
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value);
}
