// API endpoints configuration

// Base URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/v1';

// Auth endpoints
export const AUTH_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/auth/login`,
  REGISTER: `${API_BASE_URL}/auth/register`,
  REFRESH: `${API_BASE_URL}/auth/refresh`,
  LOGOUT: `${API_BASE_URL}/auth/logout`,
  PROFILE: `${API_BASE_URL}/auth/profile`
};

// Other endpoints can be added here
export const USER_ENDPOINTS = {
  GET_PROFILE: `${API_BASE_URL}/user/profile`,
  UPDATE_PROFILE: `${API_BASE_URL}/user/profile`
};

export const STORE_ENDPOINTS = {
  GET_ALL_STORES: `${API_BASE_URL}/store`,
  CREATE_STORE: `${API_BASE_URL}/store`,
  UPDATE_STORE: (id) => `${API_BASE_URL}/store/${id}`,
  DELETE_STORE: (id) => `${API_BASE_URL}/store/${id}`,
  GET_STORE_BY_ID: (id) => `${API_BASE_URL}/store/${id}`
};

// Export base URL for direct use if needed
export { API_BASE_URL };