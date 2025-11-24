'use client';

/**
 * Target Allocation Selector Component
 * UI wizard for setting target portfolio allocation
 */

import { useState } from 'react';
import { useRebalancingStore } from '@/stores/rebalancing';
import {
  PRESET_ALLOCATIONS,
  RebalancingStrategy,
  type TargetAllocation,
  type SectorAllocation,
  type GeographyAllocation,
  type AssetTypeAllocation,
} from '@/lib/rebalancing';

export function TargetAllocationSelector() {
  const [step, setStep] = useState<'strategy' | 'preset' | 'custom'>('strategy');
  const [customAllocation, setCustomAllocation] = useState<Partial<TargetAllocation>>({});

  const { strategy, setStrategy, loadPreset, setTargetAllocation } =
    useRebalancingStore();

  // Step 1: Select Strategy
  const renderStrategyStep = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Шаг 1: Выберите стратегию</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.values(RebalancingStrategy).map((strat) => (
          <button
            key={strat}
            onClick={() => {
              setStrategy(strat);
              setStep('preset');
            }}
            className={`p-4 border rounded-lg hover:border-blue-500 transition ${
              strategy === strat ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}
          >
            <div className="font-medium">{getStrategyLabel(strat)}</div>
            <p className="text-sm text-gray-600 mt-2">
              {getStrategyDescription(strat)}
            </p>
          </button>
        ))}
      </div>
    </div>
  );

  // Step 2: Select Preset or Custom
  const renderPresetStep = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Шаг 2: Целевая аллокация</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(['conservative', 'moderate', 'aggressive'] as const).map((preset) => (
          <button
            key={preset}
            onClick={() => {
              loadPreset(preset);
              setStep('strategy');
            }}
            className="p-4 border border-gray-300 rounded-lg hover:border-blue-500 transition"
          >
            <div className="font-medium capitalize">{getPresetLabel(preset)}</div>
            <div className="text-sm text-gray-600 mt-2">
              {renderPresetSummary(preset)}
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={() => setStep('custom')}
        className="w-full py-2 border border-dashed border-gray-400 rounded-lg hover:border-blue-500 transition"
      >
        Настроить вручную
      </button>

      <button
        onClick={() => setStep('strategy')}
        className="text-sm text-gray-600 hover:text-gray-900"
      >
        ← Назад к выбору стратегии
      </button>
    </div>
  );

  // Step 3: Custom Allocation
  const renderCustomStep = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Настройка целевой аллокации</h3>

      {/* Sector Allocation */}
      <div>
        <h4 className="font-medium mb-2">Секторная аллокация (%)</h4>
        <div className="grid grid-cols-2 gap-3">
          {renderSectorInputs()}
        </div>
      </div>

      {/* Geography Allocation */}
      <div>
        <h4 className="font-medium mb-2">Географическая аллокация (%)</h4>
        <div className="grid grid-cols-3 gap-3">
          {renderGeographyInputs()}
        </div>
      </div>

      {/* Asset Type Allocation */}
      <div>
        <h4 className="font-medium mb-2">Тип активов (%)</h4>
        <div className="grid grid-cols-2 gap-3">
          {renderAssetTypeInputs()}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleSaveCustom}
          className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Сохранить
        </button>
        <button
          onClick={() => setStep('preset')}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Отмена
        </button>
      </div>
    </div>
  );

  const renderSectorInputs = () => {
    const sectors: Array<keyof SectorAllocation> = [
      'technology',
      'finance',
      'energy',
      'healthcare',
      'utilities',
      'materials',
      'industrials',
      'consumer',
      'telecommunications',
      'realestate',
      'other',
    ];

    return sectors.map((sector) => (
      <div key={sector}>
        <label className="text-sm text-gray-600 capitalize">{sector}</label>
        <input
          type="number"
          min="0"
          max="100"
          step="1"
          placeholder="0"
          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded"
          onChange={(e) =>
            setCustomAllocation((prev) => ({
              ...prev,
              sectors: {
                ...prev.sectors,
                [sector]: Number(e.target.value) / 100,
              },
            }))
          }
        />
      </div>
    ));
  };

  const renderGeographyInputs = () => {
    const geos: Array<keyof GeographyAllocation> = ['russia', 'developed', 'emerging'];

    return geos.map((geo) => (
      <div key={geo}>
        <label className="text-sm text-gray-600 capitalize">{geo}</label>
        <input
          type="number"
          min="0"
          max="100"
          step="1"
          placeholder="0"
          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded"
          onChange={(e) =>
            setCustomAllocation((prev) => ({
              ...prev,
              geography: {
                ...prev.geography,
                [geo]: Number(e.target.value) / 100,
              },
            }))
          }
        />
      </div>
    ));
  };

  const renderAssetTypeInputs = () => {
    const types: Array<keyof AssetTypeAllocation> = [
      'stocks',
      'bonds',
      'etf',
      'alternatives',
    ];

    return types.map((type) => (
      <div key={type}>
        <label className="text-sm text-gray-600 capitalize">{type}</label>
        <input
          type="number"
          min="0"
          max="100"
          step="1"
          placeholder="0"
          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded"
          onChange={(e) =>
            setCustomAllocation((prev) => ({
              ...prev,
              assetTypes: {
                ...prev.assetTypes,
                [type]: Number(e.target.value) / 100,
              },
            }))
          }
        />
      </div>
    ));
  };

  const handleSaveCustom = () => {
    if (customAllocation.sectors && customAllocation.geography && customAllocation.assetTypes) {
      setTargetAllocation({
        sectors: customAllocation.sectors,
        geography: customAllocation.geography,
        assetTypes: customAllocation.assetTypes,
        lastUpdated: new Date(),
      });
      setStep('strategy');
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      {step === 'strategy' && renderStrategyStep()}
      {step === 'preset' && renderPresetStep()}
      {step === 'custom' && renderCustomStep()}
    </div>
  );
}

// Helper functions
function getStrategyLabel(strategy: RebalancingStrategy): string {
  const labels: Record<RebalancingStrategy, string> = {
    [RebalancingStrategy.TACTICAL]: 'Тактическая',
    [RebalancingStrategy.STRATEGIC]: 'Стратегическая',
    [RebalancingStrategy.THRESHOLD_BASED]: 'По порогу',
  };
  return labels[strategy];
}

function getStrategyDescription(strategy: RebalancingStrategy): string {
  const descriptions: Record<RebalancingStrategy, string> = {
    [RebalancingStrategy.TACTICAL]: 'Краткосрочная корректировка на основе рыночных условий',
    [RebalancingStrategy.STRATEGIC]: 'Долгосрочное поддержание целевой аллокации',
    [RebalancingStrategy.THRESHOLD_BASED]: 'Ребалансировка при отклонении >5%',
  };
  return descriptions[strategy];
}

function getPresetLabel(preset: 'conservative' | 'moderate' | 'aggressive'): string {
  const labels = {
    conservative: 'Консервативный (40/50/10)',
    moderate: 'Умеренный (60/30/10)',
    aggressive: 'Агрессивный (85/10/5)',
  };
  return labels[preset];
}

function renderPresetSummary(preset: 'conservative' | 'moderate' | 'aggressive'): string {
  const allocation = PRESET_ALLOCATIONS[preset];
  return `Акции: ${(allocation.assetTypes.stocks! * 100).toFixed(0)}%, Облигации: ${(allocation.assetTypes.bonds! * 100).toFixed(0)}%, ETF: ${(allocation.assetTypes.etf! * 100).toFixed(0)}%`;
}
