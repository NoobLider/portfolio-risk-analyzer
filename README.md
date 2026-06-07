# Portfolio Risk Analyzer & Optimizer

**A quantitative finance application implementing Modern Portfolio Theory for portfolio analysis, risk assessment, and optimization.**

---

## Overview

This project demonstrates the practical implementation of **Modern Portfolio Theory (Markowitz, 1952)** — a foundational concept in quantitative finance. The application allows users to:

- Analyze investment portfolios with comprehensive risk metrics
- Optimize asset allocations to maximize risk-adjusted returns
- Visualize the efficient frontier and compare portfolio strategies
- Understand correlation structures between assets

**Built for:** Aalto University Finance program application portfolio

---

## Financial Theory

### Modern Portfolio Theory (MPT)

The application implements the core mathematical framework of MPT:

#### 1. Portfolio Expected Return
```
E[R_p] = Σ w_i × μ_i
```
Where:
- `w_i` = weight of asset i
- `μ_i` = expected return of asset i

#### 2. Portfolio Variance (Risk)
```
σ²_p = Σ Σ w_i × w_j × σ_ij
```
Where:
- `σ_ij` = covariance between assets i and j
- This can be expressed in matrix form: σ²_p = w^T Σ w

#### 3. Sharpe Ratio
```
Sharpe = (E[R_p] - r_f) / σ_p
```
Where:
- `r_f` = risk-free rate
- This measures risk-adjusted return

#### 4. Optimization Problem

The optimizer solves a quadratic programming problem:

```
Maximize: (w^T μ - r_f) / √(w^T Σ w)
Subject to:
  Σ w_i = 1           (budget constraint)
  w_i ≥ 0             (no short selling, optional)
```

This is solved using **Sequential Least Squares Programming (SLSQP)** from scipy.optimize.

---

## Features

### Risk Metrics Calculated

| Metric | Description | Formula/Method |
|--------|-------------|----------------|
| **Expected Return** | Annualized mean return | μ × 252 (trading days) |
| **Volatility** | Annualized standard deviation | σ × √252 |
| **Sharpe Ratio** | Risk-adjusted return | (Return - r_f) / Volatility |
| **Sortino Ratio** | Downside risk-adjusted return | (Return - r_f) / Downside Deviation |
| **VaR (95%)** | Value at Risk | Parametric: μ - 1.645σ |
| **CVaR (95%)** | Conditional VaR/Expected Shortfall | Mean of returns below VaR threshold |
| **Max Drawdown** | Maximum peak-to-trough decline | Rolling calculation |
| **Beta** | Market sensitivity | Cov(asset, market) / Var(market) |
| **Alpha** | Excess return | Actual - [r_f + β(market - r_f)] |

### Optimization Capabilities

- **Maximum Sharpe Portfolio**: Finds the optimal risky portfolio (tangency portfolio)
- **Minimum Variance Portfolio**: Lowest risk allocation
- **Efficient Frontier**: Generates N portfolios across the risk spectrum
- **Constraints**: Supports both long-only and long-short strategies

### Visualizations

- **Efficient Frontier Chart**: Interactive scatter plot showing risk/return tradeoffs
- **Capital Market Line**: Visualizes the tangency portfolio
- **Correlation Heatmap**: Color-coded matrix showing asset relationships
- **Allocation Pie Charts**: Current vs. optimal weight comparisons
- **Risk Metrics Dashboard**: Comprehensive metric display with interpretation

---

## Technology Stack

### Backend
- **Python 3.9+** with **FastAPI** for high-performance API
- **NumPy** & **Pandas** for numerical computations
- **SciPy** (`scipy.optimize`) for quadratic programming
- **yfinance** for market data retrieval
- **Pydantic** for data validation

### Frontend
- **Next.js 14** (React 18) with TypeScript
- **Tailwind CSS** for styling
- **Recharts** for interactive visualizations
- **Axios** for API communication

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (Next.js 14)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │  Portfolio   │  │  Efficient   │  │  Correlation    │   │
│  │  Input Form  │  │  Frontier    │  │  Heatmap        │   │
│  │              │  │  Chart       │  │                 │   │
│  └──────────────┘  └──────────────┘  └─────────────────┘   │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │  Risk        │  │  Asset       │  │  Optimization   │   │
│  │  Metrics     │  │  Allocation  │  │  Controls       │   │
│  │  Panel       │  │  Pie Chart    │  │                 │   │
│  └──────────────┘  └──────────────┘  └─────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ HTTP/REST
┌─────────────────────────────────────────────────────────────┐
│                     BACKEND (FastAPI)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │  Portfolio   │  │  Risk        │  │  Optimization   │   │
│  │  API Router  │  │  Calculator  │  │  Engine         │   │
│  └──────────────┘  └──────────────┘  └─────────────────┘   │
│  ┌──────────────┐  ┌──────────────┐                         │
│  │  Data        │  │  Market      │                         │
│  │  Fetcher     │  │  Data Cache  │                         │
│  └──────────────┘  └──────────────┘                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     DATA SOURCE                             │
│              Yahoo Finance API (yfinance)                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Installation & Setup

### Prerequisites
- Python 3.9 or higher
- Node.js 18 or higher
- npm or yarn

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the server
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at: http://localhost:8000

API Documentation: http://localhost:8000/docs

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at: http://localhost:3000

---

## API Endpoints

### Portfolio Analysis
- `POST /portfolio/analyze` - Analyze portfolio with given weights
- `POST /portfolio/optimize` - Optimize for maximum Sharpe ratio
- `POST /portfolio/efficient-frontier` - Generate efficient frontier points
- `GET /portfolio/example-portfolios` - Get sample portfolios

### Market Data
- `GET /market/search?q={query}` - Search for tickers
- `GET /market/info/{ticker}` - Get ticker information
- `GET /market/validate/{ticker}` - Validate ticker existence

---

## Usage Example

### 1. Build a Portfolio
Add stocks using the search interface (e.g., AAPL, MSFT, GOOGL)

### 2. Analyze
Click "Analyze Portfolio" to calculate:
- Expected return and volatility
- Sharpe and Sortino ratios
- VaR and CVaR
- Maximum drawdown
- Correlation matrix

### 3. Optimize
Click "Optimize" to find the optimal allocation that:
- Maximizes Sharpe ratio
- Generates efficient frontier
- Compares different strategies (Max Sharpe, Min Variance, Equal Weight)

---

## Example Output

### Efficient Frontier Visualization
```
Expected Return
    │
    │          ╱
    │        ╱
    │      ╱  ● Max Sharpe (Optimal)
    │    ╱
    │  ╱
    │● Equal Weight
    │
    │● Min Variance
    └────────────────────
           Volatility
```

### Sample Risk Metrics Output
```json
{
  "expected_return": 0.1254,
  "volatility": 0.1856,
  "sharpe_ratio": 0.6521,
  "sortino_ratio": 0.8245,
  "var_95": 0.0285,
  "cvar_95": 0.0412,
  "max_drawdown": -0.2341
}
```

---

## Key Concepts Demonstrated

### 1. **Mean-Variance Optimization**
The core principle of Modern Portfolio Theory: investors can construct portfolios to optimize expected return based on a given level of market risk.

### 2. **Efficient Frontier**
The set of optimal portfolios that offer:
- The highest expected return for a given level of risk
- The lowest risk for a given level of expected return

### 3. **Diversification**
The correlation matrix visualization demonstrates how combining assets with low correlations can reduce overall portfolio risk without sacrificing expected returns.

### 4. **Risk-Adjusted Returns**
The Sharpe ratio demonstrates the importance of evaluating returns relative to the risk taken, not in absolute terms.

---

## Why This Project for Aalto

### Alignment with Finance Curriculum
1. **Quantitative Methods**: Demonstrates proficiency in numerical optimization and statistical analysis
2. **Portfolio Theory**: Direct application of Modern Portfolio Theory, a core concept in finance
3. **Risk Management**: Comprehensive implementation of risk metrics used in professional finance
4. **Programming Skills**: Shows ability to implement complex financial algorithms in code

### Technical Depth
- **Mathematical Implementation**: Not just a toy model, but rigorous implementation of optimization theory
- **Real Data Integration**: Uses actual market data (Yahoo Finance) rather than synthetic data
- **Professional Architecture**: Clean separation of concerns, REST API design, modern frontend stack

### Practical Value
- Can be used for actual investment analysis
- Extensible for more complex strategies (factor models, Black-Litterman, etc.)
- Demonstrates understanding of both theory and implementation

---

## Future Extensions

### Potential Enhancements
1. **Factor Models**: Implement Fama-French 3-factor or 5-factor models
2. **Black-Litterman**: Add Bayesian portfolio optimization
3. **Monte Carlo Simulation**: Risk forecasting with simulation
4. **Rebalancing Strategies**: Backtesting different rebalancing approaches
5. **ESG Integration**: Add sustainability scoring to optimization
6. **Multi-Period Optimization**: Dynamic programming for multi-period decisions

### Data Sources
- Integration with Bloomberg API for institutional-grade data
- Alternative data sources (sentiment, satellite imagery, etc.)

---

## Testing

### Backend Tests
```bash
cd backend
pytest tests/
```

### Frontend Tests
```bash
cd frontend
npm test
```

---

## References

1. Markowitz, H. (1952). "Portfolio Selection", *The Journal of Finance*, 7(1), 77-91.
2. Sharpe, W.F. (1966). "Mutual Fund Performance", *The Journal of Business*, 39(1), 119-138.
3. Sortino, F.A. & Price, L.N. (1994). "Performance Measurement in a Downside Risk Framework", *The Journal of Investing*, 3(3), 59-65.
4. Jorion, P. (2006). *Value at Risk: The New Benchmark for Managing Financial Risk*, McGraw-Hill.

---

## Author

This project was developed as part of a portfolio for application to the **Aalto University Finance program**.

**Key Skills Demonstrated:**
- Quantitative finance and portfolio theory
- Python programming and numerical computing
- API development with FastAPI
- Frontend development with React/Next.js
- Data visualization and UX design
- Financial mathematics and optimization

---

## License

MIT License - Feel free to use for educational purposes.

---

## Contact

For questions about the mathematical implementation or the code structure, please refer to the API documentation at `/docs` when running the backend.
