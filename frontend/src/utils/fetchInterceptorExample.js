/**
 * Fetch Interceptor Usage Examples
 * 
 * This file demonstrates how to use the fetch interceptor in different scenarios
 */

import { api, handleApiError, handleApiSuccess, isAuthenticated, clearAuth } from './fetchInterceptor';

// Example 1: Basic GET request
export const fetchUserData = async (userId) => {
    try {
        const response = await api.get(`/user/${userId}`);
        return response.data;
    } catch (error) {
        handleApiError(error, 'Failed to fetch user data');
        throw error;
    }
};

// Example 2: POST request with data
export const createUser = async (userData) => {
    try {
        const response = await api.post('/user', userData);
        handleApiSuccess('User created successfully!');
        return response.data;
    } catch (error) {
        handleApiError(error, 'Failed to create user');
        throw error;
    }
};

// Example 3: PUT request for updates
export const updateUser = async (userId, userData) => {
    try {
        const response = await api.put(`/user/${userId}`, userData);
        handleApiSuccess('User updated successfully!');
        return response.data;
    } catch (error) {
        handleApiError(error, 'Failed to update user');
        throw error;
    }
};

// Example 4: DELETE request
export const deleteUser = async (userId) => {
    try {
        await api.delete(`/user/${userId}`);
        handleApiSuccess('User deleted successfully!');
    } catch (error) {
        handleApiError(error, 'Failed to delete user');
        throw error;
    }
};

// Example 5: File upload
export const uploadFile = async (file, endpoint = '/upload') => {
    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.upload(endpoint, formData);
        handleApiSuccess('File uploaded successfully!');
        return response.data;
    } catch (error) {
        handleApiError(error, 'Failed to upload file');
        throw error;
    }
};

// Example 6: Authentication check
export const checkAuthAndFetch = async (endpoint) => {
    if (!isAuthenticated()) {
        handleApiError(new Error('Not authenticated'), 'Please login first');
        return null;
    }

    try {
        const response = await api.get(endpoint);
        return response.data;
    } catch (error) {
        handleApiError(error, 'Failed to fetch data');
        throw error;
    }
};

// Example 7: Batch operations
export const batchDeleteUsers = async (userIds) => {
    try {
        const deletePromises = userIds.map(id => api.delete(`/user/${id}`));
        await Promise.all(deletePromises);
        handleApiSuccess(`${userIds.length} users deleted successfully!`);
    } catch (error) {
        handleApiError(error, 'Failed to delete users');
        throw error;
    }
};

// Example 8: Conditional API calls
export const fetchDataWithRetry = async (endpoint, maxRetries = 3) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await api.get(endpoint);
            return response.data;
        } catch (error) {
            if (attempt === maxRetries) {
                handleApiError(error, `Failed to fetch data after ${maxRetries} attempts`);
                throw error;
            }
            console.log(`Attempt ${attempt} failed, retrying...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
    }
};

// Example 9: Custom headers
export const fetchWithCustomHeaders = async (endpoint, customHeaders = {}) => {
    try {
        const response = await api.get(endpoint, {
            headers: {
                'X-Custom-Header': 'custom-value',
                ...customHeaders
            }
        });
        return response.data;
    } catch (error) {
        handleApiError(error, 'Failed to fetch data with custom headers');
        throw error;
    }
};

// Example 10: Logout and clear auth
export const logout = () => {
    clearAuth();
    handleApiSuccess('Logged out successfully');
    window.location.href = '/login';
};

// Example 11: React component usage
export const useApiCall = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);

    const executeApiCall = async (apiFunction, ...args) => {
        setLoading(true);
        setError(null);

        try {
            const result = await apiFunction(...args);
            setData(result);
            return result;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return { loading, error, data, executeApiCall };
};

// Example 12: Error boundary integration
export const withApiErrorHandling = (Component) => {
    return (props) => {
        const handleApiError = (error, customMessage) => {
            // Log error for debugging
            console.error('API Error in component:', error);

            // Show user-friendly error message
            handleApiError(error, customMessage);

            // You can also dispatch to a global error store here
            // dispatch(setGlobalError(error));
        };

        return <Component {...props} onApiError={handleApiError} />;
    };
};

export default {
    fetchUserData,
    createUser,
    updateUser,
    deleteUser,
    uploadFile,
    checkAuthAndFetch,
    batchDeleteUsers,
    fetchDataWithRetry,
    fetchWithCustomHeaders,
    logout,
    useApiCall,
    withApiErrorHandling
};
