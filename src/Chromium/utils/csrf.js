/**
 * CSRF Token Management Module
 * Handles fetching and caching of CSRF tokens for API requests
 */

// Cache the token promise to avoid multiple requests
let csrfTokenPromise = null;

/**
 * Fetches a CSRF token from the TryHackMe API
 * @returns {Promise<string>} The CSRF token
 * @throws {Error} If token fetch fails or response is invalid
 */
async function getCsrfToken() {
    try {
        const response = await fetch('https://tryhackme.com/api/v2/auth/csrf', {
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });

        // Handle redirects (usually for authentication)
        if (response.redirected) {
            console.error('CSRF request redirected - user likely needs to log in');
            throw new Error('Authentication required');
        }

        const data = await response.json();
        
        // Validate response format
        if (!data.data?.token) {
            throw new Error('Invalid CSRF token response format');
        }

        return data.data.token;
    } catch (error) {
        console.error('Failed to fetch CSRF token:', error);
        throw error;
    }
}

/**
 * Gets a CSRF token, using cached promise if available
 * @returns {Promise<string>} The CSRF token
 */
export function getToken() {
    if (!csrfTokenPromise) {
        csrfTokenPromise = getCsrfToken();
        
        // Clear the cache if the token fetch fails
        csrfTokenPromise.catch(() => {
            csrfTokenPromise = null;
        });
    }
    return csrfTokenPromise;
}

/**
 * Prepares headers with CSRF token for API requests
 * @param {Object} headers - Existing headers to augment
 * @returns {Promise<Object>} Headers with CSRF token added
 */
export async function prepareHeaders(headers = {}) {
    const token = await getToken();
    return {
        ...headers,
        'csrf-token': token
    };
} 