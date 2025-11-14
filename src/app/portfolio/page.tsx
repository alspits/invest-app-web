'use client';

import { useState } from 'react';
import { Portfolio } from '@/components/features/Portfolio/Portfolio';
import AnalyticsDashboard from '@/components/features/Analytics/AnalyticsDashboard';

type TabType = 'portfolio' | 'analytics';

export default function PortfolioPage() {
  const [activeTab, setActiveTab] = useState<TabType>('portfolio');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Tab Switcher */}
        <div className="pt-6 pb-4">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              {/* Portfolio Tab */}
              <button
                onClick={() => setActiveTab('portfolio')}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-bold text-base
                  transition-colors duration-200
                  ${
                    activeTab === 'portfolio'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
                aria-current={activeTab === 'portfolio' ? 'page' : undefined}
              >
                Portfolio
              </button>

              {/* Analytics Tab */}
              <button
                onClick={() => setActiveTab('analytics')}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-bold text-base
                  transition-colors duration-200
                  ${
                    activeTab === 'analytics'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
                aria-current={activeTab === 'analytics' ? 'page' : undefined}
              >
                Analytics
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="pb-6">
          {activeTab === 'portfolio' && <Portfolio />}
          {activeTab === 'analytics' && <AnalyticsDashboard />}
        </div>
      </div>
    </div>
  );
}
