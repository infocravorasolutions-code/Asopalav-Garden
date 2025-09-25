// WebView utility functions for React Native WebView integration

/**
 * Check if the app is running inside a React Native WebView
 * @returns {boolean} True if running in WebView, false otherwise
 */
export const isInWebView = () => {
  return window.ReactNativeWebView !== undefined;
};

/**
 * Check if WebView download functions are available
 * @returns {boolean} True if download functions are available, false otherwise
 */
export const hasWebViewDownloadSupport = () => {
  return isInWebView() && (
    window.downloadPDF || 
    window.downloadCSV || 
    window.downloadExcel || 
    window.downloadFile
  );
};

/**
 * Download a file using WebView functions if available, otherwise fallback to browser download
 * @param {Blob} blob - The file blob to download
 * @param {string} filename - The filename for the download
 * @param {string} mimeType - The MIME type of the file
 * @param {string} downloadType - The type of download ('pdf', 'csv', 'excel', or 'file')
 * @returns {Promise<void>}
 */
export const downloadFileWithWebViewSupport = (blob, filename, mimeType = 'application/octet-stream', downloadType = 'file') => {
  return new Promise((resolve, reject) => {
    try {
      if (isInWebView()) {
        
        // Use direct React Native WebView messaging
        const reader = new FileReader();
        reader.onload = () => {
          const base64Data = reader.result;
          
          // Map download types to file types that match your React Native app
          let fileType = downloadType;
          if (downloadType === 'excel') {
            fileType = 'xlsx';
          }
          
          // Send message using the exact format your React Native app expects
          const message = {
            type: 'download',
            fileType: fileType,
            fileName: filename,
            data: base64Data
          };
          
          window.ReactNativeWebView.postMessage(JSON.stringify(message));
          
          resolve();
        };
        reader.onerror = () => reject(new Error('Failed to read file data'));
        reader.readAsDataURL(blob);
      } else {
        // Fallback to regular browser download
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        resolve();
      }
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Show appropriate success message based on environment
 * @param {string} message - The success message
 * @param {boolean} isWebView - Whether the app is running in WebView
 */
export const showDownloadSuccess = (message, isWebView = isInWebView()) => {
  if (isWebView) {
    return `${message} initiated in mobile app`;
  }
  return message;
};

/**
 * Get the appropriate file extension for a download type
 * @param {string} downloadType - The type of download
 * @returns {string} The file extension
 */
export const getFileExtension = (downloadType) => {
  switch (downloadType) {
    case 'pdf':
      return '.pdf';
    case 'csv':
      return '.csv';
    case 'excel':
      return '.xlsx';
    default:
      return '';
  }
};

/**
 * Generate a filename with timestamp
 * @param {string} baseName - The base name for the file
 * @param {string} downloadType - The type of download
 * @returns {string} The generated filename
 */
export const generateFilename = (baseName, downloadType) => {
  const timestamp = new Date().toISOString().split('T')[0];
  const extension = getFileExtension(downloadType);
  return `${baseName}_${timestamp}${extension}`;
};

export default {
  isInWebView,
  hasWebViewDownloadSupport,
  downloadFileWithWebViewSupport,
  showDownloadSuccess,
  getFileExtension,
  generateFilename
};
