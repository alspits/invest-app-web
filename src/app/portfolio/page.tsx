'use client';

import { useState } from 'react';
import { Portfolio } from '@/components/features/Portfolio/Portfolio';
import AnalyticsDashboard from '@/components/features/Analytics/AnalyticsDashboard';
import { NewsFeed } from '@/components/features/News/NewsFeed';
import { MarketContext } from '@/components/features/Market/MarketContext';
import { GoalList } from '@/components/features/Goals/GoalList';
import { PerformanceSummary } from '@/components/features/Portfolio/PerformanceSummary';

type TabType = 'portfolio' | 'analytics' | 'news' | 'goals';

export default function PortfolioPage() {
  const [activeTab, setActiveTab] = useState<TabType>('portfolio');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Performance Summary */}
        <div className="pt-6 pb-4">
          <PerformanceSummary />
        </div>

        {/* Market Context Widget */}
        <div className="pb-4">
          <MarketContext />
        </div>

        {/* Tab Switcher */}
        <div className="pb-4">
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

              {/* News Tab */}
              <button
                onClick={() => setActiveTab('news')}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-bold text-base
                  transition-colors duration-200
                  ${
                    activeTab === 'news'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
                aria-current={activeTab === 'news' ? 'page' : undefined}
              >
                News
              </button>

              {/* Goals Tab */}
              <button
                onClick={() => setActiveTab('goals')}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-bold text-base
                  transition-colors duration-200
                  ${
                    activeTab === 'goals'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
                aria-current={activeTab === 'goals' ? 'page' : undefined}
              >
                Goals
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="pb-6">
          {activeTab === 'portfolio' && <Portfolio />}
          {activeTab === 'analytics' && <AnalyticsDashboard />}
          {activeTab === 'news' && <NewsFeed />}
          {activeTab === 'goals' && <GoalList />}
        </div>
      </div>
    </div>
  );
}
