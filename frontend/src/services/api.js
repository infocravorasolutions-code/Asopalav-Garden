import axios from 'axios';
import { config } from '../config/environment.js';
import { handleApiError } from '../utils/toast.js';
import { getApiUrl } from '../config/environment.js';


// API Base Configuration
const API_BASE_URL = getApiUrl()

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: config.api.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});


// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    // Show error toast for client-side errors
    if (error.response?.status >= 400 && error.response?.status < 500) {
      handleApiError(error);
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  // Universal login - handles admin, manager, and employee
  login: async (credentials) => {
    try {
      const { userType, ...loginData } = credentials;

      console.log('API Login - User Type:', userType);
      console.log('API Login - Login Data:', loginData);

      let endpoint = '';
      switch (userType) {
        case 'admin':
          endpoint = '/admin/login';
          break;
        case 'manager':
          endpoint = '/manager/login';
          break;
        case 'employee':
          endpoint = '/employee/login';
          break;
        default:
          throw new Error('Invalid user type');
      }

      console.log('API Login - Endpoint:', endpoint);
      console.log('API Login - Full URL:', `${API_BASE_URL}${endpoint}`);
      console.log('API Login - Request data:', loginData);

      const response = await api.post(endpoint, loginData);
      console.log('API Login - Response:', response.data);
      console.log('API Login - Response status:', response.status);
      console.log('API Login - Response headers:', response.headers);
      return response.data;
    } catch (error) {
      console.error('API Login - Error:', error);
      throw error.response?.data || error.message;
    }
  },

  // Forgot password
  forgotPassword: async (email, userType) => {
    try {
      const response = await api.post('/auth/forgot-password', {
        email,
        userType
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get shift-wise data for admin dashboard
  getShiftWiseData: async () => {
    try {
      console.log('API - Fetching shift-wise data...');
      const response = await api.get('/admin/shift-wise-data');
      console.log('API - Shift-wise data response:', response);
      return response.data;
    } catch (error) {
      console.error('API - Error fetching shift-wise data:', error);
      throw error.response?.data || error.message;
    }
  },

  // Reset password
  resetPassword: async (token, newPassword, userType) => {
    try {
      const response = await api.post('/auth/reset-password', {
        token,
        newPassword,
        userType
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Verify reset token
  verifyResetToken: async (token, userType) => {
    try {
      const response = await api.get('/auth/verify-reset-token', {
        params: { token, userType }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Verify OTP and reset password (legacy)
  verifyOTP: async (data) => {
    try {
      const response = await api.post('/auth/verify-otp', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Logout
  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }
};

// Admin API
export const adminAPI = {
  // Get admin profile
  getProfile: async () => {
    try {
      const response = await api.get('/admin/profile');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get company details
  getCompany: async () => {
    try {
      const response = await api.get('/admin/company');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get dashboard data
  getDashboard: async () => {
    try {
      const response = await api.get('/admin/dashboard');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get all employees
  getEmployees: async (params = {}) => {
    try {
      const response = await api.get('/employee/all', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get all managers
  getManagers: async (params = {}) => {
    try {
      const response = await api.get('/manager/all', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get attendance data
  getAttendance: async (params = {}) => {
    try {
      const response = await api.get('/admin/attendance', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get muster roll report
  getMusterRollReport: async (params = '') => {
    try {
      const response = await api.get(`/employee/muster-roll?${params}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get attendance summary
  getAttendanceSummary: async () => {
    try {
      const response = await api.get('/admin/attendance/summary');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update attendance record
  updateAttendance: async (attendanceId, data) => {
    try {
      const response = await api.put(`/admin/attendance/${attendanceId}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete attendance record
  deleteAttendance: async (attendanceId) => {
    try {
      const response = await api.delete(`/admin/attendance/${attendanceId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get managers for filter dropdown
  getManagers: async () => {
    try {
      const response = await api.get('/manager');
      return { managers: response.data.data || [] };
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get employees for filter dropdown
  getEmployees: async () => {
    try {
      const response = await api.get('/employee');
      return { employees: response.data.data || [] };
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Step in (employee clock in)
  stepIn: async (data) => {
    try {
      const response = await api.post('/attendence/step-in', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Step out (employee clock out)
  stepOut: async (data) => {
    try {
      const response = await api.post('/attendence/step-out', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get all sites
  getSites: async (params = {}) => {
    try {
      const response = await api.get('/sites', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get site by ID
  getSiteById: async (siteId) => {
    try {
      const response = await api.get(`/sites/${siteId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

// Company API
export const companyAPI = {
  // Get company details
  getCompanyDetails: async () => {
    try {
      const response = await api.get('/company');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update company details
  updateCompany: async (data) => {
    try {
      const response = await api.put('/company', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

// Export API
export const exportAPI = {
  // Export attendance to Excel
  exportAttendanceToExcel: async (data) => {
    try {
      const response = await api.post('/export/attendance/excel', data, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance_report_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Export attendance to PDF
  exportAttendanceToPDF: async (data) => {
    try {
      const response = await api.post('/export/attendance/pdf', data, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance_report_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Export employees to Excel
  exportEmployeesToExcel: async (data) => {
    try {
      const response = await api.post('/export/employees/excel', data, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `employees_list_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get attendance summary
  getAttendanceSummary: async (data) => {
    try {
      const response = await api.post('/export/attendance/summary', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export const attendanceAPI = {
  stepIn: (data) => api.post('/attendence/step-in', data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  stepOut: (data) => api.post('/attendence/step-out', data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  getEmployeeAttendance: (employeeId, params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);

    const queryString = queryParams.toString();
    const url = `/attendence/employee/${employeeId}${queryString ? `?${queryString}` : ''}`;
    return api.get(url);
  },
}

// Site Point Management API
export const sitePointAPI = {
  createSitePoint: (siteId, pointData) => {
    return api.post(`/sites/${siteId}/points`, pointData);
  },
  updateSitePoint: (siteId, pointId, pointData) => {
    return api.put(`/sites/${siteId}/points/${pointId}`, pointData);
  },
  deleteSitePoint: (siteId, pointId) => {
    return api.delete(`/sites/${siteId}/points/${pointId}`);
  },
}

export default api;
