"""
Market Data Fetcher

Fetches historical price data from Yahoo Finance.
Handles caching and data validation.
"""

import yfinance as yf
import pandas as pd
from typing import List, Dict, Optional, Tuple
from datetime import datetime, timedelta
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DataFetcher:
    """
    Fetches and manages market data from Yahoo Finance.
    
    Features:
    - Automatic date range handling
    - Missing data detection and warning
    - Price adjustment for splits/dividends
    """
    
    def __init__(self):
        self.cache = {}
    
    def fetch_historical_data(
        self,
        tickers: List[str],
        period: str = "5y",
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        interval: str = "1d"
    ) -> Tuple[pd.DataFrame, Dict[str, str]]:
        """
        Fetch historical adjusted close prices for multiple tickers.
        
        Args:
            tickers: List of ticker symbols
            period: Yahoo Finance period (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max)
            start_date: Optional start date (YYYY-MM-DD), overrides period
            end_date: Optional end date (YYYY-MM-DD)
            interval: Data interval (1d, 1wk, 1mo)
            
        Returns:
            Tuple of (price DataFrame, warnings dict)
        """
        warnings = {}
        
        try:
            download_kwargs = dict(
                tickers=tickers,
                interval=interval,
                progress=False,
                auto_adjust=True,
                group_by='ticker',  # yfinance 1.x: group by ticker for consistent multi-index
            )
            if start_date and end_date:
                download_kwargs['start'] = start_date
                download_kwargs['end'] = end_date
            else:
                download_kwargs['period'] = period

            data = yf.download(**download_kwargs)

            if data is None or data.empty:
                raise ValueError(f"No data returned for tickers: {tickers}")

            # yfinance 1.x with group_by='ticker' returns MultiIndex (ticker, field)
            # or flat columns when only one ticker.
            if isinstance(data.columns, pd.MultiIndex):
                level0 = data.columns.get_level_values(0).unique().tolist()
                level1 = data.columns.get_level_values(1).unique().tolist()

                # Determine which level holds the price fields (Close, Open, etc.)
                price_fields = {'Close', 'Open', 'High', 'Low', 'Adj Close'}
                if bool(price_fields & set(level1)):
                    # Structure: (ticker, field) — standard group_by='ticker'
                    close_frames = []
                    for ticker in tickers:
                        if ticker in level0:
                            col = (ticker, 'Close') if (ticker, 'Close') in data.columns else None
                            if col:
                                s = data[col].rename(ticker)
                                close_frames.append(s)
                    if not close_frames:
                        raise ValueError(f"No Close price data found for tickers: {tickers}")
                    prices = pd.concat(close_frames, axis=1)
                else:
                    # Structure: (field, ticker) — legacy layout
                    if 'Close' in level0:
                        prices = data['Close'].copy()
                    elif 'Adj Close' in level0:
                        prices = data['Adj Close'].copy()
                    else:
                        raise ValueError("Could not locate Close prices in downloaded data")
            else:
                # Single ticker — flat DataFrame
                if 'Close' in data.columns:
                    prices = data[['Close']].copy()
                    prices.columns = tickers
                else:
                    prices = data.iloc[:, [0]].copy()
                    prices.columns = tickers
            
            # Validate data
            if prices.empty:
                raise ValueError(f"No data returned for tickers: {tickers}")
            
            # Check for missing data
            missing_pct = prices.isna().mean() * 100
            for ticker in tickers:
                if ticker in missing_pct.index and missing_pct[ticker] > 5:
                    warnings[ticker] = f"Missing {missing_pct[ticker]:.1f}% of data points"
                elif ticker not in prices.columns:
                    warnings[ticker] = "No data available for this ticker"
            
            # Forward fill missing values (intraday gaps)
            prices = prices.ffill()
            
            # Drop any remaining NaN values
            prices = prices.dropna()
            
            if prices.empty:
                raise ValueError("All data was dropped due to missing values")
            
            logger.info(f"Fetched {len(prices)} data points for {len(tickers)} tickers")
            
            return prices, warnings
            
        except Exception as e:
            logger.error(f"Error fetching data: {e}")
            raise ValueError(f"Failed to fetch market data: {str(e)}")
    
    def fetch_benchmark_data(
        self,
        benchmark: str = "SPY",
        period: str = "5y",
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> pd.Series:
        """
        Fetch benchmark market data (default S&P 500 via SPY).
        
        Args:
            benchmark: Benchmark ticker symbol
            period: Yahoo Finance period
            start_date: Optional start date
            end_date: Optional end date
            
        Returns:
            Series of benchmark returns
        """
        prices, _ = self.fetch_historical_data(
            [benchmark],
            period=period,
            start_date=start_date,
            end_date=end_date
        )
        
        if benchmark in prices.columns:
            return prices[benchmark]
        else:
            return prices.iloc[:, 0]
    
    def validate_tickers(self, tickers: List[str]) -> Tuple[List[str], List[str]]:
        """
        Validate that tickers exist and return valid data.
        
        Args:
            tickers: List of ticker symbols to validate
            
        Returns:
            Tuple of (valid_tickers, invalid_tickers)
        """
        valid = []
        invalid = []
        
        for ticker in tickers:
            try:
                # Try to fetch a small amount of data
                test_data = yf.download(ticker, period="5d", progress=False, auto_adjust=True)
                if not test_data.empty:
                    valid.append(ticker.upper())
                else:
                    invalid.append(ticker.upper())
            except Exception:
                invalid.append(ticker.upper())
        
        return valid, invalid
    
    def get_ticker_info(self, ticker: str) -> Dict:
        """
        Get basic information about a ticker.
        
        Args:
            ticker: Ticker symbol
            
        Returns:
            Dict with name, sector, market cap, etc.
        """
        try:
            stock = yf.Ticker(ticker)
            info = stock.info
            
            return {
                'name': info.get('longName', 'Unknown'),
                'sector': info.get('sector', 'Unknown'),
                'industry': info.get('industry', 'Unknown'),
                'market_cap': info.get('marketCap', None),
                'currency': info.get('currency', 'USD')
            }
        except Exception as e:
            logger.error(f"Error fetching info for {ticker}: {e}")
            return {
                'name': ticker,
                'sector': 'Unknown',
                'industry': 'Unknown',
                'market_cap': None,
                'currency': 'USD'
            }
    
    def get_sectors_for_tickers(self, tickers: List[str]) -> Dict[str, str]:
        """
        Get sector classification for a list of tickers.

        Args:
            tickers: List of ticker symbols

        Returns:
            Dict mapping ticker -> sector (e.g., {"AAPL": "Technology"})
        """
        sectors: Dict[str, str] = {}
        for ticker in tickers:
            try:
                info = yf.Ticker(ticker).info
                sectors[ticker] = info.get('sector', 'Unknown') or 'Unknown'
            except Exception:
                sectors[ticker] = 'Unknown'
        return sectors

    def search_tickers(self, query: str) -> List[Dict]:
        """
        Search for tickers by company name or symbol.
        
        Note: yfinance doesn't have a built-in search, so this uses
        a curated list of common tickers as a fallback.
        
        Args:
            query: Search query
            
        Returns:
            List of matching tickers with info
        """
        # Common stocks for demonstration (in production, use a proper API)
        common_stocks = [
            {'ticker': 'AAPL', 'name': 'Apple Inc.'},
            {'ticker': 'MSFT', 'name': 'Microsoft Corporation'},
            {'ticker': 'GOOGL', 'name': 'Alphabet Inc.'},
            {'ticker': 'AMZN', 'name': 'Amazon.com Inc.'},
            {'ticker': 'TSLA', 'name': 'Tesla Inc.'},
            {'ticker': 'META', 'name': 'Meta Platforms Inc.'},
            {'ticker': 'NVDA', 'name': 'NVIDIA Corporation'},
            {'ticker': 'JPM', 'name': 'JPMorgan Chase & Co.'},
            {'ticker': 'JNJ', 'name': 'Johnson & Johnson'},
            {'ticker': 'V', 'name': 'Visa Inc.'},
            {'ticker': 'WMT', 'name': 'Walmart Inc.'},
            {'ticker': 'PG', 'name': 'Procter & Gamble Co.'},
            {'ticker': 'UNH', 'name': 'UnitedHealth Group Inc.'},
            {'ticker': 'HD', 'name': 'Home Depot Inc.'},
            {'ticker': 'MA', 'name': 'Mastercard Inc.'},
            {'ticker': 'BAC', 'name': 'Bank of America Corp.'},
            {'ticker': 'ABBV', 'name': 'AbbVie Inc.'},
            {'ticker': 'PFE', 'name': 'Pfizer Inc.'},
            {'ticker': 'KO', 'name': 'Coca-Cola Co.'},
            {'ticker': 'PEP', 'name': 'PepsiCo Inc.'},
            {'ticker': 'XOM', 'name': 'Exxon Mobil Corp.'},
            {'ticker': 'CVX', 'name': 'Chevron Corp.'},
            {'ticker': 'DIS', 'name': 'Walt Disney Co.'},
            {'ticker': 'NFLX', 'name': 'Netflix Inc.'},
            {'ticker': 'ADBE', 'name': 'Adobe Inc.'},
            {'ticker': 'CRM', 'name': 'Salesforce Inc.'},
            {'ticker': 'INTC', 'name': 'Intel Corp.'},
            {'ticker': 'AMD', 'name': 'Advanced Micro Devices Inc.'},
            {'ticker': 'NKE', 'name': 'Nike Inc.'},
            {'ticker': 'T', 'name': 'AT&T Inc.'},
        ]
        
        query_lower = query.lower()
        results = []
        
        for stock in common_stocks:
            if (query_lower in stock['ticker'].lower() or 
                query_lower in stock['name'].lower()):
                results.append(stock)
        
        return results[:10]  # Return top 10 matches
