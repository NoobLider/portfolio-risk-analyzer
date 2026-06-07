"""
Pydantic models for API request/response validation.
"""

from pydantic import BaseModel, Field, field_validator
from typing import List, Dict, Optional, Any
from datetime import date


class AssetInput(BaseModel):
    """Single asset input with ticker and weight"""
    ticker: str = Field(..., description="Stock ticker symbol (e.g., AAPL)", min_length=1, max_length=10)
    weight: float = Field(..., description="Portfolio weight (0-1)", ge=0, le=1)


class PortfolioAnalysisRequest(BaseModel):
    """Request model for portfolio analysis"""
    assets: List[AssetInput] = Field(..., description="List of assets with weights", min_length=1)
    start_date: Optional[str] = Field(None, description="Start date (YYYY-MM-DD)")
    end_date: Optional[str] = Field(None, description="End date (YYYY-MM-DD)")
    period: str = Field("5y", description="Data period if dates not specified")
    risk_free_rate: float = Field(0.02, description="Annual risk-free rate", ge=0, le=0.5)
    benchmark: Optional[str] = Field("SPY", description="Benchmark ticker for beta calculation")
    
    @field_validator('assets')
    def weights_sum_to_one(cls, v):
        total = sum(asset.weight for asset in v)
        if abs(total - 1.0) > 0.01:
            # Normalize weights instead of raising error
            for asset in v:
                asset.weight = asset.weight / total
        return v


class OptimizationRequest(BaseModel):
    """Request model for portfolio optimization"""
    tickers: List[str] = Field(..., description="List of ticker symbols", min_length=2, max_length=50)
    start_date: Optional[str] = Field(None, description="Start date (YYYY-MM-DD)")
    end_date: Optional[str] = Field(None, description="End date (YYYY-MM-DD)")
    period: str = Field("5y", description="Data period if dates not specified")
    risk_free_rate: float = Field(0.02, description="Annual risk-free rate", ge=0, le=0.5)
    allow_short_selling: bool = Field(False, description="Allow negative weights")
    max_position_size: Optional[float] = Field(None, description="Maximum single position weight")


class EfficientFrontierRequest(BaseModel):
    """Request model for efficient frontier generation"""
    tickers: List[str] = Field(..., description="List of ticker symbols", min_length=2, max_length=50)
    n_points: int = Field(50, description="Number of frontier points", ge=10, le=100)
    start_date: Optional[str] = Field(None, description="Start date (YYYY-MM-DD)")
    end_date: Optional[str] = Field(None, description="End date (YYYY-MM-DD)")
    period: str = Field("5y", description="Data period if dates not specified")
    risk_free_rate: float = Field(0.02, description="Annual risk-free rate", ge=0, le=0.5)


class RiskMetrics(BaseModel):
    """Risk metrics response model"""
    expected_return: float = Field(..., description="Annualized expected return")
    volatility: float = Field(..., description="Annualized volatility (standard deviation)")
    sharpe_ratio: float = Field(..., description="Sharpe ratio (risk-adjusted return)")
    sortino_ratio: float = Field(..., description="Sortino ratio (downside risk-adjusted)")
    var_95: float = Field(..., description="Value at Risk at 95% confidence")
    cvar_95: float = Field(..., description="Conditional VaR (Expected Shortfall)")
    max_drawdown: float = Field(..., description="Maximum drawdown")
    beta: Optional[float] = Field(None, description="Beta relative to benchmark")
    alpha: Optional[float] = Field(None, description="Alpha (excess return)")


class AssetMetrics(BaseModel):
    """Individual asset metrics"""
    ticker: str
    expected_return: float
    volatility: float
    sharpe_ratio: float


class PortfolioAnalysisResponse(BaseModel):
    """Complete portfolio analysis response"""
    portfolio_metrics: RiskMetrics
    asset_metrics: Dict[str, AssetMetrics]
    correlation_matrix: Dict[str, Dict[str, float]]
    covariance_matrix: Dict[str, Dict[str, float]]
    weights: Dict[str, float]
    benchmark: Optional[str]
    data_range: Dict[str, str]
    warnings: Dict[str, str]


class OptimizationResult(BaseModel):
    """Optimization result model"""
    optimal_weights: Dict[str, float]
    expected_return: float
    volatility: float
    sharpe_ratio: float
    success: bool
    message: str


class OptimalPortfoliosResponse(BaseModel):
    """Response with multiple optimal portfolios"""
    max_sharpe: OptimizationResult
    min_variance: OptimizationResult
    equal_weight: OptimizationResult
    efficient_frontier: List[Dict[str, float]]
    correlation_matrix: Dict[str, Dict[str, float]]
    asset_metrics: Dict[str, AssetMetrics]
    data_range: Dict[str, str]
    warnings: Dict[str, str]


class EfficientFrontierPoint(BaseModel):
    """Single point on efficient frontier"""
    return_: float = Field(..., alias="return")
    volatility: float
    sharpe: float


class EfficientFrontierResponse(BaseModel):
    """Efficient frontier response"""
    frontier: List[Dict[str, float]]
    tickers: List[str]
    risk_free_rate: float


class TickerSearchResult(BaseModel):
    """Ticker search result"""
    ticker: str
    name: str


class TickerSearchResponse(BaseModel):
    """Ticker search response"""
    results: List[TickerSearchResult]
    query: str


class TickerInfoResponse(BaseModel):
    """Ticker information response"""
    ticker: str
    name: str
    sector: str
    industry: str
    market_cap: Optional[int]
    currency: str


class MarketDataResponse(BaseModel):
    """Market data response"""
    ticker: str
    prices: List[Dict[str, Any]]  # List of {date, open, high, low, close, volume}
    period: str


class ErrorResponse(BaseModel):
    """Error response model"""
    error: str
    detail: Optional[str] = None
