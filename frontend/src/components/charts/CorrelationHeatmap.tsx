'use client';

import React from 'react';

interface CorrelationHeatmapProps {
  correlationMatrix: Record<string, Record<string, number>>;
  tickers: string[];
  title?: string;
}

export const CorrelationHeatmap: React.FC<CorrelationHeatmapProps> = ({
  correlationMatrix,
  tickers,
  title = 'Asset Correlation Matrix',
}) => {
  const getColor = (value: number): string => {
    // Blue for positive, Red for negative
    // Intensity based on absolute value
    if (value > 0) {
      const intensity = Math.min(255, Math.round(value * 255));
      return `rgba(59, 130, 246, ${0.1 + value * 0.9})`; // Blue with varying opacity
    } else {
      const intensity = Math.min(255, Math.round(Math.abs(value) * 255));
      return `rgba(239, 68, 68, ${0.1 + Math.abs(value) * 0.9})`; // Red with varying opacity
    }
  };

  const getTextColor = (value: number): string => {
    return Math.abs(value) > 0.5 ? 'white' : '#374151';
  };

  // Ensure tickers are sorted and consistent
  const sortedTickers = tickers.sort();

  return (
    <div className="w-full bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>

      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Header row */}
          <div className="flex">
            <div className="w-20 flex-shrink-0" /> {/* Empty corner cell */}
            {sortedTickers.map((ticker) => (
              <div
                key={`header-${ticker}`}
                className="w-20 h-12 flex items-center justify-center text-xs font-medium text-gray-700"
              >
                {ticker}
              </div>
            ))}
          </div>

          {/* Data rows */}
          {sortedTickers.map((rowTicker) => (
            <div key={`row-${rowTicker}`} className="flex">
              {/* Row label */}
              <div className="w-20 h-12 flex items-center justify-center text-xs font-medium text-gray-700">
                {rowTicker}
              </div>

              {/* Cells */}
              {sortedTickers.map((colTicker) => {
                const value = correlationMatrix[rowTicker]?.[colTicker] ?? 0;
                return (
                  <div
                    key={`cell-${rowTicker}-${colTicker}`}
                    className="w-20 h-12 flex items-center justify-center text-xs font-semibold"
                    style={{
                      backgroundColor: getColor(value),
                      color: getTextColor(value),
                    }}
                    title={`${rowTicker} ↔ ${colTicker}: ${value.toFixed(3)}`}
                  >
                    {value.toFixed(2)}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-center">
            <div className="flex">
              <div className="w-6 h-6 bg-red-500/20" />
              <div className="w-6 h-6 bg-red-500/40" />
              <div className="w-6 h-6 bg-red-500/60" />
              <div className="w-6 h-6 bg-red-500/80" />
              <div className="w-6 h-6 bg-red-500" />
            </div>
            <span className="text-xs text-gray-500 mt-1">Negative</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-6 h-6 bg-gray-100 border" />
            <span className="text-xs text-gray-500 mt-1">0</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex">
              <div className="w-6 h-6 bg-blue-500/20" />
              <div className="w-6 h-6 bg-blue-500/40" />
              <div className="w-6 h-6 bg-blue-500/60" />
              <div className="w-6 h-6 bg-blue-500/80" />
              <div className="w-6 h-6 bg-blue-500" />
            </div>
            <span className="text-xs text-gray-500 mt-1">Positive</span>
          </div>
        </div>

        <div className="text-sm text-gray-600">
          Values range from -1 (perfect negative correlation) to +1 (perfect positive correlation)
        </div>
      </div>
    </div>
  );
};

export default CorrelationHeatmap;
