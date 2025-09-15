import { AUTH_ENDPOINTS } from '../const/endpoints';
import { isTokenExpired, clearAuthData } from './tokenUtils';

// API client with automatic token refresh
class ApiClient {
  constructor() {
    this.isRefreshing = false;
    this.failedQueue = [];
  }

  processQueue(error, token = null) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });
    
    this.failedQueue = [];
  }

  async refreshToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch(AUTH_ENDPOINTS.REFRESH, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      
      // Update localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('refreshToken', data.refreshToken);
      
      return data.token;
    } catch (error) {
      // Clear all auth data on refresh failure
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      // Redirect to login
      window.location.href = '/login';
      throw error;
    }
  }

  async request(url, options = {}) {
    let token = localStorage.getItem('token');
    
    // Check if token is expired before making request
    if (token && isTokenExpired(token)) {
      try {
        token = await this.refreshToken();
      } catch (error) {
        // If refresh fails, clear auth data and redirect
        clearAuthData();
        window.location.href = '/login';
        throw error;
      }
    }
    
    // Add authorization header if token exists
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      
      // If token is invalid, try to refresh
      if (response.status === 401 && token) {
        if (this.isRefreshing) {
          // If already refreshing, queue this request
          return new Promise((resolve, reject) => {
            this.failedQueue.push({ resolve, reject });
          }).then(() => {
            // Retry with new token
            const newToken = localStorage.getItem('token');
            return fetch(url, {
              ...config,
              headers: {
                ...config.headers,
                Authorization: `Bearer ${newToken}`,
              },
            });
          });
        }

        this.isRefreshing = true;

        try {
          const newToken = await this.refreshToken();
          this.processQueue(null, newToken);
          
          // Retry original request with new token
          return fetch(url, {
            ...config,
            headers: {
              ...config.headers,
              Authorization: `Bearer ${newToken}`,
            },
          });
        } catch (refreshError) {
          this.processQueue(refreshError, null);
          throw refreshError;
        } finally {
          this.isRefreshing = false;
        }
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Convenience methods
  async get(url, options = {}) {
    return this.request(url, { ...options, method: 'GET' });
  }

  async post(url, data, options = {}) {
    return this.request(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put(url, data, options = {}) {
    return this.request(url, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(url, options = {}) {
    return this.request(url, { ...options, method: 'DELETE' });
  }
}

// Create singleton instance
const apiClient = new ApiClient();

export default apiClient;