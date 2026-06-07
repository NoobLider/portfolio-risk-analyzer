'use client';

import React, { useState, useCallback } from 'react';
import { Calculator, Sparkles, Info, AlertCircle } from 'lucide-react';
import { PortfolioInput } from '@/components/portfolio/PortfolioInput';
import { RiskMetricsCard } from '@/components/metrics/RiskMetricsCard';
import { EfficientFrontierChart } from '@/components/charts/EfficientFrontierChart';
import { AllocationPieChart } from '@/components/charts/AllocationPieChart';
import { CorrelationHeatmap } from '@/components/charts/CorrelationHeatmap';
import { OptimizationComparison } from '@/components/portfolio/OptimizationComparison';
import { portfolioApi } from '@/lib/api';
import { Asset, PortfolioAnalysisResponse, OptimalPortfoliosResponse } from '@/types';

export default function Home() {
  const [assets, setAssets] = useState<Asset[]>([
    { ticker: 'AAPL', weight: 0.25 },
    { ticker: 'MSFT', weight: 0.25 },
    { ticker: 'GOOGL', weight: 0.20 },
    { ticker: 'AMZN', weight: 0.15 },
    { ticker: 'META', weight: 0.15 },
  ]);
  const [riskFreeRate, setRiskFreeRate] = useState(0.045);

  const [analysis, setAnalysis] = useState<PortfolioAnalysisResponse | null>(null);
  const [optimization, setOptimization] = useState<OptimalPortfoliosResponse | null>(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = useCallback(async () => {
    if (assets.length === 0) {
      setError('Please add at least one asset to the portfolio');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await portfolioApi.analyzePortfolio({
        assets: assets.map((a) => ({ ticker: a.ticker, weight: a.weight })),
        risk_free_rate: riskFreeRate,
        period: '5y',
      });
      setAnalysis(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [assets, riskFreeRate]);

  const handleOptimize = useCallback(async () => {
    if (assets.length < 2) {
      setError('Please add at least 2 assets for optimization');
      return;
    }

    setIsOptimizing(true);
    setError(null);

    try {
      const response = await portfolioApi.optimizePortfolio({
        tickers: assets.map((a) => a.ticker),
        risk_free_rate: riskFreeRate,
        period: '5y',
        allow_short_selling: false,
      });
      setOptimization(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Optimization failed. Please try again.');
    } finally {
      setIsOptimizing(false);
    }
  }, [assets, riskFreeRate]);

  return (
    <main className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <Calculator className="text-blue-600" size={28} />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Portfolio Risk Analyzer
              </h1>
              <p className="text-sm text-gray-600">
                Quantitative analysis using Modern Portfolio Theory
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="text-red-500" size={20} />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Input */}
          <div className="lg:col-span-1 space-y-6">
            <PortfolioInput
              assets={assets}
              onAssetsChange={setAssets}
              riskFreeRate={riskFreeRate}
              onRiskFreeRateChange={setRiskFreeRate}
            />

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || assets.length === 0}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Calculator size={18} />
                    Analyze Portfolio
                  </>
                )}
              </button>

              <button
                onClick={handleOptimize}
                disabled={isOptimizing || assets.length < 2}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isOptimizing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Optimizing...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    Optimize
                  </>
                )}
              </button>
            </div>

            {/* Theory note */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start gap-2">
                <Info size={18} className="text-blue-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-blue-900">Modern Portfolio Theory</h4>
                  <p className="text-xs text-blue-800 mt-1">
                    This tool implements Markowitz portfolio optimization to find the asset allocation
                    that maximizes risk-adjusted returns (Sharpe ratio).
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right column - Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* Analysis results */}
            {analysis && (
              <>
                <RiskMetricsCard metrics={analysis.portfolio_metrics} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <AllocationPieChart allocations={analysis.weights} title="Current Allocation" />

                  <div className="bg-white rounded-lg shadow-md p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Asset Performance</h3>
                    <div className="space-y-2">
                      {Object.entries(analysis.asset_metrics).map(([ticker, metrics]) => (
                        <div key={ticker} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="font-medium text-gray-900">{ticker}</span>
                          <div className="text-sm text-right">
                            <span className="text-gray-600">Return: {(metrics.expected_return * 100).toFixed(1)}%</span>
                            <span className="ml-3 text-gray-600">Vol: {(metrics.volatility * 100).toFixed(1)}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {Object.keys(analysis.correlation_matrix).length > 1 && (
                  <CorrelationHeatmap
                    correlationMatrix={analysis.correlation_matrix}
                    tickers={Object.keys(analysis.correlation_matrix)}
                  />
                )}
              </>
            )}

            {/* Optimization results */}
            {optimization && (
              <>
                <OptimizationComparison
                  currentPortfolio={analysis ? {
                    expected_return: analysis.portfolio_metrics.expected_return,
                    volatility: analysis.portfolio_metrics.volatility,
                    sharpe_ratio: analysis.portfolio_metrics.sharpe_ratio,
                    weights: analysis.weights,
                  } : undefined}
                  optimalPortfolio={optimization.max_sharpe}
                />

                <EfficientFrontierChart
                  frontier={optimization.efficient_frontier}
                  portfolios={[
                    {
                      name: 'Max Sharpe',
                      volatility: optimization.max_sharpe.volatility,
                      return: optimization.max_sharpe.expected_return,
                      color: '#10b981',
                    },
                    {
                      name: 'Min Variance',
                      volatility: optimization.min_variance.volatility,
                      return: optimization.min_variance.expected_return,
                      color: '#f59e0b',
                    },
                    {
                      name: 'Equal Weight',
                      volatility: optimization.equal_weight.volatility,
                      return: optimization.equal_weight.expected_return,
                      color: '#8b5cf6',
                    },
                    ...(analysis ? [{
                      name: 'Current',
                      volatility: analysis.portfolio_metrics.volatility,
                      return: analysis.portfolio_metrics.expected_return,
                      color: '#ef4444',
                    }] : []),
                  ]}
                  riskFreeRate={riskFreeRate}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg shadow-md p-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Max Sharpe Portfolio</h4>
                    <p className="text-xs text-gray-600 mb-2">Optimal risk-adjusted returns</p>
                    <p className="text-lg font-bold text-green-600">{optimization.max_sharpe.sharpe_ratio.toFixed(2)}</p>
                    <p className="text-sm text-gray-600">Sharpe Ratio</p>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Minimum Variance</h4>
                    <p className="text-xs text-gray-600 mb-2">Lowest risk portfolio</p>
                    <p className="text-lg font-bold text-yellow-600">{(optimization.min_variance.volatility * 100).toFixed(1)}%</p>
                    <p className="text-sm text-gray-600">Volatility</p>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Equal Weight</h4>
                    <p className="text-xs text-gray-600 mb-2">Naive diversification</p>
                    <p className="text-lg font-bold text-purple-600">{optimization.equal_weight.sharpe_ratio.toFixed(2)}</p>
                    <p className="text-sm text-gray-600">Sharpe Ratio</p>
                  </div>
                </div>
              </>
            )}

            {/* Empty state */}
            {!analysis && !optimization && !isAnalyzing && !isOptimizing && (
              <div className="flex flex-col items-center justify-center h-96 bg-white rounded-lg shadow-md">
                <Calculator size={48} className="text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg">Build a portfolio and click Analyze or Optimize</p>
                <p className="text-gray-400 text-sm mt-2">
                  Add stocks from the sidebar to get started
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
