/**
 * api.js
 * Centralized API configuration and request handler.
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

/**
 * Generic request handler with centralized error and auth management.
 * @param {string} endpoint - API endpoint (e.g., '/surveys/')
 * @param {object} options - Fetch options (method, body, etc.)
 */
export const request = async (endpoint, options = {}) => {
    const token = localStorage.getItem('authToken');
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Token ${token}` } : {}),
        ...options.headers,
    };

    const config = {
        ...options,
        headers,
    };

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

        // 403 Forbidden: Token expired or invalid
        if (response.status === 403) {
            localStorage.removeItem('authToken');
            // Opsiyonel: Window reload yerine event dispatch edilebilir
            // window.location.href = '/login'; 
        }

        const data = await response.json();

        if (!response.ok) {
            throw { status: response.status, ...data };
        }

        return data;
    } catch (error) {
        throw error; // Re-throw for component to handle
    }
};

/**
 * Old helper kept for backward compatibility (Deprecated)
 */
export const getAuthHeaders = (token) => ({
    'Authorization': `Token ${token}`,
    'Content-Type': 'application/json'
});
