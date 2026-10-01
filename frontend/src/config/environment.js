
const IS_DEVELOPMENT = false; // Change to true for development, false for production

const getApiUrl = () => {
  
  if (IS_DEVELOPMENT) {
    const localUrl = "http://localhost:5678/api";
    console.log('🔧 [Environment] Using LOCAL backend:', localUrl);
    return localUrl;
  } else {
    const prodUrl = "https://api.neelkanthlandscape.info/api";
    console.log('🔧 [Environment] Using PRODUCTION backend:', prodUrl);
    return prodUrl;
  }
};


// Environment Configuration
const config = {
  // API Configuration

  api: {
    baseURL: getApiUrl(),
    timeout: 30000,
  },

  // App Configuration
  app: {
    name: import.meta.env.VITE_APP_NAME || 'Mahakali Farm & Nursery',
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
