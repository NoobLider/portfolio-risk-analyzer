"""
Unit tests for portfolio calculator.
"""

import pytest
import numpy as np
import pandas as pd
from app.services.calculator import PortfolioCalculator


class TestPortfolioCalculator:
    """Tests for the PortfolioCalculator class."""
    
    def test_portfolio_return_calculation(self):
        """Test basic portfolio return calculation."""
        calc = PortfolioCalculator(risk_free_rate=0.02)
        
        # Create sample returns data
        returns = pd.DataFrame({
            'AAPL': [0.01, -0.005, 0.008, 0.012, -0.003],
            'MSFT': [0.008, 0.003, -0.002, 0.015, 0.001]
        })
        
        weights = np.array([0.6, 0.4])
        metrics = calc.calculate_portfolio_metrics(returns, weights)
        
        assert metrics.expected_return is not None
        assert metrics.volatility is not None
        assert metrics.sharpe_ratio is not None
    
    def test_sharpe_ratio_calculation(self):
        """Test Sharpe ratio is calculated correctly."""
        calc = PortfolioCalculator(risk_free_rate=0.02)
        
        # Create returns with known properties
        returns = pd.DataFrame({
            'AAPL': [0.02] * 20,  # 2% daily return
        })
        
        weights = np.array([1.0])
        metrics = calc.calculate_portfolio_metrics(returns, weights)
        
        # With zero volatility, Sharpe should be 0
        assert metrics.sharpe_ratio == 0
    
    def test_correlation_matrix(self):
        """Test correlation matrix calculation."""
        calc = PortfolioCalculator()
        
        returns = pd.DataFrame({
            'AAPL': [0.01, 0.02, 0.015, -0.01, 0.005],
            'MSFT': [0.008, 0.018, 0.012, -0.008, 0.004]
        })
        
        corr_matrix = calc.calculate_correlation_matrix(returns)
        
        assert 'AAPL' in corr_matrix.columns
        assert 'MSFT' in corr_matrix.columns
        # Diagonal should be 1 (self-correlation)
        assert corr_matrix.loc['AAPL', 'AAPL'] == 1.0
        assert corr_matrix.loc['MSFT', 'MSFT'] == 1.0
    
    def test_covariance_matrix(self):
        """Test covariance matrix calculation."""
        calc = PortfolioCalculator()
        
        returns = pd.DataFrame({
            'AAPL': [0.01, 0.02, 0.015, -0.01, 0.005],
            'MSFT': [0.008, 0.018, 0.012, -0.008, 0.004]
        })
        
        cov_matrix = calc.calculate_covariance_matrix(returns)
        
        assert cov_matrix.shape == (2, 2)
        # Diagonal should be positive (variance)
        assert cov_matrix.loc['AAPL', 'AAPL'] > 0
        assert cov_matrix.loc['MSFT', 'MSFT'] > 0


class TestRiskMetrics:
    """Tests for specific risk metrics."""
    
    def test_var_calculation(self):
        """Test VaR is calculated and negative."""
        calc = PortfolioCalculator()
        
        # Create returns with some volatility
        np.random.seed(42)
        returns = pd.DataFrame({
            'AAPL': np.random.normal(0.001, 0.02, 100)
        })
        
        weights = np.array([1.0])
        metrics = calc.calculate_portfolio_metrics(returns, weights)
        
        # VaR should be positive (representing loss)
        assert metrics.var_95 > 0
        # CVaR should be greater than or equal to VaR
        assert metrics.cvar_95 >= metrics.var_95
    
    def test_max_drawdown(self):
        """Test max drawdown calculation."""
        calc = PortfolioCalculator()
        
        # Create returns with a clear drawdown
        returns = pd.DataFrame({
            'AAPL': [0.05, 0.03, -0.15, 0.02, 0.04]  # -15% drop
        })
        
        weights = np.array([1.0])
        metrics = calc.calculate_portfolio_metrics(returns, weights)
        
        # Max drawdown should be negative
        assert metrics.max_drawdown < 0


if __name__ == '__main__':
    pytest.main([__file__])
