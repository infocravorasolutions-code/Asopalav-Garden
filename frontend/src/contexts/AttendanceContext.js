import React, { createContext, useContext, useState, useCallback } from 'react';
import { attendanceAPI, userAPI, api } from '../services/api';
import toast from 'react-hot-toast';

const AttendanceContext = createContext();

export const useAttendance = () => {
  const context = useContext(AttendanceContext);
  if (!context) {
    throw new Error('useAttendance must be used within an AttendanceProvider');
  }
  return context;
};

export const AttendanceProvider = ({ children }) => {
  const [attendanceList, setAttendanceList] = useState([]);
  const [managers, setManagers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all attendance records
  const fetchAttendance = useCallback(async (filters = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await attendanceAPI.getAllAttendance(filters);
      setAttendanceList(response.data?.attendance || []);
      return response.data?.attendance || [];
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch attendance data';
      setError(errorMessage);
      console.error('Error fetching attendance:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch attendance by employee
  const fetchAttendanceByEmployee = useCallback(async (employeeId, filters = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await attendanceAPI.getAttendanceByEmployee(employeeId, filters);
      return response.data?.attendance || [];
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch employee attendance';
      setError(errorMessage);
      console.error('Error fetching employee attendance:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch all managers for filtering
  const fetchManagers = useCallback(async () => {
    try {
      const response = await api.get('/manager/all');
              // console.log('Managers response:', response.data);
      setManagers(response.data?.data || response.data || []);
      return response.data?.data || response.data || [];
    } catch (err) {
      console.error('Error fetching managers:', err);
      return [];
    }
  }, []);

  // Fetch all employees for filtering
  const fetchEmployees = useCallback(async () => {
    try {
      const response = await api.get('/employee/all');
              // console.log('Employees response:', response.data);
      setEmployees(response.data?.data || response.data || []);
      return response.data?.data || response.data || [];
    } catch (err) {
      console.error('Error fetching employees:', err);
      return [];
    }
  }, []);

  // Update single attendance record
  const updateAttendance = useCallback(async (id, data) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await attendanceAPI.updateAttendance(id, data);
      
      // Update the record in the list - backend returns { message, attendance }
      const updatedRecord = response.data.attendance || response.data;
      setAttendanceList(prev => 
        prev.map(record => 
          record._id === id ? { ...record, ...updatedRecord } : record
        )
      );
      return updatedRecord;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update attendance';
      setError(errorMessage);
      console.error('Error updating attendance:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Bulk update attendance records
  const bulkUpdateAttendance = useCallback(async (attendanceIds, updates) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await attendanceAPI.bulkUpdateAttendance({
        attendanceIds,
        updates
      });
      // Refresh the attendance list
      await fetchAttendance();
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to bulk update attendance';
      setError(errorMessage);
      console.error('Error bulk updating attendance:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchAttendance]);

  // Export attendance data to CSV
  const exportToCSV = useCallback((data, filename = 'attendance_report.csv') => {
    if (!data || data.length === 0) {
      setError('No data to export');
      return;
    }

    try {
      // Add header information
      const reportDate = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      const presentCount = data.filter(record => record.stepIn).length;
      const absentCount = data.filter(record => !record.stepIn).length;
      const totalHours = data.reduce((sum, record) => sum + (record.totalTime || 0), 0);

      const headerInfo = [
        ['PANTHER SECURE - ATTENDANCE REPORT'],
        [''],
        [`Report Generated: ${reportDate}`],
        [`Total Records: ${data.length}`],
        [`Present: ${presentCount} | Absent: ${absentCount} | Total Hours: ${Math.floor(totalHours / 60)}h ${totalHours % 60}m`],
        ['']
      ];

      // Define CSV headers
      const headers = [
        'Date',
        'Employee Name',
        'Employee Email',
        'Shift',
        'Clock In',
        'Clock Out',
        'Location',
        'Remarks'
      ];

      // Convert data to CSV format
      const csvData = data.map(record => [
        new Date(record.stepIn).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
        record.employeeId?.name || 'N/A',
        record.employeeId?.email || 'N/A',
        record.shift?.toUpperCase() || 'N/A',
        record.stepIn ? new Date(record.stepIn).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : 'N/A',
        record.stepOut ? new Date(record.stepOut).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : 'N/A',
        record.address || 'N/A',
        record.note || 'N/A'
      ]);

      // Create CSV content with header info
      const csvContent = [
        ...headerInfo.map(row => row.join(',')),
        headers.join(','),
        ...csvData.map(row => row.join(','))
      ].join('\n');

      // Create blob
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      
      // Check if in WebView and use appropriate download method
      if (window.ReactNativeWebView) {
        console.log('📱 WebView detected, using native CSV download...');
        
        // Convert blob to base64 for WebView
        const reader = new FileReader();
        reader.onload = () => {
          const base64Data = reader.result;
          
          // Send to React Native using the exact format your app expects
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'download',
            fileType: 'csv',
            fileName: filename,
            data: base64Data
          }));
          
          console.log('📊 CSV sent to React Native:', filename);
        };
        reader.readAsDataURL(blob);
      } else {
        // Fallback for regular browser
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      setError('Failed to export CSV');
    }
  }, []);

  // Export attendance data to PDF
  const exportToPDF = useCallback(async (data, filename = 'attendance_report.pdf') => {
    
    // Add timestamp to filename to prevent caching issues
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filenameWithTimestamp = filename.replace('.pdf', `_${timestamp}.pdf`);
    if (!data || data.length === 0) {
      setError('No data to export');
      return;
    }

    try {
      // Import jsPDF and autoTable dynamically
      const jsPDF = (await import('jspdf')).default;
      const autoTable = (await import('jspdf-autotable')).default;
      
      const doc = new jsPDF('l', 'mm', 'a4'); // Landscape for better table fit

      // Page dimensions
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 15;

      // Colors
      const primaryColor = [41, 128, 185]; // Blue
      const secondaryColor = [52, 73, 94]; // Dark gray
      const accentColor = [46, 204, 113]; // Green
      const dangerColor = [231, 76, 60]; // Red

      // Helper function to add text with custom styling
      const addText = (text, x, y, fontSize = 12, fontStyle = 'normal', color = secondaryColor) => {
        doc.setTextColor(...color);
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', fontStyle);
        doc.text(text, x, y);
      };

      // Helper function to right align text
      const rightAlignText = (text, x, y, fontSize = 12, fontStyle = 'normal', color = secondaryColor) => {
        const textWidth = doc.getTextWidth(text);
        addText(text, x - textWidth, y, fontSize, fontStyle, color);
      };

      let y = margin;

      // Header Section
      const headerHeight = 35;
      
      // Company logo (actual image)
      try {
        // Load and add the logo image
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
        doc.addImage(logoImg, 'PNG', margin, y, 25, 25);
      } catch (error) {
        // Fallback to text logo if image fails to load
        doc.setFillColor(...primaryColor);
        doc.rect(margin, y, 25, 25, 'F');
        addText('PS', margin + 12, y + 17, 14, 'bold', [255, 255, 255]);
        doc.setDrawColor(...secondaryColor);
        doc.rect(margin, y, 25, 25);
      }
      
      // Company name and title
      addText('PANTHER SECURE', margin + 35, y + 8, 16, 'bold', primaryColor);
      addText('Professional Security Solutions', margin + 35, y + 16, 9, 'normal', secondaryColor);
      addText('ATTENDANCE REPORT', margin + 35, y + 24, 12, 'bold', secondaryColor);
      
      // Report details
      const reportDate = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      rightAlignText(`Generated: ${reportDate}`, pageWidth - margin, y + 8, 8, 'normal', secondaryColor);
      rightAlignText(`Total Records: ${data.length}`, pageWidth - margin, y + 16, 8, 'normal', secondaryColor);
      
      y += headerHeight + 8;

      // Summary Section
      const presentCount = data.filter(record => record.stepIn).length;
      const absentCount = data.filter(record => !record.stepIn).length;
      const totalHours = data.reduce((sum, record) => sum + (record.totalTime || 0), 0);
      
      // Draw summary box with border
      doc.setFillColor(248, 249, 250);
      doc.rect(margin, y, pageWidth - 2 * margin, 22, 'F');
      doc.setDrawColor(...secondaryColor);
      doc.rect(margin, y, pageWidth - 2 * margin, 22);
      
      addText('SUMMARY', margin + 10, y + 7, 11, 'bold', secondaryColor);
      addText(`Present: ${presentCount}`, margin + 10, y + 15, 9, 'normal', accentColor);
      addText(`Absent: ${absentCount}`, margin + 70, y + 15, 9, 'normal', dangerColor);
      addText(`Total Hours: ${Math.floor(totalHours / 60)}h ${totalHours % 60}m`, margin + 130, y + 15, 9, 'normal', primaryColor);
      
      y += 35;

      // Prepare table data with proper text wrapping
      const tableHeaders = ['Date', 'Employee Name', 'Shift', 'Clock In', 'Clock Out', 'Location', 'Remarks'];
      
      const tableData = data.map(record => {
        return [
          new Date(record.stepIn).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
          record.employeeId?.name || 'N/A',
          record.shift?.toUpperCase() || 'N/A',
          record.stepIn ? new Date(record.stepIn).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : 'N/A',
          record.stepOut ? new Date(record.stepOut).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : 'N/A',
          record.address || 'N/A',
          record.note || 'N/A'
        ];
      });

      // Calculate table width and center it - adjusted to fit page width
      const totalColumnWidth = 25 + 50 + 20 + 25 + 25 + 60 + 55; // Sum of all column widths (260mm)
      const tablePageWidth = doc.internal.pageSize.width; // 297mm for A4 landscape
      const leftMargin = (tablePageWidth - totalColumnWidth) / 2; // 18.5mm on each side
      
      // Add table with autoTable for proper text wrapping
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
          fillColor: primaryColor,
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 7
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
        tableWidth: 'auto',
        showHead: 'everyPage'
      });

      // Footer Section
      const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : y + 50;
      doc.setDrawColor(...secondaryColor);
      doc.setLineWidth(1);
      doc.line(margin, finalY, pageWidth - margin, finalY);
      
      addText('This report was generated automatically by Panther Secure System.', margin, finalY + 8, 8, 'normal', [128, 128, 128]);
      addText('For any queries, please contact the system administrator.', margin, finalY + 12, 8, 'normal', [128, 128, 128]);

      // Check if running in WebView
      if (window.ReactNativeWebView) {
        
        // Get PDF as base64 data URI
        const pdfDataUri = doc.output('datauristring');
        
        // Send to React Native using the exact format your app expects
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'download',
          fileType: 'pdf',
          fileName: filenameWithTimestamp,
          data: pdfDataUri
        }));
        
        return;
      }

      // Regular browser fallback
      doc.save(filenameWithTimestamp);
    } catch (err) {
      setError('Failed to export PDF');
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Delete attendance record
  const deleteAttendance = useCallback(async (id) => {
    setIsLoading(true);
    setError(null);
    try {
      await api.delete(`/attendence/${id}`);
      setAttendanceList(prev => prev.filter(record => record._id !== id));
      toast.success('Attendance record deleted successfully');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete attendance record';
      setError(message);
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value = {
    attendanceList,
    managers,
    employees,
    isLoading,
    error,
    fetchAttendance,
    fetchAttendanceByEmployee,
    fetchManagers,
    fetchEmployees,
    updateAttendance,
    bulkUpdateAttendance,
    deleteAttendance,
    exportToCSV,
    exportToPDF,
    clearError
  };

  return (
    <AttendanceContext.Provider value={value}>
      {children}
    </AttendanceContext.Provider>
  );
};
