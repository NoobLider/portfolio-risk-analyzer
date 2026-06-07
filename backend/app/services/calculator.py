"""
Portfolio Risk Calculator

Implements Modern Portfolio Theory calculations including:
- Expected returns and volatility
- Sharpe ratio and Sortino ratio
- Value at Risk (VaR) and Conditional VaR
- Maximum drawdown
- Correlation matrix
"""

import numpy as np
import pandas as pd
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass


@dataclass
class RiskMetrics:
    """Container for portfolio risk metrics"""
    expected_return: float  # Annualized expected return
    volatility: float  # Annualized standard deviation
    sharpe_ratio: float  # Risk-adjusted return
    sortino_ratio: float  # Downside risk-adjusted return
    var_95: float  # Value at Risk at 95% confidence
    cvar_95: float  # Conditional VaR (Expected Shortfall)
    max_drawdown: float  # Maximum peak-to-trough decline
    beta: Optional[float] = None  # Market sensitivity
    alpha: Optional[float] = None  # Excess return


class PortfolioCalculator:
    """
    Core portfolio calculation engine implementing Modern Portfolio Theory.
    
    Mathematical foundation:
    - Portfolio return: E[R_p] = Σ w_i * μ_i
    - Portfolio variance: σ²_p = w^T Σ w
    - Sharpe ratio: (E[R_p] - r_f) / σ_p
    """
    
    TRADING_DAYS_PER_YEAR = 252
    
    def __init__(self, risk_free_rate: float = 0.02):
        """
        Initialize calculator with risk-free rate.
        
        Args:
            risk_free_rate: Annual risk-free rate (default 2%)
        """
        self.risk_free_rate = risk_free_rate
    
    def calculate_returns(self, prices: pd.DataFrame) -> pd.DataFrame:
        """
        Calculate daily returns from price data.
        
        Args:
            prices: DataFrame with date index and asset columns
            
        Returns:
            DataFrame of daily percentage returns
        """
        return prices.pct_change().dropna()
    
    def calculate_portfolio_metrics(
        self,
        returns: pd.DataFrame,
        weights: np.ndarray,
        market_returns: Optional[pd.Series] = None
    ) -> RiskMetrics:
        """
        Calculate comprehensive risk metrics for a portfolio.
        
        Args:
            returns: DataFrame of daily asset returns
            weights: Array of portfolio weights (must sum to 1)
            market_returns: Optional market benchmark returns for beta calculation
            
        Returns:
            RiskMetrics object with all calculated metrics
        """
        # Ensure weights sum to 1
        weights = np.array(weights)
        weights = weights / weights.sum()
        
        # Portfolio daily returns
        portfolio_returns = returns.dot(weights)
        
        # Annualized expected return
        expected_return = portfolio_returns.mean() * self.TRADING_DAYS_PER_YEAR
        
        # Annualized volatility
        volatility = portfolio_returns.std() * np.sqrt(self.TRADING_DAYS_PER_YEAR)
        
        # Sharpe ratio
        excess_return = expected_return - self.risk_free_rate
        sharpe_ratio = excess_return / volatility if volatility > 0 else 0
        
        # Sortino ratio (downside deviation only)
        downside_returns = portfolio_returns[portfolio_returns < 0]
        downside_deviation = downside_returns.std() * np.sqrt(self.TRADING_DAYS_PER_YEAR)
        sortino_ratio = excess_return / downside_deviation if downside_deviation > 0 else 0
        
        # Value at Risk (parametric method, 95% confidence)
        z_score_95 = 1.645
        var_95 = -(portfolio_returns.mean() - z_score_95 * portfolio_returns.std())
        
        # Conditional VaR (Expected Shortfall)
        cvar_95 = -portfolio_returns[portfolio_returns <= -var_95].mean()
        if pd.isna(cvar_95):
            cvar_95 = var_95  # Fallback if no tail events
        
        # Maximum drawdown
        cumulative_returns = (1 + portfolio_returns).cumprod()
        rolling_max = cumulative_returns.expanding().max()
        drawdowns = (cumulative_returns - rolling_max) / rolling_max
        max_drawdown = drawdowns.min()
        
        # Beta and Alpha (if market data provided)
        beta = None
        alpha = None
        if market_returns is not None and len(market_returns) > 0:
            aligned_data = pd.concat([portfolio_returns, market_returns], axis=1).dropna()
            if len(aligned_data) > 1:
                covariance = aligned_data.cov().iloc[0, 1]
                market_variance = aligned_data.iloc[:, 1].var()
                if market_variance > 0:
                    beta = covariance / market_variance
                    # Alpha = actual return - (risk_free + beta * (market_return - risk_free))
                    market_return = aligned_data.iloc[:, 1].mean() * self.TRADING_DAYS_PER_YEAR
                    alpha = expected_return - (self.risk_free_rate + beta * (market_return - self.risk_free_rate))
        
        return RiskMetrics(
            expected_return=expected_return,
            volatility=volatility,
            sharpe_ratio=sharpe_ratio,
            sortino_ratio=sortino_ratio,
            var_95=var_95,
            cvar_95=cvar_95,
            max_drawdown=max_drawdown,
            beta=beta,
            alpha=alpha
        )
    
    def calculate_correlation_matrix(self, returns: pd.DataFrame) -> pd.DataFrame:
        """
        Calculate correlation matrix between assets.
        
        Args:
            returns: DataFrame of daily asset returns
            
        Returns:
            Correlation matrix DataFrame
        """
        return returns.corr()
    
    def calculate_covariance_matrix(self, returns: pd.DataFrame) -> pd.DataFrame:
        """
        Calculate annualized covariance matrix.
        
        Args:
            returns: DataFrame of daily asset returns
            
        Returns:
            Annualized covariance matrix
        """
        return returns.cov() * self.TRADING_DAYS_PER_YEAR
    
    def calculate_individual_metrics(self, returns: pd.DataFrame) -> Dict[str, Dict]:
        """
        Calculate individual asset metrics.
        
        Args:
            returns: DataFrame of daily asset returns
            
        Returns:
            Dictionary mapping ticker to metrics dict
        """
        metrics = {}
        for column in returns.columns:
            asset_returns = returns[column]
            metrics[column] = {
                'expected_return': asset_returns.mean() * self.TRADING_DAYS_PER_YEAR,
                'volatility': asset_returns.std() * np.sqrt(self.TRADING_DAYS_PER_YEAR),
                'sharpe_ratio': (asset_returns.mean() * self.TRADING_DAYS_PER_YEAR - self.risk_free_rate) / 
                               (asset_returns.std() * np.sqrt(self.TRADING_DAYS_PER_YEAR))
            }
        return metrics
    
    def portfolio_performance(
        self,
        weights: np.ndarray,
        mean_returns: pd.Series,
        cov_matrix: pd.DataFrame
    ) -> Tuple[float, float]:
        """
        Calculate portfolio return and volatility from weights and statistics.
        
        Used by the optimizer to evaluate candidate portfolios.
        
        Args:
            weights: Portfolio weights
            mean_returns: Expected returns per asset
            cov_matrix: Covariance matrix
            
        Returns:
            Tuple of (portfolio_return, portfolio_volatility)
        """
        portfolio_return = np.dot(weights, mean_returns)
        portfolio_volatility = np.sqrt(np.dot(weights.T, np.dot(cov_matrix, weights)))
        return portfolio_return, portfolio_volatility
