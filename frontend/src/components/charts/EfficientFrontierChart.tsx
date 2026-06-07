'use client';

import React from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ZAxis,
} from 'recharts';

interface FrontierPoint {
  volatility: number;
  return: number;
  sharpe: number;
}

interface PortfolioPoint {
  name: string;
  volatility: number;
  return: number;
  color: string;
}

interface EfficientFrontierChartProps {
  frontier: FrontierPoint[];
  portfolios: PortfolioPoint[];
  riskFreeRate: number;
  title?: string;
}

interface TooltipPayload {
  name: string;
  value: number;
  payload: Record<string, number>;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;

  return (
    <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
      <p className="text-sm text-gray-600">
        Volatility: {(data.volatility * 100).toFixed(2)}%
      </p>
      <p className="text-sm text-gray-600">
        Expected Return: {(data.return * 100).toFixed(2)}%
      </p>
      {data.sharpe !== undefined && (
        <p className="text-sm text-gray-600">
          Sharpe Ratio: {data.sharpe.toFixed(3)}
        </p>
      )}
    </div>
  );
};

export const EfficientFrontierChart: React.FC<EfficientFrontierChartProps> = ({
  frontier,
  portfolios,
  riskFreeRate,
  title = 'Efficient Frontier',
}) => {
  // Capital Market Line points
  const maxSharpePortfolio = portfolios.find((p) => p.name === 'Max Sharpe');
  const cmlData: { volatility: number; return: number }[] = [];

  if (maxSharpePortfolio && maxSharpePortfolio.volatility > 0) {
    const slope =
      (maxSharpePortfolio.return - riskFreeRate) / maxSharpePortfolio.volatility;
    for (let i = 0; i <= 10; i++) {
      const vol = (maxSharpePortfolio.volatility * i) / 5;
      cmlData.push({ volatility: vol, return: riskFreeRate + slope * vol });
    }
  }

  const allVols = frontier.map((f) => f.volatility);
  const domainMin = Math.max(0, Math.min(...allVols) * 0.9);
  const domainMax = Math.max(...allVols) * 1.1;

  return (
    <div className="w-full bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              type="number"
              dataKey="volatility"
              name="Volatility"
              tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
              label={{ value: 'Volatility (Annualized)', position: 'bottom', offset: 10 }}
              domain={[domainMin, domainMax]}
              stroke="#6b7280"
            />
            <YAxis
              type="number"
              dataKey="return"
              name="Expected Return"
              tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
              label={{ value: 'Expected Return', angle: -90, position: 'insideLeft', offset: -10 }}
              stroke="#6b7280"
            />
            <ZAxis range={[60, 60]} />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" height={36} />

            {/* Efficient Frontier curve */}
            <Scatter
              name="Efficient Frontier"
              data={frontier}
              fill="#3b82f6"
              line={{ stroke: '#3b82f6', strokeWidth: 2 }}
              legendType="line"
            />

            {/* Capital Market Line */}
            {cmlData.length > 0 && (
              <Scatter
                name="Capital Market Line"
                data={cmlData}
                fill="#10b981"
                line={{ stroke: '#10b981', strokeWidth: 2, strokeDasharray: '6 3' }}
                legendType="line"
                shape={() => <g />}
              />
            )}

            {/* Individual key portfolios */}
            {portfolios.map((portfolio) => (
              <Scatter
                key={portfolio.name}
                name={portfolio.name}
                data={[{ volatility: portfolio.volatility, return: portfolio.return }]}
                fill={portfolio.color}
              />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Legend summary */}
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        {portfolios.map((p) => (
          <div key={p.name} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="font-medium">{p.name}:</span>
            <span className="text-gray-600">
              {(p.return * 100).toFixed(1)}% ret / {(p.volatility * 100).toFixed(1)}% vol
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EfficientFrontierChart;
