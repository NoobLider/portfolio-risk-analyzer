"""
Application constants and default values.
"""

from typing import Dict, List, Any

# Risk-free rate (US Treasury 10-year yield as baseline)
DEFAULT_RISK_FREE_RATE = 0.045  # 4.5% (adjust based on current market)

# Default benchmark for beta calculations
DEFAULT_BENCHMARK = "SPY"  # S&P 500 ETF

# Trading days per year
TRADING_DAYS_PER_YEAR = 252

# Default data period
DEFAULT_DATA_PERIOD = "5y"

# VaR confidence levels
VAR_CONFIDENCE_95 = 1.645  # Z-score for 95%
VAR_CONFIDENCE_99 = 2.326  # Z-score for 99%

# Example portfolios for quick testing
EXAMPLE_PORTFOLIOS: Dict[str, Dict[str, Any]] = {
    "tech_giants": {
        "name": "Tech Giants",
        "description": "Major technology companies",
        "tickers": ["AAPL", "MSFT", "GOOGL", "AMZN", "META", "NVDA"],
        "weights": [0.25, 0.25, 0.15, 0.15, 0.10, 0.10]
    },
    "diversified_large_cap": {
        "name": "Diversified Large Cap",
        "description": "Cross-sector large cap stocks",
        "tickers": ["AAPL", "JPM", "JNJ", "V", "PG"],
        "weights": [0.30, 0.20, 0.20, 0.15, 0.15]
    },
    "dividend_focus": {
        "name": "Dividend Focus",
        "description": "High dividend yield stocks",
        "tickers": ["JNJ", "PG", "KO", "PEP", "T"],
        "weights": [0.25, 0.25, 0.20, 0.20, 0.10]
    },
    "balanced_10": {
        "name": "Balanced 10-Stock Portfolio",
        "description": "Diversified across sectors",
        "tickers": ["AAPL", "MSFT", "AMZN", "JPM", "JNJ", "V", "PG", "UNH", "HD", "BAC"],
        "weights": [0.15, 0.15, 0.10, 0.10, 0.10, 0.10, 0.10, 0.10, 0.05, 0.05]
    }
}

# Valid periods for Yahoo Finance
VALID_PERIODS = ["1d", "5d", "1mo", "3mo", "6mo", "1y", "2y", "5y", "10y", "ytd", "max"]

# Valid intervals
VALID_INTERVALS = ["1d", "1wk", "1mo"]

# Maximum assets for optimization (to prevent timeout)
MAX_ASSETS_OPTIMIZATION = 50
