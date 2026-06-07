'use client';

import React from 'react';
import { ArrowRight, TrendingUp, Shield, Scale } from 'lucide-react';
import { OptimizationResult } from '@/types';
import { formatPercentage, formatDecimal } from '@/lib/utils';

interface OptimizationComparisonProps {
  currentPortfolio?: {
    expected_return: number;
    volatility: number;
    sharpe_ratio: number;
    weights: Record<string, number>;
  };
  optimalPortfolio: OptimizationResult;
  title?: string;
}

export const OptimizationComparison: React.FC<OptimizationComparisonProps> = ({
  currentPortfolio,
  optimalPortfolio,
  title = 'Optimization Recommendation',
}) => {
  const improvements = {
    return: optimalPortfolio.expected_return - (currentPortfolio?.expected_return || 0),
    volatility: optimalPortfolio.volatility - (currentPortfolio?.volatility || 0),
    sharpe: optimalPortfolio.sharpe_ratio - (currentPortfolio?.sharpe_ratio || 0),
  };

  const topAllocations = Object.entries(optimalPortfolio.optimal_weights)
    .filter(([, weight]) => weight > 0.01)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="w-full bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>

      {/* Optimal metrics summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-3 bg-green-50 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={16} className="text-green-600" />
            <span className="text-xs font-medium text-green-700">Expected Return</span>
          </div>
          <p className="text-xl font-bold text-green-900">
            {formatPercentage(optimalPortfolio.expected_return)}
          </p>
          {currentPortfolio && (
            <p className={`text-xs ${improvements.return >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {improvements.return >= 0 ? '+' : ''}{formatPercentage(improvements.return)}
            </p>
          )}
        </div>

        <div className="p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Shield size={16} className="text-blue-600" />
            <span className="text-xs font-medium text-blue-700">Volatility</span>
          </div>
          <p className="text-xl font-bold text-blue-900">
            {formatPercentage(optimalPortfolio.volatility)}
          </p>
          {currentPortfolio && (
            <p className={`text-xs ${improvements.volatility <= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {improvements.volatility >= 0 ? '+' : ''}{formatPercentage(improvements.volatility)}
            </p>
          )}
        </div>

        <div className="p-3 bg-purple-50 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Scale size={16} className="text-purple-600" />
            <span className="text-xs font-medium text-purple-700">Sharpe Ratio</span>
          </div>
          <p className="text-xl font-bold text-purple-900">
            {formatDecimal(optimalPortfolio.sharpe_ratio)}
          </p>
          {currentPortfolio && (
            <p className={`text-xs ${improvements.sharpe >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {improvements.sharpe >= 0 ? '+' : ''}{formatDecimal(improvements.sharpe)}
            </p>
          )}
        </div>
      </div>

      {/* Optimal allocations */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Recommended Allocation</h4>
        <div className="space-y-2">
          {topAllocations.map(([ticker, weight]) => (
            <div key={ticker} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="font-medium text-gray-900">{ticker}</span>
              <div className="flex items-center gap-3">
                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500"
                    style={{ width: `${weight * 100}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-gray-700 w-16 text-right">
                  {(weight * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comparison if current portfolio exists */}
      {currentPortfolio && (
        <div className="p-3 bg-yellow-50 rounded-lg">
          <h4 className="text-sm font-semibold text-yellow-900 mb-2">Comparison Summary</h4>
          <p className="text-sm text-yellow-800">
            Switching to the optimal portfolio would
            {improvements.return > 0 ? ' increase expected returns by ' + formatPercentage(improvements.return) : ' maintain similar expected returns'}
            {improvements.volatility < 0 ? ' while reducing volatility by ' + formatPercentage(Math.abs(improvements.volatility)) : ''}
            {improvements.sharpe > 0 ? ', resulting in a Sharpe ratio improvement of ' + formatDecimal(improvements.sharpe) + '.' : '.'}
          </p>
        </div>
      )}

      {/* Success message */}
      {optimalPortfolio.success && (
        <div className="mt-4 p-2 bg-green-50 border border-green-200 rounded">
          <p className="text-sm text-green-700">{optimalPortfolio.message}</p>
        </div>
      )}
    </div>
  );
};

export default OptimizationComparison;
