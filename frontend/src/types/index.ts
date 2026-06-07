export interface Asset {
  ticker: string;
  weight: number;
  name?: string;
}

export interface AssetInput {
  ticker: string;
  weight: number;
}

export interface RiskMetrics {
  expected_return: number;
  volatility: number;
  sharpe_ratio: number;
  sortino_ratio: number;
  var_95: number;
  cvar_95: number;
  max_drawdown: number;
  beta?: number;
  alpha?: number;
}

export interface AssetMetrics {
  ticker: string;
  expected_return: number;
  volatility: number;
  sharpe_ratio: number;
}

export interface PortfolioAnalysisRequest {
  assets: AssetInput[];
  start_date?: string;
  end_date?: string;
  period?: string;
  risk_free_rate?: number;
  benchmark?: string;
}

export interface PortfolioAnalysisResponse {
  portfolio_metrics: RiskMetrics;
  asset_metrics: Record<string, AssetMetrics>;
  correlation_matrix: Record<string, Record<string, number>>;
  covariance_matrix: Record<string, Record<string, number>>;
  weights: Record<string, number>;
  benchmark?: string;
  data_range: {
    start: string;
    end: string;
  };
  warnings: Record<string, string>;
  sectors: Record<string, string>;
}

export interface OptimizationResult {
  optimal_weights: Record<string, number>;
  expected_return: number;
  volatility: number;
  sharpe_ratio: number;
  success: boolean;
  message: string;
}

export interface OptimalPortfoliosResponse {
  max_sharpe: OptimizationResult;
  min_variance: OptimizationResult;
  equal_weight: OptimizationResult;
  efficient_frontier: Array<{
    return: number;
    volatility: number;
    sharpe: number;
  }>;
  correlation_matrix: Record<string, Record<string, number>>;
  asset_metrics: Record<string, AssetMetrics>;
  data_range: {
    start: string;
    end: string;
  };
  warnings: Record<string, string>;
  sectors: Record<string, string>;
}

export interface OptimizationRequest {
  tickers: string[];
  start_date?: string;
  end_date?: string;
  period?: string;
  risk_free_rate?: number;
  allow_short_selling?: boolean;
  max_position_size?: number;
}

export interface EfficientFrontierPoint {
  return: number;
  volatility: number;
  sharpe: number;
}

export interface TickerSearchResult {
  ticker: string;
  name: string;
}

export interface ExamplePortfolio {
  name: string;
  description: string;
  assets: Array<{
    ticker: string;
    name: string;
  }>;
}

export type ExamplePortfolios = Record<string, ExamplePortfolio>;
