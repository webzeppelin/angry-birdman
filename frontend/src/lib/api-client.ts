/**
 * API Client Configuration - Token Proxy Pattern
 *
 * Axios instance configured for communication with the Angry Birdman API.
 * Uses httpOnly cookies for authentication (set by backend token proxy).
 * Includes request/response interceptors for error handling.
 */

import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

// API base URL from environment or default to development API
const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3001';

/**
 * Configured Axios instance for API requests
 *
 * Authentication is handled via httpOnly cookies automatically included with requests.
 * No need to manually add Authorization headers.
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
  withCredentials: true, // Include cookies in cross-origin requests
});

/**
 * Request interceptor for logging and custom modifications
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Cookies are automatically included with withCredentials: true
    // No need to manually add Authorization header

    // Log requests in development (disabled for production)
    // eslint-disable-next-line no-console
    if (import.meta.env.DEV) console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);

    return config;
  },

  (error) => {
    return Promise.reject(error instanceof Error ? error : new Error(String(error)));
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
          // Unauthorized - session expired or invalid
          // Dispatch logout event to clear frontend state
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
