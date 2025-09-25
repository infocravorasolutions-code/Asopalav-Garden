// Dynamic imports will be used in the functions
import Papa from 'papaparse';
import { downloadFileWithWebViewSupport, showDownloadSuccess } from './webviewUtils';

// Export data to CSV
export const exportToCSV = (data, filename, headers = null) => {
  try {
    // If headers are provided, use them; otherwise use object keys
    const csvHeaders = headers || Object.keys(data[0] || {});
    
    // Prepare data for CSV
    const csvData = data.map(row => {
      if (headers) {
        return headers.map(header => row[header.key] || '');
      }
      return Object.values(row);
    });

    // Add headers to the beginning
    const csvContent = [csvHeaders.map(h => h.label || h), ...csvData];

    // Convert to CSV string
    const csv = Papa.unparse(csvContent);

    // Create blob and download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    return downloadFileWithWebViewSupport(blob, `${filename}.csv`, 'text/csv', 'csv');
  } catch (error) {
    throw new Error('Failed to export CSV');
  }
};

// Export data to PDF
export const exportToPDF = async (data, filename, title, headers = null) => {
  try {
    // PDF Export Debug
    
    if (!data || data.length === 0) {
      throw new Error('No data to export');
    }

    // Import jsPDF and autoTable dynamically
    const jsPDF = (await import('jspdf')).default;
    const autoTable = (await import('jspdf-autotable')).default;
    
    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape for better table fit
    
    // Add logo
    try {
      const logoImg = new Image();
      logoImg.src = '/assets/logo.png';
      
      // Wait for image to load
      await new Promise((resolve, reject) => {
        logoImg.onload = resolve;
        logoImg.onerror = reject;
        // Set a timeout in case the image doesn't load
        setTimeout(reject, 5000);
      });
      
      // Add the logo image to PDF
      doc.addImage(logoImg, 'PNG', 14, 10, 20, 20);
    } catch (error) {
    }
    
    // Add title
    doc.setFontSize(18);
    doc.text(title, 40, 22);
    
    // Add date
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 40, 32);
    
    // Prepare table data - handle attendance data structure
    let tableHeaders, tableData;
    
    if (headers) {
      // Use provided headers
      tableHeaders = headers.map(h => h.label || h);
      tableData = data.map(row => {
        return headers.map(header => {
          const value = row[header.key];
          if (value === null || value === undefined) return '';
          if (typeof value === 'object') {
            return value.name || value.toString();
          }
          return value.toString();
        });
      });
    } else {
      // Auto-generate headers for attendance data
      tableHeaders = ['Date', 'Employee Name', 'Shift', 'Clock In', 'Clock Out', 'Location', 'Remarks'];
      tableData = data.map(record => {
        // Helper function to wrap long text
        const wrapText = (text, maxLength = 30) => {
          if (!text || text.length <= maxLength) return text;
          
          const words = text.split(' ');
          const lines = [];
          let currentLine = '';
          
          for (const word of words) {
            if ((currentLine + word).length <= maxLength) {
              currentLine += (currentLine ? ' ' : '') + word;
            } else {
              if (currentLine) lines.push(currentLine);
              currentLine = word;
            }
          }
          if (currentLine) lines.push(currentLine);
          
          return lines.join('\n');
        };
        
        return [
          new Date(record.stepIn).toLocaleDateString(),
          wrapText(record.employeeId?.name || 'N/A', 25), // Employee names
          record.shift || 'N/A',
          record.stepIn ? new Date(record.stepIn).toLocaleTimeString() : 'N/A',
          record.stepOut ? new Date(record.stepOut).toLocaleTimeString() : 'N/A',
          wrapText(record.address || 'N/A', 35), // Location
          wrapText(record.note || 'N/A', 30) // Remarks
        ];
      });
    }

    // Calculate table width and center it - adjusted to fit page width
    const totalColumnWidth = 25 + 50 + 20 + 25 + 25 + 60 + 55; // Sum of all column widths (260mm)
    const pageWidth = doc.internal.pageSize.width; // 297mm for A4 landscape
    const leftMargin = (pageWidth - totalColumnWidth) / 2; // 18.5mm on each side
    
    // Add table with optimized layout for all columns
    autoTable(doc, {
      head: [tableHeaders],
      body: tableData,
      startY: 40,
      styles: {
        fontSize: 7,
        cellPadding: 3,
        overflow: 'linebreak',
        halign: 'left',
        valign: 'top',
        lineWidth: 0.1,
        lineColor: [200, 200, 200]
      },
      headStyles: {
        fillColor: [59, 130, 246], // Primary blue
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 8
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252], // Light gray
      },
      columnStyles: {
        0: { cellWidth: 25, halign: 'center', overflow: 'linebreak' }, // Date
        1: { cellWidth: 50, halign: 'left', overflow: 'linebreak' },   // Employee Name
        2: { cellWidth: 20, halign: 'center', overflow: 'linebreak' }, // Shift
        3: { cellWidth: 25, halign: 'center', overflow: 'linebreak' }, // Clock In
        4: { cellWidth: 25, halign: 'center', overflow: 'linebreak' }, // Clock Out
        5: { cellWidth: 60, halign: 'left', overflow: 'linebreak' },   // Location
        6: { cellWidth: 55, halign: 'left', overflow: 'linebreak' }    // Remarks
      },
      margin: { left: leftMargin, right: leftMargin },
      tableWidth: 'auto'
    });

    // Get PDF as blob and download
    const pdfBlob = doc.output('blob');
    
    return downloadFileWithWebViewSupport(pdfBlob, filename, 'application/pdf', 'pdf');
  } catch (error) {
    throw new Error('Failed to export PDF');
  }
};

// Export data to Excel (CSV format but with .xlsx extension)
export const exportToExcel = (data, filename, headers = null) => {
  try {
    // Define columns to exclude from Excel export
    const excludedColumns = ['stepInImage', 'longitude', 'latitude', 'createdAt', 'updatedAt'];
    
    // If headers are provided, filter out excluded columns
    let csvHeaders;
    if (headers) {
      csvHeaders = headers.filter(header => !excludedColumns.includes(header.key));
    } else {
      // Auto-generate headers for attendance data, excluding unwanted columns
      csvHeaders = [
        { key: 'date', label: 'Date' },
        { key: 'employeeName', label: 'Employee Name' },
        { key: 'managerName', label: 'Manager Name' },
        { key: 'shift', label: 'Shift' },
        { key: 'stepIn', label: 'Clock In' },
        { key: 'stepOut', label: 'Clock Out' },
        { key: 'address', label: 'Location' },
        { key: 'note', label: 'Remarks' }
      ];
    }
    
    // Prepare data for CSV with proper name extraction
    const csvData = data.map(row => {
      if (headers) {
        return csvHeaders.map(header => {
          const value = row[header.key];
          if (value === null || value === undefined) return '';
          if (typeof value === 'object') {
            return value.name || value.toString();
          }
          return value.toString();
        });
      } else {
        // Auto-generate data for attendance records
        return [
          new Date(row.stepIn).toLocaleDateString(),
          row.employeeId?.name || 'N/A',
          row.managerId?.name || 'N/A',
          row.shift || 'N/A',
          row.stepIn ? new Date(row.stepIn).toLocaleTimeString() : 'N/A',
          row.stepOut ? new Date(row.stepOut).toLocaleTimeString() : 'N/A',
          row.address || 'N/A',
          row.note || 'N/A'
        ];
      }
    });

    // Add headers to the beginning
    const csvContent = [csvHeaders.map(h => h.label || h), ...csvData];

    // Convert to CSV string
    const csv = Papa.unparse(csvContent);

    // Create blob with Excel MIME type and download
    const blob = new Blob([csv], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    return downloadFileWithWebViewSupport(blob, `${filename}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'excel');
  } catch (error) {
    console.error('Excel export error:', error);
    throw new Error('Failed to export Excel');
  }
};

// Generic download function for any file type
export const downloadFile = (data, filename, mimeType = 'application/octet-stream') => {
  try {
    const blob = new Blob([data], { type: mimeType });
    return downloadFileWithWebViewSupport(blob, filename, mimeType, 'file');
  } catch (error) {
    console.error('File download error:', error);
    throw new Error('Failed to download file');
  }
};

// Format data for export
export const formatAttendanceData = (attendanceData) => {
  return attendanceData.map(record => ({
    'Employee ID': record.employeeId,
    'Employee Name': record.employeeName,
    'Date': new Date(record.timestamp).toLocaleDateString(),
    'Time': new Date(record.timestamp).toLocaleTimeString(),
    'Type': record.type === 'clock-in' ? 'Clock In' : 'Clock Out',
    'Status': record.status || 'Present',
    'Location': record.location ? `${record.location.latitude}, ${record.location.longitude}` : 'N/A',
  }));
};

export const formatEmployeeData = (employeeData) => {
  return employeeData.map(employee => ({
    'Employee ID': employee.id,
    'Name': employee.name,
    'Email': employee.email,
    'Phone': employee.phone || 'N/A',
    'Department': employee.department || 'N/A',
    'Position': employee.position || 'N/A',
    'Status': employee.status,
    'Join Date': new Date(employee.joinDate).toLocaleDateString(),
    'Manager': employee.managerName || 'N/A',
  }));
};

export const formatManagerData = (managerData) => {
  return managerData.map(manager => ({
    'Manager ID': manager.id,
    'Name': manager.name,
    'Email': manager.email,
    'Phone': manager.phone || 'N/A',
    'Department': manager.department || 'N/A',
    'Status': manager.status,
    'Join Date': new Date(manager.joinDate).toLocaleDateString(),
    'Team Size': manager.teamSize || 0,
  }));
};

// Download file from blob
export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
