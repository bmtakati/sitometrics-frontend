// Export utilities for PDF and Excel generation
// Install these packages: npm install jspdf jspdf-autotable exceljs

import { buildHotelHeaderLines } from './reportHotel';

const loadPdfLibs = async () => {
  const [jspdfMod, autotableMod] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
  const jsPDF = jspdfMod.jsPDF || jspdfMod.default;
  const { autoTable } = autotableMod;

  if (typeof jsPDF !== 'function' || typeof autoTable !== 'function') {
    throw new Error('PDF libraries failed to load');
  }

  return { jsPDF, autoTable };
};

const formatHeaderLabel = (header) => header.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim();

/**
 * Export data to PDF
 * @param {string} reportName - Name of the report
 * @param {Array} data - Array of data objects
 * @param {Array} headers - Array of header names
 * @param {{ hotel?: object, subtitle?: string }} options
 */
export const exportToPDF = async (reportName, data, headers, options = {}) => {
  try {
    const { hotel, subtitle } = options;
    const { jsPDF, autoTable } = await loadPdfLibs();

    const doc = new jsPDF();
    let startY = 14;

    if (hotel?.name) {
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text(hotel.name, 14, startY);
      startY += 8;

      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      buildHotelHeaderLines(hotel).forEach((line) => {
        doc.text(line, 14, startY);
        startY += 5;
      });
      startY += 4;
    }

    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text(reportName, 14, startY);
    startY += 8;

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    if (subtitle) {
      doc.text(subtitle, 14, startY);
      startY += 6;
    }
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, startY);
    startY += 8;

    const tableData = data.map((row) => headers.map((header) => row[header] ?? 'N/A'));

    autoTable(doc, {
      head: [headers.map(formatHeaderLabel)],
      body: tableData,
      startY,
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [5, 150, 105] },
    });

    doc.save(`${reportName.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
    return true;
  } catch {
    return false;
  }
};

/**
 * Export data to Excel
 * @param {string} reportName - Name of the report
 * @param {Array} data - Array of data objects
 * @param {{ hotel?: object, subtitle?: string }} options
 */
export const exportToExcel = async (reportName, data, options = {}) => {
  try {
    const { hotel, subtitle } = options;
    const ExcelJS = (await import('exceljs')).default;

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Report Data');
    let rowNum = 1;

    const addTextRow = (value, style = {}) => {
      const row = ws.getRow(rowNum++);
      row.getCell(1).value = value;
      if (style.bold) row.getCell(1).font = { bold: true, size: style.size || 11 };
      return row;
    };

    if (hotel?.name) {
      addTextRow(hotel.name, { bold: true, size: 14 });
      buildHotelHeaderLines(hotel).forEach((line) => addTextRow(line));
      rowNum += 1;
    }

    addTextRow(reportName, { bold: true, size: 12 });
    if (subtitle) addTextRow(subtitle);
    addTextRow(`Generated: ${new Date().toLocaleString()}`);
    rowNum += 1;

    const firstRow = Array.isArray(data) && data.length > 0 ? data[0] : null;
    if (firstRow && typeof firstRow === 'object' && !Array.isArray(firstRow)) {
      const keys = Object.keys(firstRow);
      const headerRow = ws.getRow(rowNum++);
      keys.forEach((key, index) => {
        headerRow.getCell(index + 1).value = formatHeaderLabel(key);
        headerRow.getCell(index + 1).font = { bold: true };
      });

      data.forEach((row) => {
        if (!row || typeof row !== 'object' || Array.isArray(row)) return;
        const bodyRow = ws.getRow(rowNum++);
        keys.forEach((key, index) => {
          bodyRow.getCell(index + 1).value = row[key] ?? '';
        });
      });

      ws.columns = keys.map((key) => ({ key, width: Math.max(formatHeaderLabel(key).length + 4, 14) }));
    }

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportName.replace(/\s+/g, '_')}_${Date.now()}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Export data to CSV
 * @param {string} reportName - Name of the report
 * @param {Array} data - Array of data objects
 */
export const exportToCSV = (reportName, data) => {
  try {
    if (!Array.isArray(data) || data.length === 0) return false;

    const firstRow = data[0];
    if (!firstRow || typeof firstRow !== 'object' || Array.isArray(firstRow)) return false;

    const headers = Object.keys(firstRow);

    const csvContent = [
      headers.join(','),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header];
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          })
          .join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${reportName.replace(/\s+/g, '_')}_${Date.now()}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return true;
  } catch {
    return false;
  }
};
