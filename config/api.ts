export const API_CONFIG = {
  BASE_URL: 'http://localhost:8007/api/admin',
  // BASE_URL: 'https://dash3.50g.io/api/admin',
  TIMEOUT: 10000, // 10 seconds
  ENDPOINTS: {
    LOGIN: '/login',
    LOGOUT: '/logout',
    ME: '/me',
  }
} as const;

export const getApiConfig = () => {
  // In production, you can use environment variables
  return {
    baseURL: process.env.NUXT_PUBLIC_API_BASE_URL || API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
  };
}; 