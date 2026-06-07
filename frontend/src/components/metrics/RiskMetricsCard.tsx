'use client';

import React from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, Shield, Target, BarChart3 } from 'lucide-react';
import { RiskMetrics } from '@/types';
import { formatPercentage, formatDecimal, getRiskLevel, getSharpeRating } from '@/lib/utils';

interface RiskMetricsCardProps {
  metrics: RiskMetrics;
  title?: string;
}

interface MetricItemProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  color?: string;
  tooltip?: string;
}

const MetricItem: React.FC<MetricItemProps> = ({ label, value, icon, color = 'text-gray-600', tooltip }) => {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg" title={tooltip}>
      <div className="flex items-center gap-2">
        <div className={`${color}`}>{icon}</div>
        <span className="text-sm font-medium text-gray-700">{label}</span>
      </div>
      <span className="text-sm font-bold text-gray-900">{value}</span>
    </div>
  );
};

export const RiskMetricsCard: React.FC<RiskMetricsCardProps> = ({
  metrics,
  title = 'Risk Metrics',
}) => {
  const riskLevel = getRiskLevel(metrics.volatility);
  const sharpeRating = getSharpeRating(metrics.sharpe_ratio);

  return (
    <div className="w-full bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Expected Return */}
        <MetricItem
          label="Expected Return (Annual)"
          value={formatPercentage(metrics.expected_return)}
          icon={<TrendingUp size={18} />}
          color={metrics.expected_return >= 0 ? 'text-green-600' : 'text-red-600'}
          tooltip="Annualized expected return based on historical performance"
        />

        {/* Volatility */}
        <MetricItem
          label="Volatility"
          value={`${formatPercentage(metrics.volatility)} (${riskLevel.level})`}
          icon={<BarChart3 size={18} />}
          color={riskLevel.color}
          tooltip="Annualized standard deviation of returns"
        />

        {/* Sharpe Ratio */}
        <MetricItem
          label="Sharpe Ratio"
          value={`${formatDecimal(metrics.sharpe_ratio)} (${sharpeRating.rating})`}
          icon={<Target size={18} />}
          color={sharpeRating.color}
          tooltip="Risk-adjusted return: (Return - Risk-free rate) / Volatility"
        />

        {/* Sortino Ratio */}
        <MetricItem
          label="Sortino Ratio"
          value={formatDecimal(metrics.sortino_ratio)}
          icon={<Shield size={18} />}
          color="text-blue-600"
          tooltip="Downside risk-adjusted return: penalizes only downside volatility"
        />

        {/* VaR */}
        <MetricItem
          label="VaR (95%)"
          value={formatPercentage(-metrics.var_95)}
          icon={<AlertTriangle size={18} />}
          color="text-orange-600"
          tooltip="Value at Risk: potential loss at 95% confidence level"
        />

        {/* CVaR */}
        <MetricItem
          label="CVaR (95%)"
          value={formatPercentage(-metrics.cvar_95)}
          icon={<TrendingDown size={18} />}
          color="text-red-600"
          tooltip="Conditional VaR: expected shortfall beyond VaR threshold"
        />

        {/* Max Drawdown */}
        <MetricItem
          label="Max Drawdown"
          value={formatPercentage(metrics.max_drawdown)}
          icon={<TrendingDown size={18} />}
          color="text-red-600"
          tooltip="Maximum peak-to-trough decline during the period"
        />

        {/* Beta */}
        {metrics.beta !== undefined && metrics.beta !== null && (
          <MetricItem
            label="Beta (vs Benchmark)"
            value={formatDecimal(metrics.beta)}
            icon={<BarChart3 size={18} />}
            color={metrics.beta > 1 ? 'text-red-600' : metrics.beta < 1 ? 'text-green-600' : 'text-gray-600'}
            tooltip="Market sensitivity: >1 means more volatile than market"
          />
        )}

        {/* Alpha */}
        {metrics.alpha !== undefined && metrics.alpha !== null && (
          <MetricItem
            label="Alpha"
            value={formatPercentage(metrics.alpha)}
            icon={<TrendingUp size={18} />}
            color={metrics.alpha >= 0 ? 'text-green-600' : 'text-red-600'}
            tooltip="Excess return vs benchmark after adjusting for risk"
          />
        )}
      </div>

      {/* Interpretation */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <h4 className="text-sm font-semibold text-blue-900 mb-1">Quick Interpretation</h4>
        <p className="text-sm text-blue-800">
          This portfolio has a <strong>{riskLevel.level}</strong> risk profile with a{' '}
          <strong>{sharpeRating.rating}</strong> risk-adjusted return rating.
          {metrics.sharpe_ratio > 1 ? (
            ' The risk-adjusted returns are attractive.'
          ) : metrics.sharpe_ratio > 0.5 ? (
            ' The risk-adjusted returns are moderate.'
          ) : (
            ' The portfolio is not adequately compensating for the risk taken.'
          )}
          {metrics.var_95 > 0.02 && (
            <span className="text-orange-700 block mt-1">
              Warning: VaR indicates significant downside potential.
            </span>
          )}
        </p>
      </div>
    </div>
  );
};

export default RiskMetricsCard;
