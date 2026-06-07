/**
 * PDF Export Utility
 *
 * Captures the results panel as a canvas and produces a multi-page PDF report.
 * Uses jspdf + html2canvas (client-side only — no server required).
 */

import { PortfolioAnalysisResponse, OptimalPortfoliosResponse } from '@/types';

// Dynamic imports so these large libs don't affect initial bundle
async function loadLibs() {
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import('jspdf'),
    import('html2canvas'),
  ]);
  return { jsPDF, html2canvas };
}

export interface ExportOptions {
  analysis: PortfolioAnalysisResponse | null;
  optimization: OptimalPortfoliosResponse | null;
  period: string;
  resultsElementId: string;
}

function formatPct(v: number): string {
  return `${(v * 100).toFixed(2)}%`;
}

function formatNum(v: number, decimals = 3): string {
  return v.toFixed(decimals);
}

export async function exportToPdf(options: ExportOptions): Promise<void> {
  const { jsPDF, html2canvas } = await loadLibs();

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 14;
  const contentW = pageW - margin * 2;
  let y = margin;

  // ─── Helper functions ────────────────────────────────────────────────────────

  function addTitle(text: string, size = 16) {
    pdf.setFontSize(size);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(30, 64, 175); // blue-700
    pdf.text(text, margin, y);
    y += size * 0.5;
  }

  function addSubtitle(text: string, size = 10) {
    pdf.setFontSize(size);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(107, 114, 128); // gray-500
    pdf.text(text, margin, y);
    y += size * 0.5 + 2;
  }

  function addSectionHeader(text: string) {
    y += 4;
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(17, 24, 39); // gray-900
    pdf.text(text, margin, y);
    y += 6;
    pdf.setDrawColor(209, 213, 219);
    pdf.line(margin, y, pageW - margin, y);
    y += 4;
  }

  function addRow(label: string, value: string, highlight = false) {
    if (y > pageH - 20) { pdf.addPage(); y = margin; }
    pdf.setFontSize(9);
    pdf.setFont('helvetica', highlight ? 'bold' : 'normal');
    pdf.setTextColor(55, 65, 81);
    pdf.text(label, margin, y);
    pdf.setTextColor(highlight ? 22 : 75, highlight ? 101 : 85, highlight ? 52 : 99);
    pdf.text(value, pageW - margin, y, { align: 'right' });
    y += 5.5;
  }

  function addSpace(mm = 4) { y += mm; }

  // ─── Cover / title page ──────────────────────────────────────────────────────
  pdf.setFillColor(30, 64, 175);
  pdf.rect(0, 0, pageW, 38, 'F');
  pdf.setFontSize(22);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text('Portfolio Risk Analyzer', margin, 18);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Quantitative Analysis Report', margin, 26);
  pdf.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, margin, 33);
  pdf.text(`Period: ${options.period.toUpperCase()}`, pageW - margin, 33, { align: 'right' });
  pdf.setTextColor(30, 64, 175);
  y = 48;

  // ─── Analysis section ────────────────────────────────────────────────────────
  if (options.analysis) {
    const a = options.analysis;

    addTitle('Risk Analysis');
    addSubtitle(`Data: ${a.data_range.start} → ${a.data_range.end}  |  Benchmark: ${a.benchmark ?? 'None'}`);

    addSectionHeader('Portfolio Risk Metrics');
    const m = a.portfolio_metrics;
    addRow('Expected Return (annualized)', formatPct(m.expected_return), true);
    addRow('Volatility (annualized)', formatPct(m.volatility));
    addRow('Sharpe Ratio', formatNum(m.sharpe_ratio), true);
    addRow('Sortino Ratio', formatNum(m.sortino_ratio));
    addRow('Value at Risk (95%)', formatPct(m.var_95));
    addRow('Conditional VaR / Expected Shortfall (95%)', formatPct(m.cvar_95));
    addRow('Maximum Drawdown', formatPct(m.max_drawdown));
    if (m.beta !== undefined && m.beta !== null) addRow('Beta', formatNum(m.beta));
    if (m.alpha !== undefined && m.alpha !== null) addRow('Alpha', formatPct(m.alpha));

    addSectionHeader('Portfolio Composition');
    Object.entries(a.weights).forEach(([ticker, weight]) => {
      const sector = a.sectors?.[ticker] ?? '';
      addRow(`${ticker}${sector ? ` (${sector})` : ''}`, formatPct(weight));
    });

    addSectionHeader('Individual Asset Metrics');
    addRow('Asset', 'Return  |  Volatility  |  Sharpe');
    Object.entries(a.asset_metrics).forEach(([ticker, metrics]) => {
      addRow(
        ticker,
        `${formatPct(metrics.expected_return)}  |  ${formatPct(metrics.volatility)}  |  ${formatNum(metrics.sharpe_ratio)}`
      );
    });
  }

  // ─── Optimization section ────────────────────────────────────────────────────
  if (options.optimization) {
    const o = options.optimization;

    if (options.analysis) { pdf.addPage(); y = margin; }

    addTitle('Portfolio Optimization');
    addSubtitle(`Data: ${o.data_range.start} → ${o.data_range.end}`);

    addSectionHeader('Maximum Sharpe Portfolio');
    addRow('Expected Return', formatPct(o.max_sharpe.expected_return), true);
    addRow('Volatility', formatPct(o.max_sharpe.volatility));
    addRow('Sharpe Ratio', formatNum(o.max_sharpe.sharpe_ratio), true);
    addSectionHeader('Optimal Weights (Max Sharpe)');
    Object.entries(o.max_sharpe.optimal_weights).forEach(([ticker, weight]) => {
      addRow(ticker, formatPct(weight));
    });

    addSpace();
    addSectionHeader('Minimum Variance Portfolio');
    addRow('Expected Return', formatPct(o.min_variance.expected_return));
    addRow('Volatility', formatPct(o.min_variance.volatility), true);
    addRow('Sharpe Ratio', formatNum(o.min_variance.sharpe_ratio));

    addSpace();
    addSectionHeader('Equal Weight Benchmark');
    addRow('Expected Return', formatPct(o.equal_weight.expected_return));
    addRow('Volatility', formatPct(o.equal_weight.volatility));
    addRow('Sharpe Ratio', formatNum(o.equal_weight.sharpe_ratio));
  }

  // ─── Charts screenshot ───────────────────────────────────────────────────────
  const el = document.getElementById(options.resultsElementId);
  if (el) {
    try {
      pdf.addPage();
      y = margin;
      addTitle('Charts & Visualizations');
      addSpace(4);

      const canvas = await html2canvas(el, {
        scale: 1.5,
        useCORS: true,
        backgroundColor: '#f3f4f6',
        logging: false,
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.85);
      const imgH = (canvas.height / canvas.width) * contentW;

      // If it fits on one page, add it; otherwise scale to fit
      if (imgH <= pageH - y - margin) {
        pdf.addImage(imgData, 'JPEG', margin, y, contentW, imgH);
      } else {
        // Scale to page height
        const scaledH = pageH - y - margin;
        const scaledW = (canvas.width / canvas.height) * scaledH;
        pdf.addImage(imgData, 'JPEG', margin, y, Math.min(scaledW, contentW), scaledH);
      }
    } catch {
      // Chart capture failed — silently skip
    }
  }

  // ─── Footer on every page ────────────────────────────────────────────────────
  const totalPages = (pdf.internal as unknown as { getNumberOfPages: () => number }).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(156, 163, 175);
    pdf.text(
      `Portfolio Risk Analyzer  —  Page ${i} of ${totalPages}  —  Generated with Modern Portfolio Theory`,
      pageW / 2,
      pageH - 6,
      { align: 'center' }
    );
  }

  pdf.save(`portfolio-report-${new Date().toISOString().slice(0, 10)}.pdf`);
}
