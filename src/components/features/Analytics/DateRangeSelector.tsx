import React from 'react';
import { Calendar } from 'lucide-react';
import { useAnalyticsStore } from '../../../stores/analyticsStore';

interface DateRangeSelectorProps {
  accountId: string;
}

const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({ accountId }) => {
  const { selectedDays, setSelectedDays, loadHistory, isLoading } = useAnalyticsStore();

  const dateRangeOptions = [
    { days: 30, label: '30 Days' },
    { days: 90, label: '90 Days' },
    { days: 180, label: '180 Days' },
    { days: 365, label: '1 Year' },
  ];

  const handleDateRangeChange = async (days: number) => {
    if (isLoading) return;
    setSelectedDays(days);
    await loadHistory(accountId, days);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <div className="flex flex-wrap gap-2 sm:grid sm:grid-cols-2 md:flex md:flex-row">
        {dateRangeOptions.map(({ days, label }) => {
          const isActive = selectedDays === days;

          return (
            <button
              key={days}
              onClick={() => handleDateRangeChange(days)}
              disabled={isLoading}
              className={`
                flex items-center justify-center gap-2 px-4 py-2 rounded-lg
                transition-all duration-200 ease-in-out
                h-10 flex-1 min-w-[120px]
                ${
                  isActive
                    ? 'bg-blue-500 text-white font-bold'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
                ${
                  isLoading
                    ? 'opacity-50 cursor-not-allowed'
                    : 'cursor-pointer'
                }
              `}
            >
              {isLoading && isActive ? (
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                <Calendar className="w-4 h-4" />
              )}
              <span className="text-sm sm:text-base">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DateRangeSelector;
