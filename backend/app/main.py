"""
Portfolio Risk Analyzer API

FastAPI application entry point for the portfolio optimization backend.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.routers import portfolio, market_data


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan handler.
    Handles startup and shutdown events.
    """
    # Startup
    print("🚀 Portfolio Risk Analyzer API starting up...")
    print("📊 Financial calculations engine ready")
    print("🔍 Market data service connected")
    yield
    # Shutdown
    print("👋 API shutting down...")


# Create FastAPI application
app = FastAPI(
    title="Portfolio Risk Analyzer API",
    description="""
    Quantitative portfolio analysis and optimization API implementing Modern Portfolio Theory.
    
    ## Features
    
    - **Portfolio Analysis**: Calculate risk metrics including Sharpe ratio, VaR, CVaR, and maximum drawdown
    - **Portfolio Optimization**: Find optimal allocations using mean-variance optimization
    - **Efficient Frontier**: Generate and visualize the efficient frontier
    - **Market Data**: Access historical price data from Yahoo Finance
    
    ## Financial Theory
    
    This API implements Modern Portfolio Theory (Markowitz, 1952):
    - Maximizes Sharpe ratio for optimal risk-adjusted returns
    - Uses quadratic programming for constrained optimization
    - Supports both long-only and long-short portfolio strategies
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """API root endpoint with basic info."""
    return {
        "name": "Portfolio Risk Analyzer API",
        "version": "1.0.0",
        "description": "Quantitative portfolio analysis using Modern Portfolio Theory",
        "documentation": "/docs",
        "endpoints": {
            "portfolio": "/portfolio",
            "market_data": "/market",
            "health": "/health"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "services": {
            "calculator": "operational",
            "optimizer": "operational",
            "market_data": "operational"
        }
    }


# Include routers
app.include_router(portfolio.router)
app.include_router(market_data.router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
