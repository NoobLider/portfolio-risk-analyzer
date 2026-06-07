'use client';

import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

interface AllocationData {
  name: string;
  value: number;
  color?: string;
}

interface AllocationPieChartProps {
  allocations: Record<string, number>;
  title?: string;
  showLegend?: boolean;
}

const COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Green
  '#f59e0b', // Yellow
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#84cc16', // Lime
  '#f97316', // Orange
  '#6366f1', // Indigo
  '#14b8a6', // Teal
  '#d946ef', // Fuchsia
];

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: AllocationData;
  }>;
}

const CustomTooltip: React.FC<TooltipProps> = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0];
  const percentage = (data.value * 100).toFixed(1);

  return (
    <div className="bg-white p-2 border border-gray-200 rounded shadow-lg">
      <p className="font-medium text-gray-900">{data.name}</p>
      <p className="text-sm text-gray-600">{percentage}%</p>
    </div>
  );
};

export const AllocationPieChart: React.FC<AllocationPieChartProps> = ({
  allocations,
  title = 'Asset Allocation',
  showLegend = true,
}) => {
  // Convert allocations to array format for Recharts
  const data: AllocationData[] = Object.entries(allocations)
    .filter(([, value]) => value > 0.001) // Filter out very small weights
    .map(([name, value], index) => ({
      name,
      value,
      color: COLORS[index % COLORS.length],
    }))
    .sort((a, b) => b.value - a.value); // Sort by size descending

  if (data.length === 0) {
    return (
      <div className="w-full bg-white rounded-lg shadow-md p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="h-[250px] flex items-center justify-center text-gray-500">
          No allocation data available
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ${(value * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend />}
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Summary table */}
      <div className="mt-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 font-medium text-gray-700">Asset</th>
              <th className="text-right py-2 font-medium text-gray-700">Weight</th>
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 5).map((item) => (
              <tr key={item.name} className="border-b border-gray-100">
                <td className="py-2 flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  {item.name}
                </td>
                <td className="text-right py-2">{(item.value * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AllocationPieChart;
