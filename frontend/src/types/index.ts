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

export interface MonteCarloRequest {
  tickers: string[];
  start_date?: string;
  end_date?: string;
  period?: string;
  risk_free_rate?: number;
  n_simulations?: number;
}

export interface MonteCarloPoint {
  return: number;
  volatility: number;
  sharpe: number;
}

export interface MonteCarloResponse {
  simulations: MonteCarloPoint[];
  tickers: string[];
  risk_free_rate: number;
  data_range: { start: string; end: string };
}

export interface BenchmarkComparisonRequest {
  assets: AssetInput[];
  start_date?: string;
  end_date?: string;
  period?: string;
  benchmark?: string;
}

export interface BenchmarkDataPoint {
  date: string;
  portfolio: number;
  benchmark?: number;
}

export interface BenchmarkComparisonResponse {
  series: BenchmarkDataPoint[];
  benchmark: string;
  summary: {
    portfolio_total_return: number;
    benchmark_total_return: number;
    portfolio_annualized_return: number;
    benchmark_annualized_return: number;
    tracking_error: number;
    information_ratio: number;
    alpha: number;
  };
  data_range: { start: string; end: string };
}
