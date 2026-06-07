"""
Portfolio API Router

Handles portfolio analysis, optimization, and efficient frontier generation.
"""

from fastapi import APIRouter, HTTPException
from typing import List, Dict
import pandas as pd
import numpy as np

from app.models.schemas import (
    PortfolioAnalysisRequest,
    PortfolioAnalysisResponse,
    OptimizationRequest,
    OptimalPortfoliosResponse,
    EfficientFrontierRequest,
    EfficientFrontierResponse,
    MonteCarloRequest,
    MonteCarloResponse,
    BenchmarkComparisonRequest,
    BenchmarkComparisonResponse,
    AssetMetrics,
    RiskMetrics,
    OptimizationResult,
    ErrorResponse
)
from app.services.calculator import PortfolioCalculator
from app.services.optimizer import PortfolioOptimizer
from app.services.data_fetcher import DataFetcher

router = APIRouter(prefix="/portfolio", tags=["portfolio"])


@router.post("/analyze", response_model=PortfolioAnalysisResponse)
async def analyze_portfolio(request: PortfolioAnalysisRequest):
    """
    Analyze a portfolio with given weights and calculate all risk metrics.
    
    - Expected return and volatility
    - Sharpe and Sortino ratios
    - VaR and CVaR
    - Maximum drawdown
    - Beta and Alpha (if benchmark provided)
    - Correlation and covariance matrices
    """
    try:
        # Extract tickers and weights
        tickers = [asset.ticker.upper() for asset in request.assets]
        weights = np.array([asset.weight for asset in request.assets])
        
        # Normalize weights
        weights = weights / weights.sum()
        
        # Initialize services
        data_fetcher = DataFetcher()
        calculator = PortfolioCalculator(risk_free_rate=request.risk_free_rate)
        
        # Fetch market data
        prices, warnings = data_fetcher.fetch_historical_data(
            tickers=tickers,
            period=request.period,
            start_date=request.start_date,
            end_date=request.end_date
        )
        
        # Check for missing tickers
        available_tickers = [t for t in tickers if t in prices.columns]
        missing_tickers = [t for t in tickers if t not in prices.columns]
        
        if len(available_tickers) == 0:
            raise HTTPException(status_code=400, detail=f"No data available for any of the tickers: {tickers}")
        
        for t in missing_tickers:
            warnings[t] = "Ticker not found or no data available"
        
        # Filter to available tickers and adjust weights
        if missing_tickers:
            mask = [t in available_tickers for t in tickers]
            weights = weights[mask]
            weights = weights / weights.sum()
            tickers = available_tickers
        
        # Calculate returns
        prices = prices[tickers]
        returns = calculator.calculate_returns(prices)
        
        # Fetch benchmark data if specified
        market_returns = None
        if request.benchmark:
            try:
                benchmark_prices = data_fetcher.fetch_benchmark_data(
                    benchmark=request.benchmark,
                    period=request.period,
                    start_date=request.start_date,
                    end_date=request.end_date
                )
                market_returns = benchmark_prices.pct_change().dropna()
            except Exception as e:
                warnings['benchmark'] = f"Could not fetch benchmark data: {str(e)}"
        
        # Calculate portfolio metrics
        portfolio_metrics = calculator.calculate_portfolio_metrics(
            returns, weights, market_returns
        )
        
        # Calculate individual asset metrics
        individual_metrics = calculator.calculate_individual_metrics(returns)
        asset_metrics = {
            ticker: AssetMetrics(
                ticker=ticker,
                expected_return=metrics['expected_return'],
                volatility=metrics['volatility'],
                sharpe_ratio=metrics['sharpe_ratio']
            )
            for ticker, metrics in individual_metrics.items()
        }
        
        # Get correlation and covariance matrices
        correlation_matrix = calculator.calculate_correlation_matrix(returns)
        covariance_matrix = calculator.calculate_covariance_matrix(returns)
        
        # Convert matrices to dict format
        corr_dict = correlation_matrix.to_dict()
        cov_dict = covariance_matrix.to_dict()
        
        # Fetch sector data (best-effort, non-blocking)
        try:
            sectors = data_fetcher.get_sectors_for_tickers(tickers)
        except Exception:
            sectors = {}

        # Round for cleaner response
        weights_dict = {t: round(float(w), 4) for t, w in zip(tickers, weights)}
        
        return PortfolioAnalysisResponse(
            portfolio_metrics=RiskMetrics(
                expected_return=round(portfolio_metrics.expected_return, 4),
                volatility=round(portfolio_metrics.volatility, 4),
                sharpe_ratio=round(portfolio_metrics.sharpe_ratio, 4),
                sortino_ratio=round(portfolio_metrics.sortino_ratio, 4),
                var_95=round(portfolio_metrics.var_95, 4),
                cvar_95=round(portfolio_metrics.cvar_95, 4),
                max_drawdown=round(portfolio_metrics.max_drawdown, 4),
                beta=round(portfolio_metrics.beta, 4) if portfolio_metrics.beta else None,
                alpha=round(portfolio_metrics.alpha, 4) if portfolio_metrics.alpha else None
            ),
            asset_metrics=asset_metrics,
            correlation_matrix=corr_dict,
            covariance_matrix=cov_dict,
            weights=weights_dict,
            benchmark=request.benchmark,
            data_range={
                "start": str(returns.index[0].date()),
                "end": str(returns.index[-1].date())
            },
            warnings=warnings,
            sectors=sectors
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.post("/optimize", response_model=OptimalPortfoliosResponse)
async def optimize_portfolio(request: OptimizationRequest):
    """
    Optimize a portfolio for maximum Sharpe ratio and generate efficient frontier.
    
    Returns:
    - Maximum Sharpe portfolio (optimal risky portfolio)
    - Minimum variance portfolio
    - Equal weight portfolio (benchmark)
    - Efficient frontier points for visualization
    """
    try:
        tickers = [t.upper() for t in request.tickers]
        
        # Initialize services
        data_fetcher = DataFetcher()
        optimizer = PortfolioOptimizer(
            risk_free_rate=request.risk_free_rate,
            allow_short_selling=request.allow_short_selling,
            max_position_size=request.max_position_size
        )
        calculator = PortfolioCalculator(risk_free_rate=request.risk_free_rate)
        
        # Fetch market data
        prices, warnings = data_fetcher.fetch_historical_data(
            tickers=tickers,
            period=request.period,
            start_date=request.start_date,
            end_date=request.end_date
        )
        
        # Check for missing tickers
        available_tickers = [t for t in tickers if t in prices.columns]
        missing_tickers = [t for t in tickers if t not in prices.columns]
        
        if len(available_tickers) < 2:
            raise HTTPException(
                status_code=400, 
                detail=f"Need at least 2 valid tickers. Missing: {missing_tickers}"
            )
        
        for t in missing_tickers:
            warnings[t] = "Ticker not found or no data available"
        
        tickers = available_tickers
        prices = prices[tickers]
        
        # Calculate returns
        returns = calculator.calculate_returns(prices)
        
        # Get optimal portfolios
        optimal_portfolios = optimizer.get_optimal_portfolios(returns, tickers)
        
        # Generate efficient frontier
        frontier = optimizer.generate_efficient_frontier(
            returns, tickers, n_points=50
        )
        
        # Calculate individual asset metrics
        individual_metrics = calculator.calculate_individual_metrics(returns)
        asset_metrics = {
            ticker: AssetMetrics(
                ticker=ticker,
                expected_return=metrics['expected_return'],
                volatility=metrics['volatility'],
                sharpe_ratio=metrics['sharpe_ratio']
            )
            for ticker, metrics in individual_metrics.items()
        }
        
        # Get correlation matrix
        correlation_matrix = calculator.calculate_correlation_matrix(returns)

        # Fetch sector data (best-effort)
        try:
            sectors = data_fetcher.get_sectors_for_tickers(tickers)
        except Exception:
            sectors = {}

        # Convert optimization results
        def convert_opt_result(result):
            return {
                "optimal_weights": result.optimal_weights,
                "expected_return": round(result.expected_return, 4),
                "volatility": round(result.volatility, 4),
                "sharpe_ratio": round(result.sharpe_ratio, 4),
                "success": result.success,
                "message": result.message
            }
        
        return OptimalPortfoliosResponse(
            max_sharpe=convert_opt_result(optimal_portfolios['max_sharpe']),
            min_variance=convert_opt_result(optimal_portfolios['min_variance']),
            equal_weight=convert_opt_result(optimal_portfolios['equal_weight']),
            efficient_frontier=[{
                "return": round(p['return'], 4),
                "volatility": round(p['volatility'], 4),
                "sharpe": round(p['sharpe'], 4)
            } for p in frontier],
            correlation_matrix=correlation_matrix.to_dict(),
            asset_metrics=asset_metrics,
            data_range={
                "start": str(returns.index[0].date()),
                "end": str(returns.index[-1].date())
            },
            warnings=warnings,
            sectors=sectors
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Optimization failed: {str(e)}")


@router.post("/efficient-frontier", response_model=EfficientFrontierResponse)
async def get_efficient_frontier(request: EfficientFrontierRequest):
    """
    Generate efficient frontier points for visualization.
    
    Returns a series of (risk, return) pairs forming the efficient frontier curve.
    """
    try:
        tickers = [t.upper() for t in request.tickers]
        
        data_fetcher = DataFetcher()
        optimizer = PortfolioOptimizer(risk_free_rate=request.risk_free_rate)
        calculator = PortfolioCalculator(risk_free_rate=request.risk_free_rate)
        
        # Fetch data
        prices, _ = data_fetcher.fetch_historical_data(
            tickers=tickers,
            period=request.period,
            start_date=request.start_date,
            end_date=request.end_date
        )
        
        available_tickers = [t for t in tickers if t in prices.columns]
        if len(available_tickers) < 2:
            raise HTTPException(status_code=400, detail="Need at least 2 valid tickers")
        
        tickers = available_tickers
        prices = prices[tickers]
        returns = calculator.calculate_returns(prices)
        
        # Generate frontier
        frontier = optimizer.generate_efficient_frontier(
            returns, tickers, n_points=request.n_points
        )
        
        return EfficientFrontierResponse(
            frontier=[{
                "return": round(p['return'], 4),
                "volatility": round(p['volatility'], 4),
                "sharpe": round(p['sharpe'], 4)
            } for p in frontier],
            tickers=tickers,
            risk_free_rate=request.risk_free_rate
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate frontier: {str(e)}")


@router.post("/monte-carlo", response_model=MonteCarloResponse)
async def run_monte_carlo(request: MonteCarloRequest):
    """
    Run Monte Carlo simulation with random portfolio weights.

    Generates n_simulations random weight vectors and computes risk/return
    for each, producing a cloud of portfolios that visualises the efficient frontier.
    """
    try:
        tickers = [t.upper() for t in request.tickers]

        data_fetcher = DataFetcher()
        calculator = PortfolioCalculator(risk_free_rate=request.risk_free_rate)

        prices, _ = data_fetcher.fetch_historical_data(
            tickers=tickers,
            period=request.period,
            start_date=request.start_date,
            end_date=request.end_date
        )

        available_tickers = [t for t in tickers if t in prices.columns]
        if len(available_tickers) < 2:
            raise HTTPException(status_code=400, detail="Need at least 2 valid tickers")

        tickers = available_tickers
        prices = prices[tickers]
        returns = calculator.calculate_returns(prices)

        simulations = calculator.run_monte_carlo(returns, tickers, n_simulations=request.n_simulations)

        return MonteCarloResponse(
            simulations=simulations,
            tickers=tickers,
            risk_free_rate=request.risk_free_rate,
            data_range={
                "start": str(returns.index[0].date()),
                "end": str(returns.index[-1].date())
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Monte Carlo simulation failed: {str(e)}")


@router.post("/benchmark-comparison", response_model=BenchmarkComparisonResponse)
async def benchmark_comparison(request: BenchmarkComparisonRequest):
    """
    Compare portfolio cumulative returns vs a benchmark (default SPY).

    Returns a time series of portfolio and benchmark values (starting at 1.0)
    plus summary statistics: total return, alpha, tracking error, info ratio.
    """
    try:
        tickers = [asset.ticker.upper() for asset in request.assets]
        weights = np.array([asset.weight for asset in request.assets])
        weights = weights / weights.sum()

        data_fetcher = DataFetcher()
        calculator = PortfolioCalculator()

        prices, _ = data_fetcher.fetch_historical_data(
            tickers=tickers,
            period=request.period,
            start_date=request.start_date,
            end_date=request.end_date
        )

        available_tickers = [t for t in tickers if t in prices.columns]
        if not available_tickers:
            raise HTTPException(status_code=400, detail="No valid tickers found")

        if len(available_tickers) < len(tickers):
            mask = np.array([t in available_tickers for t in tickers])
            weights = weights[mask]
            weights = weights / weights.sum()
            tickers = available_tickers

        prices = prices[tickers]

        # Fetch benchmark
        benchmark_prices = data_fetcher.fetch_benchmark_data(
            benchmark=request.benchmark,
            period=request.period,
            start_date=request.start_date,
            end_date=request.end_date
        )

        series = calculator.calculate_cumulative_returns(prices, weights, benchmark_prices)

        if not series:
            raise HTTPException(status_code=500, detail="Could not compute cumulative returns")

        # Summary stats
        final_port = series[-1]['portfolio']
        final_bench = series[-1].get('benchmark', 1.0)
        port_total_return = final_port - 1.0
        bench_total_return = final_bench - 1.0

        # Daily returns for tracking error / info ratio
        port_daily = prices.pct_change().dropna().dot(weights)
        bench_daily = benchmark_prices.pct_change().dropna()
        aligned = pd.concat([port_daily, bench_daily], axis=1).dropna()
        aligned.columns = ['portfolio', 'benchmark']
        excess = aligned['portfolio'] - aligned['benchmark']
        tracking_error = float(excess.std() * np.sqrt(252))
        info_ratio = float((excess.mean() * 252) / tracking_error) if tracking_error > 0 else 0.0
        n_years = len(series) / 252
        annualized_port = float((1 + port_total_return) ** (1 / max(n_years, 0.01)) - 1)
        annualized_bench = float((1 + bench_total_return) ** (1 / max(n_years, 0.01)) - 1)

        return BenchmarkComparisonResponse(
            series=series,
            benchmark=request.benchmark,
            summary={
                "portfolio_total_return": round(port_total_return, 4),
                "benchmark_total_return": round(bench_total_return, 4),
                "portfolio_annualized_return": round(annualized_port, 4),
                "benchmark_annualized_return": round(annualized_bench, 4),
                "tracking_error": round(tracking_error, 4),
                "information_ratio": round(info_ratio, 4),
                "alpha": round(annualized_port - annualized_bench, 4),
            },
            data_range={
                "start": series[0]['date'],
                "end": series[-1]['date']
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Benchmark comparison failed: {str(e)}")


@router.get("/example-portfolios")
async def get_example_portfolios():
    """
    Get example portfolios for quick testing.
    
    Returns sample portfolios like S&P 500 constituents, Tech stocks, etc.
    """
    examples = {
        "tech_giants": {
            "name": "Tech Giants",
            "description": "Major technology companies",
            "assets": [
                {"ticker": "AAPL", "name": "Apple"},
                {"ticker": "MSFT", "name": "Microsoft"},
                {"ticker": "GOOGL", "name": "Alphabet"},
                {"ticker": "AMZN", "name": "Amazon"},
                {"ticker": "META", "name": "Meta"},
                {"ticker": "NVDA", "name": "NVIDIA"}
            ]
        },
        "diversified_large_cap": {
            "name": "Diversified Large Cap",
            "description": "Cross-sector large cap stocks",
            "assets": [
                {"ticker": "AAPL", "name": "Apple"},
                {"ticker": "JPM", "name": "JPMorgan"},
                {"ticker": "JNJ", "name": "Johnson & Johnson"},
                {"ticker": "V", "name": "Visa"},
                {"ticker": "PG", "name": "Procter & Gamble"}
            ]
        },
        "dividend_aristocrats": {
            "name": "Dividend Focus",
            "description": "High dividend yield stocks",
            "assets": [
                {"ticker": "JNJ", "name": "Johnson & Johnson"},
                {"ticker": "PG", "name": "Procter & Gamble"},
                {"ticker": "KO", "name": "Coca-Cola"},
                {"ticker": "PEP", "name": "PepsiCo"},
                {"ticker": "T", "name": "AT&T"}
            ]
        }
    }
    
    return examples
