import toast from 'react-hot-toast';

// Success toast
export const showSuccess = (message, options = {}) => {
    return toast.success(message, {
        duration: 3000,
        position: 'top-right',
        ...options
    });
};

// Error toast
export const showError = (message, options = {}) => {
    return toast.error(message, {
        duration: 5000,
        position: 'top-right',
        ...options
    });
};

// Warning toast
export const showWarning = (message, options = {}) => {
    return toast(message, {
        duration: 4000,
        position: 'top-right',
        icon: '⚠️',
        style: {
            background: '#f59e0b',
            color: '#fff',
        },
        ...options
    });
};

// Info toast
export const showInfo = (message, options = {}) => {
    return toast(message, {
        duration: 4000,
        position: 'top-right',
        icon: 'ℹ️',
        style: {
            background: '#3b82f6',
            color: '#fff',
        },
        ...options
    });
};

// Loading toast
export const showLoading = (message, options = {}) => {
    return toast.loading(message, {
        position: 'top-right',
        ...options
    });
};

// Promise toast
export const showPromise = (promise, messages, options = {}) => {
    return toast.promise(promise, messages, {
        position: 'top-right',
        ...options
    });
};

// Custom toast
export const showCustom = (message, options = {}) => {
    return toast(message, {
        position: 'top-right',
        ...options
    });
};

// Dismiss toast
export const dismissToast = (toastId) => {
    return toast.dismiss(toastId);
};

// Dismiss all toasts
export const dismissAll = () => {
    return toast.dismiss();
};

// API error handler
export const handleApiError = (error, context = {}) => {
    console.error('API Error:', error);

    let message = 'An error occurred';

    if (error.response?.data?.message) {
        message = error.response.data.message;
    } else if (error.message) {
        message = error.message;
    } else if (error.response?.status) {
        message = `Server error (${error.response.status})`;
    }

    showError(message);
    return message;
};

// Application error handler
export const handleAppError = (error, context = {}) => {
    console.error('Application Error:', error);

    const message = error.message || 'An application error occurred';
    showError(message);
    return message;
};

// Network error handler
export const handleNetworkError = (error, context = {}) => {
    console.error('Network Error:', error);

    const message = 'Network connection error. Please check your internet connection.';
    showError(message);
    return message;
};

// Authentication error handler
export const handleAuthError = (error, context = {}) => {
    console.error('Authentication Error:', error);

    const message = 'Authentication failed. Please login again.';
    showError(message);
    return message;
};

// Validation error handler
export const handleValidationError = (error, context = {}) => {
    console.error('Validation Error:', error);

    const message = error.message || 'Please check your input and try again.';
    showError(message);
    return message;
};

// Success handlers
export const handleSuccess = (message, context = {}) => {
    showSuccess(message);
    return message;
};

// Warning handlers
export const handleWarning = (message, context = {}) => {
    showWarning(message);
    return message;
};

// Info handlers
export const handleInfo = (message, context = {}) => {
    showInfo(message);
    return message;
};

export default {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading,
    showPromise,
    showCustom,
    dismissToast,
    dismissAll,
    handleApiError,
    handleAppError,
    handleNetworkError,
    handleAuthError,
    handleValidationError,
    handleSuccess,
    handleWarning,
    handleInfo,
};


