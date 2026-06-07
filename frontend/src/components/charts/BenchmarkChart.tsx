'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { BenchmarkDataPoint } from '@/types';

interface BenchmarkSummary {
  portfolio_total_return: number;
  benchmark_total_return: number;
  portfolio_annualized_return: number;
  benchmark_annualized_return: number;
  tracking_error: number;
  information_ratio: number;
  alpha: number;
}

interface BenchmarkChartProps {
  series: BenchmarkDataPoint[];
  benchmark: string;
  summary: BenchmarkSummary;
}

const CustomTooltip = ({
  active,
  payload,
  label,
  benchmark,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
  benchmark?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: {((entry.value - 1) * 100).toFixed(2)}%
        </p>
      ))}
    </div>
  );
};

function fmt(v: number, pct = true): string {
  const val = pct ? (v * 100).toFixed(2) + '%' : v.toFixed(3);
  return v >= 0 ? `+${val}` : val;
}

function StatBadge({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive: boolean | null;
}) {
  const color =
    positive === null
      ? 'text-gray-700'
      : positive
      ? 'text-green-700'
      : 'text-red-600';
  return (
    <div className="bg-gray-50 rounded-lg p-3 text-center">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-base font-bold ${color}`}>{value}</p>
    </div>
  );
}

// Thin the series to at most ~300 points for rendering performance
function thin(series: BenchmarkDataPoint[], maxPoints = 300): BenchmarkDataPoint[] {
  if (series.length <= maxPoints) return series;
  const step = Math.ceil(series.length / maxPoints);
  return series.filter((_, i) => i % step === 0 || i === series.length - 1);
}

export const BenchmarkChart: React.FC<BenchmarkChartProps> = ({
  series,
  benchmark,
  summary,
}) => {
  const data = thin(series);

  // Determine x-axis tick interval
  const tickInterval = Math.max(1, Math.floor(data.length / 6));

  const portfolioBeating = summary.alpha > 0;

  return (
    <div className="w-full bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-1">
        Portfolio vs {benchmark} — Cumulative Returns
      </h3>
      <p className="text-sm text-gray-500 mb-4">
        Both series start at 1.0 (100%). Values show growth of $1 invested at the start of the period.
      </p>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatBadge
          label="Portfolio Total Return"
          value={fmt(summary.portfolio_total_return)}
          positive={summary.portfolio_total_return >= 0}
        />
        <StatBadge
          label={`${benchmark} Total Return`}
          value={fmt(summary.benchmark_total_return)}
          positive={summary.benchmark_total_return >= 0}
        />
        <StatBadge
          label="Alpha (annualized)"
          value={fmt(summary.alpha)}
          positive={summary.alpha > 0}
        />
        <StatBadge
          label="Information Ratio"
          value={summary.information_ratio.toFixed(3)}
          positive={summary.information_ratio > 0}
        />
      </div>

      <div className="flex items-center gap-2 mb-4">
        <span
          className={`text-sm font-medium px-3 py-1 rounded-full ${
            portfolioBeating
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {portfolioBeating
            ? `Outperforming ${benchmark} by ${fmt(summary.alpha)} / year`
            : `Underperforming ${benchmark} by ${fmt(Math.abs(summary.alpha))} / year`}
        </span>
        <span className="text-xs text-gray-400">
          Tracking error: {(summary.tracking_error * 100).toFixed(2)}%
        </span>
      </div>

      <ResponsiveContainer width="100%" height={380}>
        <LineChart data={data} margin={{ top: 10, right: 20, bottom: 30, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10 }}
            interval={tickInterval}
            angle={-30}
            textAnchor="end"
            label={{ value: 'Date', position: 'insideBottom', offset: -18, fontSize: 12 }}
          />
          <YAxis
            tickFormatter={(v) => `${((v - 1) * 100).toFixed(0)}%`}
            tick={{ fontSize: 11 }}
            label={{ value: 'Cumulative Return', angle: -90, position: 'insideLeft', offset: 10, fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip benchmark={benchmark} />} />
          <Legend verticalAlign="top" height={36} />
          <ReferenceLine y={1} stroke="#9ca3af" strokeDasharray="4 4" />
          <Line
            type="monotone"
            dataKey="portfolio"
            name="My Portfolio"
            stroke="#2563eb"
            dot={false}
            strokeWidth={2}
          />
          <Line
            type="monotone"
            dataKey="benchmark"
            name={benchmark}
            stroke="#9ca3af"
            dot={false}
            strokeWidth={1.5}
            strokeDasharray="5 3"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BenchmarkChart;
