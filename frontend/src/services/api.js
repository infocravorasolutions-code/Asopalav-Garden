import axios from 'axios';
import { getApiUrl, getImageUrl } from '../config/apiConfig';

export const BASE_URL = getApiUrl();
export const IMAGE_URL = getImageUrl();

// Rate limiting utility
class RateLimiter {
  constructor(maxRequests = 100, timeWindow = 60000) { // 100 requests per minute
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindow;
    this.requests = [];
  }

  canMakeRequest() {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.timeWindow);
    return this.requests.length < this.maxRequests;
  }

  addRequest() {
    this.requests.push(Date.now());
  }
}

const rateLimiter = new RateLimiter();

// Create axios instance
export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000, // Reduced to 15 seconds for faster error handling
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token and rate limiting
api.interceptors.request.use(
  (config) => {
    // Check rate limiting (disabled for development)
    // if (!rateLimiter.canMakeRequest()) {
    //   return Promise.reject(new Error('Rate limit exceeded. Please wait before making another request.'));
    // }
    
    // rateLimiter.addRequest();
    
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // If data is FormData, remove Content-Type to let browser set it
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('❌ API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });
    
    if (error.response?.status === 401) {
      // Unauthorized - clear auth data and redirect to login
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const authAPI = {
  login: (credentials, role) => {
    if (role === 'employee') {
      return api.post('/auth/employee/login', credentials);
    }
    const endpoint = role === 'admin' ? '/admin/login' : '/manager/login';
    return api.post(endpoint, credentials);
  },
  logout: () => api.post('/auth/logout'),
  refreshToken: () => api.post('/auth/refresh'),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resendOTP: (data) => api.post('/auth/resend-otp', data),
  updatePassword: (data) => api.post('/auth/update-password', data),
};

export const userAPI = {
  // Admin endpoints
  createManager: (data) => api.post('/manager', data),
  createEmployee: (data) => api.post('/employee', data),
  getAllManagers: () => api.get('/manager/all'),
  getAllEmployees: () => api.get('/employee/all'),
  updateManager: (id, data) => api.put(`/manager/${id}`, data),
  updateEmployee: (id, data) => api.put(`/employee/${id}`, data),
  deleteManager: (id) => api.delete(`/manager/${id}`),
  deleteEmployee: (id) => api.delete(`/employee/${id}`),
  
  // Manager endpoints
  getMyEmployees: () => api.get('/employee/all'), // Manager gets employees assigned to them
  createMyEmployee: (data) => api.post('/employee', data),
  updateMyEmployee: (id, data) => api.put(`/employee/${id}`, data),
  deleteMyEmployee: (id) => api.delete(`/employee/${id}`),
  
  // Profile
  updateProfile: (data) => api.put('/profile', data),
  changePassword: (data) => api.put('/profile/password', data),
};

export const attendanceAPI = {
  // Admin endpoints - using correct backend routes
  getAllAttendance: (filters) => api.get('/attendence', { params: filters }),
  getAttendanceByEmployee: (employeeId, filters) => 
    api.get(`/attendence/${employeeId}`, { params: filters }),
  
  // Manager endpoints - using correct endpoints from your specification
  getMyEmployeesAttendance: (filters) => 
    api.get('/attendence', { params: filters }),
  getEmployeeAttendance: (employeeId, filters) => 
    api.get(`/attendence/${employeeId}`, { params: filters }),
  
  // Employee endpoints
  clockIn: (data) => api.post('/attendence/step-in', data),
  clockOut: (data) => api.post('/attendence/step-out', data),
  getMyAttendance: (filters) => api.get('/attendence', { params: filters }),
  
  // Check employee status
  checkEmployeeStatus: (employeeId) => api.get(`/attendence/status/${employeeId}`),
  
  // Real-time step-in tracking
  getLiveStepIns: () => api.get('/attendence/live-stepins'),
  getStepInHistory: (filters) => api.get('/attendence/stepin-history', { params: filters }),
  
  // AWS Location Service endpoints (Node.js backend with bearer token)
  validateGeoFence: (data) => api.post('/location/validate-geofence', data),
  recordStepIn: (data) => api.post('/location/step-in', data),
  getAddress: (lat, lng) => api.get(`/location/address?latitude=${lat}&longitude=${lng}`),
  getAWSStatus: () => api.get('/location/aws-status'),
  toggleDevelopmentMode: (enabled) => api.post('/location/toggle-development-mode', { enabled }),
  
  // Get employee routes for admin map
  getEmployeeRoutes: (filters) => api.get('/attendence/routes', { params: filters }),
  
  // Update attendance
  updateAttendance: (id, data) => api.put(`/attendence/${id}`, data),
  bulkUpdateAttendance: (data) => api.post('/attendence/bulk-update', data),
};

// Settings API removed - now using static configuration

export const reportAPI = {
  // Admin reports
  getAttendanceReport: (filters) => 
    api.get('/admin/reports/attendance', { params: filters }),
  getEmployeeReport: (filters) => 
    api.get('/admin/reports/employees', { params: filters }),
  getManagerReport: (filters) => 
    api.get('/admin/reports/managers', { params: filters }),
  
  // Manager reports
  getMyTeamReport: (filters) => 
    api.get('/manager/reports/team', { params: filters }),
  getMyAttendanceReport: (filters) => 
    api.get('/manager/reports/attendance', { params: filters }),
  
  // Export reports with WebView support
  exportCSV: (endpoint, filters) => 
    api.get(`${endpoint}/export/csv`, { 
      params: filters,
      responseType: 'blob'
    }).then(response => {
      // Check if in WebView and handle download appropriately
      if (window.ReactNativeWebView && window.downloadCSV) {
        const reader = new FileReader();
        reader.onload = () => {
          const base64Data = reader.result;
          const filename = `export_${new Date().toISOString().split('T')[0]}.csv`;
          window.downloadCSV(base64Data, filename);
        };
        reader.readAsDataURL(response.data);
        return { success: true, message: 'Download initiated in mobile app' };
      } else {
        // Fallback for regular browser
        const url = window.URL.createObjectURL(response.data);
        const link = document.createElement('a');
        link.href = url;
        link.download = `export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        return { success: true, message: 'Download completed' };
      }
    }),
  exportPDF: (endpoint, filters) => 
    api.get(`${endpoint}/export/pdf`, { 
      params: filters,
      responseType: 'blob'
    }).then(response => {
      // Check if in WebView and handle download appropriately
      if (window.ReactNativeWebView && window.downloadPDF) {
        const reader = new FileReader();
        reader.onload = () => {
          const base64Data = reader.result;
          const filename = `export_${new Date().toISOString().split('T')[0]}.pdf`;
          window.downloadPDF(base64Data, filename);
        };
        reader.readAsDataURL(response.data);
        return { success: true, message: 'Download initiated in mobile app' };
      } else {
        // Fallback for regular browser
        const url = window.URL.createObjectURL(response.data);
        const link = document.createElement('a');
        link.href = url;
        link.download = `export_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        return { success: true, message: 'Download completed' };
      }
    }),
  exportExcel: (endpoint, filters) => 
    api.get(`${endpoint}/export/excel`, { 
      params: filters,
      responseType: 'blob'
    }).then(response => {
      // Check if in WebView and handle download appropriately
      if (window.ReactNativeWebView && window.downloadExcel) {
        const reader = new FileReader();
        reader.onload = () => {
          const base64Data = reader.result;
          const filename = `export_${new Date().toISOString().split('T')[0]}.xlsx`;
          window.downloadExcel(base64Data, filename);
        };
        reader.readAsDataURL(response.data);
        return { success: true, message: 'Download initiated in mobile app' };
      } else {
        // Fallback for regular browser
        const url = window.URL.createObjectURL(response.data);
        const link = document.createElement('a');
        link.href = url;
        link.download = `export_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        return { success: true, message: 'Download completed' };
      }
    }),
};

export const uploadAPI = {
  uploadImage: (file, type = 'attendance') => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', type);
    
    return api.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export const dashboardAPI = {
  getDashboard: () => api.get('/dashboard'),
};

export const managerAPI = {
  // Admin endpoints for managing managers (using the correct endpoints from your API docs)
  getAllManagers: () => api.get('/manager/all'),
  getManagerById: (id) => api.get(`/manager/${id}`),
  createManager: (data) => api.post('/manager', data),
  updateManager: (id, data) => api.put(`/manager/${id}`, data),
  deleteManager: (id) => api.delete(`/manager/${id}`),
};

export const employeeAPI = {
  // Employee endpoints
  getEmployeeDashboard: () => {
    console.log('🌐 API Call: GET /employee/dashboard');
    return api.get('/employee/dashboard');
  },
  setEmployeePassword: (data) => api.post('/employee/set-password', data),
  updateEmployeeProfile: (data) => api.put('/employee/profile', data),
  changeEmployeePassword: (data) => api.put('/employee/change-password', data),
  
  // Admin/Manager endpoints for employee management
  getAllEmployees: () => {
    console.log('🌐 API Call: GET /employee/all');
    return api.get('/employee/all');
  },
  createEmployee: (data) => {
    console.log('🌐 API Call: POST /employee');
    return api.post('/employee', data);
  },
  updateEmployee: (id, data) => {
    console.log('🌐 API Call: PUT /employee/' + id);
    return api.put(`/employee/${id}`, data);
  },
  deleteEmployee: (id) => {
    console.log('🌐 API Call: DELETE /employee/' + id);
    return api.delete(`/employee/${id}`);
  },
};

export const locationAPI = {
  // Employee location tracking
  updateLocation: (data) => api.post('/location/update', data),
  markOffline: () => api.post('/location/offline'),
  
  // Admin/Manager monitoring
  getOnlineEmployees: () => api.get('/location/online'),
  getEmployeeLocationHistory: (employeeId, filters) => 
    api.get(`/location/history/${employeeId}`, { params: filters }),
  getGeoFenceStats: (filters) => api.get('/location/stats', { params: filters }),
  
  // Testing
  testGeoFencing: (data) => api.post('/location/test-geofencing', data),
};


export default api;
