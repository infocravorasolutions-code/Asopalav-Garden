/**
 * Fetch Interceptor - Centralized API call handler
 * Provides consistent authentication, error handling, and request/response processing
 */

import toast from 'react-hot-toast';

// API Configuration
const API_BASE_URL = 'https://api.neelkanthlandscape.info/api';
// const API_BASE_URL = 'http://localhost:5678/api';
// Request interceptor to add auth token and common headers
const addAuthHeaders = (url, options = {}) => {
    const token = localStorage.getItem('authToken');
    const superAdminToken = localStorage.getItem('superadmin_token');

    // Determine which token to use based on the endpoint
    const authToken = url.includes('/superadmin/') ? superAdminToken : token;

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
    }

    return {
        ...options,
        headers,
    };
};

// Response interceptor to handle common responses and errors
const handleResponse = async (response) => {
    // Handle different response types
    if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

        try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
            // If response is not JSON, use status text
        }

        // Handle specific status codes
        switch (response.status) {
            case 401:
                // Token expired or invalid
                localStorage.removeItem('authToken');
                localStorage.removeItem('superadmin_token');
                localStorage.removeItem('user');
                window.location.href = '/login';
                throw new Error('Authentication failed. Please login again.');

            case 403:
                throw new Error('Access denied. You do not have permission to perform this action.');

            case 404:
                throw new Error('Resource not found.');

            case 500:
                throw new Error('Server error. Please try again later.');

            default:
                throw new Error(errorMessage);
        }
    }

    // Handle successful responses
    try {
        const data = await response.json();
        return data;
    } catch {
        // If response is not JSON, return the response object
        return response;
    }
};

// Main fetch interceptor function
export const fetchInterceptor = async (endpoint, options = {}) => {
    try {
        // Construct full URL
        const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

        // Add authentication headers
        const requestOptions = addAuthHeaders(url, options);

        // Log request in development
        if (import.meta.env.MODE === 'development') {
            console.log(`🌐 API Request: ${requestOptions.method || 'GET'} ${url}`);
        }

        // Make the request
        const response = await fetch(url, requestOptions);

        // Handle response
        const data = await handleResponse(response);

        // Log response in development
        if (import.meta.env.MODE === 'development') {
            console.log(`✅ API Response: ${url}`, data);
        }

        return data;
    } catch (error) {
        // Log error in development
        if (import.meta.env.MODE === 'development') {
            console.error(`❌ API Error: ${endpoint}`, error);
        }

        // Re-throw the error for component handling
        throw error;
    }
};

// Convenience methods for different HTTP methods
export const api = {
    // GET request
    get: (endpoint, options = {}) =>
        fetchInterceptor(endpoint, { ...options, method: 'GET' }),

    // POST request
    post: (endpoint, data, options = {}) =>
        fetchInterceptor(endpoint, {
            ...options,
            method: 'POST',
            body: JSON.stringify(data),
        }),

    // PUT request
    put: (endpoint, data, options = {}) =>
        fetchInterceptor(endpoint, {
            ...options,
            method: 'PUT',
            body: JSON.stringify(data),
        }),

    // PATCH request
    patch: (endpoint, data, options = {}) =>
        fetchInterceptor(endpoint, {
            ...options,
            method: 'PATCH',
            body: JSON.stringify(data),
        }),

    // DELETE request
    delete: (endpoint, options = {}) =>
        fetchInterceptor(endpoint, { ...options, method: 'DELETE' }),

    // Upload file request
    upload: (endpoint, formData, options = {}) =>
        fetchInterceptor(endpoint, {
            ...options,
            method: 'POST',
            body: formData,
            headers: {
                // Don't set Content-Type for FormData, let browser set it with boundary
                ...(options.headers || {}),
            },
        }),
};

// Error handler with toast notifications
export const handleApiError = (error, customMessage = null) => {
    const message = customMessage || error.message || 'An unexpected error occurred';

    // Show toast notification
    toast.error(message);

    // Log error for debugging
    console.error('API Error:', error);

    return message;
};

// Success handler with toast notifications
export const handleApiSuccess = (message = 'Operation completed successfully') => {
    toast.success(message);
    return message;
};

// Utility function to check if user is authenticated
export const isAuthenticated = () => {
    const token = localStorage.getItem('authToken');
    const superAdminToken = localStorage.getItem('superadmin_token');
    return !!(token || superAdminToken);
};

// Utility function to get current user token
export const getAuthToken = () => {
    return localStorage.getItem('authToken') || localStorage.getItem('superadmin_token');
};

// Utility function to clear authentication
export const clearAuth = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('superadmin_token');
    localStorage.removeItem('user');
    localStorage.removeItem('userInfo');
    localStorage.removeItem('company');
};

export default fetchInterceptor;
