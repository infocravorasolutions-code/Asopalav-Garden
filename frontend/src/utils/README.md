# Fetch Interceptor Documentation

## Overview

The Fetch Interceptor is a centralized API call handler that provides consistent authentication, error handling, and request/response processing across the entire application.

## Features

- ✅ **Automatic Authentication**: Automatically adds auth tokens to requests
- ✅ **Centralized Error Handling**: Consistent error handling with toast notifications
- ✅ **Request/Response Logging**: Development-mode logging for debugging
- ✅ **Multiple HTTP Methods**: GET, POST, PUT, PATCH, DELETE, and file upload
- ✅ **Token Management**: Automatic token detection and management
- ✅ **Error Recovery**: Automatic logout on authentication failures
- ✅ **Type Safety**: Proper response structure handling

## Installation

```javascript
import { api, handleApiError, handleApiSuccess } from '../../utils/fetchInterceptor';
```

## Basic Usage

### GET Request
```javascript
const fetchEmployees = async () => {
  try {
    const response = await api.get('/employee/all');
    return response.data;
  } catch (error) {
    handleApiError(error, 'Failed to fetch employees');
  }
};
```

### POST Request
```javascript
const createEmployee = async (employeeData) => {
  try {
    const response = await api.post('/employee', employeeData);
    handleApiSuccess('Employee created successfully!');
    return response.data;
  } catch (error) {
    handleApiError(error, 'Failed to create employee');
  }
};
```

### DELETE Request
```javascript
const deleteEmployee = async (employeeId) => {
  try {
    await api.delete(`/employee/${employeeId}`);
    handleApiSuccess('Employee deleted successfully!');
  } catch (error) {
    handleApiError(error, 'Failed to delete employee');
  }
};
```

### File Upload
```javascript
const uploadFile = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.upload('/upload', formData);
    handleApiSuccess('File uploaded successfully!');
    return response.data;
  } catch (error) {
    handleApiError(error, 'Failed to upload file');
  }
};
```

## API Methods

### `api.get(endpoint, options)`
- **Purpose**: Make GET requests
- **Parameters**: 
  - `endpoint` (string): API endpoint
  - `options` (object): Additional fetch options
- **Returns**: Promise with response data

### `api.post(endpoint, data, options)`
- **Purpose**: Make POST requests
- **Parameters**:
  - `endpoint` (string): API endpoint
  - `data` (object): Request body data
  - `options` (object): Additional fetch options
- **Returns**: Promise with response data

### `api.put(endpoint, data, options)`
- **Purpose**: Make PUT requests
- **Parameters**: Same as POST
- **Returns**: Promise with response data

### `api.patch(endpoint, data, options)`
- **Purpose**: Make PATCH requests
- **Parameters**: Same as POST
- **Returns**: Promise with response data

### `api.delete(endpoint, options)`
- **Purpose**: Make DELETE requests
- **Parameters**:
  - `endpoint` (string): API endpoint
  - `options` (object): Additional fetch options
- **Returns**: Promise with response data

### `api.upload(endpoint, formData, options)`
- **Purpose**: Upload files
- **Parameters**:
  - `endpoint` (string): Upload endpoint
  - `formData` (FormData): File data
  - `options` (object): Additional fetch options
- **Returns**: Promise with response data

## Utility Functions

### `handleApiError(error, customMessage)`
- **Purpose**: Handle API errors with toast notifications
- **Parameters**:
  - `error` (Error): The error object
  - `customMessage` (string): Custom error message
- **Returns**: Error message string

### `handleApiSuccess(message)`
- **Purpose**: Show success toast notifications
- **Parameters**:
  - `message` (string): Success message
- **Returns**: Success message string

### `isAuthenticated()`
- **Purpose**: Check if user is authenticated
- **Returns**: Boolean indicating authentication status

### `getAuthToken()`
- **Purpose**: Get current authentication token
- **Returns**: Token string or null

### `clearAuth()`
- **Purpose**: Clear all authentication data
- **Returns**: void

## Configuration

### Environment Variables
The interceptor automatically detects the environment and uses appropriate API URLs:

- **Development**: `http://localhost:5678/api`
- **Production**: `https://api.neelkanthlandscape.info/api`

### Authentication
The interceptor automatically:
- Detects the appropriate token (`authToken` or `superadmin_token`)
- Adds the token to request headers
- Handles token expiration and logout

## Error Handling

### Automatic Error Handling
The interceptor automatically handles:
- **401 Unauthorized**: Automatic logout
- **403 Forbidden**: Access denied messages
- **404 Not Found**: Resource not found messages
- **500 Server Error**: Server error messages

### Custom Error Messages
```javascript
try {
  const response = await api.get('/endpoint');
} catch (error) {
  // Custom error message
  handleApiError(error, 'Custom error message');
}
```

## Development Features

### Request/Response Logging
In development mode, the interceptor logs:
- 🌐 API requests with method and URL
- ✅ Successful responses with data
- ❌ Errors with details

### Debug Information
```javascript
// Enable detailed logging in development
console.log('API Request:', requestDetails);
console.log('API Response:', responseData);
```

## Migration Guide

### From Old API Calls
```javascript
// ❌ Old way
const response = await fetch(`${api}/api/employee/all`, {
  headers: { 'Authorization': `Bearer ${token}` }
});

// ✅ New way
const response = await api.get('/employee/all');
```

### From Axios
```javascript
// ❌ Old axios way
const response = await axios.get('/employee/all');

// ✅ New fetch interceptor way
const response = await api.get('/employee/all');
```

## Best Practices

### 1. Always Use Error Handling
```javascript
try {
  const response = await api.get('/endpoint');
  // Handle success
} catch (error) {
  handleApiError(error, 'Custom error message');
}
```

### 2. Use Success Notifications
```javascript
try {
  await api.post('/endpoint', data);
  handleApiSuccess('Operation completed successfully!');
} catch (error) {
  handleApiError(error, 'Operation failed');
}
```

### 3. Check Authentication
```javascript
if (!isAuthenticated()) {
  handleApiError(new Error('Not authenticated'), 'Please login first');
  return;
}
```

### 4. Handle Loading States
```javascript
const [loading, setLoading] = useState(false);

const fetchData = async () => {
  setLoading(true);
  try {
    const response = await api.get('/endpoint');
    // Handle response
  } catch (error) {
    handleApiError(error, 'Failed to fetch data');
  } finally {
    setLoading(false);
  }
};
```

## Examples

See `fetchInterceptorExample.js` for comprehensive usage examples including:
- Basic CRUD operations
- File uploads
- Batch operations
- Error handling patterns
- React component integration
- Custom hooks
- Higher-order components

## Troubleshooting

### Common Issues

1. **Token Not Found**: Ensure user is logged in and token exists in localStorage
2. **CORS Errors**: Check API server CORS configuration
3. **Network Errors**: Check API server availability
4. **Authentication Errors**: Verify token validity and expiration

### Debug Mode
Enable debug logging by checking the browser console for:
- Request details
- Response data
- Error information

## Support

For issues or questions:
1. Check the browser console for error details
2. Verify API endpoint availability
3. Check authentication status
4. Review error messages in toast notifications
