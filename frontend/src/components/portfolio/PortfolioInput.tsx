'use client';

import React, { useState, useCallback } from 'react';
import { Plus, X, Search, Loader2 } from 'lucide-react';
import { Asset } from '@/types';
import { marketApi } from '@/lib/api';

const PERIOD_OPTIONS = [
  { label: '1Y', value: '1y', description: '1 year' },
  { label: '3Y', value: '3y', description: '3 years' },
  { label: '5Y', value: '5y', description: '5 years' },
  { label: '10Y', value: '10y', description: '10 years' },
];

interface PortfolioInputProps {
  assets: Asset[];
  onAssetsChange: (assets: Asset[]) => void;
  riskFreeRate: number;
  onRiskFreeRateChange: (rate: number) => void;
  period: string;
  onPeriodChange: (period: string) => void;
}

export const PortfolioInput: React.FC<PortfolioInputProps> = ({
  assets,
  onAssetsChange,
  riskFreeRate,
  onRiskFreeRateChange,
  period,
  onPeriodChange,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ ticker: string; name: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // Debounced search
  const handleSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await marketApi.searchTickers(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toUpperCase();
    setSearchQuery(query);
    handleSearch(query);
  };

  const addAsset = (ticker: string, name?: string) => {
    if (assets.find((a) => a.ticker === ticker)) {
      return; // Already exists
    }

    const newAssets = [...assets, { ticker, weight: 0, name }];
    // Equal weight distribution for new assets
    const equalWeight = 1 / newAssets.length;
    const updatedAssets = newAssets.map((a) => ({ ...a, weight: equalWeight }));

    onAssetsChange(updatedAssets);
    setSearchQuery('');
    setSearchResults([]);
    setShowSearch(false);
  };

  const removeAsset = (ticker: string) => {
    const newAssets = assets.filter((a) => a.ticker !== ticker);
    if (newAssets.length > 0) {
      // Redistribute weights
      const equalWeight = 1 / newAssets.length;
      onAssetsChange(newAssets.map((a) => ({ ...a, weight: equalWeight })));
    } else {
      onAssetsChange([]);
    }
  };

  const updateWeight = (ticker: string, weight: number) => {
    const newAssets = assets.map((a) =>
      a.ticker === ticker ? { ...a, weight: Math.max(0, Math.min(1, weight)) } : a
    );
    onAssetsChange(newAssets);
  };

  const normalizeWeights = () => {
    const total = assets.reduce((sum, a) => sum + a.weight, 0);
    if (total > 0) {
      const normalized = assets.map((a) => ({ ...a, weight: a.weight / total }));
      onAssetsChange(normalized);
    }
  };

  const totalWeight = assets.reduce((sum, a) => sum + a.weight, 0);
  const weightError = Math.abs(totalWeight - 1) > 0.01;

  return (
    <div className="w-full bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Portfolio Composition</h3>

      {/* Risk-free rate input */}
      <div className="mb-4 flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700">Risk-Free Rate:</label>
        <input
          type="number"
          step="0.001"
          min="0"
          max="1"
          value={riskFreeRate}
          onChange={(e) => onRiskFreeRateChange(parseFloat(e.target.value) || 0)}
          className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span className="text-sm text-gray-500">(e.g., 0.045 for 4.5%)</span>
      </div>

      {/* Period selector */}
      <div className="mb-4">
        <label className="text-sm font-medium text-gray-700 block mb-2">Data Period:</label>
        <div className="flex gap-2">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onPeriodChange(opt.value)}
              title={opt.description}
              className={`flex-1 py-1.5 text-sm font-medium rounded-lg border transition-colors ${
                period === opt.value
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Historical window used for all calculations
        </p>
      </div>

      {/* Search */}
      <div className="mb-4 relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search tickers (e.g., AAPL, MSFT)..."
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => setShowSearch(true)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400" size={16} />
            )}
          </div>
        </div>

        {/* Search results dropdown */}
        {showSearch && searchResults.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {searchResults.map((result) => (
              <button
                key={result.ticker}
                onClick={() => addAsset(result.ticker, result.name)}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between"
              >
                <div>
                  <span className="font-semibold text-gray-900">{result.ticker}</span>
                  <span className="ml-2 text-sm text-gray-600">{result.name}</span>
                </div>
                <Plus size={16} className="text-blue-500" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Current assets */}
      <div className="space-y-2">
        {assets.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            No assets added yet. Search and add stocks to build your portfolio.
          </p>
        ) : (
          assets.map((asset) => (
            <div
              key={asset.ticker}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex-1">
                <span className="font-semibold text-gray-900">{asset.ticker}</span>
                {asset.name && (
                  <span className="ml-2 text-sm text-gray-600">{asset.name}</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={asset.weight}
                  onChange={(e) => updateWeight(asset.ticker, parseFloat(e.target.value))}
                  className="w-20 px-2 py-1 text-sm text-right border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-500">%</span>
              </div>

              <button
                onClick={() => removeAsset(asset.ticker)}
                className="p-1 text-red-500 hover:bg-red-50 rounded"
              >
                <X size={18} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Weight summary */}
      {assets.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Total Weight:</span>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-bold ${weightError ? 'text-red-600' : 'text-green-600'}`}>
                {(totalWeight * 100).toFixed(1)}%
              </span>
              {weightError && (
                <button
                  onClick={normalizeWeights}
                  className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  Normalize
                </button>
              )}
            </div>
          </div>
          {weightError && (
            <p className="text-xs text-red-600 mt-1">
              Weights should sum to 100%. Click Normalize to fix.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default PortfolioInput;
