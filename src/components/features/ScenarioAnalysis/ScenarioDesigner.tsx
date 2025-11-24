'use client';

/**
 * Scenario Designer Component
 * Multi-step UI for creating and configuring What-If scenarios
 */

import { useState, useEffect } from 'react';
import { useScenarioStore } from '@/stores/scenarios';
import { usePortfolioStore } from '@/stores/portfolioStore';
import {
  loadPresets,
  replayHistoricalScenario,
  simulateMarketMove,
  simulateSectorMove,
  convertToPosition,
} from '@/lib/scenario';
import type { ScenarioChange, ScenarioResult } from '@/lib/scenario/types';

type Step = 'select-base' | 'add-changes' | 'review';

export function ScenarioDesigner() {
  const [step, setStep] = useState<Step>('select-base');
  const [scenarioName, setScenarioName] = useState('');
  const [changes, setChanges] = useState<ScenarioChange[]>([]);
  const [result, setResult] = useState<ScenarioResult | null>(null);

  const { createScenario, selectScenario } = useScenarioStore();
  const { portfolio } = usePortfolioStore();

  const positions = portfolio?.positions.map(convertToPosition) || [];

  const presets = loadPresets();

  // Calculate scenario on changes
  useEffect(() => {
    if (changes.length > 0 && positions.length > 0) {
      // Recalculate result (simplified - actual implementation in WhatIfImpactPanel)
      // Here we just mark that changes exist
    }
  }, [changes, positions]);

  const handleAddPreset = (presetId: string) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) return;

    // Guard against missing marketMultipliers
    if (!preset.marketMultipliers) {
      console.warn(`Preset ${presetId} is missing marketMultipliers`);
      return;
    }

    const newChange: ScenarioChange = {
      id: `preset-${presetId}-${Date.now()}`,
      type: 'market_event',
      label: preset.name,
      marketMultipliers: preset.marketMultipliers,
    };

    setChanges([...changes, newChange]);
  };

  const handleAddCustomChange = (type: ScenarioChange['type']) => {
    const newChange: ScenarioChange = {
      id: `custom-${Date.now()}`,
      type,
      label: 'Custom Change',
    };

    setChanges([...changes, newChange]);
  };

  const handleRemoveChange = (id: string) => {
    setChanges(changes.filter((c) => c.id !== id));
  };

  const handleSaveScenario = () => {
    try {
      const scenario = createScenario({
        name: scenarioName || 'Untitled Scenario',
        changes,
      });

      // Validate scenario before proceeding
      if (!scenario || !scenario.id) {
        console.error('Failed to create scenario: invalid response');
        return;
      }

      selectScenario(scenario.id);

      // Reset form only on success
      setScenarioName('');
      setChanges([]);
      setStep('select-base');
    } catch (error) {
      console.error('Error saving scenario:', error);
      // Keep form data intact so user can retry
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Scenario Designer</h2>
        <p className="text-gray-600 mt-1">Create What-If scenarios for portfolio analysis</p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-4">
        <StepButton
          label="1. Base"
          active={step === 'select-base'}
          completed={step !== 'select-base'}
          onClick={() => setStep('select-base')}
        />
        <div className="flex-1 h-px bg-gray-300" />
        <StepButton
          label="2. Changes"
          active={step === 'add-changes'}
          completed={step === 'review'}
          onClick={() => setStep('add-changes')}
        />
        <div className="flex-1 h-px bg-gray-300" />
        <StepButton
          label="3. Review"
          active={step === 'review'}
          completed={false}
          onClick={() => setStep('review')}
        />
      </div>

      {/* Step Content */}
      {step === 'select-base' && (
        <div className="space-y-4">
          <h3 className="font-semibold">Select Base Portfolio</h3>
          <p className="text-sm text-gray-600">Using current portfolio positions</p>
          <button
            onClick={() => setStep('add-changes')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Next: Add Changes
          </button>
        </div>
      )}

      {step === 'add-changes' && (
        <div className="space-y-6">
          <div>
            <label className="block font-semibold mb-2">Scenario Name</label>
            <input
              type="text"
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
              placeholder="e.g., Market Crash Simulation"
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          {/* Historical Presets */}
          <div>
            <h3 className="font-semibold mb-2">Historical Events</h3>
            <div className="grid grid-cols-2 gap-2">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleAddPreset(preset.id)}
                  className="text-left px-3 py-2 border rounded hover:border-blue-500 hover:bg-blue-50"
                >
                  <div className="font-medium text-sm">{preset.name}</div>
                  <div className="text-xs text-gray-500">{preset.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Changes */}
          <div>
            <h3 className="font-semibold mb-2">Custom Changes</h3>
            <div className="flex gap-2">
              <button
                onClick={() => handleAddCustomChange('price_change')}
                className="px-3 py-2 border rounded hover:border-blue-500"
              >
                Price Change
              </button>
              <button
                onClick={() => handleAddCustomChange('quantity_change')}
                className="px-3 py-2 border rounded hover:border-blue-500"
              >
                Quantity Change
              </button>
              <button
                onClick={() => handleAddCustomChange('add_position')}
                className="px-3 py-2 border rounded hover:border-blue-500"
              >
                Add Position
              </button>
            </div>
          </div>

          {/* Changes List */}
          {changes.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Applied Changes ({changes.length})</h3>
              <div className="space-y-2">
                {changes.map((change) => (
                  <div key={change.id} className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm">{change.label}</span>
                    <button
                      onClick={() => handleRemoveChange(change.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => setStep('select-base')}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={() => setStep('review')}
              disabled={changes.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300"
            >
              Next: Review
            </button>
          </div>
        </div>
      )}

      {step === 'review' && (
        <div className="space-y-4">
          <h3 className="font-semibold">Review Scenario</h3>
          <div className="p-4 bg-gray-50 rounded">
            <div className="text-sm space-y-2">
              <div>
                <span className="font-medium">Name:</span> {scenarioName || 'Untitled'}
              </div>
              <div>
                <span className="font-medium">Changes:</span> {changes.length}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setStep('add-changes')}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={handleSaveScenario}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Save Scenario
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper component
function StepButton({
  label,
  active,
  completed,
  onClick,
}: {
  label: string;
  active: boolean;
  completed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded font-medium ${
        active
          ? 'bg-blue-600 text-white'
          : completed
            ? 'bg-green-600 text-white'
            : 'bg-gray-200 text-gray-600'
      }`}
    >
      {label}
    </button>
  );
}
