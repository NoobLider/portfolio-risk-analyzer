'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';

interface CorrelationComparisonProps {
  correlationMatrix: Record<string, Record<string, number>>;
  currentWeights: Record<string, number>;
  optimalWeights: Record<string, number>;
  tickers: string[];
}

function getColor(value: number): string {
  if (value > 0) return `rgba(59, 130, 246, ${0.1 + value * 0.9})`;
  return `rgba(239, 68, 68, ${0.1 + Math.abs(value) * 0.9})`;
}

function getTextColor(value: number): string {
  return Math.abs(value) > 0.5 ? 'white' : '#374151';
}

/**
 * Weighted average correlation of a portfolio given weights and a correlation matrix.
 * Measures how "diversified" the portfolio is — lower is better.
 * Formula: Σ_i Σ_j w_i * w_j * ρ_ij  (excluding diagonal)
 */
function weightedAvgCorrelation(
  weights: Record<string, number>,
  matrix: Record<string, Record<string, number>>,
  tickers: string[]
): number {
  let sum = 0;
  let totalWeight = 0;
  for (const ti of tickers) {
    for (const tj of tickers) {
      if (ti === tj) continue;
      const wi = weights[ti] ?? 0;
      const wj = weights[tj] ?? 0;
      const corr = matrix[ti]?.[tj] ?? 0;
      sum += wi * wj * corr;
      totalWeight += wi * wj;
    }
  }
  return totalWeight > 0 ? sum / totalWeight : 0;
}

interface HeatmapProps {
  correlationMatrix: Record<string, Record<string, number>>;
  tickers: string[];
  weights: Record<string, number>;
  label: string;
  labelColor: string;
}

const MiniHeatmap: React.FC<HeatmapProps> = ({
  correlationMatrix,
  tickers,
  weights,
  label,
  labelColor,
}) => {
  const sorted = [...tickers].sort();
  const cellSize = Math.max(44, Math.min(64, Math.floor(320 / sorted.length)));

  return (
    <div className="flex-1 min-w-0">
      <div className={`text-sm font-semibold mb-3 ${labelColor}`}>{label}</div>

      {/* Weight badges */}
      <div className="flex flex-wrap gap-1 mb-3">
        {sorted.map((t) => {
          const w = weights[t];
          if (!w || w < 0.001) return null;
          return (
            <span
              key={t}
              className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full"
            >
              {t}: {(w * 100).toFixed(1)}%
            </span>
          );
        })}
      </div>

      <div className="overflow-x-auto">
        <div className="inline-block">
          {/* Header */}
          <div className="flex">
            <div style={{ width: cellSize, flexShrink: 0 }} />
            {sorted.map((ticker) => (
              <div
                key={ticker}
                className="flex items-center justify-center text-xs font-medium text-gray-600"
                style={{ width: cellSize, height: 36, flexShrink: 0 }}
              >
                {ticker}
              </div>
            ))}
          </div>

          {/* Rows */}
          {sorted.map((rowTicker) => (
            <div key={rowTicker} className="flex">
              <div
                className="flex items-center justify-center text-xs font-medium text-gray-600"
                style={{ width: cellSize, height: cellSize, flexShrink: 0 }}
              >
                {rowTicker}
              </div>
              {sorted.map((colTicker) => {
                const value = correlationMatrix[rowTicker]?.[colTicker] ?? 0;
                return (
                  <div
                    key={`${rowTicker}-${colTicker}`}
                    className="flex items-center justify-center text-xs font-semibold"
                    style={{
                      width: cellSize,
                      height: cellSize,
                      flexShrink: 0,
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
    </div>
  );
};

export const CorrelationComparison: React.FC<CorrelationComparisonProps> = ({
  correlationMatrix,
  currentWeights,
  optimalWeights,
  tickers,
}) => {
  const currentAvgCorr = weightedAvgCorrelation(currentWeights, correlationMatrix, tickers);
  const optimalAvgCorr = weightedAvgCorrelation(optimalWeights, correlationMatrix, tickers);
  const improvement = currentAvgCorr - optimalAvgCorr;

  return (
    <div className="w-full bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-1">
        Correlation Analysis: Before vs After Optimization
      </h3>
      <p className="text-sm text-gray-500 mb-4">
        The optimizer shifts weight toward lower-correlated assets to reduce portfolio risk.
        Lower weighted-average correlation means better diversification.
      </p>

      {/* Summary bar */}
      <div className="flex items-center gap-4 mb-6 p-3 bg-gray-50 rounded-lg">
        <div className="text-center">
          <p className="text-xs text-gray-500">Current avg. correlation</p>
          <p className="text-xl font-bold text-gray-700">{currentAvgCorr.toFixed(3)}</p>
        </div>
        <ArrowRight className="text-gray-400 shrink-0" size={20} />
        <div className="text-center">
          <p className="text-xs text-gray-500">Optimal avg. correlation</p>
          <p className="text-xl font-bold text-green-600">{optimalAvgCorr.toFixed(3)}</p>
        </div>
        {improvement > 0.001 && (
          <div className="ml-auto text-center bg-green-50 border border-green-200 rounded-lg px-4 py-2">
            <p className="text-xs text-green-600 font-medium">Diversification gain</p>
            <p className="text-lg font-bold text-green-700">−{improvement.toFixed(3)}</p>
            <p className="text-xs text-green-600">lower correlation</p>
          </div>
        )}
      </div>

      {/* Side-by-side heatmaps */}
      <div className="flex flex-col lg:flex-row gap-6">
        <MiniHeatmap
          correlationMatrix={correlationMatrix}
          tickers={tickers}
          weights={currentWeights}
          label="Current Portfolio Weights"
          labelColor="text-gray-700"
        />

        <div className="hidden lg:flex items-center justify-center">
          <ArrowRight className="text-blue-400" size={28} />
        </div>

        <MiniHeatmap
          correlationMatrix={correlationMatrix}
          tickers={tickers}
          weights={optimalWeights}
          label="Optimized (Max Sharpe) Weights"
          labelColor="text-green-700"
        />
      </div>

      <p className="text-xs text-gray-400 mt-4">
        Note: The correlation matrix is the same for both — only the portfolio weights change.
        The optimizer finds the weight combination that minimizes portfolio variance (w&#7488; Σ w)
        relative to expected return.
      </p>
    </div>
  );
};

export default CorrelationComparison;
