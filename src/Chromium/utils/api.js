/**
 * API Utilities Module
 * Handles API requests with CSRF token and error handling
 */

import { prepareHeaders } from './csrf.js';

/**
 * Makes an authenticated API request with CSRF token
 * @param {string} url - API endpoint URL
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} API response data
 * @throws {Error} If request fails or response is invalid
 */
export async function makeRequest(url, options = {}) {
    try {
        // Prepare headers with CSRF token
        const headers = await prepareHeaders({
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Cache-Control': 'no-cache',
            ...(options.headers || {})
        });

        // Make the request
        const response = await fetch(url, {
            ...options,
            credentials: 'include',
            headers
        });

        // Handle redirects (usually for authentication)
        if (response.redirected) {
            console.error('API request redirected - user likely needs to log in');
            throw new Error('Authentication required');
        }

        // Get response text first for better error handling
        const responseText = await response.text();
        
        // Try to parse as JSON
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            console.error('Failed to parse API response:', responseText);
            throw new Error('Invalid JSON response from API');
        }

        // Check for API-level success
        if (!response.ok) {
            throw new Error(data.message || 'API request failed');
        }

        return data;
    } catch (error) {
        console.error('API request failed:', error);
        throw error;
    }
} 