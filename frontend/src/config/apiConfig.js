// Centralized API configuration for the entire application
// Change IS_DEVELOPMENT to switch between development and production environments

const IS_DEVELOPMENT = true; // Change to true for development, false for production

const getApiUrl = () => {
  if (IS_DEVELOPMENT) {
    return "http://localhost:5678/api";
  } else {
    return "https://api.panthersecure.co.in/api";
  }
};

const getServerUrl = () => {
  if (IS_DEVELOPMENT) {
    return "http://localhost:5678";
  } else {
    return "https://api.panthersecure.co.in";
  }
};

const getImageUrl = () => {
  if (IS_DEVELOPMENT) {
    return "http://localhost:5678/static";
  } else {
    return "https://api.panthersecure.co.in/static";
  }
};

const getSocketUrl = () => {
  if (IS_DEVELOPMENT) {
    return "http://localhost:5678";
  } else {
    return "https://api.panthersecure.co.in";
  }
};

// Log the configuration for debugging
console.log('🔧 API Configuration:', {
  mode: IS_DEVELOPMENT ? 'DEVELOPMENT' : 'PRODUCTION',
  API_URL: getApiUrl(),
  SERVER_URL: getServerUrl(),
  IMAGE_URL: getImageUrl(),
  SOCKET_URL: getSocketUrl()
});

export {
  IS_DEVELOPMENT,
  getApiUrl,
  getServerUrl,
  getImageUrl,
  getSocketUrl
};
