/**
 * API Client Configuration
 *
 * Axios instance configured for communication with the Angry Birdman API.
 * Includes request/response interceptors for authentication and error handling.
 */

import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

// API base URL from environment or default to development API
const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3001';

/**
 * Configured Axios instance for API requests
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

/**
 * Request interceptor to add authentication token
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from auth context (will be set by AuthProvider)
    const token = localStorage.getItem('access_token');

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor for error handling
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle common error scenarios
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;

      switch (status) {
        case 401:
          // Unauthorized - clear auth state and redirect to login
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.dispatchEvent(new CustomEvent('auth:logout'));
          break;

        case 403:
          // Forbidden - user doesn't have permission
          console.error('Access forbidden:', error.response.data);
          break;

        case 404:
          // Not found
          console.error('Resource not found:', error.config?.url);
          break;

        case 500:
        case 502:
        case 503:
          // Server errors
          console.error('Server error:', error.response.data);
          break;

        default:
          console.error('API error:', error.response.data);
      }
    } else if (error.request) {
      // Request made but no response received
      console.error('Network error: No response from server');
    } else {
      // Error in request setup
      console.error('Request error:', error.message);
    }

    // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
    return Promise.reject(error);
  }
);

/**
 * Type-safe API error response
 */
export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
  details?: unknown;
  timestamp: string;
  path: string;
}

/**
 * Extract API error message from error response
 */
export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const apiError = error.response?.data as ApiError | undefined;
    return apiError?.message || error.message || 'An unexpected error occurred';
  }
  return 'An unexpected error occurred';
}
