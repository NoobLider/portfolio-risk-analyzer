'use client';

import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { exportToPdf, ExportOptions } from '@/lib/exportPdf';

interface ExportButtonProps extends ExportOptions {}

export const ExportButton: React.FC<ExportButtonProps> = (props) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportToPdf(props);
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      title="Export analysis as PDF"
      className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-lg hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
    >
      {isExporting ? (
        <>
          <Loader2 size={15} className="animate-spin" />
          Generating PDF...
        </>
      ) : (
        <>
          <Download size={15} />
          Export PDF
        </>
      )}
    </button>
  );
};

export default ExportButton;
