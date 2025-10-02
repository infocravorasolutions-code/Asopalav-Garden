// Enhanced PDF Export Utilities with Professional Styling
// Matches the reference image design with proper branding and layout

import { downloadFileWithWebViewSupport } from './webviewUtils';

/**
 * Create a professional attendance report PDF matching the reference design
 * @param {Array} data - Attendance data array
 * @param {Object} options - PDF generation options
 * @returns {Promise<Blob>} PDF blob
 */
export const createProfessionalAttendancePDF = async (data, options = {}) => {
  try {
    // Dynamic imports for better performance
    const jsPDF = (await import('jspdf')).default;
    const autoTable = (await import('jspdf-autotable')).default;

    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape for better table fit

    // Page dimensions
    const pageWidth = doc.internal.pageSize.width; // 297mm for A4 landscape
    const pageHeight = doc.internal.pageSize.height; // 210mm for A4 landscape
    const margin = 15;

    // Brand colors matching the reference
    const primaryBlue = [59, 130, 246]; // #3B82F6
    const darkGray = [55, 65, 81]; // #374151
    const lightGray = [243, 244, 246]; // #F3F4F6
    const successGreen = [34, 197, 94]; // #22C55E
    const dangerRed = [239, 68, 68]; // #EF4444

    let y = margin;

    // Helper function to add text with styling
    const addText = (text, x, y, fontSize = 12, fontStyle = 'normal', color = darkGray, align = 'left') => {
      doc.setTextColor(...color);
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', fontStyle);
      if (align === 'center') {
        const textWidth = doc.getTextWidth(text);
        doc.text(text, x - textWidth / 2, y);
      } else if (align === 'right') {
        const textWidth = doc.getTextWidth(text);
        doc.text(text, x - textWidth, y);
      } else {
        doc.text(text, x, y);
      }
    };

    // Helper function to draw rectangles with borders
    const drawRect = (x, y, width, height, fillColor = null, strokeColor = darkGray, lineWidth = 0.5) => {
      if (fillColor) {
        doc.setFillColor(...fillColor);
        doc.rect(x, y, width, height, 'F');
      }
      doc.setDrawColor(...strokeColor);
      doc.setLineWidth(lineWidth);
      doc.rect(x, y, width, height);
    };

    // Header Section - Company Logo and Branding
    const headerHeight = 35;

    // Try to load company logo
    try {
      const logoImg = new Image();
      logoImg.src = '/assets/logo.png';

      // Wait for image to load with timeout
      await new Promise((resolve, reject) => {
        logoImg.onload = resolve;
        logoImg.onerror = reject;
        setTimeout(() => reject(new Error('Logo load timeout')), 3000);
      });

      // Add logo to PDF
      doc.addImage(logoImg, 'PNG', margin, y, 25, 25);
    } catch (error) {
      // Fallback: Draw a simple logo placeholder
      drawRect(margin, y, 25, 25, primaryBlue);
      addText('NL', margin + 12.5, y + 17, 14, 'bold', [255, 255, 255], 'center');
    }

    // Company branding section - Using current project details
    const brandingX = margin + 35;
    addText('NILKANTH LANDSCAPE', brandingX, y + 8, 16, 'bold', primaryBlue);
    addText('Professional Landscape Solutions', brandingX, y + 16, 9, 'normal', darkGray);
    addText('ATTENDANCE REPORT', brandingX, y + 24, 12, 'bold', darkGray);

    // Add version identifier to confirm new PDF format


    // Report metadata (right aligned)
    const reportDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    addText(`Generated: ${reportDate}`, pageWidth - margin, y + 8, 8, 'normal', darkGray, 'right');
    addText(`Total Records: ${data.length}`, pageWidth - margin, y + 16, 8, 'normal', darkGray, 'right');

    y += headerHeight + 8;

    // Summary Section with professional styling
    const summaryHeight = 25;
    const summaryWidth = pageWidth - 2 * margin;

    // Summary background with border
    drawRect(margin, y, summaryWidth, summaryHeight, lightGray, darkGray, 0.5);

    // Summary content
    const presentCount = data.filter(record => record.stepIn).length;
    const absentCount = data.filter(record => !record.stepIn).length;
    const totalHours = data.reduce((sum, record) => sum + (record.totalTime || 0), 0);

    addText('SUMMARY', margin + 10, y + 8, 11, 'bold', darkGray);
    addText(`Present: ${presentCount}`, margin + 10, y + 18, 9, 'normal', successGreen);
    addText(`Absent: ${absentCount}`, margin + 70, y + 18, 9, 'normal', dangerRed);
    addText(`Total Hours: ${Math.floor(totalHours / 60)}h ${totalHours % 60}m`, margin + 130, y + 18, 9, 'normal', primaryBlue);

    y += summaryHeight + 15;

    // Prepare table data with proper formatting
    const tableHeaders = ['Date', 'Employee Name', 'Shift', 'Clock In', 'Clock Out', 'Location', 'Remarks'];

    // Sort data by date for better organization
    const sortedData = [...data].sort((a, b) => new Date(a.stepIn) - new Date(b.stepIn));

    const tableData = sortedData.map(record => {
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
        new Date(record.stepIn).toLocaleDateString('en-US', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }).replace(',', ''),
        wrapText(record.employeeId?.name || 'N/A', 25),
        (record.shift || 'N/A').toUpperCase(),
        record.stepIn ? new Date(record.stepIn).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }) : 'N/A',
        record.stepOut ? new Date(record.stepOut).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }) : 'N/A',
        wrapText(record.address || 'N/A', 35),
        wrapText(record.note || 'N/A', 30)
      ];
    });

    // Calculate table positioning for better fit
    const totalColumnWidth = 25 + 50 + 20 + 25 + 25 + 60 + 55; // Sum of all column widths
    const tableLeftMargin = (pageWidth - totalColumnWidth) / 2;

    // Create the table with professional styling
    autoTable(doc, {
      head: [tableHeaders],
      body: tableData,
      startY: y,
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
        fillColor: primaryBlue,
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 8
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252], // Very light gray for alternating rows
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
      margin: { left: tableLeftMargin, right: tableLeftMargin },
      tableWidth: 'auto',
      showHead: 'everyPage'
    });

    // Footer section
    const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : y + 50;

    // Footer line
    doc.setDrawColor(...darkGray);
    doc.setLineWidth(0.5);
    doc.line(margin, finalY, pageWidth - margin, finalY);

    // Footer text
    addText('This report was generated automatically by Nilkanth Landscape System.', margin, finalY + 8, 8, 'normal', [128, 128, 128]);
    addText('For any queries, please contact the system administrator.', margin, finalY + 12, 8, 'normal', [128, 128, 128]);

    // Generate PDF blob
    const pdfBlob = doc.output('blob');
    return pdfBlob;

  } catch (error) {
    console.error('Error creating professional PDF:', error);
    throw new Error('Failed to create professional PDF: ' + error.message);
  }
};

/**
 * Export attendance data to PDF with professional styling
 * @param {Array} data - Attendance data
 * @param {string} filename - Output filename
 * @param {Object} options - Export options
 */
export const exportAttendanceToPDF = async (data, filename = 'attendance_report.pdf', options = {}) => {
  try {

    if (!data || data.length === 0) {
      throw new Error('No data to export');
    }

    // Add timestamp to filename to prevent caching issues
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filenameWithTimestamp = filename.replace('.pdf', `_${timestamp}.pdf`);

    // Create professional PDF
    const pdfBlob = await createProfessionalAttendancePDF(data, options);


    // Download with WebView support
    return await downloadFileWithWebViewSupport(
      pdfBlob,
      filenameWithTimestamp,
      'application/pdf',
      'pdf'
    );

  } catch (error) {
    console.error('❌ [exportAttendanceToPDF] Error exporting PDF:', error);
    console.error('❌ [exportAttendanceToPDF] Error stack:', error.stack);
    throw new Error('Failed to export PDF: ' + error.message);
  }
};

/**
 * Create a traditional muster roll PDF in Form XVI format
 * @param {Array} reportData - Muster roll data
 * @param {Object} dateRange - Date range for the report
 * @param {Object} options - PDF generation options
 */
export const createTraditionalMusterRollPDF = async (reportData, dateRange, options = {}) => {
  try {

    const jsPDF = (await import('jspdf')).default;
    const doc = new jsPDF('landscape', 'mm', 'a3'); // Using A3 for better fit

    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 10;

    let currentY = margin + 10;

    // Brand colors
    const primaryBlue = [59, 130, 246];
    const darkGray = [55, 65, 81];

    // Get company code from options or use default
    const companyCode = options.companyCode || 'NEELKANTH';
    const fallbackLogoUrl = options.fallbackLogoUrl || null;

    // Helper functions
    const addText = (text, x, y, fontSize = 12, fontStyle = 'normal', color = darkGray, align = 'left') => {
      doc.setTextColor(...color);
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', fontStyle);
      if (align === 'center') {
        const textWidth = doc.getTextWidth(text);
        doc.text(text, x - textWidth / 2, y);
      } else if (align === 'right') {
        const textWidth = doc.getTextWidth(text);
        doc.text(text, x - textWidth, y);
      } else {
        doc.text(text, x, y);
      }
    };

    // Header section with logo - using CompanyLogo component logic
    let logoAdded = false;
    const logoSize = 25; // Optimized logo size for inline layout
    const logoY = margin + 5; // Fixed Y position at top
    const logoX = margin; // Logo X position
    const textStartX = logoX + logoSize + 10; // Text starts after logo with spacing

    // Helper function to get company logo path (same logic as CompanyLogo component)
    const getCompanyLogoPath = (companyCode) => {
      if (!companyCode) return null;

      const normalizedCode = companyCode.toUpperCase();
      const logoMap = {
        'HARIKRISHNA': 'HARIKRISHNA.jpg',
        'NEELKANTH': 'NEELKANTH.jpg',
        'NILKANTH': 'NEELKANTH.jpg', // Alternative spelling
      };

      const logoFileName = logoMap[normalizedCode];
      if (logoFileName) {
        return `/src/company-logo/${logoFileName}`;
      }
      return null;
    };

    // Get company logo with fallback (same logic as CompanyLogo component)
    const getCompanyLogo = (companyCode, fallbackLogoUrl) => {
      const logoPath = getCompanyLogoPath(companyCode);
      return logoPath || fallbackLogoUrl;
    };

    try {
      // Get the correct logo URL using CompanyLogo component logic
      const logoUrl = getCompanyLogo(companyCode, fallbackLogoUrl);

      if (logoUrl) {
        const logoImg = new Image();
        logoImg.crossOrigin = 'anonymous'; // Handle CORS if needed
        logoImg.src = logoUrl;

        await new Promise((resolve, reject) => {
          logoImg.onload = () => {
            try {
              // Determine image format from path
              const imageFormat = logoUrl.toLowerCase().includes('.jpg') || logoUrl.toLowerCase().includes('.jpeg') ? 'JPEG' : 'PNG';

              // Add logo at top left with proper alignment
              doc.addImage(logoImg, imageFormat, logoX, logoY, logoSize, logoSize);
              logoAdded = true;
              resolve();
            } catch (addError) {
              reject(addError);
            }
          };
          logoImg.onerror = reject;
          setTimeout(() => reject(new Error('Logo load timeout')), 2000);
        });
      }

      if (!logoAdded) {
        console.warn(`No company logo found for company code: ${companyCode}, using text-based header`);
        // Add a text-based company header as fallback
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(...primaryBlue);
        doc.text(companyCode.toUpperCase(), textStartX, logoY + 5);
        doc.setFontSize(8);
        doc.setTextColor(...darkGray);
        doc.text('Company Logo', textStartX, logoY + 12);
      }
    } catch (error) {
      console.warn('Could not load company logo for muster roll PDF:', error);
      // Fallback to text-based header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(...primaryBlue);
      doc.text(companyCode.toUpperCase(), textStartX, logoY + 5);
      doc.setFontSize(8);
      doc.setTextColor(...darkGray);
      doc.text('Company Logo', textStartX, logoY + 12);
    }

    // Calculate header layout - logo and text inline
    const headerStartY = logoY;
    const titleY = headerStartY + 8; // Title aligned with logo
    const companyNameY = titleY + 6; // Company name below title
    const deploymentY = companyNameY + 6; // Deployment text below company name

    // Form title - positioned inline with logo
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Form XVI 1 [See Rule 78(1) (a) (1)] Muster Roll', textStartX, titleY);

    // Company name - inline with logo
    doc.setFontSize(14);
    doc.text('NILKANTH LANDSCAPE', textStartX, companyNameY);

    // Deployment text - inline with logo
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const currentDate = new Date();
    const monthYear = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
    const deploymentText = `DEPLOYMENT OF LANDSCAPE PERSONNEL AT NILKANTH LANDSCAPE UNIT ON ${monthYear}`;
    doc.text(deploymentText, textStartX, deploymentY);

    // Set currentY to start table below the header
    currentY = Math.max(logoY + logoSize, deploymentY) + 15;

    // Calculate date range
    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);
    const daysInMonth = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

    // Table structure
    const startX = margin;
    let currentX = startX;

    // Column widths for A3 format - increased for better text display
    const colWidths = {
      srNo: 12,
      empCode: 18,
      name: 45,
      designation: 35,  // Increased from 25
      shift: 30,         // Increased from 20
      daily: 6,
      totalDays: 15
    };

    // Draw table headers
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setDrawColor(0);
    doc.setLineWidth(0.3);

    const tableStartY = currentY;
    const rowHeight = 15;

    // Header cells
    const headers = [
      'SR NO', 'EMP CODE', 'NAME OF EMPLOYEE', 'DESIGNATION',
      'SHIFT'
    ];

    // Add day headers
    for (let i = 1; i <= daysInMonth; i++) {
      headers.push(i.toString());
    }
    headers.push('TOTAL\nDAYS');

    // Draw header row
    currentX = startX;
    headers.forEach((header, index) => {
      let width;
      if (index < 5) {
        const keys = ['srNo', 'empCode', 'name', 'designation', 'shift'];
        width = colWidths[keys[index]];
      } else if (index < 5 + daysInMonth) {
        width = colWidths.daily;
      } else {
        width = colWidths.totalDays;
      }

      // Draw cell border
      doc.rect(currentX, currentY - 5, width, rowHeight);

      // Add text
      const lines = header.split('\n');
      const lineHeight = 3;
      const textStartY = currentY + (rowHeight / 2) - ((lines.length * lineHeight) / 2);

      lines.forEach((line, lineIndex) => {
        // Better header text positioning
        const headerTextX = currentX + 2; // Small margin from cell border
        doc.text(line, headerTextX, textStartY + (lineIndex * lineHeight), { align: 'left' });
      });

      currentX += width;
    });

    currentY += rowHeight;

    // Data rows
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);

    reportData.forEach((record, rowIndex) => {
      // Check for new page
      if (currentY > pageHeight - 30) {
        doc.addPage();
        currentY = margin + 10;
      }

      currentX = startX;
      const dataRowHeight = 12;

      // Row data
      const rowData = [
        record.srNo.toString(),
        record.empCode,
        record.name,
        record.designation,
        record.shift
      ];


      // Add daily attendance - using numeric keys (1, 2, 3, etc.)
      for (let i = 1; i <= daysInMonth; i++) {
        // The data structure uses numeric keys (1, 2, 3, etc.) for days
        const attendanceValue = record.attendance[i] || '';
        rowData.push(attendanceValue);
      }

      rowData.push(record.totalDays.toString());

      // Draw data cells
      rowData.forEach((cellData, cellIndex) => {
        let width;
        if (cellIndex < 5) {
          const keys = ['srNo', 'empCode', 'name', 'designation', 'shift'];
          width = colWidths[keys[cellIndex]];
        } else if (cellIndex < 5 + daysInMonth) {
          width = colWidths.daily;
        } else {
          width = colWidths.totalDays;
        }

        // Draw cell border
        doc.rect(currentX, currentY - 4, width, dataRowHeight);

        // Handle long text
        let displayText = cellData.toString();

        // Truncate text based on column type
        if (cellIndex === 2 && displayText.length > 25) { // Name column
          displayText = displayText.substring(0, 23) + '..';
        } else if (cellIndex === 3 && displayText.length > 20) { // Designation column
          displayText = displayText.substring(0, 18) + '..';
        } else if (cellIndex === 4 && displayText.length > 25) { // Shift column
          displayText = displayText.substring(0, 23) + '..';
        }


        // Color coding for attendance
        if (cellIndex >= 6 && cellIndex < 6 + daysInMonth) {
          if (displayText === 'P') doc.setTextColor(0, 100, 0);
          else if (displayText === 'A') doc.setTextColor(200, 0, 0);
          else if (displayText === 'W') doc.setTextColor(0, 0, 200);
          else doc.setTextColor(0, 0, 0);
        } else {
          doc.setTextColor(0, 0, 0);
        }

        // Better text positioning to prevent overflow
        const textX = currentX + 2; // Small margin from cell border
        const textY = currentY + dataRowHeight / 2;

        // Use left alignment for better text control
        doc.text(displayText, textX, textY, { align: 'left' });
        currentX += width;
      });

      currentY += dataRowHeight;
    });

    // Generate PDF blob
    const pdfBlob = doc.output('blob');
    return pdfBlob;

  } catch (error) {
    console.error('Error creating traditional muster roll PDF:', error);
    throw new Error('Failed to create traditional muster roll PDF: ' + error.message);
  }
};

/**
 * Export traditional muster roll to PDF
 * @param {Array} reportData - Muster roll data
 * @param {Object} dateRange - Date range
 * @param {string} filename - Output filename
 */
export const exportTraditionalMusterRollToPDF = async (reportData, dateRange, filename = 'traditional_muster_roll.pdf', options = {}) => {
  try {
    if (!reportData || reportData.length === 0) {
      throw new Error('No muster roll data to export');
    }

    // Add timestamp to filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filenameWithTimestamp = filename.replace('.pdf', `_${timestamp}.pdf`);

    // Create traditional muster roll PDF with company options
    const pdfBlob = await createTraditionalMusterRollPDF(reportData, dateRange, options);

    // Download with WebView support
    return await downloadFileWithWebViewSupport(
      pdfBlob,
      filenameWithTimestamp,
      'application/pdf',
      'pdf'
    );

  } catch (error) {
    console.error('Error exporting traditional muster roll PDF:', error);
    throw new Error('Failed to export traditional muster roll PDF: ' + error.message);
  }
};

export default {
  createProfessionalAttendancePDF,
  exportAttendanceToPDF,
  createTraditionalMusterRollPDF,
  exportTraditionalMusterRollToPDF
};
