// Environment configuration
const ENV = {
  // API Configuration
  API_URL: process.env.REACT_APP_API_URL || 'http://192.168.1.6:5000/api',
  
  // Environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Debug mode
  DEBUG: process.env.REACT_APP_DEBUG === 'true',
  
  // Feature flags
  FEATURES: {
    RECOMMENDATIONS: true,
    OFFLINE_MODE: false,
  },
  
  // API Timeouts (in milliseconds)
  TIMEOUTS: {
    API_REQUEST: 30000, // 30 seconds
    API_RETRY: 3, // Number of retry attempts
  },
};

// Validate required environment variables
const validateEnvironment = () => {
  if (!ENV.API_URL) {
    console.warn('API_URL is not set. Using default value.');
  }
};

// Run validation in development
if (__DEV__) {
  validateEnvironment();
}

export default ENV;
