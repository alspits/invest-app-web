import React, { useEffect, useState, useRef } from 'react';
import { RotateCw, Loader2 } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import MetricsPanel from './MetricsPanel';
import PortfolioChart from './PortfolioChart';
import HistoryChart from './HistoryChart';
import DateRangeSelector from './DateRangeSelector';
import { useAnalyticsStore } from '../../../stores/analyticsStore';
import { usePortfolioStore } from '../../../stores/portfolioStore';

const AnalyticsDashboard: React.FC = () => {
  const selectedAccountId = usePortfolioStore((state) => state.selectedAccountId);
  const { metrics, loading, error } = useAnalyticsStore();
  const loadHistory = useAnalyticsStore((state) => state.loadHistory);

  const [showError, setShowError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showRefreshSpinner, setShowRefreshSpinner] = useState(false);
  const [, setTick] = useState(0); // For forcing re-render every second

  // Refs for tracking toast state
  const isFirstLoad = useRef(true);
  const loadingToastId = useRef<string | number | null>(null);
  const lastErrorMessage = useRef<string | null>(null);

  // Format time difference for "Last updated" display
  const formatTimeDifference = (date: Date | null): string => {
    if (!date) return 'Never updated';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);

    if (diffSeconds < 60) {
      return `Last updated ${diffSeconds} second${diffSeconds !== 1 ? 's' : ''} ago`;
    } else {
      return `Last updated ${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    }
  };

  // Get color class based on time difference
  const getTimeColor = (date: Date | null): string => {
    if (!date) return 'text-gray-600';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) return 'text-green-600';
    if (diffMinutes <= 5) return 'text-gray-600';
    return 'text-orange-600';
  };

  // Handle manual refresh
  const handleRefresh = async () => {
    if (!selectedAccountId || showRefreshSpinner) return;

    setShowRefreshSpinner(true);
    try {
      await loadHistory(selectedAccountId, 30);
      const now = new Date();
      setLastUpdated(now);

      // Show success toast with last updated time
      const timeString = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
      toast.success(`Portfolio refreshed successfully at ${timeString}`, {
        duration: 2000,
      });
    } catch (err) {
      // Error will be handled by the error useEffect
    } finally {
      setShowRefreshSpinner(false);
    }
  };

  // Initial data loading on component mount
  useEffect(() => {
    if (selectedAccountId) {
      // Show loading toast for first load
      if (isFirstLoad.current) {
        loadingToastId.current = toast.loading('Loading analytics...');
      }

      loadHistory(selectedAccountId, 30)
        .then(() => {
          setLastUpdated(new Date());

          // Dismiss loading toast and show success
          if (isFirstLoad.current && loadingToastId.current) {
            toast.dismiss(loadingToastId.current);
            toast.success('Portfolio data loaded', {
              duration: 3000,
            });
            isFirstLoad.current = false;
          }
        })
        .catch(() => {
          // Error will be handled by the error useEffect
          if (loadingToastId.current) {
            toast.dismiss(loadingToastId.current);
          }
        });
    }
  }, []);

  // Update display timer (every 1 second)
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((prev) => prev + 1); // Trigger re-render
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Reload history when selected account changes
  useEffect(() => {
    if (selectedAccountId && !isFirstLoad.current) {
      // Show info toast for account switch
      toast.info('Loading new account...', {
        duration: 2000,
      });

      loadHistory(selectedAccountId, 30);
      setLastUpdated(new Date());
    }
  }, [selectedAccountId]);

  // Show/hide error alert and error toast
  useEffect(() => {
    if (error) {
      setShowError(true);

      // Only show toast if error message changed (debounce duplicate errors)
      if (error !== lastErrorMessage.current) {
        lastErrorMessage.current = error;

        toast.error(error ? `Failed to load portfolio data: ${error}` : 'Failed to load portfolio data', {
          duration: 5000,
          action: selectedAccountId ? {
            label: 'Retry',
            onClick: () => {
              if (selectedAccountId) {
                loadHistory(selectedAccountId, 30);
              }
            },
          } : undefined,
        });
      }
    }
  }, [error, selectedAccountId, loadHistory]);

  // Show loading spinner for initial load
  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">
                Portfolio Analytics
              </h1>
              <button
                onClick={handleRefresh}
                disabled={showRefreshSpinner}
                className={`p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors ${
                  showRefreshSpinner ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                aria-label="Refresh analytics"
              >
                {showRefreshSpinner ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <RotateCw className="w-5 h-5" />
                )}
              </button>
            </div>
            <p className="text-gray-600 mt-2">
              Comprehensive analysis of your portfolio performance
            </p>
            <p className={`text-sm mt-1 transition-colors ${getTimeColor(lastUpdated)}`}>
              {formatTimeDifference(lastUpdated)}
            </p>
          </div>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="w-full mb-8">
        <DateRangeSelector accountId={selectedAccountId} />
      </div>

      {/* Metrics Section */}
      <div className="w-full mb-8">
        <MetricsPanel />
      </div>

      {/* Pie Chart - Portfolio Allocation */}
      <div className="w-full mb-8">
        <PortfolioChart />
      </div>

      {/* Line Chart - Portfolio Value Over Time */}
      <div className="w-full mb-8">
        <HistoryChart />
      </div>

      {/* Error Alert - Shows at bottom if exists */}
      {error && showError && (
        <div className="w-full mt-8 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-600 rounded-r-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start">
              <svg
                className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 mr-3"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Error loading analytics
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  {error}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowError(false)}
              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 transition-colors"
              aria-label="Close error message"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <Toaster
        position="bottom-right"
        theme="system"
        richColors
        toastOptions={{
          duration: 3000,
        }}
      />
    </div>
  );
};

export default AnalyticsDashboard;
