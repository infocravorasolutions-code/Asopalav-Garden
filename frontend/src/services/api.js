import axios from 'axios';
import config from '../config/environment.js';
import { handleApiError } from '../utils/toast.js';

// API Base Configuration
const API_BASE_URL = config.api.baseURL;

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
          endpoint = '/api/admin/login';
          break;
        case 'manager':
          endpoint = '/api/manager/login';
          break;
        case 'employee':
          endpoint = '/api/employee/login';
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
      const response = await api.post('/api/auth/forgot-password', {
        email,
        userType
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Reset password
  resetPassword: async (token, newPassword, userType) => {
    try {
      const response = await api.post('/api/auth/reset-password', {
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
      const response = await api.get('/api/auth/verify-reset-token', {
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
      const response = await api.post('/api/auth/verify-otp', data);
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
      const response = await api.get('/api/admin/profile');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get company details
  getCompany: async () => {
    try {
      const response = await api.get('/api/admin/company');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get dashboard data
  getDashboard: async () => {
    try {
      const response = await api.get('/api/admin/dashboard');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get all employees
  getEmployees: async (params = {}) => {
    try {
      const response = await api.get('/api/employee/all', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get all managers
  getManagers: async (params = {}) => {
    try {
      const response = await api.get('/api/manager/all', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get attendance data
  getAttendance: async (params = {}) => {
    try {
      const response = await api.get('/api/admin/attendance', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get muster roll report
  getMusterRollReport: async (params = '') => {
    try {
      const response = await api.get(`/api/employee/muster-roll?${params}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get attendance summary
  getAttendanceSummary: async () => {
    try {
      const response = await api.get('/api/admin/attendance/summary');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update attendance record
  updateAttendance: async (attendanceId, data) => {
    try {
      const response = await api.put(`/api/admin/attendance/${attendanceId}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete attendance record
  deleteAttendance: async (attendanceId) => {
    try {
      const response = await api.delete(`/api/admin/attendance/${attendanceId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get managers for filter dropdown
  getManagers: async () => {
    try {
      const response = await api.get('/api/manager');
      return { managers: response.data.data || [] };
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get employees for filter dropdown
  getEmployees: async () => {
    try {
      const response = await api.get('/api/employee');
      return { employees: response.data.data || [] };
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Step in (employee clock in)
  stepIn: async (data) => {
    try {
      const response = await api.post('/api/attendence/step-in', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Step out (employee clock out)
  stepOut: async (data) => {
    try {
      const response = await api.post('/api/attendence/step-out', data);
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
      const response = await api.get('/api/company');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update company details
  updateCompany: async (data) => {
    try {
      const response = await api.put('/api/company', data);
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
      const response = await api.post('/api/export/attendance/excel', data, {
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
      const response = await api.post('/api/export/attendance/pdf', data, {
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
      const response = await api.post('/api/export/employees/excel', data, {
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
      const response = await api.post('/api/export/attendance/summary', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export const attendanceAPI = {
  stepIn: (data) => api.post('/api/attendence/step-in', data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  stepOut: (data) => api.post('/api/attendence/step-out', data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  getEmployeeAttendance: (employeeId) => api.get(`/api/attendence/employee/${employeeId}`),
}

export default api;
