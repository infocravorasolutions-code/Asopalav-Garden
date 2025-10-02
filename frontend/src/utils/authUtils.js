// Authentication utility functions

export const clearAuthData = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('company');
    localStorage.removeItem('userType');
    console.log('Authentication data cleared');
};

export const isAuthenticated = () => {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');
    return !!(token && user);
};

export const getUserType = () => {
    return localStorage.getItem('userType') || 'admin';
};

export const getCurrentUser = () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
};

export const getCurrentCompany = () => {
    const company = localStorage.getItem('company');
    return company ? JSON.parse(company) : null;
};

export const logout = () => {
    clearAuthData();
    window.location.href = '/login';
};

export default {
    clearAuthData,
    isAuthenticated,
    getUserType,
    getCurrentUser,
    getCurrentCompany,
    logout
};


