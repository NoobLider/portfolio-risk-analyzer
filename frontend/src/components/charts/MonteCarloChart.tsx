'use client';

import React, { useMemo } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { MonteCarloPoint } from '@/types';

interface PortfolioMarker {
  name: string;
  volatility: number;
  return: number;
  color: string;
}

interface MonteCarloChartProps {
  simulations: MonteCarloPoint[];
  portfolios?: PortfolioMarker[];
  riskFreeRate?: number;
}

// Map sharpe ratio to a colour on a red→yellow→green gradient
function sharpeToColor(sharpe: number, minSharpe: number, maxSharpe: number): string {
  const t = maxSharpe === minSharpe ? 0.5 : (sharpe - minSharpe) / (maxSharpe - minSharpe);
  const clamped = Math.max(0, Math.min(1, t));
  if (clamped < 0.5) {
    // red → yellow
    const f = clamped * 2;
    const r = 220;
    const g = Math.round(f * 200);
    return `rgb(${r},${g},40)`;
  } else {
    // yellow → green
    const f = (clamped - 0.5) * 2;
    const r = Math.round(220 * (1 - f));
    const g = Math.round(200 + f * 30);
    return `rgb(${r},${g},40)`;
  }
}

const CustomDot = (props: {
  cx?: number;
  cy?: number;
  payload?: MonteCarloPoint & { color: string };
}) => {
  const { cx, cy, payload } = props;
  if (cx === undefined || cy === undefined || !payload) return null;
  return <circle cx={cx} cy={cy} r={2.5} fill={payload.color} fillOpacity={0.7} stroke="none" />;
};

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: MonteCarloPoint & { color: string } }> }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold text-gray-800 mb-1">Simulated Portfolio</p>
      <p className="text-gray-600">Return: <span className="font-medium text-green-700">{(d.return * 100).toFixed(2)}%</span></p>
      <p className="text-gray-600">Volatility: <span className="font-medium text-blue-700">{(d.volatility * 100).toFixed(2)}%</span></p>
      <p className="text-gray-600">Sharpe: <span className="font-medium">{d.sharpe.toFixed(3)}</span></p>
    </div>
  );
};

export const MonteCarloChart: React.FC<MonteCarloChartProps> = ({
  simulations,
  portfolios = [],
  riskFreeRate = 0.045,
}) => {
  const { colored, minSharpe, maxSharpe } = useMemo(() => {
    const sharpes = simulations.map((s) => s.sharpe);
    const min = Math.min(...sharpes);
    const max = Math.max(...sharpes);
    return {
      colored: simulations.map((s) => ({ ...s, color: sharpeToColor(s.sharpe, min, max) })),
      minSharpe: min,
      maxSharpe: max,
    };
  }, [simulations]);

  const xMin = Math.max(0, Math.min(...simulations.map((s) => s.volatility)) - 0.02);
  const xMax = Math.max(...simulations.map((s) => s.volatility)) + 0.02;
  const yMin = Math.min(...simulations.map((s) => s.return)) - 0.02;
  const yMax = Math.max(...simulations.map((s) => s.return)) + 0.02;

  return (
    <div className="w-full bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-1">Monte Carlo Simulation</h3>
      <p className="text-sm text-gray-500 mb-4">
        {simulations.length.toLocaleString()} randomly weighted portfolios — colour shows Sharpe ratio
        (red = low, green = high). The efficient frontier emerges along the upper-left edge.
      </p>

      <ResponsiveContainer width="100%" height={420}>
        <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="volatility"
            type="number"
            domain={[xMin, xMax]}
            tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
            label={{ value: 'Volatility (annual)', position: 'insideBottom', offset: -15, fontSize: 12 }}
            tick={{ fontSize: 11 }}
          />
          <YAxis
            dataKey="return"
            type="number"
            domain={[yMin, yMax]}
            tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
            label={{ value: 'Expected Return (annual)', angle: -90, position: 'insideLeft', offset: 10, fontSize: 12 }}
            tick={{ fontSize: 11 }}
          />
          <Tooltip content={<CustomTooltip />} />

          {/* Simulated portfolios */}
          <Scatter
            name="Simulated"
            data={colored}
            shape={<CustomDot />}
          />

          {/* Named portfolio markers */}
          {portfolios.map((p) => {
            const MarkerShape = (props: unknown) => {
              const { cx, cy } = props as { cx?: number; cy?: number };
              if (!cx || !cy) return null;
              return (
                <g>
                  <circle cx={cx} cy={cy} r={8} fill={p.color} stroke="white" strokeWidth={2} />
                  <text x={cx} y={cy - 12} textAnchor="middle" fontSize={10} fontWeight="bold" fill={p.color}>
                    {p.name}
                  </text>
                </g>
              );
            };
            return (
              <Scatter
                key={p.name}
                name={p.name}
                data={[{ volatility: p.volatility, return: p.return, sharpe: 0, color: p.color }]}
                shape={<MarkerShape />}
              />
            );
          })}
        </ScatterChart>
      </ResponsiveContainer>

      {/* Sharpe gradient legend */}
      <div className="mt-4 flex items-center gap-3">
        <span className="text-xs text-gray-500">Low Sharpe</span>
        <div
          className="flex-1 h-3 rounded"
          style={{
            background: 'linear-gradient(to right, rgb(220,40,40), rgb(220,200,40), rgb(40,230,40))',
          }}
        />
        <span className="text-xs text-gray-500">High Sharpe</span>
        <span className="text-xs text-gray-400 ml-2">
          ({minSharpe.toFixed(2)} – {maxSharpe.toFixed(2)})
        </span>
      </div>
    </div>
  );
};

export default MonteCarloChart;
