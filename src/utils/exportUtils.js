// Export utilities for PDF and Excel generation
// Install these packages: npm install jspdf jspdf-autotable exceljs

const loadPdfLibs = async () => {
  const [jspdfMod, autotableMod] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
  const jsPDF = jspdfMod.jsPDF || jspdfMod.default;
  const { autoTable } = autotableMod;

  if (typeof jsPDF !== 'function' || typeof autoTable !== 'function') {
    throw new Error('PDF libraries failed to load');
  }

  return { jsPDF, autoTable };
};

/**
 * Export data to PDF
 * @param {string} reportName - Name of the report
 * @param {Array} data - Array of data objects
 * @param {Array} headers - Array of header names
 */
export const exportToPDF = async (reportName, data, headers) => {
  try {
    const { jsPDF, autoTable } = await loadPdfLibs();

    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text(reportName, 14, 20);
    
    // Add date
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);
    
    // Prepare table data
    const tableData = data.map(row => 
      headers.map(header => row[header] || 'N/A')
    );
    
    // Generate table
    autoTable(doc, {
      head: [headers.map(h => h.replace(/([A-Z])/g, ' $1').trim())],
      body: tableData,
      startY: 35,
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [59, 130, 246] }, // Blue color
    });
    
    // Save the PDF
    doc.save(`${reportName.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Export data to Excel
 * @param {string} reportName - Name of the report
 * @param {Array} data - Array of data objects
 */
export const exportToExcel = async (reportName, data) => {
  try {
    // Dynamic import to reduce bundle size
    const ExcelJS = (await import('exceljs')).default;

    // Create workbook and worksheet
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Report Data');

    // Add columns and rows from data
    const firstRow = Array.isArray(data) && data.length > 0 ? data[0] : null;
    if (firstRow && typeof firstRow === 'object' && !Array.isArray(firstRow)) {
      ws.columns = Object.keys(firstRow).map(key => ({ header: key, key }));
      data.forEach(row => {
        if (row && typeof row === 'object' && !Array.isArray(row)) {
          ws.addRow(row);
        }
      });
    }

    // Generate buffer and trigger download
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
  } catch (error) {
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
    
    // Get headers
    const headers = Object.keys(firstRow);
    
    // Create CSV content
    const csvContent = [
      headers.join(','), // Header row
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape values that contain commas or quotes
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');
    
    // Create blob and download
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
  } catch (error) {
    return false;
  }
};
