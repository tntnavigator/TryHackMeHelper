/**
 * CSRF Token Management Module
 * Handles fetching, caching, and management of CSRF tokens for API requests
 * Safari-compatible implementation
 * 
 * Features:
 * - Token caching to minimize API calls
 * - Automatic token refresh on failure
 * - Error handling with descriptive messages
 * - Proper authentication state handling
 */

// Cache the token promise to avoid multiple concurrent requests
let csrfTokenPromise = null;

/**
 * Fetches a CSRF token from the TryHackMe API
 * @returns {Promise<string>} The CSRF token
 * @throws {Error} If token fetch fails, user is not authenticated, or response is invalid
 */
async function getCsrfToken() {
    try {
        const response = await fetch('https://tryhackme.com/api/v2/auth/csrf', {
            credentials: 'include', // Required for authentication cookies
            headers: {
                'Accept': 'application/json',
                'Cache-Control': 'no-cache' // Prevent stale tokens
            }
        });

        // Handle redirects (usually indicates authentication required)
        if (response.redirected) {
            console.error('CSRF request redirected - user needs to authenticate');
            throw new Error('Authentication required - please log in to TryHackMe');
        }

        const data = await response.json();
        
        // Validate response format matches API schema
        if (!data.data?.token) {
            throw new Error('Invalid CSRF token response format from API');
        }

        return data.data.token;
    } catch (error) {
        console.error('Failed to fetch CSRF token:', error);
        throw error; // Preserve original error for handling upstream
    }
}

/**
 * Gets a CSRF token, using cached promise if available
 * Implements singleton pattern for token management
 * @returns {Promise<string>} The CSRF token
 */
export function getToken() {
    if (!csrfTokenPromise) {
        csrfTokenPromise = getCsrfToken();
        
        // Clear the cache if the token fetch fails
        // This allows the next request to try again
        csrfTokenPromise.catch(() => {
            csrfTokenPromise = null;
        });
    }
    return csrfTokenPromise;
}

/**
 * Prepares headers with CSRF token for API requests
 * Merges provided headers with CSRF token header
 * @param {Object} headers - Existing headers to augment
 * @returns {Promise<Object>} Headers with CSRF token added
 */
export async function prepareHeaders(headers = {}) {
    const token = await getToken();
    return {
        ...headers,
        'csrf-token': token // Required by TryHackMe API for mutations
    };
} 