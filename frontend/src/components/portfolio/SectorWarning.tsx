'use client';

import React from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface SectorWarningProps {
  sectors: Record<string, string>;
  weights: Record<string, number>;
}

interface SectorExposure {
  sector: string;
  totalWeight: number;
  tickers: string[];
}

function computeSectorExposures(
  sectors: Record<string, string>,
  weights: Record<string, number>
): SectorExposure[] {
  const map: Record<string, { totalWeight: number; tickers: string[] }> = {};

  for (const [ticker, sector] of Object.entries(sectors)) {
    const s = sector === 'Unknown' ? 'Unclassified' : sector;
    const w = weights[ticker] ?? 0;
    if (!map[s]) map[s] = { totalWeight: 0, tickers: [] };
    map[s].totalWeight += w;
    map[s].tickers.push(ticker);
  }

  return Object.entries(map)
    .map(([sector, data]) => ({ sector, ...data }))
    .sort((a, b) => b.totalWeight - a.totalWeight);
}

export const SectorWarning: React.FC<SectorWarningProps> = ({ sectors, weights }) => {
  const exposures = computeSectorExposures(sectors, weights);

  if (exposures.length === 0) return null;

  const topSector = exposures[0];
  const CONCENTRATION_THRESHOLD = 0.7; // 70%
  const isConcentrated = topSector.totalWeight >= CONCENTRATION_THRESHOLD;

  return (
    <div
      className={`rounded-lg p-4 border ${
        isConcentrated
          ? 'bg-amber-50 border-amber-300'
          : 'bg-green-50 border-green-300'
      }`}
    >
      <div className="flex items-start gap-3">
        {isConcentrated ? (
          <AlertTriangle className="text-amber-500 mt-0.5 shrink-0" size={18} />
        ) : (
          <CheckCircle className="text-green-500 mt-0.5 shrink-0" size={18} />
        )}

        <div className="flex-1 min-w-0">
          <h4
            className={`text-sm font-semibold ${
              isConcentrated ? 'text-amber-800' : 'text-green-800'
            }`}
          >
            {isConcentrated ? 'High Sector Concentration' : 'Sector Diversification'}
          </h4>

          {isConcentrated ? (
            <p className="text-xs text-amber-700 mt-1">
              <span className="font-semibold">{(topSector.totalWeight * 100).toFixed(0)}%</span> of
              this portfolio is in <span className="font-semibold">{topSector.sector}</span> (
              {topSector.tickers.join(', ')}). High sector concentration increases
              idiosyncratic risk. Consider adding assets from other sectors to improve
              diversification.
            </p>
          ) : (
            <p className="text-xs text-green-700 mt-1">
              Portfolio is spread across {exposures.length} sector
              {exposures.length > 1 ? 's' : ''}. Largest exposure:{' '}
              <span className="font-semibold">{topSector.sector}</span> (
              {(topSector.totalWeight * 100).toFixed(0)}%).
            </p>
          )}

          {/* Sector breakdown bars */}
          <div className="mt-3 space-y-1.5">
            {exposures.map((exp) => (
              <div key={exp.sector} className="flex items-center gap-2">
                <span className="text-xs text-gray-600 w-28 truncate shrink-0">
                  {exp.sector}
                </span>
                <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full ${
                      isConcentrated && exp.sector === topSector.sector
                        ? 'bg-amber-500'
                        : 'bg-blue-400'
                    }`}
                    style={{ width: `${Math.min(exp.totalWeight * 100, 100)}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 w-10 text-right shrink-0">
                  {(exp.totalWeight * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SectorWarning;
