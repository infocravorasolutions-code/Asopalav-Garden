
const IS_DEVELOPMENT = false; // Change to true for development, false for production

const getApiUrl = () => {
  if (IS_DEVELOPMENT) {
    return "http://localhost:5678/api";
  } else {
    return "https://api.neelkanthlandscape.info/api";
  }
};


// Environment Configuration
const config = {
  // API Configuration

  api: {
    baseURL: import.meta.env.VITE_API_URL || getApiUrl(),
    timeout: 10000,
  },

  // App Configuration
  app: {
    name: import.meta.env.VITE_APP_NAME || 'Labor Management System',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    environment: import.meta.env.MODE || 'development',
  },

  // Feature Flags
  features: {
    enableDebugMode: import.meta.env.MODE === 'development',
    enableErrorBoundary: true,
    enableThemeSystem: true,
  },

  // Development Configuration
  development: {
    enableConsoleLogs: import.meta.env.MODE === 'development',
    enableErrorDetails: import.meta.env.MODE === 'development',
  }
};

// Debug configuration in development
if (config.development.enableConsoleLogs) {
  console.log('🔧 Environment Configuration:', {
    api: config.api,
    app: config.app,
    features: config.features,
    mode: import.meta.env.MODE
  });
}

export { config, getApiUrl };
