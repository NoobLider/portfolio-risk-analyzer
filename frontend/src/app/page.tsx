'use client';

import React, { useState, useCallback } from 'react';
import { Calculator, Sparkles, Info, AlertCircle, TrendingUp, Shuffle } from 'lucide-react';
import { PortfolioInput } from '@/components/portfolio/PortfolioInput';
import { RiskMetricsCard } from '@/components/metrics/RiskMetricsCard';
import { EfficientFrontierChart } from '@/components/charts/EfficientFrontierChart';
import { AllocationPieChart } from '@/components/charts/AllocationPieChart';
import { CorrelationHeatmap } from '@/components/charts/CorrelationHeatmap';
import { OptimizationComparison } from '@/components/portfolio/OptimizationComparison';
import { SectorWarning } from '@/components/portfolio/SectorWarning';
import { CorrelationComparison } from '@/components/charts/CorrelationComparison';
import { MonteCarloChart } from '@/components/charts/MonteCarloChart';
import { BenchmarkChart } from '@/components/charts/BenchmarkChart';
import { ExportButton } from '@/components/portfolio/ExportButton';
import { portfolioApi } from '@/lib/api';
import {
  Asset,
  PortfolioAnalysisResponse,
  OptimalPortfoliosResponse,
  MonteCarloResponse,
  BenchmarkComparisonResponse,
} from '@/types';

export default function Home() {
  const [assets, setAssets] = useState<Asset[]>([
    { ticker: 'AAPL', weight: 0.25 },
    { ticker: 'MSFT', weight: 0.25 },
    { ticker: 'GOOGL', weight: 0.20 },
    { ticker: 'AMZN', weight: 0.15 },
    { ticker: 'META', weight: 0.15 },
  ]);
  const [riskFreeRate, setRiskFreeRate] = useState(0.045);
  const [period, setPeriod] = useState('5y');

  const [analysis, setAnalysis] = useState<PortfolioAnalysisResponse | null>(null);
  const [optimization, setOptimization] = useState<OptimalPortfoliosResponse | null>(null);
  const [monteCarlo, setMonteCarlo] = useState<MonteCarloResponse | null>(null);
  const [benchmark, setBenchmark] = useState<BenchmarkComparisonResponse | null>(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isRunningMC, setIsRunningMC] = useState(false);
  const [isLoadingBenchmark, setIsLoadingBenchmark] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'analysis' | 'optimization' | null>(null);

  function clearAllResults() {
    setAnalysis(null);
    setOptimization(null);
    setMonteCarlo(null);
    setBenchmark(null);
    setActiveView(null);
  }

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
        period,
      });
      setAnalysis(response);
      setOptimization(null);
      setMonteCarlo(null);
      setBenchmark(null);
      setActiveView('analysis');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [assets, riskFreeRate, period]);

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
        period,
        allow_short_selling: false,
      });
      setOptimization(response);
      setAnalysis(null);
      setMonteCarlo(null);
      setBenchmark(null);
      setActiveView('optimization');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Optimization failed. Please try again.');
    } finally {
      setIsOptimizing(false);
    }
  }, [assets, riskFreeRate, period]);

  const handleMonteCarlo = useCallback(async () => {
    if (assets.length < 2) {
      setError('Please add at least 2 assets for Monte Carlo simulation');
      return;
    }
    setIsRunningMC(true);
    setError(null);
    try {
      const response = await portfolioApi.runMonteCarlo({
        tickers: assets.map((a) => a.ticker),
        risk_free_rate: riskFreeRate,
        period,
        n_simulations: 2000,
      });
      setMonteCarlo(response);
      setAnalysis(null);
      setOptimization(null);
      setBenchmark(null);
      setActiveView(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Monte Carlo simulation failed. Please try again.');
    } finally {
      setIsRunningMC(false);
    }
  }, [assets, riskFreeRate, period]);

  const handleBenchmark = useCallback(async () => {
    if (assets.length === 0) {
      setError('Please add at least one asset');
      return;
    }
    setIsLoadingBenchmark(true);
    setError(null);
    try {
      const response = await portfolioApi.getBenchmarkComparison({
        assets: assets.map((a) => ({ ticker: a.ticker, weight: a.weight })),
        period,
        benchmark: 'SPY',
      });
      setBenchmark(response);
      setAnalysis(null);
      setOptimization(null);
      setMonteCarlo(null);
      setActiveView(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Benchmark comparison failed. Please try again.');
    } finally {
      setIsLoadingBenchmark(false);
    }
  }, [assets, period]);

  const sectors: Record<string, string> =
    optimization?.sectors ?? analysis?.sectors ?? {};

  const hasAnyResult = !!(analysis || optimization || monteCarlo || benchmark);

  return (
    <main className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calculator className="text-blue-600" size={28} />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Portfolio Risk Analyzer</h1>
                <p className="text-sm text-gray-600">Quantitative analysis using Modern Portfolio Theory</p>
              </div>
            </div>
            {hasAnyResult && (
              <ExportButton
                analysis={analysis}
                optimization={optimization}
                period={period}
                resultsElementId="results-panel"
              />
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="text-red-500 shrink-0" size={20} />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-1 space-y-4">
            <PortfolioInput
              assets={assets}
              onAssetsChange={setAssets}
              riskFreeRate={riskFreeRate}
              onRiskFreeRateChange={setRiskFreeRate}
              period={period}
              onPeriodChange={(p) => { setPeriod(p); clearAllResults(); }}
            />

            {/* Sector warning */}
            {Object.keys(sectors).length > 0 && (
              <SectorWarning
                sectors={sectors}
                weights={analysis?.weights ?? Object.fromEntries(assets.map((a) => [a.ticker, a.weight]))}
              />
            )}

            {/* Action buttons — 2×2 grid */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || assets.length === 0}
                className="px-3 py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isAnalyzing ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Analyzing...</>
                ) : (
                  <><Calculator size={16} /> Analyze</>
                )}
              </button>

              <button
                onClick={handleOptimize}
                disabled={isOptimizing || assets.length < 2}
                className="px-3 py-2.5 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isOptimizing ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Optimizing...</>
                ) : (
                  <><Sparkles size={16} /> Optimize</>
                )}
              </button>

              <button
                onClick={handleMonteCarlo}
                disabled={isRunningMC || assets.length < 2}
                className="px-3 py-2.5 bg-purple-600 text-white rounded-lg font-medium text-sm hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isRunningMC ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Simulating...</>
                ) : (
                  <><Shuffle size={16} /> Monte Carlo</>
                )}
              </button>

              <button
                onClick={handleBenchmark}
                disabled={isLoadingBenchmark || assets.length === 0}
                className="px-3 py-2.5 bg-orange-500 text-white rounded-lg font-medium text-sm hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoadingBenchmark ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Loading...</>
                ) : (
                  <><TrendingUp size={16} /> vs SPY</>
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
                    Implements Markowitz optimization to find the asset allocation that maximises
                    risk-adjusted returns (Sharpe ratio). Monte Carlo simulates 2,000 random
                    portfolios to visualise the efficient frontier.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right column — results */}
          <div className="lg:col-span-2 space-y-6" id="results-panel">

            {/* Tab switcher when both analysis + optimization exist */}
            {analysis && optimization && (
              <div className="flex gap-2 bg-white rounded-lg shadow-sm p-1 border border-gray-200">
                <button
                  onClick={() => setActiveView('analysis')}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeView === 'analysis' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  Risk Analysis
                </button>
                <button
                  onClick={() => setActiveView('optimization')}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeView === 'optimization' ? 'bg-green-600 text-white' : 'text-gray-600 hover:text-green-600'
                  }`}
                >
                  Optimization
                </button>
              </div>
            )}

            {/* ── Analysis results ─────────────────────────────────── */}
            {analysis && activeView === 'analysis' && (
              <>
                <RiskMetricsCard metrics={analysis.portfolio_metrics} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <AllocationPieChart allocations={analysis.weights} title="Current Allocation" />

                  <div className="bg-white rounded-lg shadow-md p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Asset Performance</h3>
                    <div className="space-y-2">
                      {Object.entries(analysis.asset_metrics).map(([ticker, metrics]) => (
                        <div key={ticker} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div>
                            <span className="font-medium text-gray-900">{ticker}</span>
                            {analysis.sectors[ticker] && analysis.sectors[ticker] !== 'Unknown' && (
                              <span className="ml-2 text-xs text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded">
                                {analysis.sectors[ticker]}
                              </span>
                            )}
                          </div>
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
                    title="Asset Correlation Matrix — Current Portfolio"
                  />
                )}
              </>
            )}

            {/* ── Optimization results ─────────────────────────────── */}
            {optimization && activeView === 'optimization' && (
              <>
                <OptimizationComparison
                  currentPortfolio={undefined}
                  optimalPortfolio={optimization.max_sharpe}
                />

                <EfficientFrontierChart
                  frontier={optimization.efficient_frontier}
                  portfolios={[
                    { name: 'Max Sharpe', volatility: optimization.max_sharpe.volatility, return: optimization.max_sharpe.expected_return, color: '#10b981' },
                    { name: 'Min Variance', volatility: optimization.min_variance.volatility, return: optimization.min_variance.expected_return, color: '#f59e0b' },
                    { name: 'Equal Weight', volatility: optimization.equal_weight.volatility, return: optimization.equal_weight.expected_return, color: '#8b5cf6' },
                  ]}
                  riskFreeRate={riskFreeRate}
                />

                <CorrelationComparison
                  correlationMatrix={optimization.correlation_matrix}
                  currentWeights={Object.fromEntries(assets.map((a) => [a.ticker, a.weight]))}
                  optimalWeights={optimization.max_sharpe.optimal_weights}
                  tickers={Object.keys(optimization.correlation_matrix)}
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

            {/* ── Monte Carlo results ──────────────────────────────── */}
            {monteCarlo && (
              <MonteCarloChart
                simulations={monteCarlo.simulations}
                portfolios={[
                  ...assets.length >= 2 ? [{
                    name: 'Current',
                    volatility: 0, // placeholder — replaced below
                    return: 0,
                    color: '#ef4444',
                  }] : [],
                ].filter(() => false)} // markers added via optimization if available
                riskFreeRate={riskFreeRate}
              />
            )}

            {/* ── Benchmark comparison results ─────────────────────── */}
            {benchmark && (
              <BenchmarkChart
                series={benchmark.series}
                benchmark={benchmark.benchmark}
                summary={benchmark.summary}
              />
            )}

            {/* ── Empty state ──────────────────────────────────────── */}
            {!hasAnyResult && !isAnalyzing && !isOptimizing && !isRunningMC && !isLoadingBenchmark && (
              <div className="flex flex-col items-center justify-center h-96 bg-white rounded-lg shadow-md">
                <Calculator size={48} className="text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg">Build a portfolio and run an analysis</p>
                <p className="text-gray-400 text-sm mt-2">
                  Use the four buttons on the left to get started
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
