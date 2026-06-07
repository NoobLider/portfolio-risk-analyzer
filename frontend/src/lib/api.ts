import axios from 'axios';
import {
  PortfolioAnalysisRequest,
  PortfolioAnalysisResponse,
  OptimizationRequest,
  OptimalPortfoliosResponse,
  TickerSearchResult,
  ExamplePortfolios,
  EfficientFrontierPoint,
  MonteCarloRequest,
  MonteCarloResponse,
  BenchmarkComparisonRequest,
  BenchmarkComparisonResponse,
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60 seconds for long calculations
});

export const portfolioApi = {
  // Analyze a portfolio with given weights
  analyzePortfolio: async (
    request: PortfolioAnalysisRequest
  ): Promise<PortfolioAnalysisResponse> => {
    const response = await api.post('/portfolio/analyze', request);
    return response.data;
  },

  // Optimize portfolio for maximum Sharpe ratio
  optimizePortfolio: async (
    request: OptimizationRequest
  ): Promise<OptimalPortfoliosResponse> => {
    const response = await api.post('/portfolio/optimize', request);
    return response.data;
  },

  // Get efficient frontier points
  getEfficientFrontier: async (
    request: OptimizationRequest
  ): Promise<EfficientFrontierPoint[]> => {
    const response = await api.post('/portfolio/efficient-frontier', {
      ...request,
      n_points: 50,
    });
    return response.data.frontier;
  },

  // Get example portfolios
  getExamplePortfolios: async (): Promise<ExamplePortfolios> => {
    const response = await api.get('/portfolio/example-portfolios');
    return response.data;
  },

  // Run Monte Carlo simulation
  runMonteCarlo: async (request: MonteCarloRequest): Promise<MonteCarloResponse> => {
    const response = await api.post('/portfolio/monte-carlo', request);
    return response.data;
  },

  // Get benchmark comparison
  getBenchmarkComparison: async (
    request: BenchmarkComparisonRequest
  ): Promise<BenchmarkComparisonResponse> => {
    const response = await api.post('/portfolio/benchmark-comparison', request);
    return response.data;
  },
};

export const marketApi = {
  // Search for tickers
  searchTickers: async (query: string): Promise<TickerSearchResult[]> => {
    if (query.length < 2) return [];
    const response = await api.get(`/market/search?q=${encodeURIComponent(query)}`);
    return response.data.results;
  },

  // Validate a ticker
  validateTicker: async (ticker: string): Promise<{ valid: boolean; message: string }> => {
    const response = await api.get(`/market/validate/${ticker}`);
    return response.data;
  },

  // Get ticker info
  getTickerInfo: async (ticker: string) => {
    const response = await api.get(`/market/info/${ticker}`);
    return response.data;
  },
};

export default api;
