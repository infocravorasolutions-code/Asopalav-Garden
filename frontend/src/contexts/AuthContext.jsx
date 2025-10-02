import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI, adminAPI, companyAPI } from '../services/api';
import { showSuccess, showError } from '../utils/toast';

// Initial state
const initialState = {
  user: null,
  company: null,
  isAuthenticated: false,
  loading: true,
  error: null
};

// Action types
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_COMPANY: 'SET_COMPANY',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
      return {
        ...state,
        loading: true,
        error: null
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        company: action.payload.company,
        isAuthenticated: true,
        loading: false,
        error: null
      };

    case AUTH_ACTIONS.LOGIN_FAILURE:
      return {
        ...state,
        user: null,
        company: null,
        isAuthenticated: false,
        loading: false,
        error: action.payload
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        company: null,
        isAuthenticated: false,
        loading: false,
        error: null
      };

    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };

    case AUTH_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false
      };

    case AUTH_ACTIONS.SET_COMPANY:
      return {
        ...state,
        company: action.payload
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };

    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for existing auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');
      const user = localStorage.getItem('user');
      const company = localStorage.getItem('company');

      if (token && user) {
        try {
          // Verify token with backend
          const userData = JSON.parse(user);
          const companyData = company ? JSON.parse(company) : null;

          dispatch({
            type: AUTH_ACTIONS.LOGIN_SUCCESS,
            payload: {
              user: userData,
              company: companyData
            }
          });
        } catch (error) {
          // Invalid stored data
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          localStorage.removeItem('company');
          dispatch({ type: AUTH_ACTIONS.LOGOUT });
        }
      } else {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (credentials) => {
    try {
      dispatch({ type: AUTH_ACTIONS.LOGIN_START });

      console.log('AuthContext - Login attempt with credentials:', credentials);

      const response = await authAPI.login(credentials);
      console.log('AuthContext - API response:', response);

      if (response.token) {
        const { userType } = credentials;
        let userData, companyData;

        // Handle different user types
        if (userType === 'admin') {
          const { admin, token, company } = response;
          userData = admin;
          companyData = company;
        } else if (userType === 'manager') {
          const { manager, token, company } = response;
          userData = manager;
          companyData = company;
        } else if (userType === 'employee') {
          const { employee, token, company } = response;
          userData = employee;
          companyData = company;
        }

        // If company is not provided in response, fetch it
        if (!companyData && userData.companyId) {
          try {
            const companyResponse = await companyAPI.getCompanyById(userData.companyId);
            if (companyResponse.data.success) {
              companyData = companyResponse.data.data;
            }
          } catch (error) {
            console.error('Error fetching company details:', error);
          }
        }

        // Store in localStorage with company data
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('userType', userType);
        if (companyData) {
          localStorage.setItem('company', JSON.stringify(companyData));
        }

        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: { user: userData, company: companyData }
        });

        console.log('AuthContext - Login successful:', { userData, companyData });
        showSuccess(`Welcome back, ${userData.name || userData.email}!`);
        return { success: true, data: response };
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      const errorMessage = error.message || 'Login failed. Please try again.';
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: errorMessage
      });
      showError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Logout function
  const logout = () => {
    authAPI.logout();
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('company');
    localStorage.removeItem('userType');
    dispatch({ type: AUTH_ACTIONS.LOGOUT });
    showSuccess('Logged out successfully');
  };

  // Get company details
  const getCompanyDetails = async () => {
    try {
      const response = await companyAPI.getCompanyDetails();
      dispatch({
        type: AUTH_ACTIONS.SET_COMPANY,
        payload: response.data
      });
      return response.data;
    } catch (error) {
      dispatch({
        type: AUTH_ACTIONS.SET_ERROR,
        payload: error.message || 'Failed to fetch company details'
      });
      throw error;
    }
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  // Set loading
  const setLoading = (loading) => {
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: loading });
  };

  const value = {
    ...state,
    login,
    logout,
    getCompanyDetails,
    clearError,
    setLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
