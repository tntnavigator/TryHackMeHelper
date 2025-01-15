/**
 * API Utilities Module
 * Provides centralized API request handling with CSRF protection and error management
 * Safari-compatible implementation
 * 
 * Features:
 * - Automatic CSRF token inclusion
 * - Consistent error handling
 * - Response validation and parsing
 * - Authentication state management
 */

import { prepareHeaders } from './csrf.js';

/**
 * Makes an authenticated API request with CSRF token
 * Handles common API interaction patterns and error cases
 * 
 * @param {string} url - API endpoint URL
 * @param {Object} options - Fetch options
 * @param {string} [options.method] - HTTP method (GET, POST, etc.)
 * @param {Object} [options.headers] - Additional headers to include
 * @param {string} [options.body] - Request body (will be stringified if object)
 * @returns {Promise<Object>} API response data
 * @throws {Error} If request fails, auth is required, or response is invalid
 * 
 * Example:
 * ```js
 * const result = await makeRequest(API.SOME_ENDPOINT, {
 *   method: 'POST',
 *   body: JSON.stringify({ id: 'some-id' })
 * });
 * ```
 */
export async function makeRequest(url, options = {}) {
    try {
        // Prepare headers with CSRF token and defaults
        const headers = await prepareHeaders({
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Cache-Control': 'no-cache',
            ...(options.headers || {})
        });

        // Make the authenticated request
        const response = await fetch(url, {
            ...options,
            credentials: 'include', // Required for auth cookies
            headers
        });

        // Handle authentication redirects
        if (response.redirected) {
            console.error('API request redirected - authentication required');
            throw new Error('Authentication required - please log in to TryHackMe');
        }

        // Get response text for better error handling
        const responseText = await response.text();
        
        // Parse response as JSON with error handling
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            console.error('Failed to parse API response:', responseText);
            throw new Error('Invalid JSON response from API - please try again');
        }

        // Check for API-level success
        if (!response.ok) {
            throw new Error(data.message || 'API request failed - please try again');
        }

        return data;
    } catch (error) {
        console.error('API request failed:', error);
        throw error; // Preserve original error for handling upstream
    }
} 