"""
Portfolio Optimizer

Implements portfolio optimization using quadratic programming.
Finds the optimal asset allocation that maximizes the Sharpe ratio.
"""

import numpy as np
import pandas as pd
from scipy.optimize import minimize
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass


@dataclass
class OptimizationResult:
    """Container for optimization results"""
    optimal_weights: Dict[str, float]
    expected_return: float
    volatility: float
    sharpe_ratio: float
    success: bool
    message: str


@dataclass
class EfficientFrontierPoint:
    """Single point on the efficient frontier"""
    target_return: float
    volatility: float
    weights: np.ndarray


class PortfolioOptimizer:
    """
    Portfolio optimizer using Modern Portfolio Theory.
    
    Implements:
    - Sharpe ratio maximization (optimal risky portfolio)
    - Efficient frontier generation
    - Global minimum variance portfolio
    - Support for long-only and long-short constraints
    """
    
    TRADING_DAYS_PER_YEAR = 252
    
    def __init__(
        self,
        risk_free_rate: float = 0.02,
        allow_short_selling: bool = False,
        max_position_size: Optional[float] = None
    ):
        """
        Initialize optimizer.
        
        Args:
            risk_free_rate: Annual risk-free rate
            allow_short_selling: If True, weights can be negative
            max_position_size: Maximum weight for any single asset (None = no limit)
        """
        self.risk_free_rate = risk_free_rate
        self.allow_short_selling = allow_short_selling
        self.max_position_size = max_position_size
    
    def _get_constraints(self, n_assets: int) -> Tuple[List[Dict], Tuple]:
        """
        Get optimization constraints.
        
        Args:
            n_assets: Number of assets
            
        Returns:
            Tuple of (constraints_list, bounds)
        """
        # Sum of weights = 1
        constraints = [{'type': 'eq', 'fun': lambda x: np.sum(x) - 1}]
        
        # Bounds for weights
        if self.allow_short_selling:
            # Allow negative weights (short selling)
            if self.max_position_size:
                bounds = tuple((-self.max_position_size, self.max_position_size) 
                              for _ in range(n_assets))
            else:
                bounds = tuple((None, None) for _ in range(n_assets))
        else:
            # Long-only constraints
            if self.max_position_size:
                bounds = tuple((0, self.max_position_size) for _ in range(n_assets))
            else:
                bounds = tuple((0, 1) for _ in range(n_assets))
        
        return constraints, bounds
    
    def _portfolio_volatility(self, weights: np.ndarray, cov_matrix: np.ndarray) -> float:
        """Calculate portfolio volatility from covariance matrix."""
        return np.sqrt(np.dot(weights.T, np.dot(cov_matrix, weights)))
    
    def _portfolio_return(self, weights: np.ndarray, mean_returns: np.ndarray) -> float:
        """Calculate portfolio expected return."""
        return np.dot(weights, mean_returns)
    
    def _negative_sharpe(
        self,
        weights: np.ndarray,
        mean_returns: np.ndarray,
        cov_matrix: np.ndarray
    ) -> float:
        """
        Negative Sharpe ratio (for minimization).
        
        We minimize this to maximize Sharpe ratio.
        """
        p_return = self._portfolio_return(weights, mean_returns)
        p_volatility = self._portfolio_volatility(weights, cov_matrix)
        
        if p_volatility == 0:
            return 0
        
        return -(p_return - self.risk_free_rate) / p_volatility
    
    def maximize_sharpe_ratio(
        self,
        returns: pd.DataFrame,
        tickers: List[str]
    ) -> OptimizationResult:
        """
        Find portfolio weights that maximize the Sharpe ratio.
        
        This is the "tangency portfolio" from Modern Portfolio Theory.
        
        Args:
            returns: DataFrame of daily returns
            tickers: List of ticker symbols
            
        Returns:
            OptimizationResult with optimal weights and metrics
        """
        # Calculate mean returns and covariance
        mean_returns = returns.mean() * self.TRADING_DAYS_PER_YEAR
        cov_matrix = returns.cov() * self.TRADING_DAYS_PER_YEAR
        
        n_assets = len(tickers)
        
        # Initial guess: equal weights
        init_weights = np.array([1 / n_assets] * n_assets)
        
        # Get constraints
        constraints, bounds = self._get_constraints(n_assets)
        
        # Optimize
        result = minimize(
            self._negative_sharpe,
            init_weights,
            args=(mean_returns.values, cov_matrix.values),
            method='SLSQP',
            bounds=bounds,
            constraints=constraints,
            options={'maxiter': 1000, 'ftol': 1e-9}
        )
        
        if result.success:
            optimal_weights = result.x
            
            # Clean up small weights (numerical precision)
            optimal_weights = np.where(optimal_weights < 0.0001, 0, optimal_weights)
            optimal_weights = optimal_weights / optimal_weights.sum()  # Renormalize
            
            # Calculate metrics
            expected_return = self._portfolio_return(optimal_weights, mean_returns.values)
            volatility = self._portfolio_volatility(optimal_weights, cov_matrix.values)
            sharpe_ratio = (expected_return - self.risk_free_rate) / volatility
            
            # Create weights dictionary
            weights_dict = {ticker: float(weight) for ticker, weight in zip(tickers, optimal_weights)}
            
            return OptimizationResult(
                optimal_weights=weights_dict,
                expected_return=float(expected_return),
                volatility=float(volatility),
                sharpe_ratio=float(sharpe_ratio),
                success=True,
                message="Optimization successful"
            )
        else:
            return OptimizationResult(
                optimal_weights={ticker: 1/n_assets for ticker in tickers},
                expected_return=mean_returns.mean(),
                volatility=0,
                sharpe_ratio=0,
                success=False,
                message=f"Optimization failed: {result.message}"
            )
    
    def minimize_volatility(
        self,
        returns: pd.DataFrame,
        tickers: List[str],
        target_return: Optional[float] = None
    ) -> OptimizationResult:
        """
        Find portfolio with minimum volatility.
        
        If target_return is specified, find minimum volatility portfolio
        that achieves at least that return.
        
        Args:
            returns: DataFrame of daily returns
            tickers: List of ticker symbols
            target_return: Optional minimum return constraint
            
        Returns:
            OptimizationResult with minimum variance portfolio
        """
        mean_returns = returns.mean() * self.TRADING_DAYS_PER_YEAR
        cov_matrix = returns.cov() * self.TRADING_DAYS_PER_YEAR
        
        n_assets = len(tickers)
        init_weights = np.array([1 / n_assets] * n_assets)
        
        constraints, bounds = self._get_constraints(n_assets)
        
        # Add return constraint if specified
        if target_return is not None:
            return_constraint = {
                'type': 'eq',
                'fun': lambda x: self._portfolio_return(x, mean_returns.values) - target_return
            }
            constraints.append(return_constraint)
        
        result = minimize(
            self._portfolio_volatility,
            init_weights,
            args=(cov_matrix.values,),
            method='SLSQP',
            bounds=bounds,
            constraints=constraints,
            options={'maxiter': 1000}
        )
        
        if result.success:
            optimal_weights = result.x
            optimal_weights = np.where(optimal_weights < 0.0001, 0, optimal_weights)
            optimal_weights = optimal_weights / optimal_weights.sum()
            
            expected_return = self._portfolio_return(optimal_weights, mean_returns.values)
            volatility = self._portfolio_volatility(optimal_weights, cov_matrix.values)
            sharpe_ratio = (expected_return - self.risk_free_rate) / volatility
            
            weights_dict = {ticker: float(weight) for ticker, weight in zip(tickers, optimal_weights)}
            
            return OptimizationResult(
                optimal_weights=weights_dict,
                expected_return=float(expected_return),
                volatility=float(volatility),
                sharpe_ratio=float(sharpe_ratio),
                success=True,
                message="Minimum variance optimization successful"
            )
        else:
            return OptimizationResult(
                optimal_weights={ticker: 1/n_assets for ticker in tickers},
                expected_return=mean_returns.mean(),
                volatility=0,
                sharpe_ratio=0,
                success=False,
                message=f"Optimization failed: {result.message}"
            )
    
    def generate_efficient_frontier(
        self,
        returns: pd.DataFrame,
        tickers: List[str],
        n_points: int = 50
    ) -> List[Dict]:
        """
        Generate efficient frontier points.
        
        Creates n_points portfolios spanning from minimum variance
        to maximum return.
        
        Args:
            returns: DataFrame of daily returns
            tickers: List of ticker symbols
            n_points: Number of frontier points to generate
            
        Returns:
            List of dicts with 'return', 'volatility', and 'sharpe'
        """
        mean_returns = returns.mean() * self.TRADING_DAYS_PER_YEAR
        cov_matrix = returns.cov() * self.TRADING_DAYS_PER_YEAR
        
        # Find minimum variance portfolio
        min_var_result = self.minimize_volatility(returns, tickers)
        min_return = min_var_result.expected_return
        min_volatility = min_var_result.volatility
        
        # Find maximum return portfolio (100% in highest return asset)
        max_return_asset = mean_returns.idxmax()
        max_return = mean_returns[max_return_asset]
        
        # Generate target returns
        target_returns = np.linspace(min_return, max_return, n_points)
        
        frontier = []
        for target in target_returns:
            result = self.minimize_volatility(returns, tickers, target_return=target)
            if result.success:
                frontier.append({
                    'return': result.expected_return,
                    'volatility': result.volatility,
                    'sharpe': result.sharpe_ratio
                })
        
        return frontier
    
    def get_optimal_portfolios(
        self,
        returns: pd.DataFrame,
        tickers: List[str]
    ) -> Dict:
        """
        Get three key portfolios for analysis:
        1. Maximum Sharpe (optimal risky portfolio)
        2. Minimum Variance (least risky)
        3. Equal Weight (benchmark comparison)
        
        Args:
            returns: DataFrame of daily returns
            tickers: List of ticker symbols
            
        Returns:
            Dict with three portfolio configurations
        """
        # Maximum Sharpe
        max_sharpe = self.maximize_sharpe_ratio(returns, tickers)
        
        # Minimum Variance
        min_var = self.minimize_volatility(returns, tickers)
        
        # Equal Weight
        n_assets = len(tickers)
        equal_weights = np.array([1 / n_assets] * n_assets)
        mean_returns = returns.mean() * self.TRADING_DAYS_PER_YEAR
        cov_matrix = returns.cov() * self.TRADING_DAYS_PER_YEAR
        
        eq_return = np.dot(equal_weights, mean_returns.values)
        eq_vol = np.sqrt(np.dot(equal_weights.T, np.dot(cov_matrix.values, equal_weights)))
        eq_sharpe = (eq_return - self.risk_free_rate) / eq_vol
        
        equal_weight = OptimizationResult(
            optimal_weights={ticker: 1/n_assets for ticker in tickers},
            expected_return=float(eq_return),
            volatility=float(eq_vol),
            sharpe_ratio=float(eq_sharpe),
            success=True,
            message="Equal weight portfolio"
        )
        
        return {
            'max_sharpe': max_sharpe,
            'min_variance': min_var,
            'equal_weight': equal_weight
        }
