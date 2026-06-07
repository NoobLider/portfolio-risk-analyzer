"""
Market Data API Router

Handles ticker search and market data retrieval.
"""

from fastapi import APIRouter, HTTPException
from typing import Optional

from app.models.schemas import (
    TickerSearchResponse,
    TickerSearchResult,
    TickerInfoResponse,
    MarketDataResponse
)
from app.services.data_fetcher import DataFetcher

router = APIRouter(prefix="/market", tags=["market-data"])


@router.get("/search", response_model=TickerSearchResponse)
async def search_tickers(q: str):
    """
    Search for stock tickers by company name or symbol.
    
    Args:
        q: Search query (min 2 characters)
        
    Returns:
        List of matching tickers with company names
    """
    if len(q) < 2:
        raise HTTPException(status_code=400, detail="Query must be at least 2 characters")
    
    try:
        data_fetcher = DataFetcher()
        results = data_fetcher.search_tickers(q)
        
        return TickerSearchResponse(
            results=[TickerSearchResult(**r) for r in results],
            query=q
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")


@router.get("/info/{ticker}", response_model=TickerInfoResponse)
async def get_ticker_info(ticker: str):
    """
    Get detailed information about a specific ticker.
    
    Args:
        ticker: Stock ticker symbol (e.g., AAPL)
        
    Returns:
        Company name, sector, industry, market cap
    """
    try:
        data_fetcher = DataFetcher()
        info = data_fetcher.get_ticker_info(ticker.upper())
        
        return TickerInfoResponse(
            ticker=ticker.upper(),
            name=info['name'],
            sector=info['sector'],
            industry=info['industry'],
            market_cap=info['market_cap'],
            currency=info['currency']
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch ticker info: {str(e)}")


@router.get("/data/{ticker}", response_model=MarketDataResponse)
async def get_market_data(
    ticker: str,
    period: str = "1y",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """
    Get historical price data for a ticker.
    
    Args:
        ticker: Stock ticker symbol
        period: Data period (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max)
        start_date: Optional start date (YYYY-MM-DD)
        end_date: Optional end date (YYYY-MM-DD)
        
    Returns:
        Historical OHLCV price data
    """
    try:
        data_fetcher = DataFetcher()
        prices, warnings = data_fetcher.fetch_historical_data(
            tickers=[ticker.upper()],
            period=period,
            start_date=start_date,
            end_date=end_date
        )
        
        if prices.empty:
            raise HTTPException(status_code=404, detail=f"No data found for ticker: {ticker}")
        
        # Convert to list of dicts
        ticker_upper = ticker.upper()
        price_list = []
        for date, row in prices.iterrows():
            price_list.append({
                "date": str(date.date()),
                "close": round(float(row[ticker_upper]), 2) if ticker_upper in prices.columns else round(float(row.iloc[0]), 2)
            })
        
        return MarketDataResponse(
            ticker=ticker.upper(),
            prices=price_list,
            period=period
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch market data: {str(e)}")


@router.get("/validate/{ticker}")
async def validate_ticker(ticker: str):
    """
    Validate that a ticker symbol exists and has data.
    
    Args:
        ticker: Stock ticker symbol
        
    Returns:
        Validation result with availability status
    """
    try:
        data_fetcher = DataFetcher()
        valid, invalid = data_fetcher.validate_tickers([ticker.upper()])
        
        return {
            "ticker": ticker.upper(),
            "valid": len(valid) > 0,
            "message": "Ticker is valid" if len(valid) > 0 else "Ticker not found or no data available"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Validation failed: {str(e)}")
